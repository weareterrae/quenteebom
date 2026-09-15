// Inbox pessoal do Sandro no projecto do Nº 5 (rycgekqszxyudmchpqvs). Token de gestão vem do ambiente, nunca é impresso.
// node sandro-n5.mjs table   -> cria pending_replies_sandro clonando pending_replies
// node sandro-n5.mjs deploy  -> faz deploy de index-sandro.ts como função meta-inbox-sandro (verify_jwt off)
// node sandro-n5.mjs check   -> lista funções e confirma a tabela
import fs from 'node:fs';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!TOKEN) { console.error('sem SUPABASE_ACCESS_TOKEN'); process.exit(1); }
const REF = 'rycgekqszxyudmchpqvs';
const API = 'https://api.supabase.com/v1';
const H = { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' };
const cmd = process.argv[2] || 'check';

async function sql(query) {
  const r = await fetch(`${API}/projects/${REF}/database/query`, { method: 'POST', headers: H, body: JSON.stringify({ query }) });
  return [r.status, (await r.text()).slice(0, 400)];
}

if (cmd === 'table') {
  console.log(await sql(`create table if not exists pending_replies_sandro (like pending_replies including all);
    alter table pending_replies_sandro enable row level security;
    select count(*) from pending_replies_sandro;`));
}

if (cmd === 'deploy') {
  const code = fs.readFileSync(new URL('./index-sandro.ts', import.meta.url), 'utf8');
  const fd = new FormData();
  fd.append('metadata', JSON.stringify({ entrypoint_path: 'index.ts', name: 'meta-inbox-sandro', verify_jwt: false }));
  fd.append('file', new Blob([code], { type: 'application/typescript' }), 'index.ts');
  const r = await fetch(`${API}/projects/${REF}/functions/deploy?slug=meta-inbox-sandro`, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN }, body: fd });
  console.log('deploy', r.status, (await r.text()).slice(0, 300));
}

if (cmd === 'check') {
  const r = await fetch(`${API}/projects/${REF}/functions`, { headers: H });
  const j = await r.json();
  console.log('funções:', Array.isArray(j) ? j.map(f => `${f.slug} (${f.status}, jwt ${f.verify_jwt})`).join(' | ') : JSON.stringify(j).slice(0, 200));
  console.log(await sql(`select column_name from information_schema.columns where table_name='pending_replies_sandro' order by ordinal_position`));
}
