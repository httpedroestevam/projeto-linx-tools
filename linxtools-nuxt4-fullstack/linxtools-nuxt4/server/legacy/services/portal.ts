import { HttpError, field } from '../lib/http.js';

export const capabilities = ['notices','videos','releases','links'];
export const defaultProfilePermissions = {
  admin: [...capabilities],
  lideranca: ['notices','videos'],
  analista: []
};
export function profilePermissionsInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400,'Informe permissões válidas para cada perfil.');
  const result={};
  for(const role of ['admin','lideranca','analista']){
    const permissions=input[role];
    if(!Array.isArray(permissions) || permissions.some(p=>!capabilities.includes(p)) || new Set(permissions).size!==permissions.length)throw new HttpError(400,`Permissões inválidas para o perfil ${role}.`);
    result[role]=role==='admin'?[...capabilities]:[...permissions];
  }
  if(Object.keys(input).some(role=>!['admin','lideranca','analista'].includes(role)))throw new HttpError(400,'Perfil desconhecido nas permissões.');
  return result;
}
export const normalizeProfilePermissions = input => input ? profilePermissionsInput(input) : Object.fromEntries(Object.entries(defaultProfilePermissions).map(([role,permissions])=>[role,[...permissions]]));
export const defaultPermissions = (role, profilePermissions=defaultProfilePermissions) => [...(profilePermissions[role] || [])];
export const userPermissions = user => Array.isArray(user?.permissions) ? user.permissions : defaultPermissions(user?.role);
export const hasPermission = (user, permission) => Boolean(user && user.active !== false && (user.role === 'admin' || userPermissions(user).includes(permission)));

function httpsUrl(value, label='link') {
  if(value === undefined || value === null || value === '')return '';
  const raw=field(value,label,700);
  let url;
  try{url=new URL(raw);}catch{throw new HttpError(400,`URL inválida para ${label}.`);}
  if(url.protocol !== 'https:' || url.username || url.password)throw new HttpError(400,`${label} exige um endereço HTTPS válido, sem credenciais.`);
  return url.href;
}
function optionalText(obj,key,limit,defaultValue='') {
  return Object.hasOwn(obj,key)?field(obj[key]??'',key,limit,false):defaultValue;
}
export function releaseInput(input,{partial=false}={}){
  const data={};
  for(const [key,max] of [['title',140],['product',90]])if(!partial||Object.hasOwn(input,key))data[key]=field(input[key],key,max);
  for(const [key,max] of [['summary',1600],['version',60]])if(!partial||Object.hasOwn(input,key))data[key]=optionalText(input,key,max);
  if(!partial||Object.hasOwn(input,'url'))data.url=httpsUrl(input.url);
  if(!partial||Object.hasOwn(input,'status')){
    if(!['published','draft'].includes(input.status??'draft'))throw new HttpError(400,'Status da release inválido.');
    data.status=input.status??'draft';
  }
  if(!partial||Object.hasOwn(input,'published_at')){
    const date=input.published_at || new Date().toISOString().slice(0,10);
    if(typeof date!=='string'||!/^(\d{4})-(\d{2})-(\d{2})$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new HttpError(400,'Data da release inválida.');
    data.published_at=date;
  }
  return data;
}
export function linkInput(input,{partial=false}={}){
  const data={};
  if(!partial||Object.hasOwn(input,'title'))data.title=field(input.title,'título',120);
  if(!partial||Object.hasOwn(input,'url')){
    data.url=httpsUrl(input.url);
    if(!data.url)throw new HttpError(400,'Informe a URL do link.');
  }
  for(const [key,max] of [['description',350],['category',55]])if(!partial||Object.hasOwn(input,key))data[key]=optionalText(input,key,max,key==='category'?'Geral':'');
  if(!partial||Object.hasOwn(input,'status')){
    if(!['published','draft'].includes(input.status??'draft'))throw new HttpError(400,'Status inválido.');
    data.status=input.status??'draft';
  }
  return data;
}
export function settingsInput(input){
  const data={};
  for(const [key,max] of [['hero_title',110],['hero_description',380],['banner_text',230]]){
    if(Object.hasOwn(input,key))data[key]=field(input[key]??'',key,max,false);
  }
  if(Object.hasOwn(input,'banner_enabled')){
    if(typeof input.banner_enabled !== 'boolean')throw new HttpError(400,'banner_enabled deve ser booleano.');
    data.banner_enabled=input.banner_enabled;
  }
  if(!Object.keys(data).length)throw new HttpError(400,'Nenhuma configuração fornecida.');
  return data;
}
export function accountInput(input,{partial=false,profilePermissions=defaultProfilePermissions}={}){
  const data={};
  if(!partial||Object.hasOwn(input,'name'))data.name=field(input.name,'nome',120);
  if(!partial||Object.hasOwn(input,'role')){
    if(!['admin','lideranca','analista'].includes(input.role))throw new HttpError(400,'Perfil inválido.');
    data.role=input.role;
  }
  if(Object.hasOwn(input,'active')){
    if(typeof input.active!=='boolean')throw new HttpError(400,'active deve ser booleano.');
    data.active=input.active;
  }else if(!partial)data.active=true;
  if(Object.hasOwn(input,'permissions')){
    if(!Array.isArray(input.permissions) || input.permissions.some(p=>!capabilities.includes(p)) || new Set(input.permissions).size!==input.permissions.length)throw new HttpError(400,'Permissões inválidas.');
    data.permissions=input.permissions;
  }else if(!partial)data.permissions=defaultPermissions(data.role,profilePermissions);
  return data;
}
