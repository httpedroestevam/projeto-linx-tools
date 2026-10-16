// Complemento PostgREST para portal editorial e controle de contas.
import { normalizeProfilePermissions } from '../services/portal.js';
import { normalizeNoticeOptions } from '../services/content.js';

export function portalSupabaseMethods(query,eq){
 const now=()=>new Date().toISOString();
 const makeMethods=(table,base)=>({
  [`list${base}s`]:async(includeHidden=false)=>{
   const rows=await query(table,{filters:'?select=*&order=created_at.desc'});
   return includeHidden?rows:rows.filter(r=>!r.archived_at && r.status!=='draft' && (!r.published_at||r.published_at<=now()));
  },
  [`create${base}`]:data=>query(table,{method:'POST',body:data,single:true}),
  [`update${base}`]:(id,data)=>query(table,{method:'PATCH',filters:`?id=eq.${eq(id)}&archived_at=is.null`,body:{...data,updated_at:now()},single:true}),
  [`archive${base}`]:async id=>Boolean(await query(table,{method:'PATCH',filters:`?id=eq.${eq(id)}&archived_at=is.null`,body:{archived_at:now()},single:true}))
 });
 return {
   ...makeMethods('releases','Release'),...makeMethods('portal_links','Link'),
   async getPortal(){const rows=await query('portal_settings',{filters:'?select=*&id=eq.main&limit=1',single:true});return rows||{hero_title:'Mais conexão. Mais soluções.',hero_description:'Comunicados, ferramentas e aprendizado em uma única central.',banner_text:'',banner_enabled:false};},
   async updatePortal(data){return query('portal_settings',{method:'POST',upsert:true,body:{id:'main',...data,updated_at:now()},single:true});},
   async getProfilePermissions(){const rows=await query('portal_settings',{filters:'?select=profile_permissions&id=eq.main&limit=1',single:true});return normalizeProfilePermissions(rows?.profile_permissions);},
   async updateProfilePermissions(input){const profile_permissions=normalizeProfilePermissions(input);const rows=await query('portal_settings',{method:'POST',upsert:true,body:{id:'main',profile_permissions,updated_at:now()},single:true});return normalizeProfilePermissions(rows?.profile_permissions);},
   async getNoticeOptions(){const rows=await query('portal_settings',{filters:'?select=notice_options&id=eq.main&limit=1',single:true});return normalizeNoticeOptions(rows?.notice_options);},
   async updateNoticeOptions(input){const previous=await this.getNoticeOptions();const next=normalizeNoticeOptions(input);const categories=new Set(next.categories.map(x=>x.id));const priorities=new Set(next.priorities.map(x=>x.id));const categoryFallback=categories.has('Geral')?'Geral':next.categories[0].id;const priorityFallback=priorities.has('normal')?'normal':next.priorities[0].id;for(const option of previous.categories.filter(x=>!categories.has(x.id)))await query('notices',{method:'PATCH',filters:`?category=eq.${eq(option.id)}`,body:{category:categoryFallback,updated_at:now()}});for(const option of previous.priorities.filter(x=>!priorities.has(x.id)))await query('notices',{method:'PATCH',filters:`?priority=eq.${eq(option.id)}`,body:{priority:priorityFallback,updated_at:now()}});const rows=await query('portal_settings',{method:'POST',upsert:true,body:{id:'main',notice_options:next,updated_at:now()},single:true});return normalizeNoticeOptions(rows?.notice_options||next);},
   updateUser:(id,data)=>query('app_users',{method:'PATCH',filters:`?id=eq.${eq(id)}`,body:{...data,updated_at:now()},single:true}),
   revokeUserSessions:id=>query('app_sessions',{method:'DELETE',filters:`?user_id=eq.${eq(id)}`})
 };
}
