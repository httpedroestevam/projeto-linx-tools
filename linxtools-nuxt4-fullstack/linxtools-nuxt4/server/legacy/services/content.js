import { field, HttpError } from '../lib/http.js';

export const defaultNoticeOptions = {
  categories: [
    { id: 'Geral', label: 'Geral' },
    { id: 'Procedimento', label: 'Procedimento' },
    { id: 'Treinamento', label: 'Treinamento' },
    { id: 'Urgente', label: 'Urgente' }
  ],
  priorities: [
    { id: 'normal', label: 'Normal' },
    { id: 'important', label: 'Importante' },
    { id: 'critical', label: 'Crítica' }
  ]
};
export function noticeOptionsInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400,'Informe opções válidas para os comunicados.');
  const normalize = (items,name,maxLabel) => {
    if (!Array.isArray(items) || !items.length || items.length > 50) throw new HttpError(400,`Mantenha entre 1 e 50 ${name}.`);
    const ids=new Set(),labels=new Set();
    return items.map(item=>{
      if(!item||typeof item!=='object'||Array.isArray(item))throw new HttpError(400,`Opção inválida em ${name}.`);
      const id=field(item.id,`${name}: identificador`,60);
      const label=field(item.label,`${name}: nome`,maxLabel);
      const normalizedLabel=label.toLocaleLowerCase('pt-BR');
      if(!/^[\p{L}\p{N}_-]+$/u.test(id)||ids.has(id)||labels.has(normalizedLabel))throw new HttpError(400,`Identificadores e nomes de ${name} devem ser únicos e válidos.`);
      ids.add(id);labels.add(normalizedLabel);
      return {id,label};
    });
  };
  const categories=normalize(input.categories,'categorias',50);
  const priorities=normalize(input.priorities,'prioridades',40);
  if(Object.keys(input).some(key=>!['categories','priorities'].includes(key)))throw new HttpError(400,'Campo desconhecido nas opções dos comunicados.');
  return {categories,priorities};
}
export function normalizeNoticeOptions(input) {
  return input ? noticeOptionsInput(input) : structuredClone(defaultNoticeOptions);
}
export function noticeInput(input, { partial = false, options = defaultNoticeOptions } = {}) {
  const result = {};
  const selectedOptions=normalizeNoticeOptions(options);
  for (const [name, limit] of [['title',140], ['body',8000]]) {
    if (!partial || Object.hasOwn(input, name)) result[name] = field(input[name],name,limit);
  }
  const defaults={category:selectedOptions.categories[0].id,priority:selectedOptions.priorities.find(p=>p.id==='normal')?.id||selectedOptions.priorities[0].id,status:'published'};
  for (const [name, values] of [['category',selectedOptions.categories.map(c=>c.id)],['priority',selectedOptions.priorities.map(p=>p.id)],['status',['draft','published']]]) {
    if (!partial || Object.hasOwn(input, name)) {
      const raw = input[name] || defaults[name];
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
