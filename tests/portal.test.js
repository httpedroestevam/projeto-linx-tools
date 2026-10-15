import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { createApp } from '../server/app.js';
import { createLocalRepository } from '../server/repositories/local.js';
import { hashPassword } from '../server/services/auth.js';

let server, base, folder, adminCookie, analystCookie, noticeId, videoId;
const jsonRequest=async (endpoint,{method='GET',body,cookie,origin}={})=>{
  const r=await fetch(base+endpoint,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(cookie?{Cookie:cookie}:{}),...(origin?{Origin:origin}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
};
before(async()=>{
  folder=await mkdtemp(path.join(os.tmpdir(),'linxtools-v12-tests-'));
  const repo=createLocalRepository(path.join(folder,'data.json'));
  await repo.createUser({name:'Admin Demonstração',email:'admin@example.com',role:'admin',password_hash:await hashPassword('Admin-strong-1234')});
  server=createApp({repository:repo});
  await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
  base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{await new Promise(ok=>server.close(ok));await rm(folder,{recursive:true,force:true});});

test('restringe mural, vídeos, edição e gestão de usuários sem login',async()=>{
  for(const route of ['/api/notices','/api/videos','/api/admin/notices','/api/admin/users']){
    assert.equal((await jsonRequest(route)).status,401,route);
  }
  assert.equal((await jsonRequest('/api/admin/notices',{method:'POST',body:{title:'Ataque',body:'Teste'}})).status,401);
});

test('login inválido é recusado e sessão autenticada funciona',async()=>{
  const bad=await jsonRequest('/api/auth/login',{method:'POST',body:{email:'admin@example.com',password:'incorreta'}});
  assert.equal(bad.status,401);
  const good=await jsonRequest('/api/auth/login',{method:'POST',body:{email:'ADMIN@EXAMPLE.COM',password:'Admin-strong-1234'}});
  assert.equal(good.status,200);assert.equal(good.data.user.role,'admin');assert.ok(good.cookie.startsWith('lt_session='));
  adminCookie=good.cookie;
  const me=await jsonRequest('/api/auth/me',{cookie:adminCookie});
  assert.equal(me.data.user.name,'Admin Demonstração');assert.equal(me.data.user.password_hash,undefined);
});

test('administrador cria usuário, analista não publica e não lê rascunhos',async()=>{
  const created=await jsonRequest('/api/admin/users',{method:'POST',cookie:adminCookie,body:{name:'Analista QA',email:'qa@example.com',role:'analista',password:'Analista-strong-1234'}});
  assert.equal(created.status,201);
  const login=await jsonRequest('/api/auth/login',{method:'POST',body:{email:'qa@example.com',password:'Analista-strong-1234'}});
  analystCookie=login.cookie;
  assert.equal((await jsonRequest('/api/admin/notices',{cookie:analystCookie})).status,403);
  const draft=await jsonRequest('/api/admin/notices',{method:'POST',cookie:adminCookie,body:{title:'Rascunho privado',body:'Não deve aparecer',status:'draft'}});
  assert.equal(draft.status,201);
  const mural=await jsonRequest('/api/notices',{cookie:analystCookie});
  assert.equal(mural.status,200);assert.ok(!mural.data.notices.some(n=>n.id===draft.data.notice.id));
});

test('publicação, confirmação de ciência, edição e arquivamento funcionam',async()=>{
  const created=await jsonRequest('/api/admin/notices',{method:'POST',cookie:adminCookie,body:{title:'Procedimento de teste',body:'Leia antes de executar.',category:'Procedimento',status:'published',priority:'important',pinned:true,requires_ack:true}});
  assert.equal(created.status,201);noticeId=created.data.notice.id;
  const visible=await jsonRequest('/api/notices',{cookie:analystCookie});
  assert.ok(visible.data.notices.some(n=>n.id===noticeId));
  const read=await jsonRequest(`/api/notices/${noticeId}`,{cookie:analystCookie});
  assert.equal(read.data.notice.acknowledged,false);
  const ack=await jsonRequest(`/api/notices/${noticeId}/ack`,{method:'POST',cookie:analystCookie,body:{}});
  assert.equal(ack.status,200);
  assert.equal((await jsonRequest(`/api/notices/${noticeId}`,{cookie:analystCookie})).data.notice.acknowledged,true);
  const updated=await jsonRequest(`/api/admin/notices/${noticeId}`,{method:'PATCH',cookie:adminCookie,body:{title:'Procedimento atualizado'}});
  assert.equal(updated.status,200);assert.equal(updated.data.notice.title,'Procedimento atualizado');
  assert.equal((await jsonRequest(`/api/admin/notices/${noticeId}`,{method:'DELETE',cookie:adminCookie,body:{}})).status,200);
  assert.equal((await jsonRequest(`/api/notices/${noticeId}`,{cookie:analystCookie})).status,404);
});

test('comunicado agendado não fica visível prematuramente',async()=>{
  const later=new Date(Date.now()+86400_000).toISOString();
  const result=await jsonRequest('/api/admin/notices',{method:'POST',cookie:adminCookie,body:{title:'Aviso futuro',body:'Amanhã',status:'published',published_at:later}});
  assert.equal(result.status,201);
  const listing=await jsonRequest('/api/notices',{cookie:analystCookie});
  assert.ok(!listing.data.notices.some(n=>n.id===result.data.notice.id));
});

test('biblioteca aceita provedores confiáveis e rejeita URL arbitrária',async()=>{
  const invalid=await jsonRequest('/api/admin/videos',{method:'POST',cookie:adminCookie,body:{title:'Falso vídeo',url:'https://example.org/watch?v=xyz'}});
  assert.equal(invalid.status,400);
  const created=await jsonRequest('/api/admin/videos',{method:'POST',cookie:adminCookie,body:{title:'Treinamento teste',category:'Treinamento',url:'https://youtu.be/dQw4w9WgXcQ'}});
  assert.equal(created.status,201);videoId=created.data.video.id;
  const listing=await jsonRequest('/api/videos',{cookie:analystCookie});
  assert.ok(listing.data.videos.some(v=>v.id===videoId && v.provider==='youtube'));
  assert.equal((await jsonRequest(`/api/admin/videos/${videoId}`,{method:'DELETE',cookie:adminCookie,body:{}})).status,200);
});

test('CSRF básico por Origin e logout invalidam sessão',async()=>{
  const csrf=await jsonRequest('/api/admin/notices',{method:'POST',cookie:adminCookie,origin:'https://externo.example',body:{title:'x',body:'y'}});
  assert.equal(csrf.status,403);
  assert.equal((await jsonRequest('/api/auth/logout',{method:'POST',cookie:analystCookie,body:{}})).status,200);
  assert.equal((await jsonRequest('/api/notices',{cookie:analystCookie})).status,401);
});
