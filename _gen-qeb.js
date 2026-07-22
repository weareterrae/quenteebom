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
        ['pao-artesanal-9-cereais', 'Pão Artesanal 9 Cereais', 'Crosta rústica e miolo rico em cereais e sementes — pão a sério, de forno.'],
        ['pao-artesanal-centeio', 'Pão Artesanal de Centeio', 'O sabor profundo do centeio, denso e aromático, para quem gosta de carácter.'],
        ['pao-artesanal-integral', 'Pão Artesanal Integral', 'Farinha integral e fermentação com tempo — simples, honesto e cheio de fibra.'],
        ['pao-artesanal-rustico', 'Pão Artesanal Rústico', 'Como o pão de antigamente: crosta estaladiça por fora, macio por dentro.'],
      ]},
      { t: 'Pão de Forma', items: [
        ['pao-de-forma-simples', 'Pão de Forma Simples', 'O clássico lá de casa — fatias macias para torradas, sandes e tudo o resto.'],
        ['pao-de-forma-9-cereais', 'Pão de Forma 9 Cereais', 'Nove cereais numa fatia fofa — energia boa para começar o dia.'],
        ['pao-de-forma-boa-linha', 'Pão de Forma Boa Linha', 'Leve e equilibrado, para quem cuida da linha sem abrir mão do sabor.'],
        ['pao-de-forma-brioche', 'Pão de Forma Brioche', 'Extra fofo e levemente adocicado — as manhãs ficam logo mais felizes.'],
        ['pao-de-forma-integral', 'Pão de Forma Integral', 'Todo o sabor do trigo integral em fatias macias, dia após dia.'],
        ['pao-de-forma-multicereais', 'Pão de Forma Multicereais', 'Mistura generosa de cereais e sementes, fatia a fatia.'],
        ['pao-de-forma-rustico', 'Pão de Forma Rústico', 'O jeito prático do pão de forma com a alma do pão rústico.'],
        ['pao-de-forma-torradas-tostas', 'Especial Torradas e Tostas', 'Feito para tostar: fatias que ficam douradas, crocantes e perfeitas.'],
      ]},
      { t: 'Super Fofo', items: [
        ['super-fofo-trigo', 'Super Fofo Trigo', 'O nome diz tudo — fofinho de derreter, para sandes que desaparecem num instante.'],
        ['super-fofo-9-cereais', 'Super Fofo 9 Cereais', 'A fofura de sempre com o bónus de nove cereais.'],
        ['super-fofo-integral', 'Super Fofo Integral', 'Integral e super fofo ao mesmo tempo? Sim, é possível.'],
      ]},
      { t: 'Para todos os momentos', items: [
        ['pao-de-hamburguer', 'Pão de Hambúrguer', 'Macio e dourado, aguenta o hambúrguer mais recheado sem se desfazer.'],
        ['pao-de-hot-dog', 'Pão de Hot Dog', 'O parceiro oficial das cachorradas em família.'],
        ['pao-de-leite', 'Pão de Leite', 'Doce na medida certa — o preferido dos lanches da escola.'],
        ['mini-pao-de-leite', 'Mini Pão de Leite', 'Pequenos, fofos e irresistíveis: um nunca chega.'],
        ['croissants', 'Croissants', 'Folhados e amanteigados, para um pequeno-almoço com ar de fim de semana.'],
      ]},
    ],
  },
  {
    slug: 'cakes', nome: 'Cakes', eyebrow: 'Rápido e fofo',
    intro: 'Preparados para bolos incríveis — junta os ingredientes frescos e em minutos tens a magia no forno.',
    hero: '/assets/img/m_cakes.jpg',
    grupos: [
      { t: 'Preparados para bolo', items: [
        ['cake-laranja', 'Cake Laranja', 'Bolo de laranja fresquinho e fofo, pronto num instante — rápido e fofo!'],
        ['cake-chocolate', 'Cake Chocolate', 'Para os dias que pedem chocolate: intenso, húmido e fácil de fazer.'],
        ['cake-cenoura', 'Cake Cenoura', 'O famoso bolo de cenoura, fofinho e dourado, sem complicações.'],
        ['cake-yogurte', 'Cake Yogurte', 'Leve e macio como deve ser um bolo de iogurte — perfeito para o lanche.'],
        ['cake-caramelo', 'Cake Caramelo', 'Doce de caramelo em forma de bolo, para adoçar qualquer tarde.'],
        ['cake-ananas', 'Cake Ananás', 'Tropical e húmido, com aquele toque de ananás que sabe a festa.'],
        ['cake-red-velvet', 'Cake Red Velvet', 'O clássico americano aveludado, agora fácil de fazer em casa.'],
      ]},
      { t: 'Pão de Ló e farinhas', items: [
        ['pao-de-lo-tradicional', 'Pão de Ló Tradicional', 'A base fofa de todas as festas — pronto para rechear e decorar.'],
        ['pao-de-lo-chocolate', 'Pão de Ló Chocolate', 'O pão de ló de sempre, em versão chocolate para gulosos.'],
        ['farinha-brioche', 'Farinha Brioche', 'A farinha certa para brioches caseiros fofos como nuvens.'],
      ]},
    ],
  },
  {
    slug: 'bolos-da-avo', nome: 'Bolos da Avó', eyebrow: 'Uma delícia a cada fatia',
    intro: 'Os bolos prontos que sabem a casa de avó — para o lanche, a festa e o café com quem gostamos.',
    hero: '/assets/img/m_bolos.jpg',
    grupos: [
      { t: 'Os clássicos', items: [
        ['bolo-da-avo-cenoura', 'Bolo da Avó Cenoura', 'Húmido, dourado e com sabor a infância — o rei dos lanches em família.'],
        ['bolo-da-avo-chocolate', 'Bolo da Avó Chocolate', 'Chocolate a sério em cada fatia, como a avó fazia.'],
        ['bolo-da-avo-laranja', 'Bolo da Avó Laranja', 'Perfumado e fresco, com o sol da laranja lá dentro.'],
        ['bolo-da-avo-marmore', 'Bolo da Avó Mármore', 'Baunilha e chocolate abraçados em espiral — o preferido lá de casa.'],
        ['bolo-da-avo-frutas', 'Bolo da Avó de Frutas', 'Pedacinhos de fruta em massa fofa — cor e alegria na mesa.'],
        ['bolo-da-avo-ginguba', 'Bolo da Avó de Ginguba', 'O sabor bem angolano da ginguba num bolo de casa.'],
      ]},
      { t: 'Especialidades', items: [
        ['bolo-doce-de-ovos-ginguba', 'Bolo Doce de Ovos com Ginguba', 'Doce de ovos cremoso e crocante de ginguba — uma dupla irresistível.'],
        ['bolo-chocolate-nozes', 'Bolo de Chocolate com Nozes', 'Chocolate intenso e nozes crocantes, para ocasiões especiais.'],
        ['bolo-brigadeiro', 'Bolo de Brigadeiro', 'Para os muito gulosos: bolo com alma de brigadeiro.'],
        ['pao-de-lo', 'Pão de Ló', 'Fofo, leve e clássico — combina com tudo e com todos.'],
        ['pao-de-lo-classico', 'Pão de Ló Clássico', 'A receita tradicional, simples e sempre certeira.'],
        ['pao-de-lo-chocolate-sublime', 'Pão de Ló Chocolate Sublime', 'Camadas fofas com chocolate sublime — o nome não engana.'],
        ['bolo-rei-tradicional', 'Bolo Rei Tradicional', 'A estrela da quadra festiva, com frutas e tradição q.b.'],
      ]},
    ],
  },
  {
    slug: 'biscoitos', nome: 'Biscoitos', eyebrow: 'Pequenas delícias',
    intro: 'Biscoitos com sabores para todos os gostos. Pequenos pedacinhos de prazer — prova-os todos!',
    hero: '/assets/img/m_biscoitos.jpg',
    grupos: [
      { t: 'Todos os sabores', items: [
        ['biscoitos-de-ginguba', 'Biscoitos de Ginguba', 'Crocantes e cheios de ginguba — o sabor de Angola em cada dentada.'],
        ['biscoitos-de-laranja', 'Biscoitos de Laranja', 'Frescos e perfumados, perfeitos para molhar no chá.'],
        ['biscoitos-de-canela', 'Biscoitos de Canela', 'O clássico quentinho que enche a casa de aroma.'],
        ['biscoitos-de-limao', 'Biscoitos de Limão', 'Um toque cítrico e alegre para a pausa do café.'],
        ['biscoitos-areados', 'Biscoitos Areados', 'Desfazem-se na boca — simples e viciantes.'],
        ['biscoitos-palmiers', 'Biscoitos Palmiers', 'Folhados, caramelizados e estaladiços: elegância em forma de biscoito.'],
        ['linguas-de-veado', 'Línguas de Veado', 'Finas e crocantes, as companheiras de sempre do cafezinho.'],
      ]},
    ],
  },
  {
    slug: 'snacks', nome: 'Snacks', eyebrow: 'Apetitoso e irresistível',
    intro: 'Frutos secos torrados no ponto — energia boa para o trabalho, a escola e o caminho.',
    hero: '/assets/img/m_snacks.jpg',
    grupos: [
      { t: 'Para levar', items: [
        ['mix-frutos-secos', 'Mix de Frutos Secos', 'Caju, amêndoa, nozes e mais — um snack apetitoso e irresistível.'],
        ['caju-torrado', 'Caju Torrado', 'Caju torrado no ponto, crocante e naturalmente delicioso.'],
        ['caju-torrado-sal', 'Caju Torrado com Sal', 'O caju de sempre com aquele toque de sal que vicia.'],
        ['amendoa-torrada', 'Amêndoa Torrada', 'Amêndoas torradas devagarinho, para um snack elegante e saudável.'],
        ['amendoa-torrada-sal', 'Amêndoa Torrada com Sal', 'Crocantes, salgadas na medida — impossível comer só uma.'],
      ]},
    ],
  },
  {
    slug: 'tostas', nome: 'Tostas', eyebrow: 'Bem-estar',
    intro: 'Crocantes e equilibradas — perfeitas com o teu topping preferido, do queijo à compota.',
    hero: '/assets/img/m_tostas.jpg',
    grupos: [
      { t: 'A escolha saudável', items: [
        ['tostas-integrais', 'Tostas Integrais', 'Crocantes e ricas em fibra — a base leve para qualquer topping.'],
        ['tostas-multicereais', 'Tostas Multicereais', 'Vários cereais numa tosta estaladiça, para dias equilibrados.'],
        ['tostas-alfarroba', 'Tostas de Alfarroba', 'O toque naturalmente doce da alfarroba numa tosta diferente de todas.'],
      ]},
    ],
  },
  {
    slug: 'ingredientes', nome: 'Ingredientes', eyebrow: 'Para criar em casa',
    intro: 'Tudo o que a tua pastelaria caseira pede — chocolates, frutos secos e as bases de confiança.',
    hero: '/assets/img/m_ingr.jpg',
    grupos: [
      { t: 'Chocolates e cacau', items: [
        ['chocolate-de-leite', 'Chocolate de Leite 34% Cacau', 'Cremoso e equilibrado — o sabor está nos detalhes.'],
        ['chocolate-negro', 'Chocolate Negro 70% Cacau', 'Intenso e profundo, para sobremesas de chef.'],
        ['chocolate-branco', 'Chocolate Branco 30% Cacau', 'Doce e suave, derrete que é uma maravilha.'],
        ['granulado-de-chocolate', 'Granulado de Chocolate', 'Para cobrir bolos, brigadeiros e sorrisos.'],
        ['cacau-em-po', 'Cacau em Pó', 'O coração de qualquer receita de chocolate a sério.'],
      ]},
      { t: 'Frutos secos e frutas', items: [
        ['amendoa-com-pele', 'Amêndoa Com Pele', 'Inteira e natural, pronta para doces e decorações.'],
        ['amendoa-sem-pele', 'Amêndoa Sem Pele', 'Branquinha e delicada, perfeita para massapão e bolos finos.'],
        ['amendoa-laminada', 'Amêndoa Laminada', 'Lâminas finas para cobrir bolos e tartes com elegância.'],
        ['amendoa-palitada', 'Amêndoa Palitada', 'Palitos crocantes para dar textura a qualquer sobremesa.'],
        ['caju', 'Caju', 'O fruto seco mais amado de Angola, pronto a usar na cozinha.'],
        ['nozes', 'Nozes', 'Miolo de noz para bolos, tartes e saladas cheias de personalidade.'],
        ['miolo-de-avela', 'Miolo de Avelã', 'Avelãs inteiras para brownies, bolachas e chocolates caseiros.'],
        ['sultanas', 'Sultanas', 'Passas douradas e macias, doces por natureza.'],
        ['cereja-cristalizada', 'Cereja Cristalizada', 'O toque vermelho clássico dos bolos de festa.'],
        ['coco-ralado', 'Coco Ralado', 'Aroma tropical para beijinhos, bolos e cocadas.'],
        ['sementes-de-sesamo', 'Sementes de Sésamo', 'Para pães, bolachas e aquele crocante final.'],
      ]},
      { t: 'Bases da pastelaria', items: [
        ['acucar-em-po', 'Açúcar em Pó', 'Finíssimo, para coberturas, glacés e polvilhar como neve.'],
        ['amido-de-milho', 'Amido de Milho', 'O segredo dos cremes lisos e dos bolos mais leves.'],
        ['fermento-em-po', 'Fermento em Pó para Bolos', 'A garantia de que o bolo cresce sempre bonito.'],
        ['chantilly-em-po', 'Chantilly em Pó', 'Chantilly firme e fofo em minutos, sempre pronto a decorar.'],
        ['creme-de-pasteleiro', 'Creme de Pasteleiro', 'O recheio cremoso das bolas de Berlim e mil-folhas caseiros.'],
        ['pao-ralado', 'Pão Ralado', 'Douradinho e fino, para panados crocantes como deve ser.'],
      ]},
    ],
  },
];

// ── Modelo de produto (retalho) ─────────────────────────────────────────────
// Campos CONFIRMADOS hoje: slug, nome, desc (curta), categoria, imagem (por convenção).
// [VALIDAÇÃO INTERNA NECESSÁRIA] — campos a preencher quando existirem dados reais
// (ERP / fichas técnicas): peso, formatos, referencia, ingredientes, alergenios,
// nutricao (por 100 g), conservacao, modo_uso. A página de produto só mostra a "Ficha"
// quando estes campos existirem — nunca inventa. Adicionar como 4º elemento (objeto) no item.
const ALLPROD = [];
CATS.forEach(cat => cat.grupos.forEach(g => g.items.forEach(function (it) {
  ALLPROD.push({ slug: it[0], nome: it[1], desc: it[2] || '', extra: it[3] || null, cat: cat.slug, catNome: cat.nome, grupo: g.t });
})));
// aviso de colisão: as URLs /produtos/<slug>/ têm de ser únicas
(function () { var seen = {}; ALLPROD.forEach(function (p) { if (seen[p.slug]) console.warn('⚠️  SLUG DUPLICADO:', p.slug, '(' + seen[p.slug] + ' vs ' + p.cat + ')'); seen[p.slug] = p.cat; }); })();

function crumbs(items) {
  var html = '<nav class="crumbs" aria-label="Onde estou"><ol>' + items.map(function (it, i) {
    var last = i === items.length - 1;
    return '<li>' + (it.url && !last ? '<a href="' + it.url + '">' + it.name + '</a>' : '<span aria-current="page">' + it.name + '</span>') + '</li>';
  }).join('') + '</ol></nav>';
  var ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(function (it, i) {
    var o = { '@type': 'ListItem', position: i + 1, name: it.name };
    if (it.url) o.item = 'https://quenteebom.com' + it.url;
    return o;
  }) };
  return { html: html, ld: '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>' };
}

function headerHTML() {
  return `<header class="hdr solid" id="hdr">
  <div class="wrap hrow">
    <a href="/">
      <img src="/assets/logos/logo_white_real.png" class="hlogo logo-w" alt="Quente e Bom">
      <img src="/assets/logos/logo_color_trans.png" class="hlogo logo-c" alt="Quente e Bom">
    </a>
    <nav class="nav">
      <a href="/produtos/">Produtos</a>
      <a href="/profissional/">Profissional</a>
      <a href="/receitas/">Receitas</a>
      <a href="/dicas/">Dicas</a>
      <a href="/recrutamento/">Carreiras</a>
      <a href="/contacto/">Contactos</a>
      <a href="#" class="cta" onclick="openBento();return false;">Falar com o Joaquim</a>
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
        <a href="/quem-somos/">A nossa história</a><a href="/receitas/">Receitas</a><a href="/dicas/">Dicas e sugestões</a><a href="/profissional/">Área Profissional</a><a href="/recrutamento/">Carreiras</a><a href="/contacto/">Contactos</a><a href="/onde-comprar/">Onde comprar</a>
      </div>
      <div class="ft-col"><h5>Contactos</h5>
        <p>Fábrica · Estrada do Calumbo/Zango,<br>Viana Park, Viana — Luanda</p>
        <a href="/contacto/">Fale connosco</a>
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
    const cards = g.items.map(([slug, nome, desc]) => `        <a class="prod" href="/produtos/${slug}/" data-reveal>
          <div class="ph"><img src="/assets/produtos/${cat.slug}/${slug}.png" alt="${nome} — Quente e Bom" loading="lazy"></div>
          <h3>${nome}</h3>
          <p class="sub">${desc || ''}</p>
        </a>`).join('\n');
    return `      <div class="strip-t"><h3>${g.t}</h3></div>
      <div class="prods">
${cards}
      </div>`;
  }).join('\n');

  const nProds = cat.grupos.reduce((s, g) => s + g.items.length, 0);
  const cb = crumbs([{ name: 'Início', url: '/' }, { name: 'Produtos', url: '/produtos/' }, { name: cat.nome }]);

  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${cat.nome} — Quente e Bom · Feito em Angola</title>
<meta name="description" content="${cat.intro} ${nProds} produtos Quente e Bom, nos supermercados de toda a Angola.">
<link rel="canonical" href="https://quenteebom.com/${cat.slug}/">
<meta property="og:title" content="${cat.nome} — Quente e Bom">
<meta property="og:description" content="${cat.intro}">
<meta property="og:image" content="https://quenteebom.com${cat.hero}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/assets/logos/favicon.png?v=1">
<link rel="stylesheet" href="/assets/css/qeb.css?v=6">
${cb.ld}
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
${cb.html}
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
      <a class="btn btn-sun" href="/profissional/revendedor/">Quero ser revendedor</a>
    </div>
    <div class="b2b-img" data-reveal><img src="/assets/img/expositor_1.jpg" alt="Expositor Quente e Bom em supermercado" loading="lazy"></div>
  </div>
</section>

${footerHTML()}

<script src="/assets/js/site.js?v=9"></script>
<script src="/assets/js/bento.js?v=5"></script>
</body>
</html>
`;
}

function produtosIndexHTML() {
  const cb = crumbs([{ name: 'Início', url: '/' }, { name: 'Produtos' }]);
  const catChips = CATS.map(c => `<button type="button" class="pf-chip" data-cat="${c.slug}" aria-pressed="false">${c.nome}</button>`).join('\n      ');
  const cards = ALLPROD.map(p => `      <a class="prod" href="/produtos/${p.slug}/" data-cat="${p.cat}" data-search="${(p.nome + ' ' + p.catNome + ' ' + p.grupo).toLowerCase().replace(/"/g, '')}">
        <div class="ph"><img src="/assets/produtos/${p.cat}/${p.slug}.png" alt="${p.nome} — Quente e Bom" loading="lazy"></div>
        <h3>${p.nome}</h3><p class="sub">${p.desc}</p></a>`).join('\n');
  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Produtos — Quente e Bom · Feito em Angola</title>
<meta name="description" content="Todos os produtos Quente e Bom: pão, cakes, Bolos da Avó, biscoitos, snacks, tostas e ingredientes. Feitos em Angola, nos supermercados de toda a Angola.">
<link rel="canonical" href="https://quenteebom.com/produtos/">
<meta property="og:title" content="Produtos Quente e Bom">
<meta property="og:description" content="Descobre todos os sabores Quente e Bom, feitos em Angola.">
<meta property="og:image" content="https://quenteebom.com/assets/social/og_home.jpg?v=1">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/assets/logos/favicon.png?v=1">
<link rel="stylesheet" href="/assets/css/qeb.css?v=6">
${cb.ld}
<style>
.pf-tools{display:flex;flex-wrap:wrap;gap:10px;margin:6px 0 14px}
#pfSearch{flex:1 1 260px;padding:12px 14px;border:1px solid #e5d5c0;border-radius:12px;font-size:15px;font-family:inherit}
.pf-chips{display:flex;gap:8px;flex-wrap:wrap;flex:1 1 100%}
.pf-chip{border:1px solid #e5d5c0;background:#fff;color:#5B2A4A;border-radius:999px;padding:8px 15px;font-size:14px;font-weight:600;cursor:pointer}
.pf-chip.on{background:#5B2A4A;color:#fff;border-color:#5B2A4A}
.pf-count{color:#9b8290;font-size:13px;margin:0 2px 12px}
.pf-empty{color:#6b5060;background:#fff;border:1px solid #f0e0c8;border-radius:12px;padding:16px;text-align:center}
</style>
</head>
<body>
${headerHTML()}
<section class="phero" style="min-height:auto;padding:78px 0 26px">
  <img src="/assets/img/expositor_1.jpg" alt="Produtos Quente e Bom">
  <div class="wrap">
    <div class="eyebrow">80 produtos, 80 sabores</div>
    <h1>Os nossos produtos</h1>
    <p>Do pão fresquinho aos Bolos da Avó, dos biscoitos aos ingredientes para criar em casa — tudo feito em Angola, nos supermercados de toda a Angola.</p>
  </div>
</section>
<section class="sec"><div class="wrap">
${cb.html}
  <div class="pf-tools">
    <label class="sr-only" for="pfSearch">Pesquisar produto</label>
    <input id="pfSearch" type="search" placeholder="Pesquisar produto…" autocomplete="off">
    <div class="pf-chips" role="group" aria-label="Filtrar por categoria">
      <button type="button" class="pf-chip on" data-cat="" aria-pressed="true">Todos</button>
      ${catChips}
    </div>
  </div>
  <p class="pf-count" id="pfCount" aria-live="polite"></p>
  <div class="prods" id="pfGrid">
${cards}
  </div>
  <p class="pf-empty" id="pfEmpty" hidden>Sem resultados. Tenta outro termo ou limpa os filtros.</p>
</div></section>
${footerHTML()}
<script>
(function(){
  var grid=document.getElementById('pfGrid'), cards=[].slice.call(grid.querySelectorAll('.prod')),
      search=document.getElementById('pfSearch'), chips=document.querySelectorAll('.pf-chip'),
      countEl=document.getElementById('pfCount'), emptyEl=document.getElementById('pfEmpty'), cat='';
  function apply(){
    var q=search.value.trim().toLowerCase(), n=0;
    cards.forEach(function(c){
      var ok=(!cat||c.getAttribute('data-cat')===cat)&&(!q||c.getAttribute('data-search').indexOf(q)>=0);
      c.style.display=ok?'':'none'; if(ok)n++;
    });
    countEl.textContent=n+' produto'+(n===1?'':'s'); emptyEl.hidden=n>0;
  }
  search.addEventListener('input',apply);
  chips.forEach(function(ch){ch.addEventListener('click',function(){chips.forEach(function(x){x.classList.remove('on');x.setAttribute('aria-pressed','false');});ch.classList.add('on');ch.setAttribute('aria-pressed','true');cat=ch.getAttribute('data-cat');apply();});});
  var qp=new URLSearchParams(location.search).get('cat');
  if(qp){var tgt=document.querySelector('.pf-chip[data-cat="'+qp+'"]');if(tgt){tgt.click();}else{apply();}}else{apply();}
})();
</script>
<script src="/assets/js/site.js?v=9"></script>
<script src="/assets/js/bento.js?v=5"></script>
</body>
</html>`;
}

function produtoHTML(p) {
  const cb = crumbs([{ name: 'Início', url: '/' }, { name: 'Produtos', url: '/produtos/' }, { name: p.catNome, url: '/' + p.cat + '/' }, { name: p.nome }]);
  const img = `/assets/produtos/${p.cat}/${p.slug}.png`;
  const related = ALLPROD.filter(x => x.cat === p.cat && x.slug !== p.slug).slice(0, 6);
  const relCards = related.map(r => `      <a class="prod" href="/produtos/${r.slug}/" data-reveal>
        <div class="ph"><img src="/assets/produtos/${r.cat}/${r.slug}.png" alt="${r.nome} — Quente e Bom" loading="lazy"></div>
        <h3>${r.nome}</h3></a>`).join('\n');
  // Ficha técnica — renderizada só com dados confirmados (p.extra). Nunca inventar. [VALIDAÇÃO INTERNA]
  const e = p.extra || {};
  const fichaRows = [];
  if (e.peso) fichaRows.push(['Peso', e.peso]);
  if (e.formatos) fichaRows.push(['Formatos', e.formatos]);
  if (e.conservacao) fichaRows.push(['Conservação', e.conservacao]);
  const ficha = fichaRows.length ? `<table class="pd-spec"><tbody>${fichaRows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}</tbody></table>` : '';
  const ingr = e.ingredientes ? `<h2>Ingredientes</h2><p>${e.ingredientes}</p>` : '';
  const aler = e.alergenios ? `<h2>Alergénios</h2><p>${e.alergenios}</p>` : '';
  const productLd = { '@context': 'https://schema.org', '@type': 'Product', name: p.nome, category: p.catNome, description: p.desc, image: 'https://quenteebom.com' + img, brand: { '@type': 'Brand', name: 'Quente e Bom' } };
  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.nome} — ${p.catNome} · Quente e Bom</title>
<meta name="description" content="${p.desc || p.nome + ' — Quente e Bom, feito em Angola.'}">
<link rel="canonical" href="https://quenteebom.com/produtos/${p.slug}/">
<meta property="og:title" content="${p.nome} — Quente e Bom">
<meta property="og:description" content="${p.desc}">
<meta property="og:type" content="product">
<meta property="og:image" content="https://quenteebom.com${img}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/assets/logos/favicon.png?v=1">
<link rel="stylesheet" href="/assets/css/qeb.css?v=6">
<script type="application/ld+json">${JSON.stringify(productLd)}</script>
${cb.ld}
<style>
.pd{display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:start;margin:8px 0 10px}
.pd-img{background:#fff;border:1px solid #f0e0c8;border-radius:20px;padding:22px;text-align:center}
.pd-img img{max-width:100%;max-height:420px}
.pd h1{margin:6px 0 12px}
.pd-desc{font-size:17px;color:#4a3340;line-height:1.6}
.pd-cta{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0 4px}
.pd-spec{width:100%;border-collapse:collapse;margin:14px 0}
.pd-spec th{text-align:left;background:#faf3e8;color:#5B2A4A;padding:9px 12px;width:150px;font-size:13px}
.pd-spec td{padding:9px 12px;border-bottom:1px solid #f1e6d8}
.pd-note{font-size:12.5px;color:#9b8290;font-style:italic;margin:8px 0 0}
@media(max-width:760px){.pd{grid-template-columns:1fr;gap:18px}}
</style>
</head>
<body>
${headerHTML()}
<section class="sec" style="padding-top:96px"><div class="wrap">
${cb.html}
  <div class="pd">
    <div class="pd-img"><img src="${img}" alt="${p.nome} — Quente e Bom"></div>
    <div>
      <div class="eyebrow">${p.catNome}</div>
      <h1>${p.nome}</h1>
      ${p.desc ? `<p class="pd-desc">${p.desc}</p>` : ''}
      ${ficha}
      <div class="pd-cta">
        <a class="btn btn-sun" href="/onde-comprar/">Onde comprar</a>
        <a class="btn btn-glass" href="/profissional/revendedor/">Quero vender este produto</a>
      </div>
      <p class="pd-note">Fotografia ilustrativa do produto. A disponibilidade nos pontos de venda pode variar.</p>
    </div>
  </div>
  ${ingr}${aler}
  ${relCards ? `<div class="strip-t" style="margin-top:26px"><h3>Também da ${p.catNome}</h3></div>\n<div class="prods">\n${relCards}\n</div>` : ''}
  <div style="background:#5B2A4A;color:#fff;border-radius:18px;padding:24px 28px;margin:28px 0;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between">
    <div style="max-width:520px"><b style="color:#F6C440">Ideias para usar</b><br>Descobre receitas fáceis com produtos Quente e Bom.</div>
    <a class="btn btn-sun" href="/receitas/">Ver receitas</a>
  </div>
</div></section>
${footerHTML()}
<script src="/assets/js/site.js?v=9"></script>
<script src="/assets/js/bento.js?v=5"></script>
</body>
</html>`;
}

function ondeComprarHTML() {
  const cb = crumbs([{ name: 'Início', url: '/' }, { name: 'Onde comprar' }]);
  // Insígnias APROVADAS (whitelist do Sandro) — nunca acrescentar outras nem nomear Horeca/hotéis.
  const CADEIAS = ['Kero', 'Candando', 'Maxi', 'Kibabo', 'Nossa Casa', 'Shoprite', 'Deskontão', 'BigOne', 'Alimenta Angola', 'Africana Discount'];
  const PROVINCIAS = ['Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango', 'Cuanza Norte', 'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla', 'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uíge', 'Zaire'];
  const chainChips = CADEIAS.map(c => `<span class="oc-chain">${c}</span>`).join('\n      ');
  const provOpts = PROVINCIAS.map(p => `<option>${p}</option>`).join('');
  const prodOpts = CATS.map(c => `<optgroup label="${c.nome}">` + c.grupos.map(g => g.items.map(i => `<option>${i[1]}</option>`).join('')).join('') + `</optgroup>`).join('');
  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Onde comprar — Quente e Bom</title>
<meta name="description" content="Encontra os produtos Quente e Bom nos supermercados de toda a Angola. Diz-nos a tua zona e ajudamos-te a encontrar.">
<link rel="canonical" href="https://quenteebom.com/onde-comprar/">
<meta property="og:title" content="Onde comprar — Quente e Bom">
<meta property="og:description" content="Os produtos Quente e Bom nos supermercados de toda a Angola.">
<meta property="og:image" content="https://quenteebom.com/assets/social/og_home.jpg?v=1">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/assets/logos/favicon.png?v=1">
<link rel="stylesheet" href="/assets/css/qeb.css?v=6">
${cb.ld}
<style>
.oc-chains{display:flex;flex-wrap:wrap;gap:10px;margin:8px 0 6px}
.oc-chain{background:#fff;border:1px solid #f0e0c8;border-radius:999px;padding:9px 18px;font-weight:700;color:#5B2A4A;font-size:14.5px}
.oc-note{color:#6b5060;font-size:14px;max-width:760px;margin:10px 2px 0}
.oc-form{background:#faf3e8;border:1px solid #f0e0c8;border-radius:18px;padding:22px;max-width:640px;margin:8px 0}
.oc-form .row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.oc-form select,.oc-form input{padding:11px;border:1px solid #e5d5c0;border-radius:10px;font-size:14px;font-family:inherit;width:100%;background:#fff}
.oc-form .full{grid-column:1/-1}
.oc-consent{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:#6b5060;margin:6px 0 12px}
.oc-err{background:#fdecec;color:#a01a1a;border-radius:10px;padding:10px 12px;font-size:13.5px;margin:0 0 10px}
@media(max-width:600px){.oc-form .row{grid-template-columns:1fr}}
</style>
</head>
<body>
${headerHTML()}
<section class="phero" style="min-height:auto;padding:78px 0 26px">
  <img src="/assets/img/m_pao.jpg" alt="Onde comprar Quente e Bom">
  <div class="wrap">
    <div class="eyebrow">Nos supermercados de toda a Angola</div>
    <h1>Onde comprar</h1>
    <p>Os produtos Quente e Bom estão nas prateleiras de supermercados por toda a Angola. A oferta varia de loja para loja — se não encontrares o que procuras, diz-nos a tua zona que ajudamos.</p>
  </div>
</section>
<section class="sec"><div class="wrap">
${cb.html}
  <div class="strip-t"><h3>Nas insígnias onde já nos encontras</h3></div>
  <div class="oc-chains">
      ${chainChips}
  </div>
  <p class="oc-note">A disponibilidade de cada produto pode variar por loja e por zona. Não encontraste um produto na tua loja? <b>Pede ao balcão</b> — muitas lojas encomendam a pedido — ou diz-nos aqui em baixo que levamos a tua zona à nossa equipa.</p>

  <div class="strip-t" style="margin-top:26px"><h3>Ajuda-nos a chegar até ti</h3></div>
  <form class="oc-form" name="onde-comprar-procura" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/obrigado.html?t=onde-comprar" id="ocForm">
    <input type="hidden" name="form-name" value="onde-comprar-procura">
    <input type="hidden" name="origem" id="ocOrigem">
    <p style="display:none"><label>Não preencher <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
    <div class="row">
      <div><label class="sr-only" for="oc-prov">Província</label>
        <select id="oc-prov" name="provincia" required><option value="" disabled selected>Província *</option>${provOpts}</select></div>
      <div><label class="sr-only" for="oc-zona">Município ou zona</label>
        <input id="oc-zona" name="zona" required placeholder="Município / zona *"></div>
    </div>
    <div class="row">
      <div class="full"><label class="sr-only" for="oc-prod">Produto que procuras</label>
        <select id="oc-prod" name="produto"><option value="">Produto que procuras (opcional)</option>${prodOpts}</select></div>
    </div>
    <div class="row">
      <div><label class="sr-only" for="oc-nome">O teu nome</label><input id="oc-nome" name="nome" placeholder="O teu nome (opcional)" autocomplete="name"></div>
      <div><label class="sr-only" for="oc-contacto">Contacto</label><input id="oc-contacto" name="contacto" placeholder="WhatsApp ou email (opcional)"></div>
    </div>
    <div class="oc-consent">
      <input type="checkbox" id="oc-rgpd" required>
      <label for="oc-rgpd">Autorizo o contacto da equipa Quente e Bom sobre esta procura.</label>
    </div>
    <p class="oc-err" id="ocErr" role="alert" hidden></p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      <button class="btn btn-sun" type="submit" id="ocSubmit">Enviar ☀️</button>
      <button type="button" class="btn btn-glass" onclick="if(window.openBento)openBento()">Perguntar ao Joaquim</button>
    </div>
  </form>
</div></section>
${footerHTML()}
<script>
(function(){
  var form=document.getElementById('ocForm'), err=document.getElementById('ocErr'), btn=document.getElementById('ocSubmit'), sending=false;
  try{document.getElementById('ocOrigem').value=document.referrer||'direto';}catch(e){}
  form.addEventListener('input',function(){if(!err.hidden)err.hidden=true;});
  form.addEventListener('submit',function(e){
    var prov=document.getElementById('oc-prov'), zona=document.getElementById('oc-zona'), rgpd=document.getElementById('oc-rgpd');
    var probs=[];
    if(!prov.value)probs.push('Escolhe a tua província.');
    if(!zona.value.trim())probs.push('Diz-nos o teu município ou zona.');
    if(!rgpd.checked)probs.push('É necessário autorizar o contacto.');
    if(probs.length){e.preventDefault();err.hidden=false;err.textContent=probs[0];return;}
    if(sending){e.preventDefault();return;}
    sending=true;btn.disabled=true;btn.textContent='A enviar…';
    if(window.qbTrack)window.qbTrack('OndeComprarProcura',{provincia:prov.value,produto:document.getElementById('oc-prod').value||'(nenhum)'});
  });
})();
</script>
<script src="/assets/js/site.js?v=9"></script>
<script src="/assets/js/bento.js?v=5"></script>
</body>
</html>`;
}

function quemSomosHTML() {
  const cb = crumbs([{ name: 'Início', url: '/' }, { name: 'Quem somos' }]);
  // Só factos confirmados: fundada em 2012, fábrica em Viana (Luanda), feito em Angola, venda a profissionais.
  // [VALIDAÇÃO INTERNA NECESSÁRIA] a preencher com dados documentados: nº de colaboradores, capacidade
  // produtiva, certificações/segurança alimentar (docs), marcos datados, fotos reais da fábrica/equipa.
  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Quem somos — Quente e Bom · Feito em Angola desde 2012</title>
<meta name="description" content="A Quente e Bom faz pão e pastelaria frescos todos os dias em Viana, Luanda, desde 2012 — para as prateleiras dos supermercados de toda a Angola.">
<link rel="canonical" href="https://quenteebom.com/quem-somos/">
<meta property="og:title" content="Quem somos — Quente e Bom">
<meta property="og:description" content="Feito em Angola desde 2012. Todos os dias, uma delícia.">
<meta property="og:image" content="https://quenteebom.com/assets/social/og_home.jpg?v=1">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="/assets/logos/favicon.png?v=1">
<link rel="stylesheet" href="/assets/css/qeb.css?v=6">
${cb.ld}
<style>
.qs-split{display:grid;grid-template-columns:1fr 1fr;gap:30px;align-items:center;margin:26px 0}
.qs-split img{width:100%;border-radius:18px;box-shadow:0 8px 26px rgba(91,42,74,.12);display:block}
.qs-split h2{color:#5B2A4A;margin:0 0 10px}
.qs-split p{color:#4a3340;line-height:1.65}
.qs-values{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin:22px 0}
.qs-val{background:#fff;border:1px solid #f0e0c8;border-radius:16px;padding:18px}
.qs-val b{color:#CC5A08}
@media(max-width:760px){.qs-split{grid-template-columns:1fr;gap:16px}}
</style>
</head>
<body>
${headerHTML()}
<section class="phero">
  <img src="/assets/img/m_pao.jpg" alt="Quente e Bom — feito em Angola">
  <div class="wrap">
    <div class="eyebrow">Feito em Angola desde 2012</div>
    <h1>Quem somos</h1>
    <p>O sol nasce, o pão também. Todos os dias, fazemos frescura para levar uma delícia a cada casa angolana.</p>
  </div>
</section>
<section class="sec"><div class="wrap">
${cb.html}
  <div class="qs-split">
    <div>
      <h2>A nossa história</h2>
      <p>Nascemos em <b>2012</b>, em <b>Viana, Luanda</b>. Desde então, fazemos pão e pastelaria frescos todos os dias, com o cuidado de quem cozinha para a própria família. Dos pães aos Bolos da Avó, cada produto carrega o mesmo compromisso: sabor genuíno, feito cá, para toda a Angola.</p>
    </div>
    <img src="/assets/img/expositor_1.jpg" alt="Produtos Quente e Bom num supermercado" loading="lazy">
  </div>

  <div class="qs-split">
    <img src="/assets/img/m_bolos.jpg" alt="Bolos da Avó Quente e Bom" loading="lazy">
    <div>
      <h2>Feito em Angola, para toda a Angola</h2>
      <p>A nossa produção é própria, em Viana. Fazer cá é uma escolha e um orgulho: gera trabalho, aproxima-nos de quem nos compra e garante frescura em toda a Angola. Levamos os nossos produtos às prateleiras dos supermercados por todo o país.</p>
    </div>
  </div>

  <div class="strip-t"><h3>No que acreditamos</h3></div>
  <div class="qs-values">
    <div class="qs-val"><b>Frescura todos os dias</b><br>Produção diária — porque uma delícia sabe melhor fresquinha.</div>
    <div class="qs-val"><b>Sabor genuíno</b><br>Receitas que sabem a casa, do pão de cada dia aos Bolos da Avó.</div>
    <div class="qs-val"><b>Orgulho angolano</b><br>Feito cá, por gente daqui, para as famílias de toda a Angola.</div>
    <div class="qs-val"><b>Perto de quem nos compra</b><br>Trabalhamos com supermercados e negócios em todo o país.</div>
  </div>

  <div class="strip-t" style="margin-top:8px"><h3>Qualidade e segurança alimentar</h3></div>
  <p style="color:#4a3340;max-width:820px;line-height:1.65">A qualidade e a segurança alimentar são levadas a sério em toda a nossa produção. <!-- [VALIDAÇÃO INTERNA NECESSÁRIA] Acrescentar aqui certificações, políticas e controlos de qualidade quando existir documentação aprovada — nunca antes. --></p>

  <div style="background:#5B2A4A;color:#fff;border-radius:18px;padding:28px 32px;margin:26px 0;display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between">
    <div style="max-width:560px"><b style="color:#F6C440">Descobre os nossos produtos</b><br>80 sabores, feitos em Angola — e onde os podes encontrar.</div>
    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <a class="btn btn-sun" href="/produtos/">Ver produtos</a>
      <a class="btn btn-glass" href="/onde-comprar/">Onde comprar</a>
    </div>
  </div>

  <div class="strip-t"><h3>Para negócios</h3></div>
  <p style="color:#4a3340;max-width:820px;line-height:1.65">És supermercado, loja, café ou restaurante? Leva a gama Quente e Bom para o teu negócio. <a href="/profissional/" style="color:#CC5A08;font-weight:700">Conhece a Área Profissional</a>.</p>

  <div class="strip-t"><h3>Contacto</h3></div>
  <p style="color:#4a3340;line-height:1.65">Fábrica · Estrada do Calumbo/Zango, Viana Parque, Viana — Luanda, Angola.<br>
  <a href="/contacto/" style="color:#CC5A08;font-weight:700">Fala connosco</a> · <a href="https://www.instagram.com/quenteebom/" target="_blank" rel="noopener" style="color:#CC5A08;font-weight:700">Instagram</a></p>
</div></section>
${footerHTML()}
<script src="/assets/js/site.js?v=9"></script>
<script src="/assets/js/bento.js?v=5"></script>
</body>
</html>`;
}

let total = 0;
let semDesc = 0;
CATS.forEach(cat => {
  const dir = path.join(__dirname, cat.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), pageHTML(cat), 'utf8');
  const n = cat.grupos.reduce((s, g) => s + g.items.length, 0);
  cat.grupos.forEach(g => g.items.forEach(i => { if (!i[2]) semDesc++; }));
  total += n;
  console.log(`${cat.slug}/index.html — ${n} produtos`);
});

// /produtos/ central + páginas individuais de produto
const pdir = path.join(__dirname, 'produtos');
fs.mkdirSync(pdir, { recursive: true });
fs.writeFileSync(path.join(pdir, 'index.html'), produtosIndexHTML(), 'utf8');
console.log(`produtos/index.html — catálogo central (${ALLPROD.length} produtos)`);
ALLPROD.forEach(p => {
  const d = path.join(pdir, p.slug);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'index.html'), produtoHTML(p), 'utf8');
});
console.log(`produtos/<slug>/index.html — ${ALLPROD.length} páginas de produto`);

// /onde-comprar/
const ocdir = path.join(__dirname, 'onde-comprar');
fs.mkdirSync(ocdir, { recursive: true });
fs.writeFileSync(path.join(ocdir, 'index.html'), ondeComprarHTML(), 'utf8');
console.log('onde-comprar/index.html — captador de procura');

// /quem-somos/
const qsdir = path.join(__dirname, 'quem-somos');
fs.mkdirSync(qsdir, { recursive: true });
fs.writeFileSync(path.join(qsdir, 'index.html'), quemSomosHTML(), 'utf8');
console.log('quem-somos/index.html — institucional');
console.log(`TOTAL: ${total} produtos em ${CATS.length} categorias · sem descrição: ${semDesc}`);
