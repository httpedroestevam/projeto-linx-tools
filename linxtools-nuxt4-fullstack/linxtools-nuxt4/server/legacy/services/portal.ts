import { HttpError, field } from '../lib/http.ts';
import { sanitizeNoticeHtml } from './content.ts';
import { isInputRecord, isUnknownArray } from '../types.ts';
import type { Capability, InputRecord, ProfilePermissions, ProfileRole, UserRecord } from '../types.ts';

export const capabilities = ['notices','videos','releases','links'] as const satisfies readonly Capability[];
export const defaultProfilePermissions: ProfilePermissions = {
  admin: [...capabilities],
  lideranca: ['notices','videos'],
  analista: []
};
const roles: readonly ProfileRole[] = ['admin','lideranca','analista'];
const isCapability = (value: unknown): value is Capability => typeof value === 'string' && capabilities.includes(value as Capability);

export function profilePermissionsInput(value: unknown): ProfilePermissions {
  if (!isInputRecord(value)) throw new HttpError(400,'Informe permissões válidas para cada perfil.');
  const input = value;
  const result: ProfilePermissions = { admin: [], lideranca: [], analista: [] };
  for(const role of roles){
    const permissions=input[role];
    if(!isUnknownArray(permissions) || permissions.some((p: unknown)=>!isCapability(p)) || new Set(permissions).size!==permissions.length)throw new HttpError(400,`Permissões inválidas para o perfil ${role}.`);
    result[role]=role==='admin'?[...capabilities]:permissions.filter(isCapability);
  }
  if(Object.keys(input).some(role=>!roles.includes(role as ProfileRole)))throw new HttpError(400,'Perfil desconhecido nas permissões.');
  return result;
}
export const normalizeProfilePermissions = (input: unknown): ProfilePermissions => input ? profilePermissionsInput(input) : Object.fromEntries(roles.map(role=>[role,[...defaultProfilePermissions[role]]])) as ProfilePermissions;
export const defaultPermissions = (role: ProfileRole, profilePermissions: ProfilePermissions=defaultProfilePermissions): Capability[] => [...(profilePermissions[role] || [])];
export const userPermissions = (user: UserRecord | null | undefined): Capability[] => Array.isArray(user?.permissions) ? user.permissions : user ? defaultPermissions(user.role) : [];
export const hasPermission = (user: UserRecord | null | undefined, permission: Capability): boolean => Boolean(user && user.active !== false && (user.role === 'admin' || userPermissions(user).includes(permission)));

function httpsUrl(value: unknown, label='link'): string {
  if(value === undefined || value === null || value === '')return '';
  const raw=field(value,label,700);
  let url;
  try{url=new URL(raw);}catch{throw new HttpError(400,`URL inválida para ${label}.`);}
  if(url.protocol !== 'https:' || url.username || url.password)throw new HttpError(400,`${label} exige um endereço HTTPS válido, sem credenciais.`);
  return url.href;
}
function optionalText(obj: InputRecord,key: string,limit: number,defaultValue=''): string {
  return Object.hasOwn(obj,key)?field(obj[key]??'',key,limit,false):defaultValue;
}
export function releaseInput(input: InputRecord,{partial=false}: {partial?: boolean} = {}): InputRecord {
  const data: InputRecord={};
  for(const [key,max] of [['title',140],['product',90]] as const)if(!partial||Object.hasOwn(input,key))data[key]=field(input[key],key,max);
  for(const [key,max] of [['summary',20_000],['version',60]] as const)if(!partial||Object.hasOwn(input,key))data[key]=optionalText(input,key,max);
  if(typeof data.summary === 'string')data.summary=sanitizeNoticeHtml(data.summary);
  if(!partial||Object.hasOwn(input,'url'))data.url=httpsUrl(input.url);
  if(!partial||Object.hasOwn(input,'status')){
    const status=input.status??'draft';
    if(status!=='published' && status!=='draft')throw new HttpError(400,'Status da release inválido.');
    data.status=status;
  }
  if(!partial||Object.hasOwn(input,'published_at')){
    const date=input.published_at || new Date().toISOString().slice(0,10);
    if(typeof date!=='string'||!/^(\d{4})-(\d{2})-(\d{2})$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new HttpError(400,'Data da release inválida.');
    data.published_at=date;
  }
  return data;
}
export function linkInput(input: InputRecord,{partial=false}: {partial?: boolean} = {}): InputRecord {
  const data: InputRecord={};
  if(!partial||Object.hasOwn(input,'title'))data.title=field(input.title,'título',120);
  if(!partial||Object.hasOwn(input,'url')){
    data.url=httpsUrl(input.url);
    if(!data.url)throw new HttpError(400,'Informe a URL do link.');
  }
  for(const [key,max] of [['description',10_000],['category',55]] as const)if(!partial||Object.hasOwn(input,key))data[key]=optionalText(input,key,max,key==='category'?'Geral':'');
  if(typeof data.description === 'string')data.description=sanitizeNoticeHtml(data.description);
  if(!partial||Object.hasOwn(input,'status')){
    const status=input.status??'draft';
    if(status!=='published' && status!=='draft')throw new HttpError(400,'Status inválido.');
    data.status=status;
  }
  return data;
}
export function settingsInput(input: InputRecord): InputRecord {
  const data: InputRecord={};
  for(const [key,max] of [['hero_title',110],['hero_description',380],['banner_text',230]] as const){
    if(Object.hasOwn(input,key))data[key]=field(input[key]??'',key,max,false);
  }
  if(Object.hasOwn(input,'banner_enabled')){
    if(typeof input.banner_enabled !== 'boolean')throw new HttpError(400,'banner_enabled deve ser booleano.');
    data.banner_enabled=input.banner_enabled;
  }
  if(!Object.keys(data).length)throw new HttpError(400,'Nenhuma configuração fornecida.');
  return data;
}
export function accountInput(input: InputRecord,{partial=false,profilePermissions=defaultProfilePermissions}: {partial?: boolean; profilePermissions?: ProfilePermissions} = {}): InputRecord {
  const data: InputRecord={};
  if(!partial||Object.hasOwn(input,'name'))data.name=field(input.name,'nome',120);
  if(!partial||Object.hasOwn(input,'role')){
    if(typeof input.role !== 'string' || !roles.includes(input.role as ProfileRole))throw new HttpError(400,'Perfil inválido.');
    data.role=input.role as ProfileRole;
  }
  if(Object.hasOwn(input,'active')){
    if(typeof input.active!=='boolean')throw new HttpError(400,'active deve ser booleano.');
    data.active=input.active;
  }else if(!partial)data.active=true;
  if(Object.hasOwn(input,'permissions')){
    if(!isUnknownArray(input.permissions) || input.permissions.some((p: unknown)=>!isCapability(p)) || new Set(input.permissions).size!==input.permissions.length)throw new HttpError(400,'Permissões inválidas.');
    data.permissions=input.permissions.filter(isCapability);
  }else if(!partial)data.permissions=defaultPermissions(data.role as ProfileRole,profilePermissions);
  return data;
}
