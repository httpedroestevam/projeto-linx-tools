// Operações adicionais para o Portal da Operação. Compartilham a mesma fila
// de escrita do repositório local: atribuídas em local.ts.
import { randomUUID } from 'node:crypto';
import { normalizeProfilePermissions } from '../services/portal.ts';
import { normalizeNoticeOptions } from '../services/content.ts';
import type { InputRecord, LinkRecord, LocalDatabase, ReleaseRecord, UserRecord } from '../types.ts';

type LoadLocal = () => Promise<LocalDatabase>;
type EditLocal = <T>(operation: (data: LocalDatabase) => T | Promise<T>) => Promise<T>;

export function portalLocalMethods(load: LoadLocal,edit: EditLocal){
 const now=()=>new Date().toISOString();
 const published=(entry: ReleaseRecord | LinkRecord)=>!entry.archived_at && entry.status!=='draft' && (!entry.published_at || entry.published_at<=now());
 const defaults={hero_title:'Mais conexão. Mais soluções.',hero_description:'Comunicados, ferramentas e aprendizado em uma única central.',banner_text:'',banner_enabled:false};
 return {
  async listReleases(includeHidden=false){const d=await load();return (d.releases||[]).filter(r=>includeHidden||published(r)).sort((a,b)=>String(b.published_at).localeCompare(String(a.published_at)));},
  async createRelease(input: InputRecord){return edit(d=>{const item={id:randomUUID(),...input,created_at:now(),updated_at:now(),archived_at:null} as ReleaseRecord;(d.releases||=[]).push(item);return item;});},
  async updateRelease(id: string,input: InputRecord){return edit(d=>{const item=(d.releases||[]).find(r=>r.id===id&&!r.archived_at);if(!item)return null;Object.assign(item,input,{updated_at:now()});return item;});},
  async archiveRelease(id: string){return edit(d=>{const item=(d.releases||[]).find(r=>r.id===id&&!r.archived_at);if(!item)return false;item.archived_at=now();return true;});},
  async listLinks(includeHidden=false){const d=await load();return (d.links||[]).filter(l=>includeHidden||published(l)).sort((a,b)=>Number(a.display_order||Number.MAX_SAFE_INTEGER)-Number(b.display_order||Number.MAX_SAFE_INTEGER)||String(b.created_at).localeCompare(String(a.created_at))||String(a.id).localeCompare(String(b.id)));},
  async createLink(input: InputRecord){return edit(d=>{const links=d.links||=[];const item={id:randomUUID(),...input,display_order:Math.max(0,...links.map(link=>Number(link.display_order)||0))+1,created_at:now(),updated_at:now(),archived_at:null} as LinkRecord;links.push(item);return item;});},
  async reorderLinks(ids: string[]){return edit(d=>{const links=d.links||[];if(ids.length!==links.length||new Set(ids).size!==ids.length||ids.some(id=>!links.some(link=>link.id===id)))return false;const byId=new Map(links.map(link=>[link.id,link]));ids.forEach((id,index)=>{const link=byId.get(id);if(link){link.display_order=index+1;link.updated_at=now();}});return true;});},
  async updateLink(id: string,input: InputRecord){return edit(d=>{const item=(d.links||[]).find(l=>l.id===id&&!l.archived_at);if(!item)return null;Object.assign(item,input,{updated_at:now()});return item;});},
  async archiveLink(id: string){return edit(d=>{const item=(d.links||[]).find(l=>l.id===id&&!l.archived_at);if(!item)return false;item.archived_at=now();return true;});},
  async getPortal(){const d=await load();return {...defaults,...d.portal};},
  async updatePortal(input: Partial<typeof defaults>){return edit(d=>{d.portal={...defaults,...d.portal,...input};return d.portal;});},
  async getProfilePermissions(){const d=await load();return normalizeProfilePermissions(d.profile_permissions);},
  async updateProfilePermissions(input: unknown){return edit(d=>{d.profile_permissions=normalizeProfilePermissions(input);return d.profile_permissions;});},
  async getNoticeOptions(){const d=await load();return normalizeNoticeOptions(d.notice_options);},
  async updateNoticeOptions(input: unknown){return edit(d=>{const previous=normalizeNoticeOptions(d.notice_options);const next=normalizeNoticeOptions(input);const categories=new Set(next.categories.map(x=>x.id));const priorities=new Set(next.priorities.map(x=>x.id));const categoryFallback=categories.has('Geral')?'Geral':next.categories[0]?.id??'Geral';const priorityFallback=priorities.has('normal')?'normal':next.priorities[0]?.id??'normal';const removedCategories=previous.categories.filter(x=>!categories.has(x.id));const removedPriorities=previous.priorities.filter(x=>!priorities.has(x.id));for(const notice of d.notices||[]){if(removedCategories.some(x=>x.id===notice.category))notice.category=categoryFallback;if(removedPriorities.some(x=>x.id===notice.priority))notice.priority=priorityFallback;}d.notice_options=next;return next;});},
  async updateUser(id: string,input: Partial<Pick<UserRecord,'name'|'role'|'active'|'permissions'>>){return edit(d=>{const u=(d.users||[]).find(u=>u.id===id);if(!u)return null;Object.assign(u,input,{updated_at:now()});return u;});},
  async revokeUserSessions(id: string){return edit(d=>{d.sessions=(d.sessions||[]).filter(s=>s.user_id!==id);return true;});}
 };
}
