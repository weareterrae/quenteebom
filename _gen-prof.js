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
</style>`;

function headerHTML(){return `<header class="hdr solid" id="hdr">
  <div class="wrap hrow">
    <a href="/">
      <img src="/assets/logos/logo_white_real.png" class="hlogo logo-w" alt="Quente e Bom">
      <img src="/assets/logos/logo_color_trans.png" class="hlogo logo-c" alt="Quente e Bom">
    </a>
    <nav class="nav">
      <a href="/#mundos">Produtos</a>
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
        <a href="/#mundos">Produtos</a><a href="/receitas/">Receitas</a><a href="/recrutamento/">Carreiras</a><a href="/contacto/">Contactos</a>
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
<script src="/assets/js/site.js?v=8"></script>
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
</div></section>`;
  return shell('Área Profissional — Quente e Bom · pré-cozidos e congelados', 'Pão pré-cozido, pão pronto congelado e pastelaria congelada para padarias, supermercados, cafés e restaurantes em toda a Angola.', '/profissional/', body);
}

function encomendaHTML(){
  let opts = '';
  GAMAS.forEach(g => {
    opts += `<optgroup label="Congelados · ${g.nome}">`;
    g.grupos.forEach(gr => gr.items.forEach(([ref,nome,peso,cx]) => {
      opts += `<option value="${nome} ${peso} (${cx} un/cx) [${ref}]">${nome} · ${peso} · ${cx} un/caixa</option>`;
    }));
    opts += `</optgroup>`;
  });
  RETALHO.forEach(r => {
    opts += `<optgroup label="Prateleira · ${r.mundo}">`;
    r.items.forEach(([ref,nome,peso,cx]) => {
      opts += `<option value="${nome} ${peso} (${cx} un/cx) [${ref}]">${nome} · ${peso} · ${cx} un/caixa</option>`;
    });
    opts += `</optgroup>`;
  });
  const body = `<section class="phero">
  <img src="/assets/img/expositor_1.jpg" alt="Pedido de cotação Quente e Bom">
  <div class="wrap">
    <div class="eyebrow">Área Profissional</div>
    <h1>Pedido de cotação</h1>
    <p>Monte a sua lista, envie — e a equipa comercial responde rapidinho com preços e plano de entregas.</p>
  </div>
</section>
<section class="sec"><div class="wrap" style="max-width:760px">
<form name="encomenda-profissional" method="POST" data-netlify="true" netlify-honeypot="bt" action="/obrigado.html" class="fform">
  <input type="hidden" name="form-name" value="encomenda-profissional">
  <p style="display:none"><input name="bt"></p>
  <div class="strip-t"><h3>1 · A sua lista</h3></div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
    <select id="prod" style="flex:1;min-width:260px;padding:12px;border-radius:10px;border:1px solid #e5d5c0">${opts}</select>
    <input id="qtd" type="number" min="1" value="1" style="width:90px;padding:12px;border-radius:10px;border:1px solid #e5d5c0" aria-label="Caixas">
    <button type="button" class="btn btn-sun" onclick="addItem()">Adicionar</button>
  </div>
  <ul id="lista" style="list-style:none;padding:0;margin:14px 0"></ul>
  <textarea id="pedido" name="pedido" required readonly style="display:none"></textarea>
  <div class="strip-t"><h3>2 · O seu negócio</h3></div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
    <input name="empresa" placeholder="Nome do negócio *" required style="padding:12px;border-radius:10px;border:1px solid #e5d5c0">
    <input name="nome" placeholder="O seu nome *" required style="padding:12px;border-radius:10px;border:1px solid #e5d5c0">
    <input name="whatsapp" placeholder="WhatsApp *" required style="padding:12px;border-radius:10px;border:1px solid #e5d5c0">
    <input name="email" type="email" placeholder="Email" style="padding:12px;border-radius:10px;border:1px solid #e5d5c0">
    <input name="provincia" placeholder="Província / zona *" required style="grid-column:1/-1;padding:12px;border-radius:10px;border:1px solid #e5d5c0">
  </div>
  <div style="margin-top:18px;text-align:center"><button class="btn btn-sun" type="submit">Enviar pedido de cotação</button></div>
</form>
<script>
function addItem(){
  var p=document.getElementById('prod'),q=document.getElementById('qtd');
  var li=document.createElement('li');
  li.style.cssText='background:#fff;border:1px solid #f0e0c8;border-radius:10px;padding:10px 14px;margin:6px 0;display:flex;justify-content:space-between;align-items:center';
  li.dataset.v=q.value+' cx — '+p.value;
  li.innerHTML='<span>'+q.value+' caixa(s) — '+p.options[p.selectedIndex].text+'</span><button type="button" style="border:none;background:#c2201f;color:#fff;border-radius:8px;padding:4px 10px;cursor:pointer" onclick="this.parentNode.remove();sync()">×</button>';
  document.getElementById('lista').appendChild(li);sync();
}
function sync(){
  var v=[].map.call(document.querySelectorAll('#lista li'),function(x){return x.dataset.v}).join('\\n');
  document.getElementById('pedido').value=v;
}
document.querySelector('form').addEventListener('submit',function(e){
  sync();
  if(!document.getElementById('pedido').value){e.preventDefault();alert('Adicione pelo menos um artigo \\u00e0 lista \\u2600\\ufe0f');}
});
</script>
</div></section>`;
  return shell('Pedido de cotação — Área Profissional · Quente e Bom', 'Monte a sua lista de pré-cozidos e congelados Quente e Bom e receba a cotação da equipa comercial.', '/profissional/encomenda/', body);
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
