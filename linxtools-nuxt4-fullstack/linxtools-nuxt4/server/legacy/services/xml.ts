import { HttpError } from '../lib/http.ts';

const NAME = /^[A-Za-z_:][\w.:-]*$/;
function validateEntities(text: string, position: number): void {
  for (let i = text.indexOf('&'); i !== -1; i = text.indexOf('&', i + 1)) {
    const match = /^&(?:(amp|lt|gt|apos|quot)|#([0-9]+)|#x([a-fA-F0-9]+));/.exec(text.slice(i));
    if (!match) invalid('Referência de entidade XML inválida ou não escapada', position + i);
    const value = match[2] ? Number(match[2]) : match[3] ? parseInt(match[3], 16) : null;
    if (value !== null && (!(value === 9 || value === 10 || value === 13 || value >= 32) || value > 0x10FFFF || (value >= 0xD800 && value <= 0xDFFF)))
      invalid('Referência numérica XML inválida', position + i);
    i += match[0].length - 1;
  }
}
function invalid(message: string, position: number): never { throw new HttpError(422, `${message} (posição ${position + 1}).`); }

function parseAttributes(input: string, at: number): void {
  let pos = 0;
  const attrs = new Set();
  while (pos < input.length) {
    while (/\s/.test(input[pos] || '') && pos < input.length) pos++;
    if (pos >= input.length) break;
    const match = /^[A-Za-z_:][\w.:-]*/.exec(input.slice(pos));
    if (!match) invalid('Nome de atributo inválido', at + pos);
    const key = match[0];
    if (attrs.has(key)) invalid(`Atributo repetido: ${key}`, at + pos);
    attrs.add(key);
    pos += key.length;
    while (/\s/.test(input[pos] || '') && pos < input.length) pos++;
    if (input[pos] !== '=') invalid(`O atributo ${key} precisa de =`, at + pos);
    pos++;
    while (/\s/.test(input[pos] || '') && pos < input.length) pos++;
    const quote = input[pos];
    const quoteCharacter = quote === '"' || quote === "'" ? quote : invalid(`O atributo ${key} precisa estar entre aspas`, at + pos);
    pos++;
    const end = input.indexOf(quoteCharacter, pos);
    if (end === -1) invalid(`Aspas não fechadas no atributo ${key}`, at + pos);
    if (input.slice(pos, end).includes('<')) invalid('Caractere < inválido em atributo', at + pos);
    validateEntities(input.slice(pos, end), at + pos);
    pos = end + 1;
    if (pos < input.length && !/\s/.test(input[pos] ?? '')) invalid('Separe os atributos por espaços', at + pos);
  }
}

function findTagEnd(xml: string, start: number): number {
  let quote = '';
  for (let i = start; i < xml.length; i++) {
    const c = xml[i];
    if (quote) { if (c === quote) quote = ''; }
    else if (c === '"' || c === "'") quote = c;
    else if (c === '>') return i;
  }
  invalid('Tag não finalizada', start);
}

// Verifica integridade sintática e aninhamento. Não valida XSD/assinatura ou regras fiscais.
// Não carrega entidades externas e bloqueia DOCTYPE deliberadamente.
export function inspectXML(xml: string): {root: string; tags: number; maxDepth: number; bytes: number} {
  const input = xml.replace(/^\uFEFF/, '');
  const stack = [];
  let roots = 0, tags = 0, maxDepth = 0, root = '', i = 0;
  while (i < input.length) {
    const next = input.indexOf('<', i);
    if (next === -1) {
      if (!stack.length && input.slice(i).trim()) invalid('Texto fora do elemento principal', i);
      validateEntities(input.slice(i), i);
      break;
    }
    if (!stack.length && input.slice(i, next).trim()) invalid('Texto fora do elemento principal', i);
    if (input.slice(i, next).includes(']]>')) invalid('Fechamento CDATA inesperado', i);
    validateEntities(input.slice(i, next), i);
    if (input.startsWith('<!--', next)) {
      const end = input.indexOf('-->', next + 4);
      if (end < 0) invalid('Comentário não finalizado', next);
      i = end + 3; continue;
    }
    if (input.startsWith('<![CDATA[', next)) {
      if (!stack.length) invalid('CDATA fora do elemento principal', next);
      const end = input.indexOf(']]>', next + 9);
      if (end < 0) invalid('CDATA não finalizado', next);
      i = end + 3; continue;
    }
    if (input.startsWith('<?', next)) {
      const end = input.indexOf('?>', next + 2);
      if (end < 0) invalid('Instrução XML não finalizada', next);
      i = end + 2; continue;
    }
    if (/^<!doctype/i.test(input.slice(next, next + 9)))
      invalid('DOCTYPE/entidades externas não são aceitos nesta ferramenta', next);
    if (input.startsWith('<!', next)) invalid('Declaração XML não suportada', next);
    const end = findTagEnd(input, next + 1);
    const raw = input.slice(next + 1, end).trim();
    if (raw.startsWith('/')) {
      const tag = raw.slice(1).trim();
      if (!NAME.test(tag)) invalid('Tag de fechamento inválida', next);
      if (stack.pop() !== tag) invalid(`Fechamento inesperado: </${tag}>`, next);
    } else {
      const selfClosing = raw.endsWith('/');
      const cleaned = selfClosing ? raw.slice(0, -1).trimEnd() : raw;
      const m = /^([^\s]+)([\s\S]*)$/.exec(cleaned);
      if (!m || !m[1] || !NAME.test(m[1])) invalid('Nome de elemento inválido', next);
      if (m[2]) parseAttributes(m[2], next + 1 + m[1].length);
      if (stack.length === 0) {
        roots++;
        if (roots > 1) invalid('Há mais de um elemento raiz', next);
        root = m[1];
      }
      tags++;
      if (!selfClosing) {
        stack.push(m[1]);
        maxDepth = Math.max(maxDepth, stack.length);
      }
    }
    i = end + 1;
  }
  if (stack.length) throw new HttpError(422, `Falta fechar a tag <${stack.at(-1)}>.`);
  if (roots === 0) throw new HttpError(422, 'O XML não contém um elemento raiz.');
  return { root, tags, maxDepth, bytes: Buffer.byteLength(xml, 'utf8') };
}
