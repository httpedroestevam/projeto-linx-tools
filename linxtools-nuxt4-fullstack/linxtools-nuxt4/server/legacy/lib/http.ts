export function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function readJSON(req) {
  const max = 300_000;
  const size = Number(req.headers['content-length'] || 0);
  if (size > max) throw new HttpError(413, 'O conteúdo ultrapassou o limite de 300 KB.');
  const chunks = [];
  let received = 0;
  for await (const chunk of req) {
    received += chunk.length;
    if (received > max) throw new HttpError(413, 'O conteúdo ultrapassou o limite de 300 KB.');
    chunks.push(chunk);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('not object');
    return parsed;
  } catch { throw new HttpError(400, 'Envie um objeto JSON válido.'); }
}

export function field(value, name, max = 200_000, required = true) {
  if (typeof value !== 'string') {
    if (!required && (value === undefined || value === null)) return '';
    throw new HttpError(400, `O campo ${name} deve ser um texto.`);
  }
  if (value.length > max) throw new HttpError(413, `O campo ${name} ultrapassou o limite permitido.`);
  const clean = value.trim();
  if (required && !clean) throw new HttpError(400, `Preencha o campo ${name}.`);
  return clean;
}
