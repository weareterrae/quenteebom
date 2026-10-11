// Gerador dos dados da app do consumidor (quenteebom.com/app/) (correr com: node _gen-app.js)
// Lê os dados dos geradores do site (_gen-qeb.js e _gen-extra.js) sem os executar
// e escreve app/dados.json. Correr sempre que mudarem produtos, receitas ou dicas.
const fs = require('fs');
const path = require('path');

function bloco(ficheiro, inicio, fim) {
  const src = fs.readFileSync(path.join(__dirname, ficheiro), 'utf8');
  const a = src.indexOf(inicio), b = src.indexOf(fim, a);
  if (a < 0 || b < 0) throw new Error(`Bloco ${inicio} não encontrado em ${ficheiro}`);
  return src.slice(a, b);
}
function avalia(codigo, nome) { return new Function(codigo + `\nreturn ${nome};`)(); }
const texto = s => String(s || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

const CATS = avalia(bloco('_gen-qeb.js', 'const CATS', 'const ALLPROD'), 'CATS');
const META = avalia(bloco('_gen-extra.js', 'const META', 'const DESTAQUE'), 'META');
const RECEITAS = avalia(bloco('_gen-extra.js', 'const RECEITAS', 'const DICAS'), 'RECEITAS');
const DICAS = avalia(bloco('_gen-extra.js', 'const DICAS', 'function headerHTML'), 'DICAS');

// Miniaturas leves (poupa-dados) em app/img/{p,r,m}/<slug>.jpg, feitas a partir das imagens do site.
// As receitas que já são .webp usam a imagem original (já é leve).
const mundos = CATS.map(c => ({ slug: c.slug, nome: c.nome, img: `/app/img/m/${c.slug}.jpg` }));
const produtos = [];
CATS.forEach(c => c.grupos.forEach(g => g.items.forEach(it => {
  produtos.push({ slug: it[0], nome: it[1], desc: texto(it[2]), mundo: c.slug, grupo: g.t, img: `/app/img/p/${it[0]}.jpg`, foto: `/assets/produtos/${c.slug}/${it[0]}.png` });
})));

const receitas = RECEITAS.map(r => ({
  slug: r.slug, titulo: r.titulo, img: r.img.endsWith('.webp') ? r.img : `/app/img/r/${r.slug}.jpg`, tempo: r.tempo, dif: r.dif, rende: r.rende,
  intro: texto(r.intro), produtos: (r.produtos || []).map(p => p[0]),
  tags: (META[r.slug] && META[r.slug].tags) || [],
}));

const dicas = DICAS.map(d => ({ ico: d.ico, t: texto(d.t), p: texto(d.p) }));

const dados = { gerado: new Date().toISOString().slice(0, 10), mundos, produtos, receitas, dicas };
fs.mkdirSync(path.join(__dirname, 'app'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'app', 'dados.json'), JSON.stringify(dados));
console.log(`app/dados.json: ${produtos.length} produtos, ${receitas.length} receitas, ${dicas.length} dicas`);
if (produtos.length !== 80 || receitas.length !== 80) console.warn('⚠️  Os números públicos são 80 produtos e 80 receitas. Confirmar antes de publicar.');
