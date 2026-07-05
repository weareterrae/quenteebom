// Gerador de Receitas + Dicas — node _gen-extra.js
// Editar os dados aqui e re-correr; NÃO editar os HTML gerados à mão.
const fs = require('fs');
const path = require('path');

// categoria (rótulo do cartão) + tags (filtros) por receita
const META = {
  'rabanadas-de-brioche':                 { cat: 'Sobremesas', tags: ['Sobremesas', 'Rápido', 'Festa'] },
  'bolo-de-cenoura-com-chocolate':        { cat: 'Bolos',      tags: ['Bolos'] },
  'queques-de-laranja-com-chocolate':     { cat: 'Docinhos',   tags: ['Docinhos'] },
  'red-velvet-de-festa':                  { cat: 'Bolos',      tags: ['Bolos', 'Festa'] },
  'bolo-marmore-caseiro':                 { cat: 'Bolos',      tags: ['Bolos'] },
  'bolo-de-ananas-invertido':             { cat: 'Bolos',      tags: ['Bolos', 'Festa'] },
  'bolo-de-iogurte-com-coco':             { cat: 'Bolos',      tags: ['Bolos'] },
  'pao-de-lo-recheado-da-pastelaria':     { cat: 'Bolos',      tags: ['Bolos', 'Festa'] },
  'bolo-de-caramelo-com-nozes':           { cat: 'Bolos',      tags: ['Bolos'] },
  'queques-com-coracao-de-chocolate-branco': { cat: 'Docinhos', tags: ['Docinhos', 'Festa'] },
  'torta-de-chocolate-com-chantilly':     { cat: 'Bolos',      tags: ['Bolos', 'Festa'] },
  'mousse-de-chocolate-negro':            { cat: 'Sobremesas', tags: ['Sobremesas', 'Sem forno'] },
  'beijinhos-de-coco':                    { cat: 'Docinhos',   tags: ['Docinhos', 'Festa', 'Sem forno'] },
  'brigadeiros-classicos':                { cat: 'Docinhos',   tags: ['Docinhos', 'Festa', 'Sem forno'] },
  'salame-de-chocolate':                  { cat: 'Sobremesas', tags: ['Sobremesas', 'Festa', 'Sem forno'] },
  'trufas-de-chocolate-branco-e-coco':    { cat: 'Docinhos',   tags: ['Docinhos', 'Festa', 'Sem forno'] },
  'copos-de-creme-com-fruta':             { cat: 'Sobremesas', tags: ['Sobremesas', 'Sem forno', 'Rápido'] },
  'mini-sandes-de-festa':                 { cat: 'Salgado',    tags: ['Salgado', 'Festa', 'Rápido'] },
  'tostas-gourmet':                       { cat: 'Salgado',    tags: ['Salgado', 'Rápido'] },
  'crocante-de-caju':                     { cat: 'Sobremesas', tags: ['Sobremesas', 'Rápido'] },
  'panados-crocantes':                    { cat: 'Salgado',    tags: ['Salgado', 'Rápido'] },
  'mousse-de-chocolate-branco':           { cat: 'Sobremesas', tags: ['Sobremesas', 'Sem forno', 'Festa'] },
  'bolo-de-bolacha-com-cafe':             { cat: 'Sobremesas', tags: ['Sobremesas', 'Sem forno', 'Festa'] },
  'cheesecake-de-limao-sem-forno':        { cat: 'Sobremesas', tags: ['Sobremesas', 'Sem forno'] },
  'pudim-de-pao-com-sultanas':            { cat: 'Sobremesas', tags: ['Sobremesas'] },
  'tarte-de-chocolate-com-palmiers':      { cat: 'Sobremesas', tags: ['Sobremesas', 'Sem forno', 'Festa'] },
  'bolo-de-caneca-de-chocolate':          { cat: 'Docinhos',   tags: ['Docinhos', 'Rápido'] },
  'espetadas-de-fruta-com-fondue':        { cat: 'Docinhos',   tags: ['Docinhos', 'Rápido', 'Sem forno', 'Festa'] },
  'panquecas-fofas':                      { cat: 'Docinhos',   tags: ['Docinhos', 'Rápido'] },
  'gelado-de-banana-e-chocolate':         { cat: 'Sobremesas', tags: ['Sobremesas', 'Sem forno', 'Rápido'] },
  'tosta-mista-de-domingo':               { cat: 'Sandes',     tags: ['Sandes', 'Salgado', 'Rápido'] },
  'club-sandwich-quente-e-bom':           { cat: 'Sandes',     tags: ['Sandes', 'Salgado', 'Festa'] },
  'sandes-de-frango-e-abacate':           { cat: 'Sandes',     tags: ['Sandes', 'Salgado', 'Rápido'] },
  'hamburguer-caseiro-a-angolana':        { cat: 'Sandes',     tags: ['Sandes', 'Salgado', 'Festa'] },
  'brioche-com-ovo-estrelado':            { cat: 'Sandes',     tags: ['Sandes', 'Salgado', 'Rápido'] },
  'sandes-de-atum-cremoso':               { cat: 'Sandes',     tags: ['Sandes', 'Salgado', 'Rápido'] },
  'prego-em-pao-artesanal':               { cat: 'Sandes',     tags: ['Sandes', 'Salgado'] },
  'queijo-quente-no-pao-de-centeio':      { cat: 'Sandes',     tags: ['Sandes', 'Salgado', 'Rápido'] },
  'sandes-leve-boa-linha':                { cat: 'Sandes',     tags: ['Sandes', 'Salgado', 'Rápido'] },
  'sandes-de-ovo-no-multicereais':        { cat: 'Sandes',     tags: ['Sandes', 'Salgado', 'Rápido'] },
};
const DESTAQUE = 'red-velvet-de-festa';
const CHIPS = ['Todas', 'Bolos', 'Docinhos', 'Sobremesas', 'Sandes', 'Salgado', 'Sem forno', 'Rápido', 'Festa'];

const RECEITAS = [
  {
    slug: 'rabanadas-de-brioche', titulo: 'Rabanadas de Brioche',
    img: '/assets/img/rec_rabanadas.jpg',
    tempo: '20 min', dif: 'Fácil', rende: '4 pessoas',
    intro: 'As rabanadas mais fofas da tua vida — o segredo é o nosso Pão de Forma Brioche, que absorve o leite e fica dourado por fora, cremoso por dentro.',
    produtos: [['Pão de Forma Brioche', '/pao/']],
    ingredientes: [
      '<b><a href="/pao/">Pão de Forma Brioche</a> Quente e Bom</b> — 8 fatias',
      '2 ovos',
      '250 ml de leite',
      '3 colheres de sopa de açúcar',
      'Canela em pó a gosto',
      'Manteiga ou óleo para dourar',
      'Mel para regar (opcional)',
    ],
    passos: [
      ['Prepara o banho', 'Bate os ovos num prato fundo. Noutro, mistura o leite com 1 colher de açúcar.'],
      ['Molha as fatias', 'Passa cada fatia de brioche primeiro pelo leite (rápido, sem encharcar) e depois pelo ovo batido.'],
      ['Doura', 'Numa frigideira com um pouco de manteiga, doura as fatias 2 minutos de cada lado, até ficarem bem douradinhas.'],
      ['Finaliza', 'Mistura o restante açúcar com canela e polvilha as rabanadas ainda quentes. Rega com um fio de mel e serve.'],
    ],
    dicaBento: 'Se o brioche estiver do dia anterior, ainda melhor — absorve mais e desfaz-se menos! ☀️',
  },
  {
    slug: 'bolo-de-cenoura-com-chocolate', titulo: 'Bolo de Cenoura com Cobertura de Chocolate',
    img: '/assets/img/rec_bolocenoura.jpg',
    tempo: '50 min', dif: 'Fácil', rende: '8 fatias',
    intro: 'O clássico que nunca falha: bolo de cenoura fofinho com cobertura brilhante de chocolate de leite. Com o nosso preparado, é impossível correr mal.',
    produtos: [['Cake Cenoura', '/cakes/'], ['Chocolate de Leite 34%', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/cakes/">Cake Cenoura</a> Quente e Bom</b> — 1 embalagem (500 g)',
      'Óleo vegetal — 150 g',
      '3 ovos (±150 g)',
      'Água — 125 g',
      '<b><a href="/ingredientes/">Chocolate de Leite 34% Cacau</a> Quente e Bom</b> — 150 g',
      '3 colheres de sopa de leite',
      '1 colher de sopa de manteiga',
    ],
    passos: [
      ['Bate a massa', 'Junta o preparado, o óleo, os ovos e a água. Bate com varas 5 minutos em velocidade moderada.'],
      ['Coze', 'Verte numa forma untada e leva ao forno a 180 °C até o palito sair seco.'],
      ['Derrete a cobertura', 'Enquanto o bolo arrefece, derrete o chocolate de leite com o leite e a manteiga em banho-maria, mexendo sempre.'],
      ['Cobre e serve', 'Verte o chocolate por cima do bolo frio, deixa firmar 15 minutos. Fatias generosas e um cafezinho — felicidade!'],
    ],
    dicaBento: 'Quer impressionar? Polvilha a cobertura com um punhado de nozes picadas dos nossos Ingredientes. 🥜',
  },
  {
    slug: 'queques-de-laranja-com-chocolate', titulo: 'Queques de Laranja com Pepitas de Chocolate',
    img: '/assets/img/rec_queques.jpg',
    tempo: '35 min', dif: 'Fácil', rende: '~12 queques',
    intro: 'O Cake Laranja também faz queques incríveis — com pedacinhos de laranja na massa e pepitas de chocolate negro a derreter. Perfeitos para a lancheira.',
    produtos: [['Cake Laranja', '/cakes/'], ['Chocolate Negro 70%', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/cakes/">Cake Laranja</a> Quente e Bom</b> — 1 embalagem (500 g)',
      'Óleo vegetal — 150 g',
      '3 ovos (±150 g)',
      'Água — 125 g',
      '<b><a href="/ingredientes/">Chocolate Negro 70% Cacau</a> Quente e Bom</b> — 100 g, picado grosso',
    ],
    passos: [
      ['Bate a massa', 'Junta o preparado, o óleo, os ovos e a água. Bate com varas 5 minutos em velocidade moderada.'],
      ['Junta o chocolate', 'Envolve o chocolate picado na massa com uma espátula, sem bater.'],
      ['Enche as formas', 'Distribui por formas de queque com forminhas de papel, até 2/3 da altura.'],
      ['Coze', 'Forno a 180 °C cerca de 18–20 minutos, até dourarem. Deixa arrefecer na grelha… se conseguires esperar!'],
    ],
    dicaBento: 'A ficha do produto não engana: serve para bolos E queques. Massa até 2/3 da forma — eles crescem! ☀️',
  },
  {
    slug: 'red-velvet-de-festa', titulo: 'Red Velvet de Festa com Chantilly',
    img: '/assets/img/rec_redvelvet.jpg',
    tempo: '1h', dif: 'Média', rende: '10 fatias',
    intro: 'O bolo vermelho que rouba as atenções em qualquer festa. Atenção ao segredo da ficha técnica: este leva manteiga, não óleo — e faz toda a diferença no aveludado.',
    produtos: [['Cake Red Velvet', '/cakes/'], ['Chantilly em Pó', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/cakes/">Cake Red Velvet</a> Quente e Bom</b> — 1 embalagem (500 g)',
      'Manteiga — 150 g (amolecida)',
      '3 ovos (±150 g)',
      'Água — 115 g',
      '<b><a href="/ingredientes/">Chantilly em Pó</a> Quente e Bom</b> — preparado com leite bem frio',
    ],
    passos: [
      ['Bate a massa', 'Junta o preparado, a manteiga amolecida, os ovos e a água. Bate 5 minutos em velocidade moderada.'],
      ['Coze', 'Divide por duas formas redondas untadas e coze a 180 °C até o palito sair seco. Deixa arrefecer por completo.'],
      ['Prepara o chantilly', 'Bate o Chantilly em Pó com leite bem frio (taça fria ajuda!) até ficar firme.'],
      ['Monta', 'Camada de bolo, camada generosa de chantilly, outra camada de bolo e cobre tudo. Vermelho e branco — pura festa!'],
    ],
    dicaBento: 'Apara as “costas” dos bolos com uma faca de serra para as camadas ficarem direitinhas — e as aparas são do Chef. 😄',
  },
  {
    slug: 'bolo-marmore-caseiro', titulo: 'Bolo Mármore Caseiro',
    img: '/assets/img/rec_marmore.jpg',
    tempo: '55 min', dif: 'Fácil', rende: '10 fatias',
    intro: 'Dois preparados, um clássico: metade Cake Chocolate, metade Cake Iogurte, num remoinho bonito que fica diferente em cada fatia.',
    produtos: [['Cake Chocolate', '/cakes/'], ['Cake Yogurte', '/cakes/']],
    ingredientes: [
      '<b><a href="/cakes/">Cake Chocolate</a> Quente e Bom</b> — ½ embalagem (250 g)',
      '<b><a href="/cakes/">Cake Yogurte</a> Quente e Bom</b> — ½ embalagem (250 g)',
      'Óleo vegetal — 75 g + 75 g',
      '3 ovos (1½ para cada massa)',
      'Água — 60 g + 60 g',
    ],
    passos: [
      ['Duas massas', 'Prepara as duas massas em taças separadas: cada metade de preparado com metade do óleo, dos ovos e da água. Bate cada uma 5 minutos.'],
      ['Alterna na forma', 'Numa forma untada, verte colheradas alternadas de massa clara e de chocolate.'],
      ['Faz o remoinho', 'Passa um palito em ziguezague pela massa — 2 ou 3 voltas chegam. Menos é mais!'],
      ['Coze', 'Forno a 180 °C até o palito sair seco. Cada fatia é uma surpresa. 🍥'],
    ],
    dicaBento: 'Guarda as meias embalagens bem fechadas em local seco e fresco — rendem outro bolo no fim de semana seguinte. ☀️',
  },
  {
    slug: 'bolo-de-ananas-invertido', titulo: 'Bolo de Ananás Invertido',
    img: '/assets/img/rec_ananas.jpg',
    tempo: '1h', dif: 'Média', rende: '10 fatias',
    intro: 'O truque mais bonito da pastelaria: o caramelo e o ananás vão no fundo da forma — e ao virar, tcharan! O Cake Ananás já traz pedaços de fruta na massa.',
    produtos: [['Cake Ananás', '/cakes/']],
    ingredientes: [
      '<b><a href="/cakes/">Cake Ananás</a> Quente e Bom</b> — 1 embalagem (500 g)',
      'Óleo vegetal — 150 g',
      '3 ovos (±150 g)',
      'Água — 115 g',
      'Rodelas de ananás (fresco ou em calda) — 6 a 8',
      'Açúcar para o caramelo — 120 g',
    ],
    passos: [
      ['Carameliza', 'Derrete o açúcar em lume brando até ficar dourado e verte no fundo da forma. Dispõe as rodelas de ananás por cima.'],
      ['Bate a massa', 'Junta o preparado, o óleo, os ovos e a água. Bate com varas 5 minutos em velocidade moderada.'],
      ['Coze', 'Verte a massa sobre o ananás e leva ao forno a 180 °C até o palito sair seco.'],
      ['Vira', 'Deixa amornar 10 minutos e desenforma virando o prato de uma vez — coragem e pulso firme! 🍍'],
    ],
    dicaBento: 'Vira o bolo ainda morno — se arrefecer de mais, o caramelo agarra-se à forma. ☀️',
  },
  {
    slug: 'bolo-de-iogurte-com-coco', titulo: 'Bolo de Iogurte com Coco',
    img: '/assets/img/rec_iogurtecoco.jpg',
    tempo: '50 min', dif: 'Fácil', rende: '10 fatias',
    intro: 'Fofinho, leve e com coco tostado por cima — a dupla Cake Yogurte + Coco Ralado é daquelas que fica no caderno de receitas da família.',
    produtos: [['Cake Yogurte', '/cakes/'], ['Coco Ralado', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/cakes/">Cake Yogurte</a> Quente e Bom</b> — 1 embalagem (500 g)',
      'Óleo vegetal — 150 g',
      '3 ovos (±150 g)',
      'Água — 115 g',
      '<b><a href="/ingredientes/">Coco Ralado</a> Quente e Bom</b> — 50 g na massa + 30 g para cobrir',
    ],
    passos: [
      ['Bate a massa', 'Junta o preparado, o óleo, os ovos e a água. Bate com varas 5 minutos em velocidade moderada.'],
      ['Junta o coco', 'Envolve os 50 g de coco ralado na massa com uma espátula.'],
      ['Coze', 'Verte numa forma untada e leva ao forno a 180 °C até o palito sair seco.'],
      ['Tosta e cobre', 'Tosta o restante coco numa frigideira seca até dourar e polvilha o bolo. Perfume de férias! 🥥'],
    ],
    dicaBento: 'O coco tosta em segundos — não tires os olhos da frigideira! ☀️',
  },
  {
    slug: 'pao-de-lo-recheado-da-pastelaria', titulo: 'Pão de Ló Recheado da Pastelaria',
    img: '/assets/img/rec_paolorecheado.jpg',
    tempo: '1h15', dif: 'Média', rende: '12 fatias',
    intro: 'Três produtos da casa, um resultado de pastelaria fina: pão de ló alto e fofo, creme de pasteleiro sedoso e amêndoa laminada tostada. Sem segredos — as fichas técnicas fazem o trabalho.',
    produtos: [['Pão de Ló Tradicional', '/cakes/'], ['Creme de Pasteleiro', '/ingredientes/'], ['Amêndoa Laminada', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/cakes/">Pão de Ló Tradicional</a> Quente e Bom</b> — 1 embalagem (500 g)',
      '9 ovos (±450 g)',
      'Água — 100 g',
      '<b><a href="/ingredientes/">Creme de Pasteleiro</a> Quente e Bom</b> — 100 g',
      'Açúcar — 100 g · Água fria — 300 g (para o creme)',
      '<b><a href="/ingredientes/">Amêndoa Laminada</a> Quente e Bom</b> — 50 g',
      'Açúcar em pó para polvilhar',
    ],
    passos: [
      ['Bate como um profissional', 'Junta o preparado, os 9 ovos e a água. Bate com varas 7 a 10 minutos na velocidade MÁXIMA — é isto que dá o fofo.'],
      ['Coze', 'Verte em duas formas untadas e coze a 180 °C. Deixa arrefecer por completo.'],
      ['Creme a frio', 'Mistura o Creme de Pasteleiro com o açúcar, junta à água fria e bate até ficar homogéneo. Deixa repousar antes de usar.'],
      ['Monta', 'Recheia as camadas com o creme, tosta a amêndoa numa frigideira seca e espalha por cima. Polvilha com açúcar em pó. 👨🏾‍🍳'],
    ],
    dicaBento: 'O segredo do pão de ló está na batedeira: 7 a 10 minutos SEM preguiça, na velocidade máxima. A ficha técnica não mente! ☀️',
  },
  {
    slug: 'brigadeiros-classicos', titulo: 'Brigadeiros Clássicos',
    img: '/assets/img/rec_brigadeiros.jpg',
    tempo: '30 min + frio', dif: 'Fácil', rende: '~25 unidades',
    intro: 'A estrela de todas as festas. Cacau em pó a sério na massa e Granulado de Chocolate a vestir — feitos em casa, sabem sempre melhor.',
    produtos: [['Cacau em Pó', '/ingredientes/'], ['Granulado de Chocolate', '/ingredientes/']],
    ingredientes: [
      '1 lata de leite condensado',
      '<b><a href="/ingredientes/">Cacau em Pó</a> Quente e Bom</b> — 3 colheres de sopa',
      '1 colher de sopa de manteiga',
      '<b><a href="/ingredientes/">Granulado de Chocolate</a> Quente e Bom</b> — para envolver',
    ],
    passos: [
      ['Cozinha', 'Leva o leite condensado, o cacau e a manteiga ao lume brando, mexendo sempre até descolar do fundo do tacho (±10 min).'],
      ['Arrefece', 'Espalha num prato untado e deixa arrefecer completamente (o frigorífico ajuda).'],
      ['Enrola', 'Com as mãos untadas de manteiga, faz bolinhas do tamanho de uma noz.'],
      ['Veste', 'Rola cada brigadeiro no granulado de chocolate e coloca em forminhas de papel. Tenta chegar à festa com todos! 😄'],
    ],
    dicaBento: 'Ponto certo: quando passas a colher e vês o fundo do tacho por 2 segundos, está pronto. ☀️',
  },
  {
    slug: 'salame-de-chocolate', titulo: 'Salame de Chocolate',
    img: '/assets/img/rec_salame.jpg',
    tempo: '20 min + 4h frio', dif: 'Fácil', rende: '12 fatias',
    intro: 'O clássico que junta três produtos da casa: Chocolate Negro 70%, Biscoitos Areados e Sultanas. Sem forno — o frigorífico faz o resto.',
    produtos: [['Chocolate Negro 70%', '/ingredientes/'], ['Biscoitos Areados', '/biscoitos/'], ['Sultanas', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/ingredientes/">Chocolate Negro 70% Cacau</a> Quente e Bom</b> — 200 g',
      '<b><a href="/biscoitos/">Biscoitos Areados</a> Quente e Bom</b> — 150 g, partidos grosseiramente',
      '<b><a href="/ingredientes/">Sultanas</a> Quente e Bom</b> — 50 g',
      '100 g de manteiga',
      '2 colheres de sopa de açúcar',
      '1 ovo (opcional, para a versão tradicional) ou 3 colheres de leite',
      'Açúcar em pó para polvilhar',
    ],
    passos: [
      ['Derrete', 'Derrete o chocolate com a manteiga em banho-maria. Junta o açúcar e o leite (ou ovo) e mexe até ficar brilhante.'],
      ['Mistura', 'Envolve os biscoitos partidos e as sultanas na mistura de chocolate.'],
      ['Enrola', 'Deita sobre película aderente e enrola num cilindro apertado, torcendo as pontas como um rebuçado.'],
      ['Frio e corte', 'Frigorífico no mínimo 4 horas. Polvilha com açúcar em pó e corta em fatias — parece mesmo um salame! 🍫'],
    ],
    dicaBento: 'Fatias mais bonitas? Faca quente e seca (passa por água quente e limpa) entre cada corte. ☀️',
  },
  {
    slug: 'crocante-de-caju', titulo: 'Crocante de Caju',
    img: '/assets/img/rec_crocante.jpg',
    tempo: '15 min', dif: 'Média', rende: 'para muitas sobremesas',
    intro: 'O nosso Caju Torrado já é perfeito para petiscar — mas transforma-o em crocante de caramelo e tens o topping dourado que eleva gelados, bolos e mousses.',
    produtos: [['Caju Torrado', '/snacks/']],
    ingredientes: [
      '<b><a href="/snacks/">Caju Torrado</a> Quente e Bom</b> — 150 g',
      'Açúcar — 150 g',
      '1 colher de sopa de água',
      'Uma pitada de sal',
    ],
    passos: [
      ['Caramelo', 'Leva o açúcar com a água ao lume médio, sem mexer, até ficar âmbar dourado.'],
      ['Junta o caju', 'Fora do lume, envolve rapidamente o caju torrado e a pitada de sal no caramelo.'],
      ['Estende', 'Deita sobre papel vegetal, espalha com uma espátula untada e deixa arrefecer por completo.'],
      ['Parte e usa', 'Parte em lascas para decorar bolos e mousses, ou pica fino para chover sobre gelado. Guarda em caixa hermética. ✨'],
    ],
    dicaBento: 'Caramelo não se mexe com colher — abana o tacho devagarinho e ele faz-se sozinho. E cuidado: está MUITO quente! ☀️',
  },
  {
    slug: 'mousse-de-chocolate-negro', titulo: 'Mousse de Chocolate Negro',
    img: '/assets/img/rec_mousse.jpg',
    tempo: '15 min + 3h frio', dif: 'Média', rende: '6 copos',
    intro: 'Intensa, aveludada e com apenas 3 ingredientes. O Chocolate Negro 70% faz todo o trabalho — tu ficas com os louros.',
    produtos: [['Chocolate Negro 70%', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/ingredientes/">Chocolate Negro 70% Cacau</a> Quente e Bom</b> — 200 g',
      '6 ovos (claras e gemas separadas)',
      '2 colheres de sopa de açúcar',
      'Uma pitada de sal',
    ],
    passos: [
      ['Derrete', 'Derrete o chocolate em banho-maria e deixa arrefecer um pouco. Junta as gemas uma a uma, mexendo bem.'],
      ['Bate as claras', 'Bate as claras com o sal em castelo firme, juntando o açúcar no fim.'],
      ['Envolve', 'Envolve as claras no chocolate em 3 vezes, com movimentos suaves de baixo para cima — sem pressa!'],
      ['Refrigera', 'Divide por copos e leva ao frio pelo menos 3 horas. Serve com raspas de chocolate por cima.'],
    ],
    dicaBento: 'O segredo da mousse fofa é envolver devagarinho — quem bate com força, perde o ar. 😉',
  },
  {
    slug: 'beijinhos-de-coco', titulo: 'Beijinhos de Coco',
    img: '/assets/img/rec_beijinhos.jpg',
    tempo: '30 min', dif: 'Fácil', rende: '~25 unidades',
    intro: 'Os docinhos de festa que desaparecem primeiro. Coco ralado por dentro e por fora — e aquele brilho de açúcar em pó.',
    produtos: [['Coco Ralado', '/ingredientes/'], ['Açúcar em Pó', '/ingredientes/']],
    ingredientes: [
      '1 lata de leite condensado',
      '<b><a href="/ingredientes/">Coco Ralado</a> Quente e Bom</b> — 100 g + extra para envolver',
      '1 colher de sopa de manteiga',
      '<b><a href="/ingredientes/">Açúcar em Pó</a> Quente e Bom</b> — para polvilhar',
    ],
    passos: [
      ['Cozinha', 'Leva o leite condensado, o coco e a manteiga ao lume brando, mexendo sempre até descolar do fundo (±10 min).'],
      ['Arrefece', 'Espalha num prato untado e deixa arrefecer completamente.'],
      ['Enrola', 'Com as mãos untadas de manteiga, faz bolinhas e passa-as pelo coco ralado extra.'],
      ['Decora', 'Coloca em forminhas de papel e polvilha com açúcar em pó. Prontos para a festa!'],
    ],
    dicaBento: 'Faz o dobro. Confia em mim — na festa, os beijinhos voam. ☀️',
  },
  {
    slug: 'mini-sandes-de-festa', titulo: 'Mini Sandes de Festa',
    img: '/assets/img/rec_minisandes.jpg',
    tempo: '15 min', dif: 'Fácil', rende: '12 unidades',
    intro: 'A mesa de aniversário não está completa sem elas. Os Mini Pães de Leite são do tamanho certo para mãos pequenas e fome grande.',
    produtos: [['Mini Pão de Leite', '/pao/']],
    ingredientes: [
      '<b><a href="/pao/">Mini Pão de Leite</a> Quente e Bom</b> — 12 unidades',
      'Fiambre e queijo em fatias',
      'Manteiga ou maionese',
      'Alface (opcional)',
      'Palitos coloridos para segurar',
    ],
    passos: [
      ['Abre', 'Corta os mini pães ao meio sem separar totalmente as metades.'],
      ['Barra', 'Barra o interior com manteiga ou maionese.'],
      ['Recheia', 'Dobra as fatias de fiambre e queijo para caberem direitinhas, junta a alface.'],
      ['Espeta e serve', 'Fecha com um palito colorido e monta a torre na travessa. Sucesso garantido!'],
    ],
    dicaBento: 'Varia os recheios: ovo com maionese, atum, frango desfiado — e ninguém fica de fora. 🥖',
  },
  {
    slug: 'tostas-gourmet', titulo: 'Tostas Gourmet de Queijo e Compota',
    img: '/assets/img/rec_tostas.jpg',
    tempo: '10 min', dif: 'Fácil', rende: '2 pessoas',
    intro: 'Uma entrada elegante em 10 minutos: tostas multicereais, queijo a derreter, compota e o crocante das nozes.',
    produtos: [['Tostas Multicereais', '/tostas/'], ['Nozes', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/tostas/">Tostas Multicereais</a> Quente e Bom</b> — 8 unidades',
      'Queijo (da tua preferência) — 8 fatias finas',
      'Compota de figo ou frutos vermelhos',
      '<b><a href="/ingredientes/">Nozes</a> Quente e Bom</b> — um punhado, picadas',
      'Um fio de mel',
    ],
    passos: [
      ['Monta', 'Dispõe as tostas num tabuleiro e cobre cada uma com uma fatia de queijo.'],
      ['Gratina', 'Leva ao forno quente 3–4 minutos, só até o queijo amolecer.'],
      ['Cobre', 'Coloca uma colherzinha de compota por cima de cada tosta.'],
      ['Finaliza', 'Polvilha com as nozes picadas e rega com um fio de mel. Serve morno.'],
    ],
    dicaBento: 'Também resulta com as Tostas de Alfarroba — o toque doce delas com queijo é qualquer coisa! 😋',
  },
  {
    slug: 'bolo-de-caramelo-com-nozes', titulo: 'Bolo de Caramelo com Nozes',
    img: '/assets/img/rec_caramelonozes.jpg',
    tempo: '50 min', dif: 'Fácil', rende: '10 fatias',
    intro: 'Doce de caramelo em forma de bolo, coroado com nozes tostadas. Atenção ao detalhe da ficha: o Cake Caramelo leva 125 g de óleo — menos que os irmãos.',
    produtos: [['Cake Caramelo', '/cakes/'], ['Nozes', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/cakes/">Cake Caramelo</a> Quente e Bom</b> — 1 embalagem (500 g)',
      'Óleo vegetal — 125 g',
      '3 ovos (±125 g)',
      'Água — 125 g',
      '<b><a href="/ingredientes/">Nozes</a> Quente e Bom</b> — 80 g (metade na massa, metade por cima)',
    ],
    passos: [
      ['Bate a massa', 'Junta o preparado, o óleo, os ovos e a água. Bate com varas 5 minutos em velocidade moderada.'],
      ['Junta as nozes', 'Envolve metade das nozes picadas na massa com uma espátula.'],
      ['Coze', 'Verte numa forma untada, espalha as restantes nozes por cima e leva ao forno a 180 °C até o palito sair seco.'],
      ['Serve', 'Fatias douradas com nozes crocantes — o café da tarde agradece. 🥜'],
    ],
    dicaBento: 'Nozes por cima afundam? Passa-as por um pouco de preparado seco antes de as espalhar — ficam à tona. ☀️',
  },
  {
    slug: 'queques-com-coracao-de-chocolate-branco', titulo: 'Queques com Coração de Chocolate Branco',
    img: '/assets/img/rec_coracaobranco.jpg',
    tempo: '35 min', dif: 'Média', rende: '~12 queques',
    intro: 'Por fora, queque de chocolate. Por dentro… surpresa! Um coração de chocolate branco que derrete à primeira colherada.',
    produtos: [['Cake Chocolate', '/cakes/'], ['Chocolate Branco 30%', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/cakes/">Cake Chocolate</a> Quente e Bom</b> — 1 embalagem (500 g)',
      'Óleo vegetal — 150 g',
      '3 ovos (±150 g)',
      'Água — 115 g',
      '<b><a href="/ingredientes/">Chocolate Branco 30% Cacau</a> Quente e Bom</b> — 12 quadrados generosos',
    ],
    passos: [
      ['Bate a massa', 'Junta o preparado, o óleo, os ovos e a água. Bate com varas 5 minutos em velocidade moderada.'],
      ['Esconde o coração', 'Enche as forminhas até 1/3, coloca um quadrado de chocolate branco no centro e cobre com mais massa até 2/3.'],
      ['Coze', 'Forno a 180 °C, 18–20 minutos. O exterior firma, o coração derrete.'],
      ['Serve morno', 'É morno que a magia acontece — o centro escorre como lava branca. 🤍'],
    ],
    dicaBento: 'Serve 10 minutos depois de saírem do forno: nem a escaldar, nem frios — no ponto do coração derretido. ☀️',
  },
  {
    slug: 'torta-de-chocolate-com-chantilly', titulo: 'Torta de Chocolate com Chantilly',
    img: '/assets/img/rec_torta.jpg',
    tempo: '1h', dif: 'Média', rende: '10 fatias',
    intro: 'O Pão de Ló Chocolate foi feito para enrolar: 7 ovos, massa flexível e fofa, recheio de chantilly fresco. Uma espiral que rouba olhares na mesa.',
    produtos: [['Pão de Ló Chocolate', '/cakes/'], ['Chantilly em Pó', '/ingredientes/'], ['Cacau em Pó', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/cakes/">Pão de Ló Chocolate</a> Quente e Bom</b> — 1 embalagem (500 g)',
      '7 ovos (±350 g)',
      'Água — 90 g',
      '<b><a href="/ingredientes/">Chantilly em Pó</a> Quente e Bom</b> — 200 g + 330 g de leite bem frio',
      '<b><a href="/ingredientes/">Cacau em Pó</a> Quente e Bom</b> — para polvilhar',
    ],
    passos: [
      ['Bate', 'Junta o preparado, os 7 ovos e a água. Bate 7 a 10 minutos na velocidade máxima até triplicar de volume.'],
      ['Coze fino', 'Espalha num tabuleiro forrado com papel vegetal (camada fina) e coze a 180 °C cerca de 10–12 minutos.'],
      ['Enrola quente', 'Vira sobre um pano polvilhado com açúcar e enrola AINDA QUENTE com o pano. Deixa arrefecer enrolado.'],
      ['Recheia', 'Bate o chantilly com o leite frio 4–5 minutos na máxima. Desenrola a torta, barra, volta a enrolar e polvilha com cacau. 🍫'],
    ],
    dicaBento: 'O segredo da torta que não parte: enrolar quente com o pano e deixar "aprender" a forma antes de rechear. ☀️',
  },
  {
    slug: 'trufas-de-chocolate-branco-e-coco', titulo: 'Trufas de Chocolate Branco e Coco',
    img: '/assets/img/rec_trufasbrancas.jpg',
    tempo: '25 min + 2h frio', dif: 'Fácil', rende: '~20 unidades',
    intro: 'Cremosas por dentro, nevadas por fora. Chocolate Branco 30% e Coco Ralado — duas estrelas dos nossos Ingredientes numa trufa elegante.',
    produtos: [['Chocolate Branco 30%', '/ingredientes/'], ['Coco Ralado', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/ingredientes/">Chocolate Branco 30% Cacau</a> Quente e Bom</b> — 200 g',
      '80 ml de natas',
      '1 colher de sopa de manteiga',
      '<b><a href="/ingredientes/">Coco Ralado</a> Quente e Bom</b> — 60 g + extra para envolver',
    ],
    passos: [
      ['Ganache', 'Aquece as natas (sem ferver) e verte sobre o chocolate branco picado com a manteiga. Mexe até ficar liso.'],
      ['Junta o coco', 'Envolve os 60 g de coco ralado e leva ao frio 2 horas, até firmar.'],
      ['Enrola', 'Faz bolinhas com as mãos frias (passa-as por água fria e seca-as).'],
      ['Veste de neve', 'Rola no coco ralado extra e guarda no frio até servir. Elegância pura. 🤍🥥'],
    ],
    dicaBento: 'Chocolate branco é sensível: natas quentes, nunca a ferver — senão a ganache talha. ☀️',
  },
  {
    slug: 'copos-de-creme-com-fruta', titulo: 'Copos de Creme de Pasteleiro com Fruta',
    img: '/assets/img/rec_coposcreme.jpg',
    tempo: '20 min + repouso', dif: 'Fácil', rende: '6 copos',
    intro: 'A sobremesa expresso da pastelaria: creme de pasteleiro feito a frio em minutos (sim, a frio!), fruta fresca e amêndoa tostada por cima.',
    produtos: [['Creme de Pasteleiro', '/ingredientes/'], ['Amêndoa Laminada', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/ingredientes/">Creme de Pasteleiro</a> Quente e Bom</b> — 100 g',
      'Açúcar — 100 g',
      'Água fria — 300 g',
      'Fruta fresca (manga, banana, o que houver) — 2 chávenas em cubos',
      '<b><a href="/ingredientes/">Amêndoa Laminada</a> Quente e Bom</b> — 40 g, tostada',
    ],
    passos: [
      ['Creme a frio', 'Mistura o Creme de Pasteleiro com o açúcar. Junta à água fria e bate com varas até ficar homogéneo e sedoso.'],
      ['Repousa', 'Deixa o creme repousar uns minutos — a ficha técnica manda, e ela sabe.'],
      ['Monta camadas', 'Nos copos: camada de fruta, camada de creme, mais fruta, mais creme.'],
      ['Coroa', 'Termina com a amêndoa laminada tostada. Frio, fresco e pronto em 20 minutos. 🥭'],
    ],
    dicaBento: 'Sem forno, sem fogão — este creme faz-se A FRIO. É a sobremesa de emergência do Chef. ☀️',
  },
  {
    slug: 'panados-crocantes', titulo: 'Panados Crocantes de Frango',
    img: '/assets/img/rec_panados.jpg',
    tempo: '30 min', dif: 'Fácil', rende: '4 pessoas',
    intro: 'Sim, os nossos Ingredientes também brilham no salgado! O segredo dos panados dourados e estaladiços é um Pão Ralado fino e uniforme.',
    produtos: [['Pão Ralado', '/ingredientes/']],
    ingredientes: [
      'Bifes finos de frango — 8 unidades',
      '2 ovos batidos',
      'Farinha — 1 chávena',
      '<b><a href="/ingredientes/">Pão Ralado</a> Quente e Bom</b> — 2 chávenas',
      'Sal, pimenta e limão',
      'Óleo para fritar',
    ],
    passos: [
      ['Tempera', 'Tempera os bifes com sal, pimenta e umas gotas de limão. Deixa tomar gosto 10 minutos.'],
      ['Empana', 'Passa cada bife por farinha, depois ovo batido e por fim pelo Pão Ralado, pressionando bem.'],
      ['Frita', 'Óleo quente (mas não a fumegar), 2–3 minutos de cada lado até dourar.'],
      ['Escorre e serve', 'Papel absorvente, rodela de limão e uma salada fresca. Crocante que se ouve! 🍗'],
    ],
    dicaBento: 'Dupla crosta para dias especiais: repete ovo + pão ralado uma segunda vez. Crocância a dobrar. ☀️',
  },
  {
    slug: 'mousse-de-chocolate-branco', titulo: 'Mousse de Chocolate Branco',
    img: '/assets/img/rec_moussebranca.jpg',
    tempo: '20 min + 3h frio', dif: 'Fácil', rende: '6 taças',
    intro: 'Sedosa, elegante e surpreendentemente fácil: o truque é usar o nosso Chantilly em Pó como base da mousse — fica firme, leve e pronta a impressionar.',
    produtos: [['Chocolate Branco 30%', '/ingredientes/'], ['Chantilly em Pó', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/ingredientes/">Chocolate Branco 30% Cacau</a> Quente e Bom</b> — 200 g',
      '<b><a href="/ingredientes/">Chantilly em Pó</a> Quente e Bom</b> — 200 g',
      'Leite bem frio — 330 g',
      'Raspas de lima ou frutos vermelhos para decorar (opcional)',
    ],
    passos: [
      ['Derrete', 'Derrete o chocolate branco em banho-maria, em lume brando, e deixa amornar (não pode estar quente).'],
      ['Bate o chantilly', 'Bate o Chantilly em Pó com o leite bem frio 4–5 minutos na velocidade máxima, até firme.'],
      ['Envolve', 'Junta o chocolate morno ao chantilly em 3 vezes, envolvendo com suavidade de baixo para cima.'],
      ['Refrigera', 'Divide por taças e leva ao frio 3 horas. Decora com raspas de chocolate branco e serve. 🤍'],
    ],
    dicaBento: 'Chocolate morno, nunca quente — senão derrete o chantilly e a mousse abate. Paciência de Chef! ☀️',
  },
  {
    slug: 'bolo-de-bolacha-com-cafe', titulo: 'Bolo de Bolacha com Café',
    img: '/assets/img/rec_bolobolacha.jpg',
    tempo: '30 min + 4h frio', dif: 'Fácil', rende: '10 fatias',
    intro: 'O clássico das avós em versão Quente e Bom: camadas de Línguas de Veado molhadas em café, com creme de manteiga. Sem forno e com fila para repetir.',
    produtos: [['Línguas de Veado', '/biscoitos/'], ['Açúcar em Pó', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/biscoitos/">Línguas de Veado</a> Quente e Bom</b> — 2 embalagens',
      '250 g de manteiga amolecida',
      '<b><a href="/ingredientes/">Açúcar em Pó</a> Quente e Bom</b> — 200 g',
      '1 chávena grande de café forte, frio',
      'Café ou cacau para polvilhar',
    ],
    passos: [
      ['Creme', 'Bate a manteiga com o açúcar em pó até obteres um creme fofo e claro (±5 minutos).'],
      ['Molha', 'Passa cada Língua de Veado rapidamente pelo café frio — molhar e tirar, sem encharcar.'],
      ['Monta', 'Alterna camadas de biscoito e creme num prato, terminando com creme. Reserva uns biscoitos para esmigalhar por cima.'],
      ['Frio', 'Frigorífico no mínimo 4 horas (de véspera é ainda melhor). Polvilha e corta. ☕'],
    ],
    dicaBento: 'As Línguas de Veado são finas e absorvem depressa — um mergulho de 1 segundo chega! ☀️',
  },
  {
    slug: 'cheesecake-de-limao-sem-forno', titulo: 'Cheesecake de Limão Sem Forno',
    img: '/assets/img/rec_cheesecake.jpg',
    tempo: '30 min + 6h frio', dif: 'Média', rende: '10 fatias',
    intro: 'Base crocante de Biscoitos de Limão, recheio cremoso com chantilly — um cheesecake fresco que não precisa de forno nem de sorte.',
    produtos: [['Biscoitos de Limão', '/biscoitos/'], ['Chantilly em Pó', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/biscoitos/">Biscoitos de Limão</a> Quente e Bom</b> — 250 g (1 embalagem), triturados',
      '100 g de manteiga derretida',
      '400 g de queijo creme',
      '<b><a href="/ingredientes/">Chantilly em Pó</a> Quente e Bom</b> — 100 g + 165 g de leite frio',
      'Sumo e raspa de 2 limões',
      '4 colheres de sopa de açúcar',
    ],
    passos: [
      ['Base', 'Mistura os biscoitos triturados com a manteiga derretida e calca no fundo de uma forma de fundo amovível. Frio 15 minutos.'],
      ['Chantilly', 'Bate o Chantilly em Pó com o leite frio até ficar firme.'],
      ['Recheio', 'Bate o queijo creme com o açúcar, o sumo e a raspa de limão. Envolve o chantilly com suavidade.'],
      ['Frio', 'Verte sobre a base, alisa e leva ao frio 6 horas. Decora com raspa de limão. 🍋'],
    ],
    dicaBento: 'A base fica mais firme se calcares com o fundo de um copo. E o limão dos nossos biscoitos duplica o aroma! ☀️',
  },
  {
    slug: 'pudim-de-pao-com-sultanas', titulo: 'Pudim de Pão com Sultanas',
    img: '/assets/img/rec_pudimpao.jpg',
    tempo: '1h10', dif: 'Fácil', rende: '8 porções',
    intro: 'A receita de aproveitamento mais deliciosa do mundo: o pão de forma de ontem transforma-se num pudim dourado com sultanas. Nada se perde, tudo se saboreia.',
    produtos: [['Pão de Forma Simples', '/pao/'], ['Sultanas', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/pao/">Pão de Forma Simples</a> Quente e Bom</b> — 8 fatias (pode ser do dia anterior)',
      '4 ovos',
      '750 ml de leite quente',
      '150 g de açúcar + 100 g para o caramelo',
      '<b><a href="/ingredientes/">Sultanas</a> Quente e Bom</b> — 80 g',
      '1 colher de chá de canela (opcional)',
    ],
    passos: [
      ['Carameliza', 'Derrete os 100 g de açúcar até dourar e forra o fundo da forma com o caramelo.'],
      ['Demolha', 'Parte o pão em pedaços e demolha no leite quente 10 minutos. Esmaga com um garfo.'],
      ['Mistura', 'Junta os ovos batidos, o açúcar, a canela e as sultanas. Envolve bem e verte na forma.'],
      ['Coze', 'Banho-maria no forno a 180 °C cerca de 50 minutos. Arrefece por completo antes de desenformar. 🍮'],
    ],
    dicaBento: 'Pão do dia anterior absorve melhor — este pudim é a segunda vida perfeita do pão de forma. ☀️',
  },
  {
    slug: 'tarte-de-chocolate-com-palmiers', titulo: 'Tarte de Chocolate com Base de Palmiers',
    img: '/assets/img/rec_tartepalmiers.jpg',
    tempo: '30 min + 4h frio', dif: 'Média', rende: '10 fatias',
    intro: 'Os Palmiers caramelizados fazem a base de tarte mais crocante que já provaste — e a ganache de Chocolate de Leite faz o resto. Sem forno.',
    produtos: [['Biscoitos Palmiers', '/biscoitos/'], ['Chocolate de Leite 34%', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/biscoitos/">Biscoitos Palmiers</a> Quente e Bom</b> — 250 g, triturados',
      '90 g de manteiga derretida',
      '<b><a href="/ingredientes/">Chocolate de Leite 34% Cacau</a> Quente e Bom</b> — 300 g',
      '200 ml de natas',
      'Flor de sal (uma pitada, opcional)',
    ],
    passos: [
      ['Base', 'Mistura os palmiers triturados com a manteiga e calca no fundo e bordas de uma tarteira. Frio 20 minutos.'],
      ['Ganache', 'Aquece as natas (sem ferver) e verte sobre o chocolate picado. Espera 1 minuto e mexe até brilhar.'],
      ['Enche', 'Verte a ganache sobre a base fria e alisa.'],
      ['Frio', 'Frigorífico 4 horas. Uma pitada de flor de sal por cima antes de servir muda tudo. 🍫'],
    ],
    dicaBento: 'O caramelo dos palmiers já traz doçura — por isso a ganache leva só chocolate e natas. Equilíbrio de Chef. ☀️',
  },
  {
    slug: 'bolo-de-caneca-de-chocolate', titulo: 'Bolo de Caneca de Chocolate',
    img: '/assets/img/rec_caneca.jpg',
    tempo: '5 min', dif: 'Fácil', rende: '1 caneca feliz',
    intro: 'A emergência doce resolvida em 5 minutos: uma caneca, umas colheres do nosso Cake Chocolate e o micro-ondas faz a magia. Perigosamente fácil.',
    produtos: [['Cake Chocolate', '/cakes/']],
    ingredientes: [
      '<b><a href="/cakes/">Cake Chocolate</a> Quente e Bom</b> — 5 colheres de sopa (±100 g)',
      '1 ovo pequeno',
      '2 colheres de sopa de óleo',
      '2 colheres de sopa de água',
      'Uma bola de gelado para coroar (opcional mas recomendado)',
    ],
    passos: [
      ['Mistura na caneca', 'Junta tudo numa caneca grande e mexe bem com um garfo até ficar homogéneo.'],
      ['Micro-ondas', 'Leva ao micro-ondas 90 segundos na potência máxima. O bolo cresce — não te assustes!'],
      ['Testa', 'Se o topo ainda estiver húmido, mais 15 segundos.'],
      ['Coroa', 'Uma bola de gelado por cima e uma colher. Felicidade instantânea. ⚡'],
    ],
    dicaBento: 'Enche a caneca só até metade — o bolo sobe a dobrar no micro-ondas! ☀️',
  },
  {
    slug: 'espetadas-de-fruta-com-fondue', titulo: 'Espetadas de Fruta com Fondue de Chocolate',
    img: '/assets/img/rec_fondue.jpg',
    tempo: '15 min', dif: 'Fácil', rende: 'a festa toda',
    intro: 'A sobremesa mais divertida da mesa: fruta em espetadas e um potinho de Chocolate de Leite derretido para mergulhar. As crianças fazem fila.',
    produtos: [['Chocolate de Leite 34%', '/ingredientes/'], ['Coco Ralado', '/ingredientes/']],
    ingredientes: [
      '<b><a href="/ingredientes/">Chocolate de Leite 34% Cacau</a> Quente e Bom</b> — 200 g',
      '3 colheres de sopa de leite',
      'Fruta variada em cubos: banana, manga, morango, ananás…',
      '<b><a href="/ingredientes/">Coco Ralado</a> Quente e Bom</b> — para polvilhar',
      'Palitos de espetada',
    ],
    passos: [
      ['Espeta', 'Monta as espetadas alternando as frutas — as crianças adoram ajudar nesta parte.'],
      ['Derrete', 'Derrete o chocolate com o leite em banho-maria, mexendo até ficar brilhante e fluido.'],
      ['Mergulha', 'Cada um mergulha a sua espetada no chocolate quente…'],
      ['Polvilha', '…e passa pelo coco ralado. Riso garantido à volta da mesa. 🍓🍫'],
    ],
    dicaBento: 'Banana e morango são os campeões do fondue. E fruta fria + chocolate quente = contraste perfeito. ☀️',
  },
  {
    slug: 'panquecas-fofas', titulo: 'Panquecas Fofas de Domingo',
    img: '/assets/img/rec_panquecas.jpg',
    tempo: '25 min', dif: 'Fácil', rende: '±10 panquecas',
    intro: 'Altas, fofas e douradas — o segredo das panquecas de sonho é o nosso Fermento em Pó, que as faz crescer como almofadas.',
    produtos: [['Fermento em Pó', '/ingredientes/'], ['Açúcar em Pó', '/ingredientes/']],
    ingredientes: [
      '250 g de farinha de trigo',
      '<b><a href="/ingredientes/">Fermento em Pó para Bolos</a> Quente e Bom</b> — 1 colher de sopa',
      '2 colheres de sopa de açúcar e uma pitada de sal',
      '2 ovos',
      '300 ml de leite',
      '30 g de manteiga derretida',
      '<b><a href="/ingredientes/">Açúcar em Pó</a> Quente e Bom</b> — para polvilhar · mel para regar',
    ],
    passos: [
      ['Mistura', 'Envolve os secos numa taça. Noutra, bate os ovos com o leite e a manteiga. Junta tudo SEM bater de mais — grumos pequenos são bons!'],
      ['Descansa', 'Deixa a massa repousar 10 minutos — o fermento começa a trabalhar.'],
      ['Doura', 'Frigideira antiaderente em lume médio: verte meia concha, espera pelas bolhinhas, vira e doura o outro lado.'],
      ['Serve', 'Empilha bem alto, polvilha com açúcar em pó e rega com mel. Domingo perfeito. 🥞'],
    ],
    dicaBento: 'Não esmagues as panquecas com a espátula ao virar — o ar lá dentro é o segredo da fofura! ☀️',
  },
  {
    slug: 'gelado-de-banana-e-chocolate', titulo: 'Gelado de Banana e Chocolate',
    img: '/assets/img/rec_gelado.jpg',
    tempo: '10 min + congelação', dif: 'Muito fácil', rende: '4 taças',
    intro: 'Gelado cremoso feito em casa, sem máquina e sem natas — só bananas maduras, o nosso Chocolate Negro e um toque crocante de caju. O truque preferido do Chef para os dias de calor.',
    produtos: [['Chocolate Negro 70%', '/ingredientes/'], ['Caju Torrado', '/snacks/']],
    ingredientes: [
      '4 bananas bem maduras, em rodelas',
      '<b><a href="/ingredientes/">Chocolate Negro 70% Cacau</a> Quente e Bom</b> — 100 g, derretido',
      '2–3 colheres de sopa de leite (se precisares de cremosidade)',
      '<b><a href="/snacks/">Caju Torrado</a> Quente e Bom</b> — picado, para polvilhar',
    ],
    passos: [
      ['Congela', 'Espalha as rodelas de banana num tabuleiro e leva ao congelador pelo menos 4 horas (ou de véspera).'],
      ['Bate', 'Tritura a banana congelada no processador. Primeiro fica granulada — insiste 2–3 minutos, raspando as bordas, até virar um creme de gelado. Se precisar, junta o leite.'],
      ['Rega', 'Serve em taças e rega com o chocolate derretido em fio — sobre o gelado frio, cria uma casquinha estaladiça.'],
      ['Polvilha', 'Termina com o caju picado por cima. Serve logo, cremoso, ou leva 1 hora ao congelador para ficar mais firme. 🍌🍫'],
    ],
    dicaBento: 'Quanto mais madura a banana (bem pintadinha!), mais doce e cremoso fica o gelado — sem juntar açúcar nenhum. ☀️',
  },
  {
    slug: 'tosta-mista-de-domingo', titulo: 'Tosta Mista de Domingo',
    img: '/assets/img/rec_tostamista.jpg',
    tempo: '10 min', dif: 'Muito fácil', rende: '2 tostas',
    intro: 'O clássico que nunca falha: fiambre, queijo a derreter e o nosso Pão de Forma Simples dourado na frigideira. O segredo está em onde pões a manteiga.',
    produtos: [['Pão de Forma Simples', '/pao/']],
    ingredientes: [
      '<b><a href="/pao/">Pão de Forma Simples</a> Quente e Bom</b> — 4 fatias',
      '4 fatias de queijo flamengo',
      '4 fatias de fiambre',
      'Manteiga q.b.',
    ],
    passos: [
      ['Monta', 'Em cada sandes: queijo, fiambre e queijo outra vez — assim o queijo derretido "cola" tudo.'],
      ['Barra', 'Barra a manteiga por FORA das fatias, não por dentro. É este o truque da crosta dourada.'],
      ['Doura', 'Frigideira em lume médio (ou sanduicheira): 2–3 minutos de cada lado, pressionando levemente com a espátula.'],
      ['Serve', 'Corta na diagonal e serve a puxar o fio de queijo. Domingo resolvido. 🧀'],
    ],
    dicaBento: 'Lume médio, nunca forte — dá tempo ao queijo de derreter antes de o pão queimar. ☀️',
  },
  {
    slug: 'club-sandwich-quente-e-bom', titulo: 'Club Sandwich Quente e Bom',
    img: '/assets/img/rec_club.jpg',
    tempo: '25 min', dif: 'Fácil', rende: '2 sandes altas',
    intro: 'A sandes de hotel de 5 estrelas, feita em casa: três andares do nosso pão Especial Torradas e Tostas, bem tostado, com frango, bacon, ovo e tudo a que tens direito.',
    produtos: [['Especial Torradas e Tostas', '/pao/']],
    ingredientes: [
      '<b><a href="/pao/">Pão Especial Torradas e Tostas</a> Quente e Bom</b> — 6 fatias',
      '1 peito de frango grelhado, em tiras',
      '4 fatias de bacon frito',
      '2 ovos (mexidos ou estrelados bem passados)',
      'Alface, tomate em rodelas e maionese',
    ],
    passos: [
      ['Tosta', 'Tosta bem as 6 fatias — é isto que segura a sandes sem amolecer.'],
      ['Grelha', 'Grelha o frango e frita o bacon até estaladiço.'],
      ['Empilha', 'Andar 1: maionese, alface, frango. Fatia tostada. Andar 2: ovo, bacon, tomate. Fecha com a última fatia.'],
      ['Espeta', 'Prende com palitos, corta em triângulos e serve de pé — a altura é metade do espetáculo. 🥪'],
    ],
    dicaBento: 'O nosso pão Especial Torradas foi feito para isto: tosta dourado e não verga com o recheio. ☀️',
  },
  {
    slug: 'sandes-de-frango-e-abacate', titulo: 'Sandes de Frango e Abacate',
    img: '/assets/img/rec_frangoabacate.jpg',
    tempo: '15 min', dif: 'Fácil', rende: '2 sandes',
    intro: 'Fresca, saudável e cheia de energia: frango desfiado, abacate cremoso com limão e o nosso Pão de Forma 9 Cereais, com fibra e proteína na própria fatia.',
    produtos: [['Pão de Forma 9 Cereais', '/pao/']],
    ingredientes: [
      '<b><a href="/pao/">Pão de Forma 9 Cereais</a> Quente e Bom</b> — 4 fatias',
      '1 abacate maduro',
      'Sumo de meio limão, sal e pimenta',
      '1 chávena de frango cozido ou grelhado, desfiado',
      'Folhas verdes (alface ou rúcula)',
    ],
    passos: [
      ['Esmaga', 'Esmaga o abacate com o limão, sal e pimenta — o limão dá frescura e impede que escureça.'],
      ['Barra', 'Barra o creme de abacate generosamente nas 4 fatias.'],
      ['Recheia', 'Distribui o frango desfiado e as folhas verdes.'],
      ['Fecha', 'Fecha, corta ao meio e leva para onde o dia te levar. 🥑'],
    ],
    dicaBento: 'Abacate angolano bem maduro cede ao toque — se ainda está rijo, embrulha-o em papel de jornal um dia ou dois. ☀️',
  },
  {
    slug: 'hamburguer-caseiro-a-angolana', titulo: 'Hambúrguer Caseiro à Angolana',
    img: '/assets/img/rec_hamburguer.jpg',
    tempo: '25 min', dif: 'Fácil', rende: '4 hambúrgueres',
    intro: 'Noite de hambúrgueres em casa, com orgulho local: o nosso Pão de Hambúrguer fofinho, carne suculenta e uma maionese com aquele toque de jindungo. 🌶️',
    produtos: [['Pão de Hambúrguer', '/pao/']],
    ingredientes: [
      '<b><a href="/pao/">Pão de Hambúrguer</a> Quente e Bom</b> — 4 unidades',
      '500 g de carne picada temperada com sal, pimenta e alho',
      '4 fatias de queijo',
      'Alface, tomate e cebola em rodelas',
      'Maionese misturada com jindungo a gosto',
    ],
    passos: [
      ['Molda', 'Forma 4 hambúrgueres um pouco maiores que o pão — encolhem ao grelhar. Faz uma covinha no centro para não incharem.'],
      ['Grelha', 'Chapa ou frigideira bem quente: 3–4 minutos de cada lado, queijo por cima no último minuto.'],
      ['Aquece', 'Abre os pães e aquece-os na chapa 30 segundos, com o corte para baixo — faz toda a diferença.'],
      ['Monta', 'Maionese de jindungo na base, alface, hambúrguer com queijo, tomate e cebola. Fecha e ataca. 🍔'],
    ],
    dicaBento: 'Não esmagues o hambúrguer na chapa! O suco que sai é o sabor que perdes. ☀️',
  },
  {
    slug: 'brioche-com-ovo-estrelado', titulo: 'Brioche com Ovo Estrelado',
    img: '/assets/img/rec_briocheovo.jpg',
    tempo: '10 min', dif: 'Muito fácil', rende: '2 fatias',
    intro: 'Doce com salgado é a combinação dos deuses: o nosso Pão de Forma Brioche tostado, um ovo estrelado com a gema a escorrer e o pequeno-almoço vira acontecimento.',
    produtos: [['Pão de Forma Brioche', '/pao/']],
    ingredientes: [
      '<b><a href="/pao/">Pão de Forma Brioche</a> Quente e Bom</b> — 2 fatias grossas',
      '2 ovos',
      'Manteiga q.b.',
      'Sal, pimenta e cebolinho picado (se tiveres)',
    ],
    passos: [
      ['Tosta', 'Tosta as fatias de brioche com um véu de manteiga até ficarem douradas.'],
      ['Estrela', 'Estrela os ovos em lume brando com a gema mole — clara cozida, gema líquida.'],
      ['Assenta', 'Ovo em cima da fatia quente, sal, pimenta e cebolinho.'],
      ['Fura', 'Fura a gema à mesa e deixa-a escorrer pelo brioche adocicado. É por isto que se vive. 🍳'],
    ],
    dicaBento: 'Gema mole no brioche adocicado — o contraste doce-salgado que ninguém esquece. Café ao lado, obrigatório. ☀️',
  },
  {
    slug: 'sandes-de-atum-cremoso', titulo: 'Sandes de Atum Cremoso',
    img: '/assets/img/rec_atum.jpg',
    tempo: '10 min', dif: 'Muito fácil', rende: '2–3 sandes',
    intro: 'A sandes oficial da lancheira e dos passeios: atum cremoso com milho no nosso Pão de Forma Integral, cheio de fibra. Pronta em 10 minutos.',
    produtos: [['Pão de Forma Integral', '/pao/']],
    ingredientes: [
      '<b><a href="/pao/">Pão de Forma Integral</a> Quente e Bom</b> — 4 a 6 fatias',
      '2 latas de atum, bem escorrido',
      '3 colheres de sopa de iogurte natural (ou maionese)',
      '4 colheres de sopa de milho doce',
      'Cebola roxa picadinha e pimenta q.b.',
    ],
    passos: [
      ['Mistura', 'Desfaz o atum com o iogurte, o milho, a cebola e a pimenta até ficar cremoso.'],
      ['Prova', 'Prova e ajusta — mais iogurte para cremoso, mais pimenta para carácter.'],
      ['Recheia', 'Barra generosamente entre as fatias de pão integral.'],
      ['Embala', 'Corta ao meio. Na lancheira ou na praia, mantém fresco até à hora de comer. 🐟'],
    ],
    dicaBento: 'Com iogurte em vez de maionese fica mais leve — e aguenta melhor os dias quentes. ☀️',
  },
  {
    slug: 'prego-em-pao-artesanal', titulo: 'Prego em Pão Artesanal',
    img: '/assets/img/rec_prego.jpg',
    tempo: '15 min', dif: 'Fácil', rende: '2 pregos',
    intro: 'O rei das sandes de tacho: bife fino com alho, feito na manteiga, dentro do nosso Pão Artesanal Rústico de crosta estaladiça — com o pão molhado no suco da frigideira, como manda a tradição.',
    produtos: [['Pão Artesanal Rústico', '/pao/']],
    ingredientes: [
      '<b><a href="/pao/">Pão Artesanal Rústico</a> Quente e Bom</b> — 4 fatias grossas',
      '2 bifes finos de vaca',
      '3 dentes de alho esmagados',
      'Manteiga, sal e pimenta',
      'Mostarda q.b.',
    ],
    passos: [
      ['Tempera', 'Tempera os bifes com sal, pimenta e o alho esmagado. Deixa 10 minutos a ganhar sabor.'],
      ['Frita', 'Manteiga em lume forte: 1–2 minutos de cada lado, com os alhos na frigideira.'],
      ['Molha', 'Passa o lado de dentro do pão pelo suco da frigideira — este passo NÃO é opcional. 😄'],
      ['Monta', 'Mostarda, bife, fecha e serve quente. O prego perfeito não pede mais nada. 🥩'],
    ],
    dicaBento: 'Bife fino e frigideira bem quente — o prego quer-se rápido e suculento, nunca cozido. ☀️',
  },
  {
    slug: 'queijo-quente-no-pao-de-centeio', titulo: 'Queijo Quente no Pão de Centeio',
    img: '/assets/img/rec_centeio.jpg',
    tempo: '10 min', dif: 'Muito fácil', rende: '2 sandes',
    intro: 'Sabor de bistro em casa: queijo derretido no nosso Pão Artesanal de Centeio, de sabor profundo, com um fio de mel e orégãos por cima. Sofisticado — e são só 4 ingredientes.',
    produtos: [['Pão Artesanal de Centeio', '/pao/']],
    ingredientes: [
      '<b><a href="/pao/">Pão Artesanal de Centeio</a> Quente e Bom</b> — 4 fatias',
      '150 g de queijo que derreta bem (flamengo ou mistura)',
      'Um fio de mel',
      'Orégãos e manteiga q.b.',
    ],
    passos: [
      ['Monta', 'Queijo generoso entre as fatias de centeio.'],
      ['Doura', 'Manteiga por fora e frigideira em lume médio até o queijo render — 3 minutos de cada lado.'],
      ['Rega', 'Fora do lume, rega com um fio de mel e polvilha com orégãos.'],
      ['Serve', 'Corta e serve a fumegar. Doce, salgado e o carácter do centeio — combinação de bistro. 🧀🍯'],
    ],
    dicaBento: 'O centeio tem personalidade — o mel arredonda-o e o queijo faz as pazes entre os dois. ☀️',
  },
  {
    slug: 'sandes-leve-boa-linha', titulo: 'Sandes Leve Boa Linha',
    img: '/assets/img/rec_boalinha.jpg',
    tempo: '15 min', dif: 'Muito fácil', rende: '2 sandes',
    intro: 'Para quem cuida da linha sem abrir mão do sabor: o nosso Pão de Forma Boa Linha tem MENOS 50% de hidratos de carbono e alto teor de fibra — aqui com frango grelhado e molho fresco de iogurte.',
    produtos: [['Pão de Forma Boa Linha', '/pao/']],
    ingredientes: [
      '<b><a href="/pao/">Pão de Forma Boa Linha</a> Quente e Bom</b> — 4 fatias',
      '1 peito de frango grelhado, em tiras',
      '2 colheres de sopa de iogurte natural + sumo de limão',
      'Alface, cenoura ralada e tomate em rodelas',
      'Sal e pimenta q.b.',
    ],
    passos: [
      ['Grelha', 'Grelha o frango com sal e pimenta e corta em tiras.'],
      ['Mistura', 'Mistura o iogurte com o limão — é o teu molho fresco, sem maionese.'],
      ['Monta', 'Molho nas fatias, depois alface, frango, cenoura e tomate.'],
      ['Leva', 'Fecha e leva — para o treino, o trabalho ou a marmita. Leve como o teu dia devia ser. 💚'],
    ],
    dicaBento: 'O Boa Linha é o único pão da nossa gama com menos 50% de hidratos — a sandes fica saciante e leve ao mesmo tempo. ☀️',
  },
  {
    slug: 'sandes-de-ovo-no-multicereais', titulo: 'Sandes de Ovo no Multicereais',
    img: '/assets/img/rec_ovomulti.jpg',
    tempo: '15 min', dif: 'Muito fácil', rende: '2–3 sandes',
    intro: 'Cremosa por dentro, crocante de sementes por fora: ovo cozido esmagado com mostarda e cebolinho no nosso Pão de Forma Multicereais. Simples, barata e viciante.',
    produtos: [['Pão de Forma Multicereais', '/pao/']],
    ingredientes: [
      '<b><a href="/pao/">Pão de Forma Multicereais</a> Quente e Bom</b> — 4 a 6 fatias',
      '4 ovos',
      '3 colheres de sopa de iogurte natural ou maionese',
      '1 colher de chá de mostarda',
      'Cebolinho picado, sal e pimenta',
    ],
    passos: [
      ['Coze', 'Ovos em água a ferver, 10 minutos exatos. Passa por água fria e descasca.'],
      ['Esmaga', 'Esmaga com o garfo e envolve com o iogurte, a mostarda, o cebolinho, sal e pimenta.'],
      ['Barra', 'Recheia as fatias de multicereais com boa camada de creme de ovo.'],
      ['Serve', 'Corta ao meio — as sementes do pão dão o crocante que esta sandes pedia. 🥚'],
    ],
    dicaBento: '10 minutos exatos de cozedura: gema cozida mas fofa, sem o anel cinzento à volta. ☀️',
  },
];

const DICAS = [
  { ico: '🥖', t: 'O pão NÃO vive no frigorífico', p: 'O frio seca o miolo e acelera o envelhecimento do pão. Guarda-o no <b>saco fechado, em lugar fresco e seco</b> — e no frigorífico só em dias de muito calor e humidade.' },
  { ico: '❄️', t: 'Congela fatia a fatia', p: 'O pão de forma congela lindamente. Vai tirando <b>só as fatias que precisas</b> — 30 segundos na torradeira e ficam como novas.' },
  { ico: '🔥', t: 'Torradas perfeitas', p: 'Para torradas douradas e crocantes, usa o nosso <b>Pão Especial Torradas e Tostas</b> — foi feito para isso. Torradeira bem quente e manteiga no fim, nunca antes.' },
  { ico: '🎒', t: 'Lanche escolar que enche a lancheira de sorrisos', p: 'Combina um <b>Mini Pão de Leite</b> recheado + uma peça de fruta + <b>Biscoitos de Ginguba</b>. Energia boa, sem complicar a manhã.' },
  { ico: '🍫', t: 'Derreter chocolate sem stress', p: 'Sempre em <b>banho-maria e lume brando</b>, mexendo devagar. Se o chocolate ganhar grumos, junta uma colher de chá de óleo vegetal e mexe — volta ao brilho.' },
  { ico: '🍰', t: 'Bolo fofo cresce em paz', p: 'Não abras o forno nos <b>primeiros 25 minutos</b> — a corrente de ar faz o bolo abater. Espreita pela janela do forno, que ele agradece.' },
  { ico: '🥛', t: 'Chantilly firme em minutos', p: 'O truque do nosso <b>Chantilly em Pó</b>: leite bem frio e taça fria (5 minutos no congelador antes). Bate e vê a magia.' },
  { ico: '🥪', t: 'Sandes de festa sem stress', p: 'Prepara as sandes de véspera, cobre com um <b>pano levemente húmido</b> e película, e guarda no frio. No dia, é só servir e receber elogios.' },
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
        <a href="/#historia">A nossa história</a><a href="/receitas/">Receitas</a><a href="/dicas/">Dicas e sugestões</a><a href="/profissional/">Área Profissional</a><a href="/recrutamento/">Carreiras</a><a href="/contacto/">Contactos</a><a href="/#onde">Onde comprar</a>
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

function headHTML(titulo, desc, canon, ogimg) {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titulo}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://quenteebom.com${canon}">
<meta property="og:title" content="${titulo}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="https://quenteebom.com${ogimg}">
<link rel="icon" type="image/png" href="/assets/logos/favicon.png?v=1">
<link rel="stylesheet" href="/assets/css/qeb.css?v=4">`;
}

// ---------- hub de receitas (estilo revista: destaque + pesquisa + filtros) ----------
function hubReceitas() {
  const feat = RECEITAS.find(r => r.slug === DESTAQUE) || RECEITAS[0];
  const chips = CHIPS.map((c, i) => `        <button class="chip${i === 0 ? ' on' : ''}" data-f="${c}">${c}</button>`).join('\n');
  const cards = RECEITAS.filter(r => r.slug !== feat.slug).map(r => {
    const m = META[r.slug] || { cat: 'Receita', tags: [] };
    const q = (r.titulo + ' ' + m.cat + ' ' + r.produtos.map(p => p[0]).join(' ')).toLowerCase();
    return `      <a class="rec-card" href="/receitas/${r.slug}/" data-tags="${m.tags.join('|')}" data-q="${q}">
        <div class="im"><img src="${r.img}" alt="${r.titulo}" loading="lazy"><span class="tempo">⏱ ${r.tempo}</span></div>
        <div class="bd">
          <div class="cat">${m.cat}</div>
          <h3>${r.titulo}</h3>
        </div>
      </a>`;
  }).join('\n');
  const fm = META[feat.slug] || { cat: 'Receita', tags: [] };
  return `<!DOCTYPE html>
<html lang="pt">
<head>
${headHTML('Receitas — Quente e Bom · Feito em Angola', 'Receitas simples e deliciosas com os produtos Quente e Bom — do lanche à festa, o Joaquim ensina.', '/receitas/', '/assets/img/rec_redvelvet.jpg')}
</head>
<body>
${headerHTML()}
<section class="phero" style="min-height:38vh;">
  <img src="/assets/img/dicas_hero.jpg" alt="Receitas Quente e Bom">
  <div class="wrap">
    <div class="eyebrow">Da nossa cozinha para a tua</div>
    <h1>Receitas</h1>
    <p>Simples, deliciosas e com os produtos que já tens em casa. O Joaquim ensina — tu brilhas.</p>
  </div>
</section>
<section class="sec" style="padding-top:56px;">
  <div class="wrap">
    <div class="rec-tools" data-reveal>
      <div class="rec-search"><input type="search" id="recQ" placeholder="Procura por receita ou produto… ex.: chocolate"></div>
      <div class="rec-chips" id="recChips">
${chips}
      </div>
    </div>
    <a class="rec-feat" data-reveal href="/receitas/${feat.slug}/">
      <div class="bd">
        <div class="eyebrow">⭐ Receita em destaque</div>
        <h3>${feat.titulo}</h3>
        <p>${feat.intro}</p>
        <div class="meta"><span class="pill">⏱ ${feat.tempo}</span><span class="pill">${feat.dif}</span><span class="pill">${fm.cat}</span></div>
      </div>
      <div class="im"><img src="${feat.img}" alt="${feat.titulo}"></div>
    </a>
    <div class="rec-grid" id="recGrid">
${cards}
    </div>
    <div class="rec-none" id="recNone">Nenhuma receita encontrada… mas o Joaquim aceita sugestões! 🧡</div>
  </div>
</section>
${footerHTML()}
<script src="/assets/js/site.js?v=4"></script>
<script src="/assets/js/bento.js?v=5"></script>
<script>
(function(){
  var q='', f='Todas';
  var cards=[].slice.call(document.querySelectorAll('#recGrid .rec-card'));
  function apply(){
    var vis=0;
    cards.forEach(function(c){
      var okF = (f==='Todas') || (c.getAttribute('data-tags')||'').split('|').indexOf(f)>-1;
      var okQ = !q || (c.getAttribute('data-q')||'').indexOf(q)>-1;
      var show = okF && okQ;
      c.classList.toggle('hide', !show);
      if(show) vis++;
    });
    document.getElementById('recNone').style.display = vis ? 'none' : 'block';
  }
  document.getElementById('recQ').addEventListener('input', function(){ q=this.value.trim().toLowerCase(); apply(); });
  document.querySelectorAll('#recChips .chip').forEach(function(ch){
    ch.addEventListener('click', function(){
      document.querySelectorAll('#recChips .chip').forEach(function(x){ x.classList.remove('on'); });
      ch.classList.add('on'); f=ch.getAttribute('data-f'); apply();
    });
  });
})();
</script>
</body>
</html>
`;
}

// ---------- página de receita ----------
function pagReceita(r) {
  const ings = r.ingredientes.map(i => `        <li>${i}</li>`).join('\n');
  const passos = r.passos.map(([t, p]) => `        <li><h4>${t}</h4><p>${p}</p></li>`).join('\n');
  return `<!DOCTYPE html>
<html lang="pt">
<head>
${headHTML(`${r.titulo} — Receitas Quente e Bom`, r.intro, `/receitas/${r.slug}/`, r.img)}
</head>
<body>
${headerHTML()}
<section class="rec-head">
  <div class="wrap">
    <div>
      <div class="eyebrow">Receitas · ${(META[r.slug] || {}).cat || 'Receita'}</div>
      <h1>${r.titulo}</h1>
      <p>${r.intro}</p>
      <div class="meta"><span class="pill">⏱ ${r.tempo}</span><span class="pill">${r.dif}</span><span class="pill">🍽 ${r.rende}</span></div>
    </div>
    <div class="im"><img src="${r.img}" alt="${r.titulo}"></div>
  </div>
</section>
<section class="sec">
  <div class="wrap rec-layout">
    <div>
      <div class="ing-card" data-reveal>
        <h3>Ingredientes</h3>
        <ul>
${ings}
        </ul>
        <div class="meta" style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
          <span class="pill">⏱ ${r.tempo}</span><span class="pill">${r.dif}</span><span class="pill">🍽 ${r.rende}</span>
        </div>
      </div>
    </div>
    <div data-reveal>
      <ol class="steps">
${passos}
      </ol>
      <div class="bento-tip">
        <img src="/assets/img/bento_face.jpg" alt="Joaquim">
        <div><b>Dica do Joaquim</b><p>${r.dicaBento}</p></div>
      </div>
      <div style="margin-top:34px;"><a class="btn btn-orange" href="/receitas/">← Mais receitas</a></div>
    </div>
  </div>
</section>
${footerHTML()}
<script src="/assets/js/site.js?v=4"></script>
<script src="/assets/js/bento.js?v=5"></script>
</body>
</html>
`;
}

// ---------- página de dicas ----------
function pagDicas() {
  const cards = DICAS.map(d => `      <div class="dica" data-reveal>
        <div class="ico">${d.ico}</div>
        <h3>${d.t}</h3>
        <p>${d.p}</p>
      </div>`).join('\n');
  return `<!DOCTYPE html>
<html lang="pt">
<head>
${headHTML('Dicas e Sugestões — Quente e Bom', 'Os truques do Joaquim para pão sempre fresco, torradas perfeitas, bolos fofos e lanches felizes.', '/dicas/', '/assets/img/dicas_hero.jpg')}
</head>
<body>
${headerHTML()}
<section class="phero" style="min-height:46vh;">
  <img src="/assets/img/dicas_hero.jpg" alt="Dicas Quente e Bom">
  <div class="wrap">
    <div class="eyebrow">Os truques do Chef</div>
    <h1>Dicas e Sugestões</h1>
    <p>Pequenos segredos que fazem grande diferença — do pão sempre fresco ao bolo que cresce direito.</p>
  </div>
</section>
<section class="sec">
  <div class="wrap">
    <div class="dicas-grid">
${cards}
    </div>
    <div class="bento-tip" style="margin-top:40px;" data-reveal>
      <img src="/assets/img/bento_face.jpg" alt="Joaquim">
      <div><b>Tens uma dúvida?</b><p>Pergunta-me! Estou aqui no canto do ecrã, sempre pronto a ajudar. 🧡</p></div>
    </div>
  </div>
</section>
${footerHTML()}
<script src="/assets/js/site.js?v=4"></script>
<script src="/assets/js/bento.js?v=5"></script>
</body>
</html>
`;
}

// ---------- gerar ----------
fs.mkdirSync(path.join(__dirname, 'receitas'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'receitas', 'index.html'), hubReceitas(), 'utf8');
console.log('receitas/index.html — hub com ' + RECEITAS.length + ' receitas');
RECEITAS.forEach(r => {
  const dir = path.join(__dirname, 'receitas', r.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), pagReceita(r), 'utf8');
  console.log(`receitas/${r.slug}/index.html`);
});
fs.mkdirSync(path.join(__dirname, 'dicas'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dicas', 'index.html'), pagDicas(), 'utf8');
console.log('dicas/index.html — ' + DICAS.length + ' dicas');
