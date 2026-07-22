// Gera a Área Profissional: /profissional/ + 4 gamas + /profissional/encomenda/
// Dados do ERP "Quente e Bom Artigos.xlsx" (2026-07). SEM artigos de cliente (KFC/HL/AHD).
const fs = require('fs');
const path = require('path');

const PH = '/assets/img/prof/ph_ilustrativa.svg'; // placeholder até as fotos ilustrativas serem geradas

const GAMAS = [
  {
    slug: 'pao-pre-cozido', nome: 'Pão Pré-cozido', eyebrow: 'Bake-off',
    intro: 'Pão quente todo o dia, sem desperdício: coze só o que vende, em 8–12 minutos, sem precisar de padeiro especializado.',
    hero: '/assets/img/prof/baguetes_francesas.jpg',
    grupos: [
      { t: 'Baguetes francesas', foto: PH, fkey: 'baguetes_francesas', items: [
        ['300516012', 'Baguete Francesa', '240 g', 30],
        ['300516035', 'Baguete Francesa Integral', '240 g', 30],
        ['300516027', 'Baguete Francesa Multicereais', '240 g', 30],
      ]},
      { t: 'Baguetes de balcão', foto: PH, fkey: 'baguetes_balcao', items: [
        ['300516099', 'Baguete de Trigo', '70 g', 90],
        ['300516013', 'Baguete Integral', '70 g', 90],
        ['30051601',  'Baguete Integral', '45 g', 140],
        ['30051602',  'Baguete Multicereais', '45 g', 140],
        ['3005160',   'Baguete Multicereais (Cacetinho)', '80 g', 60],
        ['300516023', 'Baguete Milho e Girassol', '80 g', 90],
        ['30051600',  'Baguete Centeio Bavieira com Sementes', '45 g', 140],
        ['300516033', 'Baguete Centeio Bavieira com Sementes', '80 g', 90],
      ]},
      { t: 'Sandes, cacetes e especiais', foto: PH, fkey: 'sandes_especiais', items: [
        ['300516029', 'Baguete Sandes', '80 g', 90],
        ['300516011', 'Baguete Sandes', '100 g', 70],
        ['300515012', 'Bola Mwangolé', '90 g', 70],
        ['300516015', 'Carcaça Sambila', '60 g', 100],
        ['300516016', 'Pão com Chouriço', '90 g', 35],
        ['300516031', 'Cacete', '165 g', 32],
        ['300516030', 'Cacete', '330 g', 20],
      ]},
    ],
  },
  {
    slug: 'pao-congelado', nome: 'Pão Pronto Congelado', eyebrow: 'Descongela e vende',
    intro: 'Pão pronto a servir: descongela e está na prateleira ou na cozinha — sem forno, sem quebras.',
    hero: '/assets/img/prof/pao_pronto.jpg',
    grupos: [
      { t: 'Pão pronto', foto: PH, fkey: 'pao_pronto', items: [
        ['300517001', 'Pão de Cachorro', '4 × 75 g', 18],
        ['300517',    'Pão de Forma Simples', '1000 g', 4],
      ]},
    ],
  },
  {
    slug: 'pastelaria-massa-congelada', nome: 'Pastelaria em Massa Congelada', eyebrow: 'Do congelador ao forno',
    intro: 'Croissants, napolitanas e pastéis em massa crua: cozem na loja e enchem a vitrine com cheiro de acabado de fazer.',
    hero: '/assets/img/prof/croissants_napolitanas.jpg',
    grupos: [
      { t: 'Croissants e napolitanas', foto: PH, fkey: 'croissants_napolitanas', items: [
        ['400010054', 'Croissant Simples', '90 g', 120],
        ['400010051', 'Croissant Chocolate', '120 g', 80],
        ['400010050', 'Croissant Doce de Ovos', '120 g', 80],
        ['400010052', 'Napolitana Chocolate', '120 g', 80],
        ['400010053', 'Napolitana de Queijo e Fiambre', '120 g', 80],
        ['400010080', 'Napolitana de Chouriço', '120 g', 80],
      ]},
      { t: 'Pastéis', foto: PH, fkey: 'pasteis', items: [
        ['400010061', 'Pastel de Nata', '60 g', 25],
        ['400010062', 'Pastel de Côco', '80 g', 25],
        ['400010063', 'Pastel de Feijão', '80 g', 25],
        ['400010064', 'Pastel de Ginguba', '80 g', 25],
      ]},
      { t: 'Massa para produção', foto: PH, fkey: 'massa_folhada', items: [
        ['MC202501', 'Massa Folhada Congelada', '1000 g', 24],
      ]},
    ],
  },
  {
    slug: 'pastelaria-pronta', nome: 'Pastelaria Pronta Congelada', eyebrow: 'A vitrine sempre cheia',
    intro: 'Bolos e pastelaria prontos: descongelam em horas e vendem-se como acabados de fazer — dos Bolos da Avó aos bolos de festa grandes.',
    hero: '/assets/img/prof/bolos_festa.jpg',
    grupos: [
      { t: 'Bolos da Avó', foto: PH, fkey: 'bolos_da_avo', items: [
        ['40000097',  'Bolo da Avó Cenoura', '400 g', 14],
        ['400020005', 'Bolo da Avó Cenoura', '550 g', 2],
        ['400010014', 'Bolo da Avó Cenoura', '1000 g', 4],
        ['400010090', 'Bolo da Avó Chocolate', '400 g', 14],
        ['400020001', 'Bolo da Avó Chocolate', '550 g', 2],
        ['400010001', 'Bolo da Avó Chocolate', '1000 g', 4],
        ['400010091', 'Bolo da Avó Choco/Nozes', '400 g', 14],
        ['400010096', 'Bolo da Avó Laranja', '400 g', 14],
        ['400020004', 'Bolo da Avó Laranja', '550 g', 2],
        ['400010010', 'Bolo da Avó Laranja', '1000 g', 4],
        ['400010094', 'Bolo da Avó Mármore', '400 g', 14],
        ['400020002', 'Bolo da Avó Mármore', '550 g', 2],
        ['400010002', 'Bolo da Avó Mármore', '1000 g', 4],
        ['400010095', 'Bolo da Avó Neutro', '400 g', 14],
        ['400020003', 'Bolo da Avó Neutro', '550 g', 2],
        ['400010003', 'Bolo da Avó Neutro', '1000 g', 4],
        ['400010092', 'Bolo da Avó Frutas', '400 g', 14],
        ['400010093', 'Bolo da Avó Ginguba', '400 g', 14],
      ]},
      { t: 'Bolos de festa', foto: PH, fkey: 'bolos_festa', items: [
        ['400010099', 'Bolo de Aniversário', '1000 g', 4],
        ['400010036', 'Bolo de Aniversário', '1500 g', 1],
        ['400020008', 'Bolo Brigadeiro', '1000 g', 2],
        ['400010037', 'Bolo Brigadeiro', '2000 g', 1],
        ['400020006', 'Bolo Chocolate com Nozes', '1000 g', 2],
        ['400010034', 'Bolo Chocolate com Nozes', '2000 g', 1],
        ['400020007', 'Bolo de Doce de Ovos com Ginguba', '1000 g', 2],
        ['400010035', 'Bolo de Doce de Ovos com Ginguba', '1500 g', 1],
        ['400030016', 'Bolo Rei Tradicional', '400 g', 12],
        ['400040016', 'Bolo Rei Tradicional', '600 g', 4],
        ['400010016', 'Bolo Rei Tradicional', '800 g', 4],
      ]},
      { t: 'Pastelaria de vitrine', foto: PH, fkey: 'vitrine', items: [
        ['400010020', 'Bola de Berlim com Creme', '90 g', 35],
        ['400010019', 'Bola de Berlim sem Creme', '70 g', 35],
        ['400010069', 'Bolo de Arroz', '75 g', 20],
        ['400010065', 'Muffin Simples', '60 g', 25],
        ['400010066', 'Muffin Chocolate', '60 g', 25],
        ['400010067', 'Muffin Cenoura', '60 g', 25],
        ['400010068', 'Muffin Laranja', '60 g', 25],
        ['400010018', 'Pão de Deus', '90 g', 24],
        ['400010025', 'Croissant Brioche', '90 g', 30],
      ]},
      { t: 'Pães de ló prontos', foto: PH, fkey: 'paes_de_lo', items: [
        ['400010012', 'Pão de Ló Real', '750 g', 4],
        ['400010013', 'Pão de Ló Chocolate Sublime', '750 g', 4],
      ]},
    ],
  },
];

// Gama de PRATELEIRA (retalho embalado) — o supermercado só o tem se o pedir. Dados do ERP.
const RETALHO = require('./retalho.json');

const CSS_EXTRA = `<style>
.spec{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(91,42,74,.07);margin:10px 0 34px}
.spec th{background:#5B2A4A;color:#fff;text-align:left;padding:11px 14px;font-size:12.5px;letter-spacing:.6px;text-transform:uppercase}
.spec td{padding:11px 14px;border-bottom:1px solid #f1e6d8;font-size:15px}
.spec tr:last-child td{border-bottom:none}
.spec td.ref{color:#9b8290;font-size:13px;white-space:nowrap}
.spec td.n{font-weight:700;color:#3A2030}
.gfoto{border-radius:16px;overflow:hidden;margin:6px 0 10px;box-shadow:0 6px 20px rgba(91,42,74,.10)}
.gfoto img{width:100%;display:block;max-height:340px;object-fit:cover}
.ilus{font-size:12px;color:#9b8290;margin:4px 2px 14px;font-style:italic}
.prof-args{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;margin:22px 0}
.prof-args .pa{background:#fff;border:1px solid #f0e0c8;border-radius:14px;padding:16px 18px}
.prof-args .pa b{color:#CC5A08}
.gcards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin:24px 0}
.gcard{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 6px 22px rgba(91,42,74,.10);text-decoration:none;color:inherit;transition:transform .2s}
.gcard:hover{transform:translateY(-4px)}
.gcard img{width:100%;height:150px;object-fit:cover;display:block}
.gcard .gc{padding:14px 16px}
.gcard h3{margin:0 0 4px;color:#5B2A4A}
.gcard p{margin:0;font-size:13.5px;color:#6b5060}
.gcard .num{display:inline-block;background:#F6C440;color:#5B2A4A;font-weight:800;font-size:12px;border-radius:999px;padding:2px 10px;margin-top:8px}
.prof-faq{max-width:820px;margin:8px 0}
.pf-q{background:#fff;border:1px solid #f0e0c8;border-radius:12px;padding:0 16px;margin:8px 0}
.pf-q summary{cursor:pointer;font-weight:700;color:#5B2A4A;padding:14px 0;list-style:none}
.pf-q summary::-webkit-details-marker{display:none}
.pf-q summary::after{content:'+';float:right;color:#CC5A08;font-size:18px}
.pf-q[open] summary::after{content:'\\2212'}
.pf-q p{margin:0 0 14px;color:#4a3340;line-height:1.6}
</style>`;

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

const FAQ_PROF = [
  ['Como funciona o pedido?', 'Escolhe os artigos no catálogo de cotação, envias a tua lista e a equipa comercial responde rapidinho com os preços e o plano de entregas.'],
  ['Como recebo os preços?', 'Os preços vêm na cotação, feita à medida do teu pedido pela equipa comercial. Não há preços fixos no site.'],
  ['Preciso de padeiro especializado?', 'Não. O pão pré-cozido coze na loja em 8 a 12 minutos, com instruções simples — enche a vitrine com cheiro de acabado de fazer.'],
  ['Já sou revendedor. Posso pedir só a prateleira?', 'Sim. Podes pedir a gama de prateleira (embalados), os congelados/bake-off, ou tudo num só pedido de cotação.'],
];
function faqLd(items) {
  var obj = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(function (q) { return { '@type': 'Question', name: q[0], acceptedAnswer: { '@type': 'Answer', text: q[1] } }; }) };
  return '<script type="application/ld+json">' + JSON.stringify(obj) + '</script>';
}

function headerHTML(){return `<header class="hdr solid" id="hdr">
  <div class="wrap hrow">
    <a href="/">
      <img src="/assets/logos/logo_white_real.png" class="hlogo logo-w" alt="Quente e Bom">
      <img src="/assets/logos/logo_color_trans.png" class="hlogo logo-c" alt="Quente e Bom">
    </a>
    <nav class="nav">
      <a href="/produtos/">Produtos</a>
      <a href="/profissional/">Profissional</a>
      <a href="/receitas/">Receitas</a>
      <a href="/contacto/">Contactos</a>
      <a href="#" class="cta" onclick="openBento();return false;">Falar com o Joaquim</a>
    </nav>
  </div>
</header>`;}

function footerHTML(){return `<footer class="ft">
  <div class="wrap">
    <div class="ft-top">
      <div style="max-width:280px;">
        <img src="/assets/logos/logo_white_real.png" class="ft-logo" alt="Quente e Bom">
        <p style="color:#c9b6a2;font-size:14px;">Todos os dias, uma delícia. Feito em Angola desde 2012.</p>
      </div>
      <div class="ft-col"><h5>Área Profissional</h5>
        <a href="/profissional/">Visão geral</a><a href="/profissional/pao-pre-cozido/">Pão Pré-cozido</a><a href="/profissional/pao-congelado/">Pão Pronto Congelado</a><a href="/profissional/pastelaria-massa-congelada/">Pastelaria em Massa</a><a href="/profissional/pastelaria-pronta/">Pastelaria Pronta</a><a href="/profissional/encomenda/">Pedido de cotação</a><a href="/profissional/revendedor/">Quero ser revendedor</a>
      </div>
      <div class="ft-col"><h5>Marca</h5>
        <a href="/produtos/">Produtos</a><a href="/receitas/">Receitas</a><a href="/recrutamento/">Carreiras</a><a href="/contacto/">Contactos</a>
      </div>
      <div class="ft-col"><h5>Contactos</h5>
        <p>Fábrica · Estrada do Calumbo/Zango,<br>Viana Park, Viana — Luanda</p>
        <a href="/contacto/">Fale connosco</a>
        <a href="https://www.instagram.com/quenteebom/" target="_blank" rel="noopener">Instagram · @quenteebom</a>
      </div>
    </div>
    <div class="ft-bot">© 2026 Doce, Quente e Bom · Feito em Angola 🇦🇴</div>
  </div>
</footer>`;}

function shell(title, desc, canonical, body){
  return `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://quenteebom.com${canonical}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:image" content="https://quenteebom.com/assets/social/og_home.jpg?v=1">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://quenteebom.com/assets/social/og_home.jpg?v=1">
<link rel="icon" type="image/png" href="/assets/logos/favicon.png?v=1">
<link rel="stylesheet" href="/assets/css/qeb.css?v=6">
${CSS_EXTRA}
</head>
<body>
${headerHTML()}
${body}
${footerHTML()}
<script src="/assets/js/site.js?v=9"></script>
<script src="/assets/js/bento.js?v=5"></script>
</body>
</html>`;
}

function gamaHTML(g){
  const grupos = g.grupos.map(gr => {
    const rows = gr.items.map(([ref,nome,peso,cx]) =>
      `<tr><td class="n">${nome}</td><td>${peso}</td><td>${cx} un/caixa</td><td class="ref">${ref}</td></tr>`).join('\n');
    return `<div class="strip-t"><h3>${gr.t}</h3></div>
<div class="gfoto" data-reveal><img src="/assets/img/prof/${gr.fkey}.jpg" alt="${gr.t} — Quente e Bom" loading="lazy" data-fkey="${gr.fkey}"></div>
<p class="ilus">Fotografia ilustrativa do produto.</p>
<table class="spec">
<tr><th>Produto</th><th>Peso</th><th>Caixa</th><th>Referência</th></tr>
${rows}
</table>`;
  }).join('\n');
  const n = g.grupos.reduce((s,x)=>s+x.items.length,0);
  const body = `<section class="phero">
  <img src="${g.hero}" alt="${g.nome} Quente e Bom">
  <div class="wrap">
    <div class="eyebrow">Área Profissional · ${g.eyebrow}</div>
    <h1>${g.nome}</h1>
    <p>${g.intro}</p>
  </div>
</section>
<section class="sec"><div class="wrap">
${grupos}
<div style="text-align:center;margin:30px 0 10px">
  <a class="btn btn-sun" href="/profissional/encomenda/">Pedir cotação desta gama</a>
</div>
</div></section>`;
  return shell(`${g.nome} — Área Profissional · Quente e Bom`, `${g.intro} ${n} artigos com entrega em toda a Angola.`, `/profissional/${g.slug}/`, body);
}

function hubHTML(){
  const cb = crumbs([{ name: 'Início', url: '/' }, { name: 'Área Profissional' }]);
  const cards = GAMAS.map(g => {
    const n = g.grupos.reduce((s,x)=>s+x.items.length,0);
    return `<a class="gcard" href="/profissional/${g.slug}/" data-reveal>
  <img src="${g.hero}" alt="${g.nome}">
  <div class="gc"><h3>${g.nome}</h3><p>${g.intro}</p><span class="num">${n} artigos</span></div>
</a>`;
  }).join('\n');
  const retailCards = RETALHO.map(r => `<a class="gcard" href="${r.link}" data-reveal>
  <img src="${r.hero}" alt="${r.mundo}">
  <div class="gc"><h3>${r.mundo}</h3><p>${r.intro}</p><span class="num">${r.items.length} referências</span></div>
</a>`).join('\n');
  const body = `<section class="phero">
  <img src="/assets/img/expositor_1.jpg" alt="Área Profissional Quente e Bom">
  <div class="wrap">
    <div class="eyebrow">Para padarias, supermercados, cafés e restaurantes</div>
    <h1>Área Profissional</h1>
    <p>A gama Quente e Bom completa para o seu negócio: os produtos embalados para a prateleira e os pré-cozidos e congelados para forno — de produção própria e entregues em toda a Angola.</p>
  </div>
</section>
<section class="sec"><div class="wrap">
${cb.html}
<div class="prof-args" data-reveal>
  <div class="pa"><b>A gama toda num pedido</b><br>Prateleira e congelados: peça tudo o que precisa numa só cotação.</div>
  <div class="pa"><b>Sem padeiro especializado</b><br>Do congelador ao forno em minutos, com instruções simples.</div>
  <div class="pa"><b>Cheiro de acabado de fazer</b><br>Pão e pastelaria quentes vendem mais — a qualquer hora do dia.</div>
  <div class="pa"><b>Produção própria em Viana</b><br>Fábrica em Luanda, entrega em todo o país, frescura garantida.</div>
</div>
<div class="strip-t"><h3>Gama de prateleira · produtos embalados</h3></div>
<p style="color:#6b5060;margin:2px 2px 14px;max-width:840px">Toda a gama Quente e Bom para as prateleiras da sua loja — pão, cakes, biscoitos, tostas, snacks e ingredientes. <b>Os supermercados só os têm se os pedirem:</b> peça a cotação e escolha o que quer receber.</p>
<div class="gcards">
${retailCards}
</div>
<div class="strip-t" style="margin-top:12px"><h3>Congelados &amp; bake-off</h3></div>
<p style="color:#6b5060;margin:2px 2px 14px;max-width:840px">Pão pré-cozido e pastelaria congelada para cozer na loja e encher a vitrine com cheiro de acabado de fazer.</p>
<div class="gcards">
${cards}
</div>
<div style="background:#5B2A4A;color:#fff;border-radius:18px;padding:28px 32px;margin:26px 0;display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between">
  <div style="max-width:560px"><b style="color:#F6C440">Como funciona?</b><br>Escolha os artigos, diga-nos as quantidades e a equipa comercial responde com a cotação e o plano de entregas. Ainda não é nosso cliente? Torne-se revendedor em 2 minutos.</div>
  <div style="display:flex;gap:12px;flex-wrap:wrap">
    <a class="btn btn-sun" href="/profissional/encomenda/">Fazer pedido de cotação</a>
    <a class="btn btn-sun" href="/profissional/revendedor/">Quero ser revendedor</a>
  </div>
</div>
<div class="strip-t" style="margin-top:26px"><h3>Perguntas frequentes</h3></div>
<div class="prof-faq">
${FAQ_PROF.map(q => `  <details class="pf-q"><summary>${q[0]}</summary><p>${q[1]}</p></details>`).join('\n')}
</div>
${cb.ld}
${faqLd(FAQ_PROF)}
</div></section>`;
  return shell('Área Profissional — Quente e Bom · pré-cozidos e congelados', 'Pão pré-cozido, pão pronto congelado e pastelaria congelada para padarias, supermercados, cafés e restaurantes em toda a Angola.', '/profissional/', body);
}

function encomendaHTML(){
  // catálogo completo: congelados/bake-off (GAMAS) + prateleira (RETALHO)
  const SEGMAP = { 'pao-pre-cozido': 'precozido' }; // as restantes gamas de GAMAS = congelado
  const ALL = [];
  GAMAS.forEach(g => g.grupos.forEach(gr => gr.items.forEach(([ref,nome,peso,cx]) => {
    ALL.push({ ref: String(ref), nome, peso, cx, seg: SEGMAP[g.slug] || 'congelado', cat: g.nome, grupo: gr.t });
  })));
  RETALHO.forEach(r => r.items.forEach(([ref,nome,peso,cx]) => {
    ALL.push({ ref: String(ref), nome, peso, cx, seg: 'prateleira', cat: r.mundo, grupo: r.mundo });
  }));
  const cats = [];
  ALL.forEach(p => { if (cats.indexOf(p.cat) < 0) cats.push(p.cat); });
  const catOpts = cats.map(c => `<option value="${c}">${c}</option>`).join('');

  const body = `<style>
  .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}
  .enc-layout{display:grid;grid-template-columns:1fr 360px;gap:26px;align-items:start}
  .enc-tools{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px}
  #encSearch{flex:1 1 240px;padding:12px 14px;border:1px solid #e5d5c0;border-radius:12px;font-size:15px;font-family:inherit}
  #encCat{padding:12px;border:1px solid #e5d5c0;border-radius:12px;font-size:14px;font-family:inherit}
  .enc-chips{display:flex;gap:8px;flex-wrap:wrap;flex:1 1 100%}
  .enc-chip{border:1px solid #e5d5c0;background:#fff;color:#5B2A4A;border-radius:999px;padding:8px 16px;font-size:14px;font-weight:600;cursor:pointer}
  .enc-chip.on{background:#5B2A4A;color:#fff;border-color:#5B2A4A}
  .enc-count{color:#9b8290;font-size:13px;margin:0 2px 10px}
  .enc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
  .enc-card{background:#fff;border:1px solid #f0e0c8;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:12px;transition:box-shadow .2s}
  .enc-card.added{box-shadow:0 0 0 2px #F6C440}
  .ec-main{display:flex;flex-direction:column;gap:2px}
  .ec-main b{color:#3A2030;font-size:15px}
  .ec-meta{font-size:13px;color:#6b5060}.ec-ref{font-size:12px;color:#9b8290}
  .ec-add{display:flex;gap:8px;align-items:center;margin-top:auto}
  .ec-stepper{display:flex;align-items:center;border:1px solid #e5d5c0;border-radius:10px;overflow:hidden}
  .ec-stepper button{width:32px;height:36px;border:0;background:#faf3e8;color:#5B2A4A;font-size:18px;cursor:pointer}
  .ec-stepper input{width:42px;height:36px;border:0;text-align:center;font-size:14px;font-family:inherit}
  .ec-addbtn{padding:8px 14px!important;font-size:13px;flex:1}
  .enc-summary{background:#faf3e8;border:1px solid #f0e0c8;border-radius:18px;padding:18px;position:sticky;top:90px}
  .enc-summary h3{margin:0 0 12px;color:#5B2A4A;display:flex;align-items:center;gap:8px;font-size:18px}
  .enc-badge{background:#F6C440;color:#5B2A4A;border-radius:999px;font-size:13px;font-weight:800;padding:2px 10px}
  .enc-cart{list-style:none;padding:0;margin:0 0 10px;max-height:300px;overflow:auto}
  .ec-line{display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #eee0cd}
  .ecl-name{flex:1;display:flex;flex-direction:column;min-width:0}
  .ecl-name b{font-size:13.5px;color:#3A2030}.ecl-name span{font-size:11.5px;color:#9b8290}
  .ecl-qty{display:flex;align-items:center;border:1px solid #e5d5c0;border-radius:8px;overflow:hidden}
  .ecl-qty button{width:26px;height:30px;border:0;background:#fff;cursor:pointer}
  .ecl-qty input{width:34px;height:30px;border:0;text-align:center;font-family:inherit}
  .ecl-rm{border:0;background:none;color:#c2201f;font-size:20px;cursor:pointer;line-height:1}
  .enc-cart-empty{font-size:13px;color:#6b5060;background:#fff;border-radius:10px;padding:12px}
  .enc-fields{display:flex;flex-direction:column;gap:8px;margin:12px 0}
  .enc-fields input,.enc-fields textarea{padding:11px;border:1px solid #e5d5c0;border-radius:10px;font-size:14px;font-family:inherit;width:100%}
  .enc-fields .inval{border-color:#c2201f;background:#fff5f5}
  .enc-consent{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:#6b5060;margin-bottom:10px}
  .enc-consent input{margin-top:3px}
  .enc-err{background:#fdecec;color:#a01a1a;border-radius:10px;padding:10px 12px;font-size:13.5px;margin:0 0 10px}
  #encSubmit{width:100%}
  .enc-mobilebar{display:none}
  @media(max-width:860px){
    .enc-layout{grid-template-columns:1fr}
    .enc-summary{position:fixed;left:0;right:0;bottom:0;top:auto;border-radius:18px 18px 0 0;max-height:82vh;overflow:auto;transform:translateY(105%);transition:transform .28s;z-index:9000;box-shadow:0 -10px 40px rgba(91,42,74,.22)}
    .enc-summary.open{transform:translateY(0)}
    .enc-mobilebar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:8999;justify-content:space-between;align-items:center;background:#5B2A4A;color:#fff;border:0;padding:15px 20px;font-size:15px;font-weight:700;cursor:pointer}
  }
  @media(prefers-reduced-motion:reduce){.enc-summary{transition:none}}
  @media(max-width:860px){.bento-btn{bottom:80px}} /* nao tapar a barra "Ver pedido" */
  </style>
  <section class="phero">
  <img src="/assets/img/expositor_1.jpg" alt="Pedido de cotação Quente e Bom">
  <div class="wrap">
    <div class="eyebrow">Área Profissional</div>
    <h1>Pedido de cotação</h1>
    <p>Monte a sua lista de produtos e envie — a equipa comercial responde rapidinho com os preços e o plano de entregas.</p>
  </div>
</section>
<section class="sec"><div class="wrap">
  <div class="enc-layout">
    <div class="enc-catalog">
      <div class="enc-tools">
        <label class="sr-only" for="encSearch">Pesquisar produto</label>
        <input id="encSearch" type="search" placeholder="Pesquisar por nome ou referência…" autocomplete="off">
        <label class="sr-only" for="encCat">Categoria</label>
        <select id="encCat"><option value="">Todas as categorias</option>${catOpts}</select>
        <div class="enc-chips" role="group" aria-label="Filtrar por tipo de produto">
          <button type="button" class="enc-chip on" data-seg="" aria-pressed="true">Todos</button>
          <button type="button" class="enc-chip" data-seg="prateleira" aria-pressed="false">Prateleira</button>
          <button type="button" class="enc-chip" data-seg="precozido" aria-pressed="false">Pré-cozido</button>
          <button type="button" class="enc-chip" data-seg="congelado" aria-pressed="false">Congelado</button>
        </div>
      </div>
      <p class="enc-count" id="encVisible" aria-live="polite"></p>
      <div class="enc-grid" id="encGrid"></div>
      <p class="enc-count" id="encEmpty" hidden>Sem resultados. Tenta outro termo ou limpa os filtros.</p>
    </div>

    <aside class="enc-summary" id="encSummary" aria-label="Resumo do pedido de cotação">
      <h3>O seu pedido <span class="enc-badge" id="encCount">0</span></h3>
      <p class="enc-cart-empty" id="encCartEmpty">Ainda não escolheste artigos. Adiciona as caixas que precisas — os preços vêm na cotação. 🧡</p>
      <ul class="enc-cart" id="encCart"></ul>
      <form name="encomenda-profissional" method="POST" data-netlify="true" netlify-honeypot="bt" action="/obrigado.html?t=cotacao" id="encForm">
        <input type="hidden" name="form-name" value="encomenda-profissional">
        <input type="hidden" name="referencia" id="encRef">
        <p style="display:none"><label>Não preencher <input name="bt" tabindex="-1" autocomplete="off"></label></p>
        <textarea id="pedido" name="pedido" hidden></textarea>
        <div class="enc-fields">
          <input name="empresa" id="f-empresa" required placeholder="Nome do negócio *" autocomplete="organization">
          <input name="nome" id="f-nome" required placeholder="O seu nome *" autocomplete="name">
          <input name="whatsapp" id="f-whats" required inputmode="tel" placeholder="WhatsApp * (+244 …)">
          <input name="email" id="f-email" type="email" placeholder="Email (opcional)" autocomplete="email">
          <input name="provincia" id="f-prov" required placeholder="Província / zona *">
          <textarea name="mensagem" rows="2" placeholder="Observações (opcional)"></textarea>
        </div>
        <div class="enc-consent">
          <input type="checkbox" id="f-rgpd" required>
          <label for="f-rgpd">Autorizo o contacto da equipa Quente e Bom sobre este pedido de cotação.</label>
        </div>
        <p class="enc-err" id="encErr" role="alert" hidden></p>
        <button class="btn btn-sun" type="submit" id="encSubmit">Enviar pedido de cotação ☀️</button>
      </form>
    </aside>
  </div>
</div></section>
<button type="button" class="enc-mobilebar" id="encMobileBar" hidden aria-expanded="false" aria-controls="encSummary">
  <span id="encMobileCount">0 artigos</span><span>Ver pedido ↑</span>
</button>
<script>
(function(){
  var PRODUCTS = ${JSON.stringify(ALL)};
  var grid=document.getElementById('encGrid'), search=document.getElementById('encSearch'),
      catSel=document.getElementById('encCat'), chips=document.querySelectorAll('.enc-chip'),
      visEl=document.getElementById('encVisible'), emptyEl=document.getElementById('encEmpty'),
      cartEl=document.getElementById('encCart'), cartEmpty=document.getElementById('encCartEmpty'),
      countEl=document.getElementById('encCount'), mBar=document.getElementById('encMobileBar'),
      mCount=document.getElementById('encMobileCount'), summary=document.getElementById('encSummary'),
      pedido=document.getElementById('pedido');
  var cart={}, seg='';
  function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML;}
  function plural(n){return n+' artigo'+(n===1?'':'s');}

  PRODUCTS.forEach(function(p){
    var el=document.createElement('div'); el.className='enc-card';
    el.setAttribute('data-search',(p.nome+' '+p.ref+' '+p.cat+' '+p.grupo).toLowerCase());
    el.innerHTML='<div class="ec-main"><b>'+esc(p.nome)+'</b><span class="ec-meta">'+esc(p.peso)+' · '+p.cx+' un/caixa</span><span class="ec-ref">Ref. '+esc(p.ref)+'</span></div>'+
      '<div class="ec-add"><div class="ec-stepper"><button type="button" aria-label="Menos" data-d="-1">\\u2212</button>'+
      '<input type="number" min="1" value="1" aria-label="Caixas de '+esc(p.nome)+'"><button type="button" aria-label="Mais" data-d="1">+</button></div>'+
      '<button type="button" class="btn btn-sun ec-addbtn">Adicionar</button></div>';
    var inp=el.querySelector('.ec-stepper input');
    el.querySelectorAll('.ec-stepper button').forEach(function(b){b.addEventListener('click',function(){inp.value=Math.max(1,(parseInt(inp.value,10)||1)+parseInt(b.getAttribute('data-d'),10));});});
    el.querySelector('.ec-addbtn').addEventListener('click',function(){add(p,Math.max(1,parseInt(inp.value,10)||1));el.classList.add('added');setTimeout(function(){el.classList.remove('added');},700);});
    p._el=el; grid.appendChild(el);
  });

  function filter(){
    var q=search.value.trim().toLowerCase(), cat=catSel.value, n=0;
    PRODUCTS.forEach(function(p){
      var ok=(!seg||p.seg===seg)&&(!cat||p.cat===cat)&&(!q||p._el.getAttribute('data-search').indexOf(q)>=0);
      p._el.style.display=ok?'':'none'; if(ok)n++;
    });
    visEl.textContent=plural(n)+' disponíveis'; emptyEl.hidden=n>0;
  }
  search.addEventListener('input',filter); catSel.addEventListener('change',filter);
  chips.forEach(function(c){c.addEventListener('click',function(){chips.forEach(function(x){x.classList.remove('on');x.setAttribute('aria-pressed','false');});c.classList.add('on');c.setAttribute('aria-pressed','true');seg=c.getAttribute('data-seg');filter();});});

  function add(p,q){cart[p.ref]={p:p,qty:q};renderCart();}
  function renderCart(){
    cartEl.innerHTML=''; var refs=Object.keys(cart), n=refs.length;
    refs.forEach(function(ref){
      var it=cart[ref], li=document.createElement('li'); li.className='ec-line';
      li.innerHTML='<div class="ecl-name"><b>'+esc(it.p.nome)+'</b><span>'+esc(it.p.peso)+' · Ref. '+esc(ref)+'</span></div>'+
        '<div class="ecl-qty"><button type="button" aria-label="Menos" data-d="-1">\\u2212</button><input type="number" min="1" value="'+it.qty+'" aria-label="Caixas"><button type="button" aria-label="Mais" data-d="1">+</button></div>'+
        '<button type="button" class="ecl-rm" aria-label="Remover '+esc(it.p.nome)+'">\\u00d7</button>';
      var inp=li.querySelector('.ecl-qty input');
      li.querySelectorAll('.ecl-qty button').forEach(function(b){b.addEventListener('click',function(){inp.value=Math.max(1,(parseInt(inp.value,10)||1)+parseInt(b.getAttribute('data-d'),10));it.qty=parseInt(inp.value,10);sync();});});
      inp.addEventListener('change',function(){inp.value=Math.max(1,parseInt(inp.value,10)||1);it.qty=parseInt(inp.value,10);sync();});
      li.querySelector('.ecl-rm').addEventListener('click',function(){delete cart[ref];renderCart();});
      cartEl.appendChild(li);
    });
    countEl.textContent=n; mCount.textContent=plural(n); cartEmpty.style.display=n?'none':'';
    mBar.hidden=n===0; sync();
  }
  function sync(){pedido.value=Object.keys(cart).map(function(ref){var it=cart[ref];return it.qty+' cx \\u2014 '+it.p.nome+' '+it.p.peso+' ['+ref+']';}).join('\\n');}

  document.getElementById('encRef').value='QB-'+Date.now().toString(36).toUpperCase().slice(-6);
  var qp=new URLSearchParams(location.search), qcat=qp.get('cat');
  if(qcat){catSel.value=qcat;}
  filter();
  var qref=qp.get('ref'); if(qref){var pp=PRODUCTS.filter(function(x){return x.ref===qref;})[0];if(pp){add(pp,1);}}

  mBar.addEventListener('click',function(){var open=summary.classList.toggle('open');mBar.setAttribute('aria-expanded',open?'true':'false');});

  var form=document.getElementById('encForm'), errEl=document.getElementById('encErr'), btn=document.getElementById('encSubmit'), sending=false;
  form.addEventListener('input',function(){if(!errEl.hidden)errEl.hidden=true;});
  form.addEventListener('submit',function(e){
    sync(); var probs=[];
    if(!Object.keys(cart).length)probs.push('Adiciona pelo menos um artigo ao pedido.');
    ['f-empresa','f-nome','f-whats','f-prov'].forEach(function(id){var f=document.getElementById(id);if(f&&!f.value.trim()){probs.push('Preenche: '+f.placeholder.replace(' *',''));f.classList.add('inval');}else if(f){f.classList.remove('inval');}});
    if(!document.getElementById('f-rgpd').checked)probs.push('\\u00c9 necess\\u00e1rio autorizar o contacto.');
    if(probs.length){e.preventDefault();errEl.hidden=false;errEl.textContent=probs[0];errEl.scrollIntoView({block:'center'});return;}
    if(sending){e.preventDefault();return;}
    sending=true;btn.disabled=true;btn.textContent='A enviar\\u2026';
    if(window.qbTrack)window.qbTrack('CotacaoEnviada',{artigos:Object.keys(cart).length});
  });
})();
</script>`;
  return shell('Pedido de cotação — Área Profissional · Quente e Bom', 'Monte a sua lista de produtos Quente e Bom (prateleira, pré-cozidos e congelados) e receba a cotação da equipa comercial, com entrega em toda a Angola.', '/profissional/encomenda/', body);
}

function revendedorHTML(){
  const body = `<section class="phero">
  <img src="/assets/img/expositor_1.jpg" alt="Torne-se revendedor Quente e Bom">
  <div class="wrap">
    <div class="eyebrow">Área Profissional</div>
    <h1>Torne-se revendedor</h1>
    <p>Produtos que vendem todos os dias e clientes que voltam sempre. Preencha em 2 minutos — a equipa comercial responde rapidinho.</p>
  </div>
</section>
<section class="sec"><div class="wrap" style="max-width:720px">
<form class="fform" name="lead-revendedor" method="POST" action="/obrigado.html" data-netlify="true" netlify-honeypot="bot-field">
  <input type="hidden" name="form-name" value="lead-revendedor">
  <p style="display:none;"><label>Não preencher: <input name="bot-field"></label></p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <input name="nome" placeholder="O seu nome *" required autocomplete="name" style="padding:12px;border-radius:10px;border:1px solid #e5d5c0">
    <input name="negocio" placeholder="Nome do negócio *" required autocomplete="organization" style="padding:12px;border-radius:10px;border:1px solid #e5d5c0">
    <input name="zona" placeholder="Zona / província * (ex.: Luanda — Viana)" required style="padding:12px;border-radius:10px;border:1px solid #e5d5c0">
    <input name="whatsapp" placeholder="WhatsApp * (+244 ...)" required inputmode="tel" style="padding:12px;border-radius:10px;border:1px solid #e5d5c0">
  </div>
  <textarea name="mensagem" rows="4" placeholder="Que produtos lhe interessam? (opcional — ex.: pão de forma, bolos da avó, pré-cozidos)" style="width:100%;margin-top:12px;padding:12px;border-radius:10px;border:1px solid #e5d5c0"></textarea>
  <div style="display:flex;gap:8px;align-items:flex-start;margin:12px 0;font-size:13.5px;color:#6b5060">
    <input type="checkbox" required id="f-rgpd" style="margin-top:3px">
    <label for="f-rgpd">Autorizo o contacto da equipa Quente e Bom sobre este pedido.</label>
  </div>
  <div style="text-align:center"><button class="btn btn-sun" type="submit">Quero ser revendedor ☀️</button></div>
</form>
</div></section>`;
  return shell('Torne-se revendedor — Quente e Bom', 'Leve os produtos Quente e Bom para a sua loja, café ou supermercado. Registo em 2 minutos e resposta rápida da equipa comercial.', '/profissional/revendedor/', body);
}

// escrever
const base = path.join(__dirname, 'profissional');
fs.mkdirSync(base, { recursive: true });
fs.writeFileSync(path.join(base, 'index.html'), hubHTML(), 'utf8');
console.log('profissional/index.html — hub');
GAMAS.forEach(g => {
  const d = path.join(base, g.slug);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'index.html'), gamaHTML(g), 'utf8');
  console.log(`profissional/${g.slug}/index.html — ${g.grupos.reduce((s,x)=>s+x.items.length,0)} artigos`);
});
fs.mkdirSync(path.join(base, 'encomenda'), { recursive: true });
fs.writeFileSync(path.join(base, 'encomenda', 'index.html'), encomendaHTML(), 'utf8');
console.log('profissional/encomenda/index.html — formulário');
fs.mkdirSync(path.join(base, 'revendedor'), { recursive: true });
fs.writeFileSync(path.join(base, 'revendedor', 'index.html'), revendedorHTML(), 'utf8');
console.log('profissional/revendedor/index.html — formulário lead-revendedor');
console.log('TOTAL: ' + GAMAS.reduce((s,g)=>s+g.grupos.reduce((a,x)=>a+x.items.length,0),0) + ' artigos');
