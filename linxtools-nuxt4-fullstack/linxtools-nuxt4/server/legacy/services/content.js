import { field, HttpError } from '../lib/http.js';
import sanitizeHtml from 'sanitize-html';

const noticeHtmlOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    'img',
    'figure',
    'figcaption',
    'iframe',
    'video',
    'source',
    'u',
    's',
    'del',
    'sup',
    'sub',
    'span',
    'div',
    'hr',
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
    'pre',
    'code',
  ],
  allowedAttributes: {
    '*': ['class', 'style', 'title'],
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'srcset', 'alt', 'width', 'height', 'loading'],
    iframe: [
      'src',
      'title',
      'width',
      'height',
      'allow',
      'allowfullscreen',
      'frameborder',
      'loading',
      'referrerpolicy',
    ],
    video: ['src', 'width', 'height', 'controls', 'poster'],
    source: ['src', 'type'],
    table: ['border', 'cellpadding', 'cellspacing', 'width'],
    th: ['colspan', 'rowspan', 'scope', 'width', 'height'],
    td: ['colspan', 'rowspan', 'width', 'height'],
  },
  allowedStyles: {
    '*': {
      color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^[a-z]+$/i],
      'background-color': [
        /^#[0-9a-f]{3,8}$/i,
        /^rgba?\([\d\s.,%]+\)$/i,
        /^[a-z]+$/i,
      ],
      'font-family': [/^[\w\s,"'-]+$/],
      'font-size': [/^\d{1,3}(?:px|pt|em|rem|%)$/i],
      'font-weight': [/^(?:normal|bold|[1-9]00)$/i],
      'font-style': [/^(?:normal|italic|oblique)$/i],
      'text-align': [/^(?:left|right|center|justify)$/i],
      'text-decoration': [/^(?:none|underline|line-through|overline)$/i],
      'line-height': [/^(?:normal|\d+(?:\.\d+)?(?:px|em|rem|%)?)$/i],
      width: [/^\d{1,4}(?:px|%|em|rem)?$/i],
      height: [/^\d{1,4}(?:px|%|em|rem)?$/i],
      'border-collapse': [/^(?:collapse|separate)$/i],
      'border-width': [/^\d{1,3}(?:px|pt)?$/i],
      'border-style': [/^(?:none|solid|dashed|dotted|double)$/i],
      'border-color': [/^#[0-9a-f]{3,8}$/i, /^[a-z]+$/i],
      'vertical-align': [/^(?:top|middle|bottom|baseline)$/i],
      float: [/^(?:left|right|none)$/i],
      display: [/^(?:block|inline|inline-block)$/i],
      'max-width': [/^\d{1,4}(?:px|%|em|rem)?$/i],
      margin: [/^\d{1,3}(?:px|pt|em|rem|%)?(?:\s+\d{1,3}(?:px|pt|em|rem|%)?){0,3}$/i],
      'margin-left': [/^\d{1,3}(?:px|pt|em|rem|%)?$/i],
      'margin-right': [/^\d{1,3}(?:px|pt|em|rem|%)?$/i],
      padding: [/^\d{1,3}(?:px|pt|em|rem|%)?(?:\s+\d{1,3}(?:px|pt|em|rem|%)?){0,3}$/i],
    },
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https'],
    iframe: ['http', 'https'],
    video: ['http', 'https'],
    source: ['http', 'https'],
  },
  allowedIframeHostnames: [
    'youtube.com',
    'www.youtube.com',
    'youtube-nocookie.com',
    'www.youtube-nocookie.com',
    'player.vimeo.com',
  ],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform(
      'a',
      { rel: 'noopener noreferrer' },
      true,
    ),
  },
};

export function sanitizeNoticeHtml(value) {
  return sanitizeHtml(value, noticeHtmlOptions);
}

export function sanitizeNotice(notice) {
  return { ...notice, body: sanitizeNoticeHtml(String(notice.body || '')) };
}

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
  for (const [name, limit] of [['title',140]]) {
    if (!partial || Object.hasOwn(input, name)) result[name] = field(input[name],name,limit);
  }
  if (!partial || Object.hasOwn(input, 'body')) {
    const body = sanitizeNoticeHtml(field(input.body, 'body', 200000));
    if (!body.trim()) throw new HttpError(400, 'O conteúdo do comunicado não pode ficar vazio.');
    result.body = body;
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
