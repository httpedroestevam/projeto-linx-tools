// Operações adicionais para o Portal da Operação. Compartilham a mesma fila
// de escrita do repositório local: atribuídas em local.js.
import { randomUUID } from 'node:crypto';

export function portalLocalMethods(load,edit){
 const now=()=>new Date().toISOString();
 const published=entry=>!entry.archived_at && entry.status!=='draft' && (!entry.published_at || entry.published_at<=now());
 const defaults={hero_title:'Mais conexão. Mais soluções.',hero_description:'Comunicados, ferramentas e aprendizado em uma única central.',banner_text:'',banner_enabled:false};
 return {
  async listReleases(includeHidden=false){const d=await load();return (d.releases||[]).filter(r=>includeHidden||published(r)).sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at)));},
  async createRelease(input){return edit(d=>{const item={id:randomUUID(),...input,created_at:now(),updated_at:now(),archived_at:null};(d.releases||=[]).push(item);return item;});},
  async updateRelease(id,input){return edit(d=>{const item=(d.releases||[]).find(r=>r.id===id&&!r.archived_at);if(!item)return null;Object.assign(item,input,{updated_at:now()});return item;});},
  async archiveRelease(id){return edit(d=>{const item=(d.releases||[]).find(r=>r.id===id&&!r.archived_at);if(!item)return false;item.archived_at=now();return true;});},
  async listLinks(includeHidden=false){const d=await load();return (d.links||[]).filter(l=>includeHidden||published(l)).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));},
  async createLink(input){return edit(d=>{const item={id:randomUUID(),...input,created_at:now(),updated_at:now(),archived_at:null};(d.links||=[]).push(item);return item;});},
  async updateLink(id,input){return edit(d=>{const item=(d.links||[]).find(l=>l.id===id&&!l.archived_at);if(!item)return null;Object.assign(item,input,{updated_at:now()});return item;});},
  async archiveLink(id){return edit(d=>{const item=(d.links||[]).find(l=>l.id===id&&!l.archived_at);if(!item)return false;item.archived_at=now();return true;});},
  async getPortal(){const d=await load();return {...defaults,...d.portal};},
  async updatePortal(input){return edit(d=>{d.portal={...defaults,...d.portal,...input};return d.portal;});},
  async updateUser(id,input){return edit(d=>{const u=(d.users||[]).find(u=>u.id===id);if(!u)return null;Object.assign(u,input,{updated_at:now()});return u;});},
  async revokeUserSessions(id){return edit(d=>{d.sessions=(d.sessions||[]).filter(s=>s.user_id!==id);return true;});}
 };
}
