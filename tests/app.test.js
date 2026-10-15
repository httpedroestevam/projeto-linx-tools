import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { createApp } from '../server/app.js';

let server, base, folder;
before(async () => {
  folder = await mkdtemp(path.join(os.tmpdir(), 'linxtools-tests-'));
  server = createApp({ dataFile: path.join(folder, 'data.json') });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await new Promise(resolve => server.close(resolve)); await rm(folder,{recursive:true,force:true}); });
const post = async (url, body) => {
  const response = await fetch(base + url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  return { status: response.status, data: await response.json() };
};

test('responde página inicial e assets', async () => {
  const html = await fetch(base+'/');
  assert.equal(html.status,200);
  assert.match(await html.text(), /Linxtools/);
  const script = await fetch(base+'/app.js');
  assert.equal(script.status,200);
  assert.match(script.headers.get('content-type'),/javascript/);
});
test('API lista oito ferramentas do catálogo',async()=>{
  const response = await fetch(base+'/api/tools');
  const {tools} = await response.json();
  assert.equal(tools.length,8);
  assert.ok(tools.some(t=>t.slug==='xml-validator'));
});
test('formata JSON válido e rejeita inválido',async()=>{
  const good=await post('/api/tools/json-formatter/execute',{content:'{"a":1}',mode:'pretty'});
  assert.equal(good.status,200);
  assert.equal(good.data.result.output,'{\n  "a": 1\n}');
  const bad=await post('/api/tools/json-formatter/execute',{content:'{"a":}'});
  assert.equal(bad.status,422);
});
test('valida XML e rejeita tag de fechamento incorreta',async()=>{
  const good=await post('/api/tools/xml-validator/execute',{content:'<?xml version="1.0"?><root foo="bar"><item/><item>abc</item></root>'});
  assert.equal(good.status,200);
  assert.equal(good.data.result.details.root,'root');
  const bad=await post('/api/tools/xml-validator/execute',{content:'<root><item></root>'});
  assert.equal(bad.status,422);
  const doctype=await post('/api/tools/xml-validator/execute',{content:'<!DOCTYPE foo><foo />'});
  assert.equal(doctype.status,422);
});
test('gera texto de atendimento e script sem executar comandos',async()=>{
  const feedback=await post('/api/tools/feedback-generator/execute',{target:'internal',subject:'Caso teste',analysis:'Erro na tela',action:'Verificação de logs'});
  assert.equal(feedback.status,200);
  assert.match(feedback.data.result.output,/Verificação de logs/);
  const script=await post('/api/tools/script-generator/execute',{preset:'powershell-port',host:'192.168.0.10',port:3050});
  assert.match(script.data.result.output,/Test-NetConnection/);
  const injection=await post('/api/tools/script-generator/execute',{preset:'windows-network',host:'localhost & del /q C:\\'});
  assert.equal(injection.status,400);
});
test('persiste sugestão sem armazenar conteúdo de ferramentas',async()=>{
  const result=await post('/api/ideas',{title:'Nova ferramenta',description:'Comparar documentos de atendimento',role:'Suporte'});
  assert.equal(result.status,201);
  assert.ok(result.data.idea.id);
  const health=await fetch(base+'/api/health');
  assert.equal(health.status,200);
});
test('não expõe arquivos privados fora da pasta public',async()=>{
  const response=await fetch(base+'/server/catalog.js');
  assert.equal(response.status,404);
});
