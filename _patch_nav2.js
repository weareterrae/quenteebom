// Funde Revendedores na Área Profissional em todo o site:
// 1) footer "Marca": Revendedores -> Área Profissional
// 2) remove "Revendedores" do menu de navegação
// 3) restantes links /revendedores/ -> /profissional/revendedor/
const fs = require('fs');
const path = require('path');
let patched = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'assets', 'revendedores'].includes(e.name)) continue;
      walk(path.join(dir, e.name));
    } else if (e.name.endsWith('.html') || e.name.startsWith('_gen-')) {
      const f = path.join(dir, e.name);
      let s = fs.readFileSync(f, 'utf8');
      const orig = s;
      s = s.split('<a href="/dicas/">Dicas e sugestões</a><a href="/revendedores/">Revendedores</a>')
           .join('<a href="/dicas/">Dicas e sugestões</a><a href="/profissional/">Área Profissional</a>');
      s = s.replace(/[ \t]*<a href="\/revendedores\/">Revendedores<\/a>\r?\n/g, '');
      s = s.split('"/revendedores/"').join('"/profissional/revendedor/"');
      if (s !== orig) { fs.writeFileSync(f, s, 'utf8'); patched++; console.log('patch ' + path.relative(__dirname, f)); }
    }
  }
}
walk(__dirname);
console.log('patched=' + patched);
