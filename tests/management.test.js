import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {mkdtemp,rm} from 'node:fs/promises';
import {createApp} from '../server/app.js';
import {createLocalRepository} from '../server/repositories/local.js';
import {hashPassword} from '../server/services/auth.js';

let dir,server,base,adminSession,editorSession,editor;
async function call(route,method='GET',data,cookie){
 const result=await fetch(base+route,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(data===undefined?{}:{'Content-Type':'application/json'})},body:data===undefined?undefined:JSON.stringify(data)});
 return {status:result.status,data:await result.json(),cookie:result.headers.get('set-cookie')?.split(';')[0]};
}
before(async()=>{
 dir=await mkdtemp(path.join(os.tmpdir(),'lt-management-'));
 const repo=createLocalRepository(path.join(dir,'db.json'));
 await repo.createUser({name:'Admin Principal',email:'admin@linxtools.test',role:'admin',active:true,password_hash:await hashPassword('SafeAdminPassword_2026')});
 server=createApp({repository:repo});await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 base=`http://127.0.0.1:${server.address().port}`;
 adminSession=(await call('/api/auth/login','POST',{email:'admin@linxtools.test',password:'SafeAdminPassword_2026'})).cookie;
});
after(async()=>{await new Promise(ok=>server.close(ok));await rm(dir,{recursive:true,force:true});});

test('novas áreas protegidas e links apenas após login',async()=>{
 assert.equal((await call('/api/admin/overview')).status,401);
 assert.equal((await call('/api/links')).status,401);
 assert.equal((await call('/api/admin/links')).status,401);
 assert.equal((await call('/api/admin/releases')).status,401);
 assert.equal((await call('/api/portal')).status,200);
 assert.equal((await call('/api/admin/overview','GET',undefined,adminSession)).status,200);
});
test('admin habilita editor com permissão granular',async()=>{
 const create=await call('/api/admin/users','POST',{name:'Editor de links',email:'editor@linxtools.test',password:'SafeEditorPassword_2026',role:'analista',active:true,permissions:['links']},adminSession);
 assert.equal(create.status,201);editor=create.data.user;
 editorSession=(await call('/api/auth/login','POST',{email:'editor@linxtools.test',password:'SafeEditorPassword_2026'})).cookie;
 assert.equal((await call('/api/admin/links','GET',undefined,editorSession)).status,200);
 assert.equal((await call('/api/admin/notices','GET',undefined,editorSession)).status,403);
 assert.equal((await call('/api/admin/releases','GET',undefined,editorSession)).status,403);
 assert.equal((await call('/api/admin/users','GET',undefined,editorSession)).status,403);
});
test('editor publica link, rascunho permanece invisível e valida HTTPS',async()=>{
 const bad=await call('/api/admin/links','POST',{title:'Perigoso',url:'javascript:alert(1)',status:'published'},editorSession);
 assert.equal(bad.status,400);
 const draft=await call('/api/admin/links','POST',{title:'Procedimento interno',url:'https://docs.example.com/help',status:'draft'},editorSession);
 assert.equal(draft.status,201);
 assert.ok(!(await call('/api/links','GET',undefined,editorSession)).data.links.some(l=>l.id===draft.data.link.id));
 const pub=await call(`/api/admin/links/${draft.data.link.id}`,'PATCH',{status:'published'},editorSession);
 assert.equal(pub.status,200);
 assert.ok((await call('/api/links','GET',undefined,editorSession)).data.links.some(l=>l.id===draft.data.link.id));
 assert.equal((await call(`/api/admin/links/${draft.data.link.id}`,'DELETE',{},editorSession)).status,200);
 assert.ok(!(await call('/api/links','GET',undefined,editorSession)).data.links.some(l=>l.id===draft.data.link.id));
});
test('administrador publica releases com rascunhos privados',async()=>{
 const draft=await call('/api/admin/releases','POST',{title:'Versão 3',product:'PDV',version:'3.0.0',summary:'Teste',published_at:'2026-10-14',status:'draft'},adminSession);
 assert.equal(draft.status,201);
 assert.ok(!(await call('/api/releases')).data.releases.some(r=>r.id===draft.data.release.id));
 const pub=await call(`/api/admin/releases/${draft.data.release.id}`,'PATCH',{status:'published'},adminSession);
 assert.equal(pub.status,200);
 assert.ok((await call('/api/releases')).data.releases.some(r=>r.id===draft.data.release.id));
 const archive=await call(`/api/admin/releases/${draft.data.release.id}`,'DELETE',{},adminSession);
 assert.equal(archive.status,200);
 assert.ok(!(await call('/api/releases')).data.releases.some(r=>r.id===draft.data.release.id));
});
test('vídeos podem ser editados por pessoas com permissão',async()=>{
 const account=(await call('/api/admin/users','POST',{name:'Editor Vídeos',email:'videos@linxtools.test',password:'SafeVideosPassword_2026',role:'analista',permissions:['videos']},adminSession)).data.user;
 const cookie=(await call('/api/auth/login','POST',{email:'videos@linxtools.test',password:'SafeVideosPassword_2026'})).cookie;
 const created=await call('/api/admin/videos','POST',{title:'Vídeo de teste',url:'https://youtu.be/dQw4w9WgXcQ'},cookie);
 assert.equal(created.status,201);
 const updated=await call(`/api/admin/videos/${created.data.video.id}`,'PATCH',{title:'Vídeo revisado',category:'Formação',description:'Teste',url:'https://youtu.be/dQw4w9WgXcQ'},cookie);
 assert.equal(updated.status,200);assert.equal(updated.data.video.title,'Vídeo revisado');
 assert.equal((await call('/api/admin/users','GET',undefined,cookie)).status,403);
});
test('configurações dependem de admin e se refletem na rota pública',async()=>{
 assert.equal((await call('/api/admin/portal','PATCH',{hero_title:'Não autorizado'},editorSession)).status,403);
 assert.equal((await call('/api/admin/portal','PATCH',{hero_title:'Operação conectada',banner_text:'Orientação atualizada',banner_enabled:true},adminSession)).status,200);
 const result=await call('/api/portal');assert.equal(result.data.portal.hero_title,'Operação conectada');assert.equal(result.data.portal.banner_enabled,true);
});
test('ao desabilitar usuário a sessão é invalidada e login recusado',async()=>{
 const disable=await call(`/api/admin/users/${editor.id}`,'PATCH',{active:false},adminSession);
 assert.equal(disable.status,200);
 assert.equal((await call('/api/auth/me','GET',undefined,editorSession)).data.user,null);
 assert.equal((await call('/api/admin/links','GET',undefined,editorSession)).status,401);
 assert.equal((await call('/api/auth/login','POST',{email:'editor@linxtools.test',password:'SafeEditorPassword_2026'})).status,401);
 assert.equal((await call(`/api/admin/users/${editor.id}`,'PATCH',{active:true,permissions:[]},adminSession)).status,200);
 const login=await call('/api/auth/login','POST',{email:'editor@linxtools.test',password:'SafeEditorPassword_2026'});
 assert.equal(login.status,200);
 assert.equal((await call('/api/admin/links','GET',undefined,login.cookie)).status,403);
});
test('proteção do último administrador e validação das permissões',async()=>{
 const users=(await call('/api/admin/users','GET',undefined,adminSession)).data.users;
 const admin=users.find(u=>u.role==='admin');
 assert.equal((await call(`/api/admin/users/${admin.id}`,'PATCH',{active:false},adminSession)).status,400);
 assert.equal((await call(`/api/admin/users/${admin.id}`,'PATCH',{role:'analista'},adminSession)).status,400);
 assert.equal((await call(`/api/admin/users/${editor.id}`,'PATCH',{permissions:['godmode']},adminSession)).status,400);
});
