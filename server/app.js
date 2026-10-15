import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { json, HttpError, readJSON, field } from './lib/http.js';
import { executeTool } from './services/tools.js';
import { createLocalRepository } from './repositories/local.js';
import { createSupabaseRepository } from './repositories/supabase.js';
import { makeToken, hashToken, hashPassword, verifyPassword, cleanUser, validateEmail, parseSession, sessionCookie, checkOrigin, SESSION_SECONDS, validRoles } from './services/auth.js';
import { noticeInput, videoInput } from './services/content.js';
import { releaseInput, linkInput, settingsInput, accountInput, hasPermission } from './services/portal.js';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const mimeTypes = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon' };
const noticeRoute=/^\/api\/notices\/([a-f\d-]{36})$/;
const acknowledgementRoute=/^\/api\/notices\/([a-f\d-]{36})\/ack$/;
const adminNoticeRoute=/^\/api\/admin\/notices\/([a-f\d-]{36})$/;
const adminVideoRoute=/^\/api\/admin\/videos\/([a-f\d-]{36})$/;
const releaseRoute=/^\/api\/admin\/releases\/([a-f\d-]{36})$/;
const linkRoute=/^\/api\/admin\/links\/([a-f\d-]{36})$/;
const userRoute=/^\/api\/admin\/users\/([a-f\d-]{36})$/;

export function createApp(config = {}) {
  const repo = config.repository || (config.dataProvider === 'supabase'
    ? createSupabaseRepository({ url: config.supabaseUrl, serviceRoleKey: config.supabaseKey })
    : createLocalRepository(config.dataFile));
  const limits = new Map();
  const consume = (key, max, windowMs) => {
    const now=Date.now();
    for(const [k,v] of limits) if (v.until<now) limits.delete(k);
    const record=limits.get(key) || {count:0,until:now+windowMs};
    if(record.until<now){record.count=0;record.until=now+windowMs;}
    record.count++;limits.set(key,record);
    if(record.count>max)throw new HttpError(429,'Muitas tentativas. Aguarde alguns minutos e tente novamente.');
  };
  const signedIn = user => {if(!user)throw new HttpError(401,'Faça login para acessar esta área.');};
  const allowed = (user,cap) => {signedIn(user);if(!hasPermission(user,cap))throw new HttpError(403,'Seu perfil não tem permissão para esta operação.');};
  const adminOnly = user => {signedIn(user);if(user.role!=='admin')throw new HttpError(403,'Acesso reservado aos administradores.');};
  return createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Frame-Options','DENY');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-src https://www.youtube-nocookie.com https://player.vimeo.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
    res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    try {
      const pathname = new URL(req.url || '/', 'http://localhost').pathname;
      if (pathname.startsWith('/api/')) {
        if(!['GET','POST','PATCH','DELETE'].includes(req.method))throw new HttpError(405,'Método não permitido.');
        if(req.method!=='GET')checkOrigin(req);
        const ip=req.socket.remoteAddress || 'unknown';
        if(req.method==='GET' && pathname==='/api/health')return json(res,200,{ok:true,service:'linxtools-api',version:'1.3.0'});
        if(req.method==='GET' && pathname==='/api/tools')return json(res,200,{tools:await repo.listTools()});
        if(req.method==='GET' && pathname==='/api/releases')return json(res,200,{releases:await repo.listReleases()});
        if(req.method==='GET' && pathname==='/api/portal')return json(res,200,{portal:await repo.getPortal()});
        if(req.method==='POST' && /^\/api\/tools\/[a-z-]+\/execute$/.test(pathname)){
          consume(`tool:${ip}`,90,60_000);
          return json(res,200,{result:executeTool(pathname.split('/')[3],await readJSON(req))});
        }
        if(req.method==='POST' && pathname==='/api/ideas'){
          consume(`idea:${ip}`,5,60_000);
          const input=await readJSON(req);
          const idea=await repo.createIdea({title:field(input.title,'título',100),description:field(input.description,'descrição',800),role:field(input.role || '','área',100,false)});
          return json(res,201,{message:'Sugestão recebida!',idea});
        }
        // Autenticação via cookie HttpOnly; não devolvemos hash ou token via JSON.
        const token=parseSession(req);
        const session=token ? await repo.getSession(hashToken(token)) : null;
        const foundUser=session ? await repo.getUserById(session.user_id) : null;
        const user=foundUser && foundUser.active !== false ? foundUser : null;
        if(req.method==='GET' && pathname==='/api/auth/me')return json(res,200,{user:cleanUser(user)});
        if(req.method==='POST' && pathname==='/api/auth/login'){
          const input=await readJSON(req);
          const email=validateEmail(input.email);
          consume(`login:${ip}:${email}`,8,15*60_000);
          const matched=await repo.getUserByEmail(email);
          const valid=await verifyPassword(input.password,matched?.password_hash);
          if(!matched || !valid || matched.active===false)throw new HttpError(401,'Credenciais inválidas ou conta desabilitada.');
          const next=makeToken();
          await repo.createSession({token_hash:hashToken(next),user_id:matched.id,expires_at:new Date(Date.now()+SESSION_SECONDS*1000).toISOString()});
          res.setHeader('Set-Cookie',sessionCookie(req,next));
          return json(res,200,{user:cleanUser(matched)});
        }
        if(req.method==='POST' && pathname==='/api/auth/logout'){
          if(token)await repo.deleteSession(hashToken(token));
          res.setHeader('Set-Cookie',sessionCookie(req,'',0));
          return json(res,200,{ok:true});
        }
        // O mural e a biblioteca de treinamento exigem autenticação.
        if(req.method==='GET' && pathname==='/api/notices'){signedIn(user);return json(res,200,{notices:await repo.listNotices(user.id)});}
        if(req.method==='GET' && noticeRoute.test(pathname)){
          signedIn(user);const id=pathname.match(noticeRoute)[1];const notice=await repo.getNotice(id,user.id);
          if(!notice)throw new HttpError(404,'Comunicado não encontrado.');
          return json(res,200,{notice});
        }
        if(req.method==='POST' && acknowledgementRoute.test(pathname)){
          signedIn(user);const id=pathname.match(acknowledgementRoute)[1];const ok=await repo.acknowledgeNotice(id,user.id);
          if(!ok)throw new HttpError(404,'Comunicado indisponível para confirmação.');
          return json(res,200,{ok:true});
        }
        if(req.method==='GET' && pathname==='/api/videos'){signedIn(user);return json(res,200,{videos:await repo.listVideos()});}
        if(req.method==='GET' && pathname==='/api/links'){signedIn(user);return json(res,200,{links:await repo.listLinks()});}
        // Publicação e gestão editorial
        if(req.method==='GET' && pathname==='/api/admin/notices'){
          allowed(user,'notices');return json(res,200,{notices:await repo.listNotices(user.id,true)});
        }
        if(req.method==='POST' && pathname==='/api/admin/notices'){
          allowed(user,'notices');const input=noticeInput(await readJSON(req));
          if(input.status==='published' && !input.published_at)input.published_at=new Date().toISOString();
          const notice=await repo.createNotice({...input,author_name:user.name,author_id:user.id});
          return json(res,201,{notice});
        }
        if(adminNoticeRoute.test(pathname) && req.method==='PATCH'){
          allowed(user,'notices');const input=noticeInput(await readJSON(req),{partial:true});
          const update=repo.patchNotice || repo.updateNotice;
          const notice=await update(pathname.match(adminNoticeRoute)[1],input);
          if(!notice)throw new HttpError(404,'Comunicado não encontrado.');
          return json(res,200,{notice});
        }
        if(adminNoticeRoute.test(pathname) && req.method==='DELETE'){
          allowed(user,'notices');const ok=await repo.archiveNotice(pathname.match(adminNoticeRoute)[1]);
          if(!ok)throw new HttpError(404,'Comunicado não encontrado.');
          return json(res,200,{ok:true});
        }
        if(req.method==='POST' && pathname==='/api/admin/videos'){
          allowed(user,'videos');const input=videoInput(await readJSON(req));
          return json(res,201,{video:await repo.createVideo({...input,author_name:user.name})});
        }
        if(req.method==='PATCH' && adminVideoRoute.test(pathname)){
          allowed(user,'videos');const data=videoInput(await readJSON(req));
          const video=await repo.updateVideo(pathname.match(adminVideoRoute)[1],data);
          if(!video)throw new HttpError(404,'Vídeo não encontrado.');
          return json(res,200,{video});
        }
        if(req.method==='DELETE' && adminVideoRoute.test(pathname)){
          allowed(user,'videos');const ok=await repo.deleteVideo(pathname.match(adminVideoRoute)[1]);
          if(!ok)throw new HttpError(404,'Vídeo não encontrado.');
          return json(res,200,{ok:true});
        }

        // Releases: rascunhos, publicação e arquivamento.
        if(req.method==='GET' && pathname==='/api/admin/releases'){
          allowed(user,'releases');return json(res,200,{releases:await repo.listReleases(true)});
        }
        if(req.method==='POST' && pathname==='/api/admin/releases'){
          allowed(user,'releases');const data=releaseInput(await readJSON(req));
          return json(res,201,{release:await repo.createRelease(data)});
        }
        if(releaseRoute.test(pathname) && req.method==='PATCH'){
          allowed(user,'releases');const release=await repo.updateRelease(pathname.match(releaseRoute)[1],releaseInput(await readJSON(req),{partial:true}));
          if(!release)throw new HttpError(404,'Release não encontrada.');
          return json(res,200,{release});
        }
        if(releaseRoute.test(pathname) && req.method==='DELETE'){
          allowed(user,'releases');const ok=await repo.archiveRelease(pathname.match(releaseRoute)[1]);
          if(!ok)throw new HttpError(404,'Release não encontrada.');
          return json(res,200,{ok:true});
        }
        // Links úteis publicados para quem está autenticado.
        if(req.method==='GET' && pathname==='/api/admin/links'){
          allowed(user,'links');return json(res,200,{links:await repo.listLinks(true)});
        }
        if(req.method==='POST' && pathname==='/api/admin/links'){
          allowed(user,'links');return json(res,201,{link:await repo.createLink(linkInput(await readJSON(req)))});
        }
        if(linkRoute.test(pathname) && req.method==='PATCH'){
          allowed(user,'links');const link=await repo.updateLink(pathname.match(linkRoute)[1],linkInput(await readJSON(req),{partial:true}));
          if(!link)throw new HttpError(404,'Link não encontrado.');
          return json(res,200,{link});
        }
        if(linkRoute.test(pathname) && req.method==='DELETE'){
          allowed(user,'links');const ok=await repo.archiveLink(pathname.match(linkRoute)[1]);
          if(!ok)throw new HttpError(404,'Link não encontrado.');
          return json(res,200,{ok:true});
        }
        if(req.method==='PATCH' && pathname==='/api/admin/portal'){
          adminOnly(user);return json(res,200,{portal:await repo.updatePortal(settingsInput(await readJSON(req)))});
        }
        if(req.method==='GET' && pathname==='/api/admin/overview'){
          signedIn(user);
          if(!['notices','videos','releases','links'].some(cap=>hasPermission(user,cap)))throw new HttpError(403,'Acesso não autorizado.');
          const [notices,videos,releases,links] = await Promise.all([repo.listNotices(user.id,true),repo.listVideos(),repo.listReleases(true),repo.listLinks(true)]);
          return json(res,200,{overview:{notices:notices.length,notice_drafts:notices.filter(n=>n.status==='draft'&&!n.archived_at).length,videos:videos.length,releases:releases.filter(r=>!r.archived_at).length,links:links.filter(l=>!l.archived_at).length}});
        }
        if(req.method==='GET' && pathname==='/api/admin/users'){
          adminOnly(user);return json(res,200,{users:await repo.listUsers()});
        }
        if(req.method==='POST' && pathname==='/api/admin/users'){
          adminOnly(user);const body=await readJSON(req);
          const data=accountInput(body);
          const password_hash=await hashPassword(body.password);
          const account=await repo.createUser({...data,email:validateEmail(body.email),password_hash});
          if(!account)throw new HttpError(409,'Este email já está cadastrado.');
          return json(res,201,{user:cleanUser(account)});
        }
        if(userRoute.test(pathname) && req.method==='PATCH'){
          adminOnly(user);const id=pathname.match(userRoute)[1],body=await readJSON(req);
          const account=await repo.getUserById(id);
          if(!account)throw new HttpError(404,'Usuário não encontrado.');
          const changes=accountInput(body,{partial:true});
          if(Object.hasOwn(body,'password'))changes.password_hash=await hashPassword(body.password);
          if(!Object.keys(changes).length)throw new HttpError(400,'Nenhuma alteração informada.');
          // Não permitir a perda do próprio acesso ou do último administrador ativo.
          const becomingInactive=changes.active===false || (changes.role && changes.role!=='admin');
          if(id===user.id && (becomingInactive || (changes.permissions && account.role!=='admin')))
            throw new HttpError(400,'Não é possível desativar nem remover o próprio acesso administrativo.');
          if(account.role==='admin' && account.active!==false && becomingInactive){
            const users=await repo.listUsers();
            if(users.filter(u=>u.role==='admin' && u.active!==false).length<=1)throw new HttpError(409,'É necessário manter ao menos um administrador ativo.');
          }
          const updated=await repo.updateUser(id,changes);
          if(!updated)throw new HttpError(404,'Usuário não encontrado.');
          // Qualquer alteração de credenciais/permissões invalida sessões ativas.
          await repo.revokeUserSessions(id);
          return json(res,200,{user:cleanUser(updated),sessions_revoked:true});
        }
        return json(res,404,{error:'Endpoint não encontrado.'});
      }
      if(req.method!=='GET' && req.method!=='HEAD')throw new HttpError(405,'Método não permitido.');
      const isRoute = pathname==='/' || ['/releases','/mural','/aprender','/admin','/operacao','/links','/login'].includes(pathname) || /^\/mural\/[a-f\d-]{36}$/.test(pathname) || /^\/tools\/[a-z-]+$/.test(pathname);
      const filename = isRoute ? '/index.html' : pathname;
      if(filename.includes('\0') || filename.split('/').includes('..'))throw new HttpError(403,'Acesso negado.');
      const absolute=path.resolve(publicDir,'.'+filename);
      if(!absolute.startsWith(publicDir+path.sep))throw new HttpError(403,'Acesso negado.');
      if(!(await stat(absolute).catch(()=>null))?.isFile())throw new HttpError(404,'Página não encontrada.');
      res.writeHead(200,{'Content-Type':mimeTypes[path.extname(absolute)] || 'application/octet-stream','Cache-Control':'no-cache'});
      if(req.method==='HEAD')return res.end();
      res.end(await readFile(absolute));
    } catch(error) {
      const status=error instanceof HttpError ? error.status : 500;
      if(status>=500 && !(error instanceof HttpError))console.error('Erro interno:',error);
      if(!res.headersSent)json(res,status,{error:status>=500?'Erro interno do servidor.':error.message});else res.end();
    }
  });
}
