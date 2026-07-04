// Insere o link "Profissional" no menu de todos os HTML (e nos geradores) onde falta
const fs = require('fs');
const path = require('path');
const LINK = '<a href="/profissional/">Profissional</a>';
const ANCHOR = '<a href="/#mundos">Produtos</a>';
let patched = 0, skipped = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'assets'].includes(e.name)) continue;
      walk(path.join(dir, e.name));
    } else if (e.name.endsWith('.html') || e.name.startsWith('_gen-')) {
      const f = path.join(dir, e.name);
      let s = fs.readFileSync(f, 'utf8');
      if (!s.includes(ANCHOR)) continue;
      if (s.includes('href="/profissional/">Profissional')) { skipped++; continue; }
      s = s.split(ANCHOR).join(ANCHOR + '\n      ' + LINK);
      fs.writeFileSync(f, s, 'utf8');
      patched++;
      console.log('patch ' + path.relative(__dirname, f));
    }
  }
}
walk(__dirname);
console.log('patched=' + patched + ' já tinham=' + skipped);
