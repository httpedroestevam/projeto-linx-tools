import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { starterTools } from '../catalog.js';
import { portalLocalMethods } from './portal-local.js';

export function createLocalRepository(filename = path.resolve('storage/data.json')) {
  let writes = Promise.resolve();
  const initial = () => ({ tools: starterTools, releases: [], ideas: [], users: [], sessions: [], notices: [
    { id: randomUUID(), title:'Demonstração: orientações para a operação', body:'Este é um comunicado de exemplo para visualizar o mural. A liderança pode substituí-lo por orientações reais no painel administrativo.\n\nUse o mural para compartilhar mudanças de processo, procedimentos e informações relevantes para o time.', category:'Procedimento', priority:'important', status:'published', pinned:true, requires_ack:false, author_name:'Equipe de demonstração', created_at:new Date().toISOString(), updated_at:new Date().toISOString(), published_at:new Date().toISOString(), expires_at:null, archived_at:null, acknowledgements:[] },
    { id: randomUUID(), title:'Demonstração: treinamentos e materiais', body:'Espaço reservado para comunicar novas capacitações e materiais de apoio.\n\nEsta publicação é apenas ilustrativa e não representa um comunicado oficial.', category:'Treinamento', priority:'normal', status:'published', pinned:false, requires_ack:false, author_name:'Equipe de demonstração', created_at:new Date().toISOString(), updated_at:new Date().toISOString(), published_at:new Date().toISOString(), expires_at:null, archived_at:null, acknowledgements:[] }
  ], videos: [] });
  async function load() {
    try { return JSON.parse(await readFile(filename, 'utf8')); }
    catch (err) {
      if (err.code !== 'ENOENT') throw err;
      await mkdir(path.dirname(filename), { recursive: true });
      try { await writeFile(filename, JSON.stringify(initial(), null, 2), { flag: 'wx', mode: 0o600 }); }
      catch (e) { if (e.code !== 'EEXIST') throw e; }
      return JSON.parse(await readFile(filename, 'utf8'));
    }
  }
  async function edit(operation) {
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
  const ready = n => n.status === 'published' && !n.archived_at && (!n.published_at || n.published_at <= new Date().toISOString()) && (!n.expires_at || n.expires_at > new Date().toISOString());
  const safeNotice = (n, userId) => { const { acknowledgements, ...copy } = n; return { ...copy, acknowledged: Boolean(acknowledgements?.includes(userId)) }; };
  const legacyNoticeOrder = (a,b) => Number(b.pinned)-Number(a.pinned) || String(b.published_at || b.created_at).localeCompare(String(a.published_at || a.created_at)) || String(a.id).localeCompare(String(b.id));
  async function ensureNoticeOrders() {
    const data = await load();
    if (!(data.notices || []).some(n => !Number.isInteger(n.display_order) || n.display_order < 1)) return;
    await edit(d => {
      const ordered = [...(d.notices || [])].sort((a,b) => {
        const aHasOrder = Number.isInteger(a.display_order) && a.display_order > 0;
        const bHasOrder = Number.isInteger(b.display_order) && b.display_order > 0;
        if (aHasOrder && bHasOrder) return a.display_order - b.display_order || String(a.id).localeCompare(String(b.id));
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
    async createIdea(input) { return edit(d => { const item={id:randomUUID(),...input,created_at:new Date().toISOString()};(d.ideas ||= []).push(item);return {id:item.id,created_at:item.created_at}; }); },
    async getUserByEmail(email) { return (await load()).users?.find(u => u.email === email) || null; },
    async getUserById(id) { return (await load()).users?.find(u => u.id === id) || null; },
    async listUsers() { return (await load()).users?.map(({password_hash,...u})=>u) || []; },
    async createUser(input) { return edit(d => { d.users ||= [];if(d.users.some(u => u.email === input.email)) return null;const user={id:randomUUID(),...input,created_at:new Date().toISOString()};d.users.push(user);return user; }); },
    async createSession(input) { return edit(d => { d.sessions ||= [];d.sessions=d.sessions.filter(s => s.expires_at > new Date().toISOString());d.sessions.push(input);return true; }); },
    async getSession(hash) { return (await load()).sessions?.find(s => s.token_hash===hash && s.expires_at>new Date().toISOString()) || null; },
    async deleteSession(hash) { return edit(d => { d.sessions = (d.sessions||[]).filter(s=>s.token_hash!==hash); }); },
    async listNotices(userId, includeHidden=false) { await ensureNoticeOrders();const d=await load();return (d.notices||[]).filter(n=>includeHidden || ready(n)).sort((a,b)=>a.display_order-b.display_order || String(a.id).localeCompare(String(b.id))).map(n=>safeNotice(n,userId)); },
    async getNotice(id,userId,includeHidden=false) { await ensureNoticeOrders();const n=(await load()).notices?.find(n=>n.id===id);return n && (includeHidden || ready(n)) ? safeNotice(n,userId):null; },
    async createNotice(input) {await ensureNoticeOrders();return edit(d=>{const now=new Date().toISOString();const notices=d.notices||=[];const item={id:randomUUID(),...input,display_order:Math.max(0,...notices.map(n=>n.display_order||0))+1,created_at:now,updated_at:now,archived_at:null,acknowledgements:[]};if(item.status==='published' && !item.published_at)item.published_at=now;notices.push(item);return safeNotice(item,null);});},
    async updateNotice(id,input) {return edit(d=>{const n=(d.notices||[]).find(n=>n.id===id && !n.archived_at);if(!n)return null;const before=n.status;Object.assign(n,input,{updated_at:new Date().toISOString()});if(n.status==='published' && before!=='published' && !n.published_at)n.published_at=new Date().toISOString();return safeNotice(n,null);});},
    async archiveNotice(id) {return edit(d=>{const n=(d.notices||[]).find(n=>n.id===id && !n.archived_at);if(!n)return false;n.archived_at=new Date().toISOString();n.updated_at=n.archived_at;return true;});},
    async reorderNotices(ids) {await ensureNoticeOrders();return edit(d=>{const notices=d.notices||[];if(ids.length!==notices.length||new Set(ids).size!==ids.length||ids.some(id=>!notices.some(n=>n.id===id)))return false;const byId=new Map(notices.map(n=>[n.id,n]));ids.forEach((id,index)=>{byId.get(id).display_order=index+1;byId.get(id).updated_at=new Date().toISOString();});return true;});},
    async acknowledgeNotice(id,userId){return edit(d=>{const n=(d.notices||[]).find(n=>n.id===id && ready(n));if(!n || !n.requires_ack)return false;n.acknowledgements ||= [];if(!n.acknowledgements.includes(userId))n.acknowledgements.push(userId);return true;});},
    async listVideos(){return (await load()).videos || [];},
    async createVideo(input){return edit(d=>{const item={id:randomUUID(),...input,created_at:new Date().toISOString()};(d.videos||=[]).push(item);return item;});},
    async updateVideo(id,input){return edit(d=>{const video=(d.videos||[]).find(v=>v.id===id);if(!video)return null;Object.assign(video,input,{updated_at:new Date().toISOString()});return video;});},
    async deleteVideo(id){return edit(d=>{const before=(d.videos||[]).length;d.videos=(d.videos||[]).filter(v=>v.id!==id);return before!==d.videos.length;});}
  };
}
