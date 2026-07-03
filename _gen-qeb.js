// Gerador das páginas de categoria Quente e Bom — node _gen-qeb.js
// Editar os dados aqui e re-correr; NÃO editar os HTML gerados à mão.
const fs = require('fs');
const path = require('path');

const CATS = [
  {
    slug: 'pao', nome: 'Pão', eyebrow: 'O pão de cada dia',
    intro: 'Do pão de forma fofinho ao artesanal de forno — frescura que se sente em cada fatia.',
    hero: '/assets/img/m_pao.jpg',
    grupos: [
      { t: 'Artesanal', items: [
        ['pao-artesanal-9-cereais', 'Pão Artesanal 9 Cereais'],
        ['pao-artesanal-centeio', 'Pão Artesanal de Centeio'],
        ['pao-artesanal-integral', 'Pão Artesanal Integral'],
        ['pao-artesanal-rustico', 'Pão Artesanal Rústico'],
      ]},
      { t: 'Pão de Forma', items: [
        ['pao-de-forma-simples', 'Pão de Forma Simples'],
        ['pao-de-forma-9-cereais', 'Pão de Forma 9 Cereais'],
        ['pao-de-forma-boa-linha', 'Pão de Forma Boa Linha'],
        ['pao-de-forma-brioche', 'Pão de Forma Brioche'],
        ['pao-de-forma-integral', 'Pão de Forma Integral'],
        ['pao-de-forma-multicereais', 'Pão de Forma Multicereais'],
        ['pao-de-forma-rustico', 'Pão de Forma Rústico'],
        ['pao-de-forma-torradas-tostas', 'Especial Torradas e Tostas'],
      ]},
      { t: 'Super Fofo', items: [
        ['super-fofo-trigo', 'Super Fofo Trigo'],
        ['super-fofo-9-cereais', 'Super Fofo 9 Cereais'],
        ['super-fofo-integral', 'Super Fofo Integral'],
      ]},
      { t: 'Para todos os momentos', items: [
        ['pao-de-hamburguer', 'Pão de Hambúrguer'],
        ['pao-de-hot-dog', 'Pão de Hot Dog'],
        ['pao-de-leite', 'Pão de Leite'],
        ['mini-pao-de-leite', 'Mini Pão de Leite'],
        ['croissants', 'Croissants'],
      ]},
    ],
  },
  {
    slug: 'cakes', nome: 'Cakes', eyebrow: 'Rápido e fofo',
    intro: 'Preparados para bolos incríveis — junta os ingredientes frescos e em minutos tens a magia no forno.',
    hero: '/assets/img/m_cakes.jpg',
    grupos: [
      { t: 'Preparados para bolo', items: [
        ['cake-laranja', 'Cake Laranja'],
        ['cake-chocolate', 'Cake Chocolate'],
        ['cake-cenoura', 'Cake Cenoura'],
        ['cake-yogurte', 'Cake Yogurte'],
        ['cake-caramelo', 'Cake Caramelo'],
        ['cake-ananas', 'Cake Ananás'],
        ['cake-red-velvet', 'Cake Red Velvet'],
      ]},
      { t: 'Pão de Ló e farinhas', items: [
        ['pao-de-lo-tradicional', 'Pão de Ló Tradicional'],
        ['pao-de-lo-chocolate', 'Pão de Ló Chocolate'],
        ['farinha-brioche', 'Farinha Brioche'],
      ]},
    ],
  },
  {
    slug: 'bolos-da-avo', nome: 'Bolos da Avó', eyebrow: 'Uma delícia a cada fatia',
    intro: 'Os bolos prontos que sabem a casa de avó — para o lanche, a festa e o café com quem gostamos.',
    hero: '/assets/img/m_bolos.jpg',
    grupos: [
      { t: 'Os clássicos', items: [
        ['bolo-da-avo-cenoura', 'Bolo da Avó Cenoura'],
        ['bolo-da-avo-chocolate', 'Bolo da Avó Chocolate'],
        ['bolo-da-avo-laranja', 'Bolo da Avó Laranja'],
        ['bolo-da-avo-marmore', 'Bolo da Avó Mármore'],
        ['bolo-da-avo-frutas', 'Bolo da Avó de Frutas'],
        ['bolo-da-avo-ginguba', 'Bolo da Avó de Ginguba'],
      ]},
      { t: 'Especialidades', items: [
        ['bolo-doce-de-ovos-ginguba', 'Bolo Doce de Ovos com Ginguba'],
        ['bolo-chocolate-nozes', 'Bolo de Chocolate com Nozes'],
        ['bolo-brigadeiro', 'Bolo de Brigadeiro'],
        ['pao-de-lo', 'Pão de Ló'],
        ['pao-de-lo-classico', 'Pão de Ló Clássico'],
        ['pao-de-lo-chocolate-sublime', 'Pão de Ló Chocolate Sublime'],
        ['bolo-rei-tradicional', 'Bolo Rei Tradicional'],
      ]},
    ],
  },
  {
    slug: 'biscoitos', nome: 'Biscoitos', eyebrow: 'Pequenas delícias',
    intro: 'Biscoitos com sabores para todos os gostos. Pequenos pedacinhos de prazer — prova-os todos!',
    hero: '/assets/img/m_biscoitos.jpg',
    grupos: [
      { t: 'Todos os sabores', items: [
        ['biscoitos-de-ginguba', 'Biscoitos de Ginguba'],
        ['biscoitos-de-laranja', 'Biscoitos de Laranja'],
        ['biscoitos-de-canela', 'Biscoitos de Canela'],
        ['biscoitos-de-limao', 'Biscoitos de Limão'],
        ['biscoitos-areados', 'Biscoitos Areados'],
        ['biscoitos-palmiers', 'Biscoitos Palmiers'],
        ['linguas-de-veado', 'Línguas de Veado'],
      ]},
    ],
  },
  {
    slug: 'snacks', nome: 'Snacks', eyebrow: 'Apetitoso e irresistível',
    intro: 'Frutos secos torrados no ponto — energia boa para o trabalho, a escola e o caminho.',
    hero: '/assets/img/m_snacks.jpg',
    grupos: [
      { t: 'Para levar', items: [
        ['mix-frutos-secos', 'Mix de Frutos Secos'],
        ['caju-torrado', 'Caju Torrado'],
        ['caju-torrado-sal', 'Caju Torrado com Sal'],
        ['amendoa-torrada', 'Amêndoa Torrada'],
        ['amendoa-torrada-sal', 'Amêndoa Torrada com Sal'],
      ]},
    ],
  },
  {
    slug: 'tostas', nome: 'Tostas', eyebrow: 'Bem-estar',
    intro: 'Crocantes e equilibradas — perfeitas com o teu topping preferido, do queijo à compota.',
    hero: '/assets/img/m_tostas.jpg',
    grupos: [
      { t: 'A escolha saudável', items: [
        ['tostas-integrais', 'Tostas Integrais'],
        ['tostas-multicereais', 'Tostas Multicereais'],
        ['tostas-alfarroba', 'Tostas de Alfarroba'],
      ]},
    ],
  },
  {
    slug: 'ingredientes', nome: 'Ingredientes', eyebrow: 'Para criar em casa',
    intro: 'Tudo o que a tua pastelaria caseira pede — chocolates, frutos secos e as bases de confiança.',
    hero: '/assets/img/m_ingr.jpg',
    grupos: [
      { t: 'Chocolates e cacau', items: [
        ['chocolate-de-leite', 'Chocolate de Leite 34% Cacau'],
        ['chocolate-negro', 'Chocolate Negro 70% Cacau'],
        ['chocolate-branco', 'Chocolate Branco 30% Cacau'],
        ['granulado-de-chocolate', 'Granulado de Chocolate'],
        ['cacau-em-po', 'Cacau em Pó'],
      ]},
      { t: 'Frutos secos e frutas', items: [
        ['amendoa-com-pele', 'Amêndoa Com Pele'],
        ['amendoa-sem-pele', 'Amêndoa Sem Pele'],
        ['amendoa-laminada', 'Amêndoa Laminada'],
        ['amendoa-palitada', 'Amêndoa Palitada'],
        ['caju', 'Caju'],
        ['nozes', 'Nozes'],
        ['miolo-de-avela', 'Miolo de Avelã'],
        ['sultanas', 'Sultanas'],
        ['cereja-cristalizada', 'Cereja Cristalizada'],
        ['coco-ralado', 'Coco Ralado'],
        ['sementes-de-sesamo', 'Sementes de Sésamo'],
      ]},
      { t: 'Bases da pastelaria', items: [
        ['acucar-em-po', 'Açúcar em Pó'],
        ['amido-de-milho', 'Amido de Milho'],
        ['fermento-em-po', 'Fermento em Pó para Bolos'],
        ['chantilly-em-po', 'Chantilly em Pó'],
        ['creme-de-pasteleiro', 'Creme de Pasteleiro'],
        ['pao-ralado', 'Pão Ralado'],
      ]},
    ],
  },
];

function headerHTML() {
  return `<header class="hdr solid" id="hdr">
  <div class="wrap hrow">
    <a href="/">
      <img src="/assets/logos/logo_white_real.png" class="hlogo logo-w" alt="Quente e Bom">
      <img src="/assets/logos/logo_color_trans.png" class="hlogo logo-c" alt="Quente e Bom">
    </a>
    <nav class="nav">
      <a href="/#mundos">Produtos</a>
      <a href="/#historia">História</a>
      <a href="/revendedores/">Revendedores</a>
      <a href="/#onde">Onde comprar</a>
      <a href="#" class="cta" onclick="openBento();return false;">Falar com o Bento</a>
    </nav>
  </div>
</header>`;
}

function footerHTML() {
  return `<footer class="ft">
  <div class="wrap">
    <div class="ft-top">
      <div style="max-width:280px;">
        <img src="/assets/logos/logo_white_real.png" class="ft-logo" alt="Quente e Bom">
        <p style="color:#c9b6a2;font-size:14px;">Todos os dias, uma delícia. Feito em Angola desde 2012.</p>
      </div>
      <div class="ft-col"><h5>Produtos</h5>
        <a href="/pao/">Pão</a><a href="/cakes/">Cakes</a><a href="/bolos-da-avo/">Bolos da Avó</a><a href="/biscoitos/">Biscoitos</a><a href="/snacks/">Snacks</a><a href="/tostas/">Tostas</a><a href="/ingredientes/">Ingredientes</a>
      </div>
      <div class="ft-col"><h5>Marca</h5>
        <a href="/#historia">A nossa história</a><a href="/revendedores/">Revendedores</a><a href="/#onde">Onde comprar</a>
      </div>
      <div class="ft-col"><h5>Contactos</h5>
        <p>Fábrica · Estrada do Calumbo/Zango,<br>Viana Park, Viana — Luanda</p>
        <a href="https://www.instagram.com/quenteebom/" target="_blank" rel="noopener">Instagram · @quenteebom</a>
        <a href="https://www.facebook.com/quenteebomangola" target="_blank" rel="noopener">Facebook</a>
      </div>
    </div>
    <div class="ft-bot">© 2026 Doce, Quente e Bom · Feito em Angola 🇦🇴</div>
  </div>
</footer>`;
}

function pageHTML(cat) {
  const grupos = cat.grupos.map(g => {
    const cards = g.items.map(([slug, nome]) => `        <div class="prod" data-reveal>
          <div class="ph"><img src="/assets/produtos/${cat.slug}/${slug}.png" alt="${nome} — Quente e Bom" loading="lazy"></div>
          <h3>${nome}</h3>
        </div>`).join('\n');
    return `      <div class="strip-t"><h3>${g.t}</h3></div>
      <div class="prods">
${cards}
      </div>`;
  }).join('\n');

  const nProds = cat.grupos.reduce((s, g) => s + g.items.length, 0);

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${cat.nome} — Quente e Bom · Feito em Angola</title>
<meta name="description" content="${cat.intro} ${nProds} produtos Quente e Bom, nos supermercados de todo o Angola.">
<link rel="canonical" href="https://www.quenteebom.co.ao/${cat.slug}/">
<meta property="og:title" content="${cat.nome} — Quente e Bom">
<meta property="og:description" content="${cat.intro}">
<meta property="og:image" content="https://www.quenteebom.co.ao${cat.hero}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%E2%98%80%EF%B8%8F%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="/assets/css/qeb.css">
</head>
<body>

${headerHTML()}

<section class="phero">
  <img src="${cat.hero}" alt="${cat.nome} Quente e Bom">
  <div class="wrap">
    <div class="eyebrow">${cat.eyebrow}</div>
    <h1>${cat.nome}</h1>
    <p>${cat.intro}</p>
  </div>
</section>

<section class="sec">
  <div class="wrap">
${grupos}
  </div>
</section>

<section class="b2b">
  <div class="mrays"></div>
  <div class="wrap">
    <div data-reveal>
      <div class="eyebrow">Para o seu negócio</div>
      <h2>Quer vender ${cat.nome} na sua loja?</h2>
      <p>Produtos que vendem todos os dias e clientes que voltam sempre. Fale connosco e torne-se revendedor Quente e Bom.</p>
      <a class="btn btn-sun" href="/revendedores/">Quero ser revendedor</a>
    </div>
    <div class="b2b-img" data-reveal><img src="/assets/img/expositor_1.jpg" alt="Expositor Quente e Bom em supermercado" loading="lazy"></div>
  </div>
</section>

${footerHTML()}

<script src="/assets/js/site.js"></script>
<script src="/assets/js/bento.js"></script>
</body>
</html>
`;
}

let total = 0;
CATS.forEach(cat => {
  const dir = path.join(__dirname, cat.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), pageHTML(cat), 'utf8');
  const n = cat.grupos.reduce((s, g) => s + g.items.length, 0);
  total += n;
  console.log(`${cat.slug}/index.html — ${n} produtos`);
});
console.log(`TOTAL: ${total} produtos em ${CATS.length} categorias`);
