import { getCookie, setCookie, deleteCookie, getRequestHeader, getMethod, getRequestURL, readRawBody, readMultipartFormData, send, setResponseHeader, createError, defineEventHandler } from 'h3'
import type { H3Event } from 'h3'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { getRepository } from '../utils/repository'
import { HttpError } from '../legacy/lib/http.js'
import { executeTool } from '../legacy/services/tools.js'
import { makeToken, hashToken, hashPassword, verifyPassword, cleanUser, validateEmail, SESSION_SECONDS } from '../legacy/services/auth.js'
import { noticeInput, noticeOptionsInput, sanitizeNotice, videoInput } from '../legacy/services/content.js'
import { accountInput, releaseInput, linkInput, settingsInput, profilePermissionsInput, hasPermission } from '../legacy/services/portal.js'

const limits = new Map<string,{count:number;expires:number}>()
const uuid = '[a-f\\d-]{36}'
const uuidPattern = new RegExp(`^${uuid}$`)
const routeId = (path:string, prefix:string) => path.match(new RegExp(`^${prefix}/(${uuid})$`))?.[1]
const ackId = (path:string) => path.match(new RegExp(`^/api/notices/(${uuid})/ack$`))?.[1]
const now = () => new Date().toISOString()
const publicNotice = (notice:any) => {const {author_id,...visible}=notice;return visible}
const methods = ['GET','POST','PATCH','DELETE']
const error = (code:number,message:string):never => {throw new HttpError(code,message)}
function consume(key:string,max:number,windowMs:number) {
  const time=Date.now()
  if(limits.size>5000)for(const [k,v] of limits)if(v.expires<time)limits.delete(k)
  const r=limits.get(key)
  const entry=(!r||r.expires<time)?{count:1,expires:time+windowMs}:{count:r.count+1,expires:r.expires}
  limits.set(key,entry)
  if(entry.count>max)error(429,'Muitas tentativas. Aguarde antes de tentar novamente.')
}
function signedIn(user:any): asserts user {if(!user)error(401,'Faça login para acessar esta área.')}
function allowed(user:any,capability:string) {signedIn(user);if(!hasPermission(user,capability))error(403,'Sem permissão para esta operação.')}
function admin(user:any){signedIn(user);if(user.role!=='admin')error(403,'Acesso reservado a administradores.')}
async function body(event:H3Event) {
  const raw=await readRawBody(event,'utf8')
  if(!raw)throw createError({statusCode:400,statusMessage:'Corpo da requisição obrigatório.'})
  if(Buffer.byteLength(raw,'utf8')>300_000)error(413,'Conteúdo maior do que 300 KB.')
  let value:any
  try {value=JSON.parse(raw)} catch {error(400,'Envie um JSON válido.')} 
  if(!value||typeof value!=='object'||Array.isArray(value))error(400,'Envie um objeto JSON.')
  return value
}
function cookie(event:H3Event,token:string) {
  setCookie(event,'lt_session',token,{httpOnly:true,secure:process.env.NODE_ENV==='production' && !['localhost','127.0.0.1'].includes(String(getRequestHeader(event,'host')||'').split(':')[0]??''),sameSite:'strict',path:'/',maxAge:SESSION_SECONDS})
}
function verifyOrigin(event:H3Event) {
  const origin=getRequestHeader(event,'origin')||''
  const target=getRequestHeader(event,'host')||''
  if(origin) {
    try {if(new URL(origin).host!==target)error(403,'Origem não permitida.')} catch {error(403,'Origem não permitida.')} 
  }
  const contentType=getRequestHeader(event,'content-type')||''
  const multipartUpload=getRequestURL(event).pathname==='/api/admin/notices/images'&&contentType.toLowerCase().startsWith('multipart/form-data;')
  if(getMethod(event)!=='DELETE' && !contentType.toLowerCase().includes('application/json')&&!multipartUpload)error(415,'Use Content-Type: application/json.')
}
export default defineEventHandler(async(event) => {
  setResponseHeader(event,'Cache-Control','no-store')
  setResponseHeader(event,'X-Content-Type-Options','nosniff')
  setResponseHeader(event,'Referrer-Policy','no-referrer')
  setResponseHeader(event,'X-Frame-Options','DENY')
  setResponseHeader(event,'Permissions-Policy','camera=(), microphone=(), geolocation=()')
  setResponseHeader(event,'Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src https://www.youtube-nocookie.com https://player.vimeo.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'")
  const path=getRequestURL(event).pathname
  const method=getMethod(event)
  try {
    if(!methods.includes(method))error(405,'Método não permitido.')
    if(method!=='GET')verifyOrigin(event)
    const repo=getRepository()
    const ip=getRequestHeader(event,'x-real-ip') || event.node.req.socket?.remoteAddress || 'local'
    if(path==='/api/health'&&method==='GET')return {ok:true,version:'2.0.0',framework:'nuxt4-nitro'}
    if(path==='/api/tools'&&method==='GET')return {tools:await repo.listTools()}
    if(path==='/api/releases'&&method==='GET')return {releases:await repo.listReleases()}
    if(path==='/api/portal'&&method==='GET')return {portal:await repo.getPortal()}
    if(/^\/api\/tools\/[a-z-]+\/execute$/.test(path)&&method==='POST'){
      consume(`tool:${ip}`,90,60_000)
      return {result:executeTool(path.split('/')[3],await body(event))}
    }
    if(path==='/api/ideas'&&method==='POST'){
      consume(`idea:${ip}`,5,60_000)
      const v=await body(event)
      const title=String(v.title||'').trim(), description=String(v.description||'').trim()
      if(!title||title.length>100||!description||description.length>800)error(400,'Informe título e descrição válidos.')
      const idea=await repo.createIdea({title,description,role:String(v.role||'').slice(0,100)})
      return {idea,message:'Sugestão recebida!'}
    }
    const token=getCookie(event,'lt_session')
    const currentSession=token&&/^[\w-]{40,100}$/.test(token)?await repo.getSession(hashToken(token)):null
    const found=currentSession?await repo.getUserById(currentSession.user_id):null
    const user=found && found.active!==false?found:null
    if(path.startsWith('/api/notices/media/')){
      const filename=path.slice('/api/notices/media/'.length)
      if(!/^[\w-]{36}\.(?:png|jpg|gif|webp)$/.test(filename))error(404,'Imagem não encontrada.')
      const imagePath=resolve(process.cwd(),'storage','uploads','notices',filename)
      let image
      try {image=await readFile(imagePath)} catch(cause) {
        if((cause as NodeJS.ErrnoException).code==='ENOENT')error(404,'Imagem não encontrada.')
        throw cause
      }
      const mime=filename.endsWith('.png')?'image/png':filename.endsWith('.jpg')?'image/jpeg':filename.endsWith('.gif')?'image/gif':'image/webp'
      setResponseHeader(event,'Content-Type',mime)
      setResponseHeader(event,'Cache-Control','public, max-age=31536000, immutable')
      setResponseHeader(event,'X-Content-Type-Options','nosniff')
      return send(event,image,mime)
    }
    if(path==='/api/admin/notices/images'&&method==='POST'){
      allowed(user,'notices')
      const parts=await readMultipartFormData(event)
      const file=parts?.find(part=>part.name==='file')
      if(!file)throw createError({statusCode:400,statusMessage:'Envie uma imagem PNG, JPEG, GIF ou WebP.'})
      const mime=file.type||''
      const extensions:Record<string,string>={'image/png':'png','image/jpeg':'jpg','image/gif':'gif','image/webp':'webp'}
      const extension=extensions[mime]
      if(!extension)throw createError({statusCode:400,statusMessage:'Envie uma imagem PNG, JPEG, GIF ou WebP.'})
      if(file.data.length>5*1024*1024)error(413,'A imagem não pode ultrapassar 5 MB.')
      const validSignature=mime==='image/png'
        ? file.data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
        : mime==='image/jpeg'
          ? file.data[0]===0xff&&file.data[1]===0xd8&&file.data[2]===0xff
          : mime==='image/gif'
            ? file.data.subarray(0,6).toString('ascii').match(/^GIF8[79]a$/)!==null
            : file.data.subarray(0,4).toString('ascii')==='RIFF'&&file.data.subarray(8,12).toString('ascii')==='WEBP'
      if(!validSignature)error(400,'O conteúdo do arquivo não corresponde a uma imagem válida.')
      const filename=`${randomUUID()}.${extension}`
      const config=useRuntimeConfig(event)
      const provider=process.env.DATA_PROVIDER||String(config.dataProvider||'local')
      if(provider==='supabase'){
        const supabaseUrl=process.env.SUPABASE_URL||String(config.supabaseUrl||'')
        const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY||String(config.supabaseServiceRoleKey||'')
        if(!supabaseUrl||!serviceKey)error(503,'O armazenamento Supabase não está configurado.')
        const bucket=process.env.SUPABASE_NOTICE_MEDIA_BUCKET||'notice-media'
        const headers={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`}
        const bucketResponse=await fetch(`${supabaseUrl}/storage/v1/bucket`,{
          method:'POST',
          headers:{...headers,'Content-Type':'application/json'},
          body:JSON.stringify({id:bucket,name:bucket,public:true,file_size_limit:5*1024*1024,allowed_mime_types:Object.keys(extensions)})
        })
        if(!bucketResponse.ok&&bucketResponse.status!==409)error(502,'Não foi possível preparar o armazenamento de imagens.')
        if(bucketResponse.status===409){
          const updateBucketResponse=await fetch(`${supabaseUrl}/storage/v1/bucket/${encodeURIComponent(bucket)}`,{
            method:'PUT',
            headers:{...headers,'Content-Type':'application/json'},
            body:JSON.stringify({public:true,file_size_limit:5*1024*1024,allowed_mime_types:Object.keys(extensions)})
          })
          if(!updateBucketResponse.ok)error(502,'Não foi possível configurar o bucket público de imagens.')
        }
        const uploadResponse=await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${filename}`,{
          method:'POST',
          headers:{...headers,'Content-Type':mime,'Cache-Control':'max-age=31536000'},
          body:new Uint8Array(file.data)
        })
        if(!uploadResponse.ok)error(502,'Não foi possível armazenar a imagem.')
        return {location:`${supabaseUrl.replace(/\/$/,'')}/storage/v1/object/public/${encodeURIComponent(bucket)}/${filename}`}
      }
      const imageDirectory=resolve(process.cwd(),'storage','uploads','notices')
      await mkdir(imageDirectory,{recursive:true})
      await writeFile(resolve(imageDirectory,filename),file.data,{flag:'wx'})
      return {location:`/api/notices/media/${filename}`}
    }
    if(path==='/api/auth/me'&&method==='GET')return {user:cleanUser(user)}
    if(path==='/api/auth/login'&&method==='POST'){
      const v=await body(event)
      const email=validateEmail(v.email)
      consume(`login:${ip}:${email}`,8,15*60_000)
      const matched=await repo.getUserByEmail(email)
      if(!matched||matched.active===false||!await verifyPassword(v.password,matched.password_hash))error(401,'Credenciais inválidas ou conta desabilitada.')
      const next=makeToken()
      await repo.createSession({token_hash:hashToken(next),user_id:matched.id,expires_at:new Date(Date.now()+SESSION_SECONDS*1000).toISOString()})
      cookie(event,next)
      return {user:cleanUser(matched)}
    }
    if(path==='/api/auth/logout'&&method==='POST'){
      if(token)await repo.deleteSession(hashToken(token))
      deleteCookie(event,'lt_session',{path:'/'})
      return {ok:true}
    }
    if(path==='/api/notices'&&method==='GET'){
      const notices=(await repo.listNotices(user?.id)).map(sanitizeNotice)
      return {notices:user?notices:notices.slice(0,3).map(publicNotice),noticeOptions:await repo.getNoticeOptions()}
    }
    const noticeId=routeId(path,'/api/notices')
    if(noticeId&&method==='GET'){
      const notice=await repo.getNotice(noticeId,user?.id)
      if(!notice)error(404,'Comunicado não encontrado.')
      const safeNotice=sanitizeNotice(notice)
      return {notice:user?safeNotice:publicNotice(safeNotice),noticeOptions:await repo.getNoticeOptions()}
    }
    const acknowledgeId=ackId(path)
    if(acknowledgeId&&method==='POST'){
      signedIn(user)
      if(!await repo.acknowledgeNotice(acknowledgeId,user.id))error(404,'Confirmação não disponível.')
      return {ok:true}
    }
    if(path==='/api/videos'&&method==='GET'){signedIn(user);return {videos:await repo.listVideos()}}
    if(path==='/api/links'&&method==='GET'){signedIn(user);return {links:await repo.listLinks()}}
    if(path==='/api/admin/overview'&&method==='GET'){
      signedIn(user)
      if(!['notices','videos','releases','links'].some(x=>hasPermission(user,x)))error(403,'Sem permissão editorial.')
      const [notices,videos,releases,links]=await Promise.all([repo.listNotices(user.id,true),repo.listVideos(),repo.listReleases(true),repo.listLinks(true)])
      return {overview:{notices:notices.length,notice_drafts:notices.filter((n:any)=>n.status==='draft'&&!n.archived_at).length,videos:videos.length,releases:releases.filter((r:any)=>!r.archived_at).length,links:links.filter((l:any)=>!l.archived_at).length}}
    }
    if(path==='/api/admin/notices'){
      allowed(user,'notices')
      if(method==='GET')return {notices:(await repo.listNotices(user.id,true)).map(sanitizeNotice)}
      if(method==='POST'){
        const v:any=noticeInput(await body(event),{options:await repo.getNoticeOptions()})
        if(v.status==='published'&&!v.published_at)v.published_at=now()
        return {notice:await repo.createNotice({...v,author_name:user.name,author_id:user.id})}
      }
    }
    if(path==='/api/admin/notices/order'&&method==='PATCH'){
      admin(user)
      const v=await body(event)
      if(!Array.isArray(v.notice_ids)||v.notice_ids.length>10000||v.notice_ids.some((id:any)=>typeof id!=='string'||!uuidPattern.test(id)))error(400,'Lista de comunicados inválida.')
      const ids=v.notice_ids as string[]
      if(new Set(ids).size!==ids.length)error(400,'A lista contém comunicados repetidos.')
      const existing=await repo.listNotices(user.id,true)
      const existingIds=new Set(existing.map((notice:any)=>notice.id))
      if(ids.length!==existingIds.size||ids.some(id=>!existingIds.has(id)))error(409,'A lista de comunicados mudou. Atualize a página e tente novamente.')
      if(!await repo.reorderNotices(ids))error(409,'Não foi possível salvar a nova ordem dos comunicados.')
      return {ok:true}
    }
    const adminNoticeId=routeId(path,'/api/admin/notices')
    if(adminNoticeId){allowed(user,'notices')
      if(method==='PATCH'){
        const data=noticeInput(await body(event),{partial:true,options:await repo.getNoticeOptions()})
        const record=await (repo.patchNotice||repo.updateNotice).call(repo,adminNoticeId,data)
        if(!record)error(404,'Comunicado não encontrado.')
        return {notice:record}
      }
      if(method==='DELETE'){if(!await repo.archiveNotice(adminNoticeId))error(404,'Comunicado não encontrado.');return {ok:true}}
    }
    if(path==='/api/admin/videos'){
      allowed(user,'videos')
      if(method==='GET')return {videos:await repo.listVideos()}
      if(method==='POST')return {video:await repo.createVideo({...videoInput(await body(event)),author_name:user.name})}
    }
    const videoId=routeId(path,'/api/admin/videos')
    if(videoId){allowed(user,'videos')
      if(method==='PATCH'){
        const v=await repo.updateVideo(videoId,videoInput(await body(event)))
        if(!v)error(404,'Vídeo não encontrado.')
        return {video:v}
      }
      if(method==='DELETE'){if(!await repo.deleteVideo(videoId))error(404,'Vídeo não encontrado.');return {ok:true}}
    }
    if(path==='/api/admin/releases'){
      allowed(user,'releases')
      if(method==='GET')return {releases:await repo.listReleases(true)}
      if(method==='POST')return {release:await repo.createRelease(releaseInput(await body(event)))}
    }
    const releaseId=routeId(path,'/api/admin/releases')
    if(releaseId){allowed(user,'releases')
      if(method==='PATCH'){const v=await repo.updateRelease(releaseId,releaseInput(await body(event),{partial:true}));if(!v)error(404,'Release não encontrada.');return {release:v}}
      if(method==='DELETE'){if(!await repo.archiveRelease(releaseId))error(404,'Release não encontrada.');return {ok:true}}
    }
    if(path==='/api/admin/links'){
      allowed(user,'links')
      if(method==='GET')return {links:await repo.listLinks(true)}
      if(method==='POST')return {link:await repo.createLink(linkInput(await body(event)))}
    }
    const linkId=routeId(path,'/api/admin/links')
    if(linkId){allowed(user,'links')
      if(method==='PATCH'){const v=await repo.updateLink(linkId,linkInput(await body(event),{partial:true}));if(!v)error(404,'Link não encontrado.');return {link:v}}
      if(method==='DELETE'){if(!await repo.archiveLink(linkId))error(404,'Link não encontrado.');return {ok:true}}
    }
    if(path==='/api/admin/portal'&&method==='PATCH'){
      admin(user)
      return {portal:await repo.updatePortal(settingsInput(await body(event)))}
    }
    if(path==='/api/admin/profile-permissions'){
      admin(user)
      if(method==='GET')return {profilePermissions:await repo.getProfilePermissions()}
      if(method==='PATCH')return {profilePermissions:await repo.updateProfilePermissions(profilePermissionsInput(await body(event)))}
    }
    if(path==='/api/admin/notice-options'){
      allowed(user,'notices')
      if(method==='GET')return {noticeOptions:await repo.getNoticeOptions()}
      if(method==='PATCH')return {noticeOptions:await repo.updateNoticeOptions(noticeOptionsInput(await body(event)))}
    }
    if(path==='/api/admin/users'){
      admin(user)
      if(method==='GET')return {users:await repo.listUsers()}
      if(method==='POST'){
        const v=await body(event)
        const data=accountInput(v,{profilePermissions:await repo.getProfilePermissions()})
        const account=await repo.createUser({...data,email:validateEmail(v.email),password_hash:await hashPassword(v.password)})
        if(!account)error(409,'Email já cadastrado.')
        return {user:cleanUser(account)}
      }
    }
    const userId=routeId(path,'/api/admin/users')
    if(userId&&method==='PATCH'){
      admin(user)
      const v=await body(event)
      const previous=await repo.getUserById(userId)
      if(!previous)error(404,'Usuário não encontrado.')
      const update:any=accountInput(v,{partial:true})
      if(Object.hasOwn(v,'password')&&v.password)update.password_hash=await hashPassword(v.password)
      if(!Object.keys(update).length)error(400,'Nenhuma alteração informada.')
      const losing=update.active===false||(update.role&&update.role!=='admin')
      if(user.id===userId&&losing)error(400,'Não é possível remover o próprio acesso administrativo.')
      if(previous.role==='admin'&&previous.active!==false&&losing){const users=await repo.listUsers();if(users.filter((x:any)=>x.role==='admin'&&x.active!==false).length<=1)error(409,'Mantenha um administrador ativo.')}
      const updated=await repo.updateUser(userId,update)
      await repo.revokeUserSessions(userId)
      return {user:cleanUser(updated),sessions_revoked:true}
    }
    error(404,'Endpoint não encontrado.')
  } catch(e:any) {
    if(e?.status && Number.isInteger(e.status))throw createError({statusCode:e.status,statusMessage:e.message,data:{error:e.message}})
    console.error('[Linxtools] Falha interna:',e)
    throw createError({statusCode:500,statusMessage:'Erro interno do servidor.',data:{error:'Erro interno do servidor.'}})
  }
})
