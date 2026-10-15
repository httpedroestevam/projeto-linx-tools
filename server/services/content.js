import { field, HttpError } from '../lib/http.js';

export const noticeCategories = ['Geral','Procedimento','Treinamento','Urgente'];
export const priorities = ['normal','important','critical'];
export function noticeInput(input, { partial = false } = {}) {
  const result = {};
  for (const [name, limit] of [['title',140], ['body',8000]]) {
    if (!partial || Object.hasOwn(input, name)) result[name] = field(input[name],name,limit);
  }
  for (const [name, values] of [['category',noticeCategories],['priority',priorities],['status',['draft','published']]]) {
    if (!partial || Object.hasOwn(input, name)) {
      const raw = input[name] || ({category:'Geral',priority:'normal',status:'published'}[name]);
      if (!values.includes(raw)) throw new HttpError(400, `Valor inválido para ${name}.`);
      result[name] = raw;
    }
  }
  for (const name of ['pinned','requires_ack']) {
    if (!partial || Object.hasOwn(input,name)) {
      if (input[name] !== undefined && typeof input[name] !== 'boolean') throw new HttpError(400, `${name} deve ser booleano.`);
      result[name] = Boolean(input[name]);
    }
  }
  for (const name of ['published_at','expires_at']) {
    if (!partial || Object.hasOwn(input,name)) {
      if (input[name] === '' || input[name] === null || input[name] === undefined) result[name] = null;
      else {
        const date = new Date(input[name]);
        if (typeof input[name] !== 'string' || Number.isNaN(date.getTime()) || !/^\d{4}-\d{2}-\d{2}T/.test(input[name])) throw new HttpError(400, `Data inválida: ${name}.`);
        result[name] = date.toISOString();
      }
    }
  }
  return result;
}
export function videoInput(input) {
  const title = field(input.title,'título',140);
  const description = field(input.description || '', 'descrição',1500,false);
  const category = field(input.category || 'Treinamento','categoria',50);
  let url;
  try { url = new URL(field(input.url,'URL',500)); }
  catch { throw new HttpError(400,'Link do vídeo inválido.'); }
  if (url.protocol !== 'https:') throw new HttpError(400,'O vídeo precisa utilizar HTTPS.');
  let provider, provider_id;
  if (['youtube.com','www.youtube.com','m.youtube.com'].includes(url.hostname)) {
    provider = 'youtube'; provider_id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.startsWith('/shorts/') ? url.pathname.split('/')[2] : '';
  } else if (url.hostname === 'youtu.be') { provider = 'youtube'; provider_id = url.pathname.slice(1); }
  else if (['vimeo.com','www.vimeo.com'].includes(url.hostname)) { provider = 'vimeo'; provider_id = url.pathname.split('/').filter(Boolean)[0]; }
  else throw new HttpError(400,'Use um link do YouTube ou Vimeo.');
  if (provider === 'youtube' && !/^[a-zA-Z0-9_-]{11}$/.test(provider_id || '')) throw new HttpError(400,'ID do YouTube inválido.');
  if (provider === 'vimeo' && !/^\d{6,12}$/.test(provider_id || '')) throw new HttpError(400,'ID do Vimeo inválido.');
  return { title,description,category,provider,provider_id,external_url:url.href,embed_url:provider === 'youtube' ? `https://www.youtube-nocookie.com/embed/${provider_id}` : `https://player.vimeo.com/video/${provider_id}` };
}
