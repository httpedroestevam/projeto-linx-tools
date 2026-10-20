import { randomBytes, createHash, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { HttpError, field } from '../lib/http.ts';
import { userPermissions } from './portal.ts';
import type { IncomingMessage } from 'node:http';
import type { ProfileRole, UserRecord } from '../types.ts';

const scrypt = (password: string, salt: string, keyLength: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scryptCallback(password, salt, keyLength, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
export const SESSION_SECONDS = 60 * 60 * 12;
export const validRoles: ProfileRole[] = ['admin', 'lideranca', 'analista'];
export const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');
export const makeToken = () => randomBytes(32).toString('base64url');

export async function hashPassword(password: unknown): Promise<string> {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128)
    throw new HttpError(400, 'A senha deve ter entre 12 e 128 caracteres.');
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${hash.toString('hex')}`;
}
export async function verifyPassword(password: unknown, value: string | null | undefined): Promise<boolean> {
  if (typeof password !== 'string' || !value || !value.startsWith('scrypt:')) return false;
  const [, salt, expectedHex] = value.split(':');
  if (!salt || !expectedHex || !/^[a-f0-9]+$/.test(expectedHex)) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = await scrypt(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function validateEmail(value: unknown): string {
  const email = field(value, 'email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Informe um email válido.');
  return email;
}
export function cleanUser(user: UserRecord | null | undefined) {
  return user && user.active !== false ? { id: user.id, name: user.name, email: user.email, role: user.role, active:true, permissions: userPermissions(user) } : null;
}
export function parseSession(req: IncomingMessage): string | null {
  const cookie = String(req.headers.cookie || '').split(';').map(c => c.trim()).find(c => c.startsWith('lt_session='));
  const token = cookie?.slice('lt_session='.length);
  return token && /^[a-zA-Z0-9_-]{40,100}$/.test(token) ? token : null;
}
export function sessionCookie(req: IncomingMessage, token: string, maxAge = SESSION_SECONDS): string {
  // O atributo Secure é obrigatório fora do acesso local. Um proxy HTTPS deve enviar X-Forwarded-Proto.
  const host = req.headers.host;
  const hostname = (Array.isArray(host) ? host[0] : host || '').split(':')[0] ?? '';
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
  const forwardedProto = req.headers['x-forwarded-proto'];
  const secure = !local || ('encrypted' in req.socket && req.socket.encrypted === true) || forwardedProto === 'https';
  return `lt_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}
export function checkOrigin(req: IncomingMessage): void {
  const origin = req.headers.origin;
  if (!origin) return; // CLI/API calls can omit Origin; browsers send Origin on JSON POST.
  const host = req.headers.host;
  try {
    const parsed = new URL(origin);
    if (parsed.host !== host || !['http:', 'https:'].includes(parsed.protocol)) throw new Error('foreign');
  } catch { throw new HttpError(403, 'Origem da requisição não permitida.'); }
}
