import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { readFile } from 'node:fs/promises';
import { createLocalRepository } from '../server/repositories/local.js';
import { hashPassword, validateEmail } from '../server/services/auth.js';

// Roda exclusivamente no ambiente de administração do projeto.
try {for(const line of (await readFile(new URL('../.env',import.meta.url),'utf8')).split(/\r?\n/)){
  const m=/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
  if(m && !process.env[m[1]])process.env[m[1]]=m[2].replace(/^['"]|['"]$/g,'');
}}catch(e){if(e.code!=='ENOENT')throw e;}
if(process.env.DATA_PROVIDER && process.env.DATA_PROVIDER!=='local')throw new Error('Cadastre o administrador local antes da migração ao Supabase.');

let name,email,password;
if(process.env.ADMIN_NAME && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD){
  ({ADMIN_NAME:name,ADMIN_EMAIL:email,ADMIN_PASSWORD:password}=process.env);
}else if(input.isTTY){
  const rl=createInterface({input,output});
  try{
    name=(await rl.question('Nome do administrador: ')).trim();
    email=await rl.question('Email: ');
    password=await rl.question('Senha forte (mín. 12 caracteres; entrada visível no terminal): ');
  }finally{rl.close();}
}else{
  // Suporta redirecionamento de entrada para scripts sem descartar as linhas.
  let supplied=''; for await (const chunk of input) supplied += chunk.toString('utf8');
  const lines=supplied.trimEnd().split(/\r?\n/);
  [name,email,password]=lines;
  if(!password)throw new Error('Forneça nome, email e senha em 3 linhas ou use variáveis ADMIN_NAME/ADMIN_EMAIL/ADMIN_PASSWORD.');
}
name=String(name || '').trim();
if(!name || name.length>120)throw new Error('Nome inválido (1 a 120 caracteres).');
email=validateEmail(email);
const repo=createLocalRepository();
const user=await repo.createUser({name,email,role:'admin',password_hash:await hashPassword(password)});
if(!user)throw new Error('Este email já está cadastrado.');
console.log(`\nAdministrador criado: ${user.name} <${user.email}>. Faça login em /login.`);
