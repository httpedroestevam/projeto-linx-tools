import { readFile } from 'node:fs/promises';
import { starterTools } from '../server/catalog.js';

// Este script migra apenas dados. Ele NÃO faz deploy do servidor na Supabase.
try {
  for (const line of (await readFile(new URL('../.env', import.meta.url),'utf8')).split(/\r?\n/)) {
    const m=/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g,'');
  }
} catch (e) { if (e.code !== 'ENOENT') throw e; }
const url=process.env.SUPABASE_URL?.replace(/\/$/,'');
const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env.');
let data;
try {data=JSON.parse(await readFile(new URL('../storage/data.json',import.meta.url),'utf8'));}
catch(e) {if (e.code!=='ENOENT') throw e;data={ tools:starterTools, releases:[], ideas:[] };}
async function upload(table, rows, conflict) {
  if (!rows?.length) { console.log(`${table}: nenhum dado para importar.`);return; }
  const response=await fetch(`${url}/rest/v1/${table}?on_conflict=${conflict}`,{
    method:'POST',
    headers:{ apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal' },
    body:JSON.stringify(rows),signal:AbortSignal.timeout(20_000)
  });
  if (!response.ok) throw new Error(`Falha ${table}: HTTP ${response.status} - ${(await response.text()).slice(0,300)}`);
  console.log(`${table}: ${rows.length} registro(s) importado(s).`);
}
await upload('tools',data.tools,'id');
await upload('releases',data.releases,'id');
await upload('tool_ideas',data.ideas,'id');
await upload('app_users',data.users || [],'id');
await upload('notices',(data.notices || []).map(({acknowledgements,...notice}) => notice),'id');
await upload('notice_acknowledgements',(data.notices || []).flatMap(n=>(n.acknowledgements || []).map(user_id=>({notice_id:n.id,user_id}))),'notice_id,user_id');
await upload('videos',data.videos || [],'id');
await upload('portal_links',data.links || [],'id');
if(data.portal) await upload('portal_settings',[{id:'main',...data.portal}], 'id');
console.log('Importação concluída. Altere DATA_PROVIDER=supabase em .env e reinicie o servidor.');
