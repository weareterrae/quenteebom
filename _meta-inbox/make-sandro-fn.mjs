// Gera index-sandro.ts a partir do index.ts: secrets com prefixo SANDRO_ (com fallback aos partilhados) e tabela própria.
import fs from 'node:fs';
const src = fs.readFileSync(new URL('./index.ts', import.meta.url), 'utf8');
let s = src;
const envLine = 'const env = (k: string, d = "") => Deno.env.get(k) ?? d;';
if (!s.includes(envLine)) throw new Error('linha env não encontrada');
s = s.replace(envLine,
  '// Cópia para o inbox pessoal do Sandro: vive no projecto do Nº 5, por isso lê secrets com prefixo SANDRO_ (fallback aos partilhados: REDATOR_KEY, RESEND_API_KEY, SUPABASE_*).\n' +
  'const PREFIX = "SANDRO_";\n' +
  'const env = (k: string, d = "") => Deno.env.get(PREFIX + k) ?? Deno.env.get(k) ?? d;\n' +
  'const TABLE = "pending_replies_sandro";');
const n = (s.match(/from\("pending_replies"\)/g) || []).length;
s = s.replace(/from\("pending_replies"\)/g, 'from(TABLE)');
fs.writeFileSync(new URL('./index-sandro.ts', import.meta.url), s);
console.log('index-sandro.ts gerado; tabela substituída em', n, 'sítios;', s.length, 'chars');
