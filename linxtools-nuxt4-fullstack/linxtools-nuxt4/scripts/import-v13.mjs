import { readFile, writeFile, mkdir, copyFile, stat } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'

const source=process.argv[2]
const replace=process.argv.includes('--replace')
if (!source) throw new Error('Uso: node scripts/import-v13.mjs "caminho/para/data.json" [--replace]')
const from=resolve(source)
const target=resolve('storage/data.json')
if(from===target)throw new Error('Arquivo de origem e destino são iguais.')
let data
try{data=JSON.parse(await readFile(from,'utf8'))}catch{throw new Error('Arquivo de origem não é um JSON válido ou não pôde ser lido.')}
if(!Array.isArray(data.users)||!Array.isArray(data.tools))throw new Error('Arquivo não corresponde ao data.json da Linxtools V1.3.')
// Sessões antigas não devem ser migradas para uma instalação nova.
data.sessions=[]
await mkdir(dirname(target),{recursive:true})
const existing=await stat(target).catch(()=>null)
if(existing){
 if(!replace)throw new Error('Já existe storage/data.json. Faça backup e repita com --replace para importar por cima.')
 const backup=`${target}.backup-${new Date().toISOString().replace(/[:.]/g,'-')}`
 await copyFile(target,backup)
 console.log('Backup criado:',backup)
}
await writeFile(target,JSON.stringify(data,null,2),{encoding:'utf8',mode:0o600})
console.log(`Importação concluída: ${data.users.length} usuário(s), ${(data.notices||[]).length} comunicado(s), ${(data.videos||[]).length} vídeo(s). As sessões foram zeradas.`)
