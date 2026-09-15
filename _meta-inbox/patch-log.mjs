import fs from 'node:fs';
let s = fs.readFileSync('index-sandro.ts', 'utf8');
const old = '    if (!await validSignature(req, raw)) return new Response("bad sig", { status: 401 });';
if (!s.includes(old)) throw new Error('linha não encontrada');
s = s.replace(old, '    const sigOk = await validSignature(req, raw);\n    console.log("WEBHOOK_POST", url.pathname, "sig", sigOk, raw.slice(0, 400));\n    if (!sigOk) return new Response("bad sig", { status: 401 });');
fs.writeFileSync('index-sandro.ts', s);
console.log('patched');
