import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { starterTools } from '../catalog.ts';
import { portalLocalMethods } from './portal-local.ts';
import type { IdeaInput, LocalDatabase, NoticeInput, NoticeRecord, SessionRecord, UserRecord, VideoInput, VideoRecord } from '../types.ts';

export function createLocalRepository(filename = path.resolve('storage/data.json')) {
  let writes: Promise<unknown> = Promise.resolve();
  const initial = (): LocalDatabase => ({ tools: starterTools, releases: [], ideas: [], users: [], sessions: [], notices: [
    { id: randomUUID(), title:'Demonstração: orientações para a operação', body:'Este é um comunicado de exemplo para visualizar o mural. A liderança pode substituí-lo por orientações reais no painel administrativo.\n\nUse o mural para compartilhar mudanças de processo, procedimentos e informações relevantes para o time.', category:'Procedimento', priority:'important', status:'published', pinned:true, requires_ack:false, author_name:'Equipe de demonstração', created_at:new Date().toISOString(), updated_at:new Date().toISOString(), published_at:new Date().toISOString(), expires_at:null, archived_at:null, acknowledgements:[] },
    { id: randomUUID(), title:'Demonstração: treinamentos e materiais', body:'Espaço reservado para comunicar novas capacitações e materiais de apoio.\n\nEsta publicação é apenas ilustrativa e não representa um comunicado oficial.', category:'Treinamento', priority:'normal', status:'published', pinned:false, requires_ack:false, author_name:'Equipe de demonstração', created_at:new Date().toISOString(), updated_at:new Date().toISOString(), published_at:new Date().toISOString(), expires_at:null, archived_at:null, acknowledgements:[] }
  ], videos: [] });
  async function load(): Promise<LocalDatabase> {
    try { return JSON.parse(await readFile(filename, 'utf8')) as LocalDatabase; }
    catch (err) {
      if (!(err instanceof Error) || !('code' in err) || err.code !== 'ENOENT') throw err;
      await mkdir(path.dirname(filename), { recursive: true });
      try { await writeFile(filename, JSON.stringify(initial(), null, 2), { flag: 'wx', mode: 0o600 }); }
      catch (e) { if (!(e instanceof Error) || !('code' in e) || e.code !== 'EEXIST') throw e; }
      return JSON.parse(await readFile(filename, 'utf8')) as LocalDatabase;
    }
  }
  async function edit<T>(operation: (data: LocalDatabase) => T | Promise<T>): Promise<T> {
    const pending = writes.then(async () => {
      const data = await load();
      const result = await operation(data);
      const tmp = `${filename}.${randomUUID()}.tmp`;
      await writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
      await rename(tmp, filename);
      return result;
    });
    writes = pending.catch(() => {});
    return pending;
  }
  const ready = (n: NoticeRecord): boolean => n.status === 'published' && !n.archived_at && (!n.published_at || n.published_at <= new Date().toISOString()) && (!n.expires_at || n.expires_at > new Date().toISOString());
  const safeNotice = (n: NoticeRecord, userId: string | null) => { const { acknowledgements, ...copy } = n; return { ...copy, acknowledged: Boolean(acknowledgements?.includes(userId ?? '')) }; };
  const legacyNoticeOrder = (a: NoticeRecord,b: NoticeRecord): number => Number(b.pinned)-Number(a.pinned) || String(b.published_at || b.created_at).localeCompare(String(a.published_at || a.created_at)) || String(a.id).localeCompare(String(b.id));
  async function ensureNoticeOrders(): Promise<void> {
    const data = await load();
    if (!(data.notices || []).some(n => !Number.isInteger(n.display_order) || (n.display_order ?? 0) < 1)) return;
    await edit(d => {
      const ordered = [...(d.notices || [])].sort((a,b) => {
        const aHasOrder = Number.isInteger(a.display_order) && (a.display_order ?? 0) > 0;
        const bHasOrder = Number.isInteger(b.display_order) && (b.display_order ?? 0) > 0;
        if (aHasOrder && bHasOrder) return (a.display_order ?? 0) - (b.display_order ?? 0) || String(a.id).localeCompare(String(b.id));
        if (aHasOrder) return -1;
        if (bHasOrder) return 1;
        return legacyNoticeOrder(a,b);
      });
      ordered.forEach((notice,index) => { notice.display_order = index + 1; });
    });
  }
  return {
    ...portalLocalMethods(load,edit),
    async listTools() { const d = await load(); return [...d.tools].sort((a,b) => a.sort_order - b.sort_order); },
    async createIdea(input: IdeaInput) { return edit(d => { const item={id:randomUUID(),...input,created_at:new Date().toISOString()};(d.ideas ||= []).push(item);return {id:item.id,created_at:item.created_at}; }); },
    async getUserByEmail(email: string) { return (await load()).users?.find(u => u.email === email) || null; },
    async getUserById(id: string) { return (await load()).users?.find(u => u.id === id) || null; },
    async listUsers() { return (await load()).users?.map(({password_hash,...u})=>u) || []; },
    async createUser(input: Omit<UserRecord, 'id'>) { return edit(d => { d.users ||= [];if(d.users.some(u => u.email === input.email)) return null;const user={id:randomUUID(),...input,created_at:new Date().toISOString()};d.users.push(user);return user; }); },
    async createSession(input: SessionRecord) { return edit(d => { d.sessions ||= [];d.sessions=d.sessions.filter(s => s.expires_at > new Date().toISOString());d.sessions.push(input);return true; }); },
    async getSession(hash: string) { return (await load()).sessions?.find(s => s.token_hash===hash && s.expires_at>new Date().toISOString()) || null; },
    async deleteSession(hash: string) { return edit(d => { d.sessions = (d.sessions||[]).filter(s=>s.token_hash!==hash); }); },
    async listNotices(userId: string, includeHidden=false) { await ensureNoticeOrders();const d=await load();return (d.notices||[]).filter(n=>includeHidden || ready(n)).sort((a,b)=>(a.display_order ?? 0)-(b.display_order ?? 0) || String(a.id).localeCompare(String(b.id))).map(n=>safeNotice(n,userId)); },
    async getNotice(id: string,userId: string,includeHidden=false) { await ensureNoticeOrders();const n=(await load()).notices?.find(n=>n.id===id);return n && (includeHidden || ready(n)) ? safeNotice(n,userId):null; },
    async createNotice(input: NoticeInput) {await ensureNoticeOrders();return edit(d=>{const now=new Date().toISOString();const notices=d.notices||=[];const item={id:randomUUID(),...input,display_order:Math.max(0,...notices.map(n=>n.display_order||0))+1,created_at:now,updated_at:now,archived_at:null,acknowledgements:[]} as NoticeRecord;if(item.status==='published' && !item.published_at)item.published_at=now;notices.push(item);return safeNotice(item,null);});},
    async updateNotice(id: string,input: Partial<NoticeInput>) {return edit(d=>{const n=(d.notices||[]).find(n=>n.id===id && !n.archived_at);if(!n)return null;const before=n.status;Object.assign(n,input,{updated_at:new Date().toISOString()});if(n.status==='published' && before!=='published' && !n.published_at)n.published_at=new Date().toISOString();return safeNotice(n,null);});},
    async archiveNotice(id: string) {return edit(d=>{const n=(d.notices||[]).find(n=>n.id===id && !n.archived_at);if(!n)return false;n.archived_at=new Date().toISOString();n.updated_at=n.archived_at;return true;});},
    async reorderNotices(ids: string[]) {await ensureNoticeOrders();return edit(d=>{const notices=d.notices||[];if(ids.length!==notices.length||new Set(ids).size!==ids.length||ids.some(id=>!notices.some(n=>n.id===id)))return false;const byId=new Map(notices.map(n=>[n.id,n]));ids.forEach((id,index)=>{const notice=byId.get(id);if(notice){notice.display_order=index+1;notice.updated_at=new Date().toISOString();}});return true;});},
    async acknowledgeNotice(id: string,userId: string){return edit(d=>{const n=(d.notices||[]).find(n=>n.id===id && ready(n));if(!n || !n.requires_ack)return false;n.acknowledgements ||= [];if(!n.acknowledgements.includes(userId))n.acknowledgements.push(userId);return true;});},
    async listVideos(includeHidden=false){const current=new Date().toISOString();return ((await load()).videos || []).filter(video=>includeHidden||(video.status!=='draft'&&(!video.published_at||video.published_at<=current))).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));},
    async createVideo(input: VideoInput){return edit(d=>{const created_at=new Date().toISOString();const item={id:randomUUID(),...input,published_at:input.published_at||(input.status==='published'?created_at:null),created_at} as VideoRecord;(d.videos||=[]).push(item);return item;});},
    async updateVideo(id: string,input: Partial<VideoInput>){return edit(d=>{const video=(d.videos||[]).find(v=>v.id===id);if(!video)return null;const updated_at=new Date().toISOString();Object.assign(video,input,{updated_at});if(video.status==='published'&&!video.published_at)video.published_at=updated_at;return video;});},
    async deleteVideo(id: string){return edit(d=>{const before=(d.videos||[]).length;d.videos=(d.videos||[]).filter(v=>v.id!==id);return before!==d.videos.length;});}
  };
}
