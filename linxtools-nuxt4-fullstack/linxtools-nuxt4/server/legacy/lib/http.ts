import type { ServerResponse } from 'node:http';
import type { HttpRequest } from '../types.ts';

export function json(res: ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export async function readJSON(req: HttpRequest): Promise<Record<string, unknown>> {
  const max = 300_000;
  const size = Number(req.headers['content-length'] || 0);
  if (size > max) throw new HttpError(413, 'O conteúdo ultrapassou o limite de 300 KB.');
  const chunks: Buffer[] = [];
  let received = 0;
  for await (const chunk of req) {
    received += chunk.length;
    if (received > max) throw new HttpError(413, 'O conteúdo ultrapassou o limite de 300 KB.');
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') throw new Error('not object');
    return parsed;
  } catch { throw new HttpError(400, 'Envie um objeto JSON válido.'); }
}

export function field(value: unknown, name: string, max = 200_000, required = true): string {
  if (typeof value !== 'string') {
    if (!required && (value === undefined || value === null)) return '';
    throw new HttpError(400, `O campo ${name} deve ser um texto.`);
  }
  if (value.length > max) throw new HttpError(413, `O campo ${name} ultrapassou o limite permitido.`);
  const clean = value.trim();
  if (required && !clean) throw new HttpError(400, `Preencha o campo ${name}.`);
  return clean;
}
