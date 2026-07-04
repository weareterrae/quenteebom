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

function headerHTML() {
  return `<header class="hdr solid" id="hdr">
  <div class="wrap hrow">
    <a href="/">
      <img src="/assets/logos/logo_white_real.png" class="hlogo logo-w" alt="Quente e Bom">
      <img src="/assets/logos/logo_color_trans.png" class="hlogo logo-c" alt="Quente e Bom">
    </a>
    <nav class="nav">
      <a href="/#mundos">Produtos</a>
      <a href="/profissional/">Profissional</a>
      <a href="/receitas/">Receitas</a>
      <a href="/dicas/">Dicas</a>
      <a href="/revendedores/">Revendedores</a>
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
        <a href="/#historia">A nossa história</a><a href="/receitas/">Receitas</a><a href="/dicas/">Dicas e sugestões</a><a href="/revendedores/">Revendedores</a><a href="/recrutamento/">Carreiras</a><a href="/contacto/">Contactos</a><a href="/#onde">Onde comprar</a>
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
    const cards = g.items.map(([slug, nome, desc]) => `        <div class="prod" data-reveal>
          <div class="ph"><img src="/assets/produtos/${cat.slug}/${slug}.png" alt="${nome} — Quente e Bom" loading="lazy"></div>
          <h3>${nome}</h3>
          <p class="sub">${desc || ''}</p>
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
<link rel="canonical" href="https://quenteebom.com/${cat.slug}/">
<meta property="og:title" content="${cat.nome} — Quente e Bom">
<meta property="og:description" content="${cat.intro}">
<meta property="og:image" content="https://quenteebom.com${cat.hero}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%E2%98%80%EF%B8%8F%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="/assets/css/qeb.css?v=4">
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

<script src="/assets/js/site.js?v=4"></script>
<script src="/assets/js/bento.js?v=5"></script>
</body>
</html>
`;
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
console.log(`TOTAL: ${total} produtos em ${CATS.length} categorias · sem descrição: ${semDesc}`);
