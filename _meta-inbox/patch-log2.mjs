import fs from 'node:fs';
let s = fs.readFileSync('index-sandro.ts', 'utf8');
s = s.replace('console.log("WEBHOOK_POST", url.pathname, "sig", sigOk, raw.slice(0, 400));', 'console.log("WEBHOOK_POST", url.pathname, "sig", sigOk);');
s = s.replace(/    console\.log\("AVO_DIAG_WEBHOOK"[^\n]*\n/, '');
fs.writeFileSync('index-sandro.ts', s);
console.log('raw log removido:', !s.includes('raw.slice(0, 400)'), 'diag removido:', !s.includes('AVO_DIAG_WEBHOOK'));
