// Adaptador de dados Supabase com chave de serviço exclusivamente no backend.
import { HttpError } from '../lib/http.ts';
import { portalSupabaseMethods } from './portal-supabase.ts';
import { isInputRecord, isUnknownArray } from '../types.ts';
import type { IdeaInput, InputRecord, SessionRecord, SupabaseQueryOptions, SupabaseRecord, UserRecord, VideoInput } from '../types.ts';

function isSupabaseRecord(value: unknown): value is SupabaseRecord {
  return isInputRecord(value);
}

export function createSupabaseRepository({ url, serviceRoleKey }: { url: string | undefined; serviceRoleKey: string | undefined }) {
  if (!url || !serviceRoleKey) throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no servidor.');
  const serviceKey = serviceRoleKey;
  const endpoint = `${url.replace(/\/$/, '')}/rest/v1`;
  function query<T extends SupabaseRecord = SupabaseRecord>(table: string, options: SupabaseQueryOptions & { single: true }): Promise<T | null>;
  function query<T extends SupabaseRecord = SupabaseRecord>(table: string, options?: SupabaseQueryOptions): Promise<T[]>;
  async function query<T extends SupabaseRecord = SupabaseRecord>(table: string, { filters = '', method = 'GET', body, single = false, upsert = false }: SupabaseQueryOptions = {}): Promise<T[] | T | null> {
    const res = await fetch(`${endpoint}/${table}${filters}`,{
      method, headers:{ apikey:serviceKey, Authorization:`Bearer ${serviceKey}`, 'Content-Type':'application/json', Prefer:upsert?'resolution=merge-duplicates,return=representation':'return=representation' },
      body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)
    });
    if(!res.ok){console.error(`Supabase ${table}: ${res.status}`);throw new HttpError(502,'Erro de comunicação com o banco.');}
    const data: unknown = await res.json().catch(()=>[]);
    const rows = isUnknownArray(data) ? data.filter(isSupabaseRecord) : [];
    return single ? (rows[0] as T | undefined) ?? null : rows as T[];
  }
  const eq = encodeURIComponent;
  const readyFilter = () => `&status=eq.published&archived_at=is.null&or=(published_at.is.null,published_at.lte.${eq(new Date().toISOString())})`;
  // Datas de validade são verificadas novamente no Node para simplificar o PostgREST.
  const active = (n: SupabaseRecord): boolean => n.status === 'published' && !n.archived_at && (!n.published_at || n.published_at<=new Date().toISOString()) && (!n.expires_at || n.expires_at>new Date().toISOString());
  async function enrichedNotices(userId: string,includeHidden=false){
    const all=await query('notices',{filters:'?select=*&order=display_order.asc,id.asc'});
    const acks=userId?await query('notice_acknowledgements',{filters:`?select=notice_id&user_id=eq.${eq(userId)}`}):[];
    const ids=new Set(acks.map(a=>a.notice_id));
    return all.filter(n=>includeHidden || active(n)).map(n=>({...n,acknowledged:ids.has(n.id)}));
  }
  return {
    ...portalSupabaseMethods(query,eq),
    listTools:()=>query('tools',{filters:'?select=*&order=sort_order.asc'}),
    async createIdea(input: IdeaInput){const v=await query('tool_ideas',{method:'POST',body:input,single:true});if(!v)throw new Error('O banco não retornou a sugestão criada.');return {id:v.id,created_at:v.created_at};},
    getUserByEmail:(email: string)=>query<UserRecord & SupabaseRecord>('app_users',{filters:`?select=*&email=eq.${eq(email)}&limit=1`,single:true}),
    getUserById:(id: string)=>query<UserRecord & SupabaseRecord>('app_users',{filters:`?select=*&id=eq.${eq(id)}&limit=1`,single:true}),
    listUsers:()=>query('app_users',{filters:'?select=id,name,email,role,active,permissions,created_at,updated_at&order=created_at.asc'}),
    async createUser(input: Omit<UserRecord, 'id'>){const existed=await query('app_users',{filters:`?select=id&email=eq.${eq(input.email)}&limit=1`,single:true});if(existed)return null;return query<UserRecord & SupabaseRecord>('app_users',{method:'POST',body:input,single:true});},
    createSession:(input: SessionRecord)=>query('app_sessions',{method:'POST',body:input}),
    getSession:(hash: string)=>query('app_sessions',{filters:`?select=*&token_hash=eq.${eq(hash)}&expires_at=gt.${eq(new Date().toISOString())}&limit=1`,single:true}),
    deleteSession:(hash: string)=>query('app_sessions',{method:'DELETE',filters:`?token_hash=eq.${eq(hash)}`}),
    listNotices:enrichedNotices,
    async listLinks(includeHidden=false){const rows=await query('portal_links',{filters:'?select=*&order=display_order.asc,id.asc'});return includeHidden?rows:rows.filter(link=>!link.archived_at&&link.status!=='draft'&&(!link.published_at||link.published_at<=new Date().toISOString()));},
    async createLink(input: InputRecord){const rows=await query('portal_links',{filters:'?select=display_order&order=display_order.desc,id.asc&limit=1'});return query('portal_links',{method:'POST',body:{...input,display_order:Number(rows[0]?.display_order||0)+1},single:true});},
    async reorderLinks(ids: string[]){await query('rpc/reorder_portal_links',{method:'POST',body:{p_link_ids:ids}});return true;},
    async getNotice(id: string,userId: string,includeHidden=false){return (await enrichedNotices(userId,includeHidden)).find(n=>n.id===id) || null;},
    async createNotice(input: InputRecord){const rows=await query('notices',{filters:'?select=display_order&order=display_order.desc,id.asc&limit=1'});return query('notices',{method:'POST',body:{...input,display_order:Number(rows[0]?.display_order||0)+1},single:true});},
    async reorderNotices(ids: string[]){await query('rpc/reorder_notices',{method:'POST',body:{p_notice_ids:ids}});return true;},
    async patchNotice(id: string,input: InputRecord){return query('notices',{method:'PATCH',filters:`?id=eq.${eq(id)}&archived_at=is.null`,body:{...input,updated_at:new Date().toISOString()},single:true});},
    async archiveNotice(id: string){return !!(await query('notices',{method:'PATCH',filters:`?id=eq.${eq(id)}&archived_at=is.null`,body:{archived_at:new Date().toISOString()},single:true}));},
    async acknowledgeNotice(id: string,userId: string){const n=await this.getNotice(id,userId);if(!n?.requires_ack)return false;await query('notice_acknowledgements',{method:'POST',body:{notice_id:id,user_id:userId},upsert:true});return true;},
    async listVideos(includeHidden=false){const videos=await query('videos',{filters:'?select=*&order=created_at.desc'});return includeHidden?videos:videos.filter(video=>video.status!=='draft'&&(!video.published_at||video.published_at<=new Date().toISOString()));},
    async createVideo(input: VideoInput){return query('videos',{method:'POST',body:{...input,published_at:input.published_at||(input.status==='published'?new Date().toISOString():null)},single:true});},
    async updateVideo(id: string,input: Partial<VideoInput>){const data={...input};if(data.status==='published'&&!data.published_at)data.published_at=new Date().toISOString();return query('videos',{method:'PATCH',filters:`?id=eq.${eq(id)}`,body:data,single:true});},
    async deleteVideo(id: string){return !!(await query('videos',{method:'DELETE',filters:`?id=eq.${eq(id)}`,single:true}));}
  };
}
