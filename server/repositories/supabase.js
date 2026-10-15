// Adaptador de dados Supabase com chave de serviço exclusivamente no backend.
import { HttpError } from '../lib/http.js';
import { portalSupabaseMethods } from './portal-supabase.js';

export function createSupabaseRepository({ url, serviceRoleKey }) {
  if (!url || !serviceRoleKey) throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no servidor.');
  const endpoint = `${url.replace(/\/$/, '')}/rest/v1`;
  async function query(table, { filters = '', method = 'GET', body, single = false, upsert = false } = {}) {
    const res = await fetch(`${endpoint}/${table}${filters}`,{
      method, headers:{ apikey:serviceRoleKey, Authorization:`Bearer ${serviceRoleKey}`, 'Content-Type':'application/json', Prefer:upsert?'resolution=merge-duplicates,return=representation':'return=representation' },
      body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(10000)
    });
    if(!res.ok){console.error(`Supabase ${table}: ${res.status}`);throw new HttpError(502,'Erro de comunicação com o banco.');}
    const data = await res.json().catch(()=>[]);
    return single ? data[0] || null : data;
  }
  const eq = encodeURIComponent;
  const readyFilter = () => `&status=eq.published&archived_at=is.null&or=(published_at.is.null,published_at.lte.${eq(new Date().toISOString())})`;
  // Datas de validade são verificadas novamente no Node para simplificar o PostgREST.
  const active = n => n.status === 'published' && !n.archived_at && (!n.published_at || n.published_at<=new Date().toISOString()) && (!n.expires_at || n.expires_at>new Date().toISOString());
  async function enrichedNotices(userId,includeHidden=false){
    const all=await query('notices',{filters:'?select=*&order=pinned.desc,published_at.desc'});
    const acks=userId?await query('notice_acknowledgements',{filters:`?select=notice_id&user_id=eq.${eq(userId)}`}):[];
    const ids=new Set(acks.map(a=>a.notice_id));
    return all.filter(n=>includeHidden || active(n)).map(n=>({...n,acknowledged:ids.has(n.id)}));
  }
  return {
    ...portalSupabaseMethods(query,eq),
    listTools:()=>query('tools',{filters:'?select=*&order=sort_order.asc'}),
    async createIdea(input){const v=await query('tool_ideas',{method:'POST',body:input,single:true});return {id:v.id,created_at:v.created_at};},
    getUserByEmail:email=>query('app_users',{filters:`?select=*&email=eq.${eq(email)}&limit=1`,single:true}),
    getUserById:id=>query('app_users',{filters:`?select=*&id=eq.${eq(id)}&limit=1`,single:true}),
    listUsers:()=>query('app_users',{filters:'?select=id,name,email,role,active,permissions,created_at,updated_at&order=created_at.asc'}),
    async createUser(input){const existed=await query('app_users',{filters:`?select=id&email=eq.${eq(input.email)}&limit=1`,single:true});if(existed)return null;return query('app_users',{method:'POST',body:input,single:true});},
    createSession:input=>query('app_sessions',{method:'POST',body:input}),
    getSession:hash=>query('app_sessions',{filters:`?select=*&token_hash=eq.${eq(hash)}&expires_at=gt.${eq(new Date().toISOString())}&limit=1`,single:true}),
    deleteSession:hash=>query('app_sessions',{method:'DELETE',filters:`?token_hash=eq.${eq(hash)}`}),
    listNotices:enrichedNotices,
    async getNotice(id,userId,includeHidden=false){return (await enrichedNotices(userId,includeHidden)).find(n=>n.id===id) || null;},
    createNotice:input=>query('notices',{method:'POST',body:input,single:true}),
    async patchNotice(id,input){return query('notices',{method:'PATCH',filters:`?id=eq.${eq(id)}&archived_at=is.null`,body:{...input,updated_at:new Date().toISOString()},single:true});},
    async archiveNotice(id){return !!(await query('notices',{method:'PATCH',filters:`?id=eq.${eq(id)}&archived_at=is.null`,body:{archived_at:new Date().toISOString()},single:true}));},
    async acknowledgeNotice(id,userId){const n=await this.getNotice(id,userId);if(!n?.requires_ack)return false;await query('notice_acknowledgements',{method:'POST',body:{notice_id:id,user_id:userId},upsert:true});return true;},
    listVideos:()=>query('videos',{filters:'?select=*&order=created_at.desc'}),
    createVideo:input=>query('videos',{method:'POST',body:input,single:true}),
    updateVideo:(id,input)=>query('videos',{method:'PATCH',filters:`?id=eq.${eq(id)}`,body:input,single:true}),
    async deleteVideo(id){return !!(await query('videos',{method:'DELETE',filters:`?id=eq.${eq(id)}`,single:true}));}
  };
}
