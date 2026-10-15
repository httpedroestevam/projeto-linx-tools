import { createApp } from './app.js';
import { readFile } from 'node:fs/promises';

// .env opcional, parser simples para evitar dependências no MVP.
try {
  const content = await readFile(new URL('../.env', import.meta.url), 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const match = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
} catch (err) { if (err.code !== 'ENOENT') throw err; }

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const app = createApp({ dataProvider: process.env.DATA_PROVIDER || 'local', supabaseUrl: process.env.SUPABASE_URL, supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY });
app.listen(port, host, () => console.log(`\n  LINXTOOLS MVP pronto em http://${host}:${port}\n  API: http://${host}:${port}/api/health\n`));
