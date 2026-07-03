// Gerador de Receitas + Dicas — node _gen-extra.js
// Editar os dados aqui e re-correr; NÃO editar os HTML gerados à mão.
const fs = require('fs');
const path = require('path');

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
    dicaBento: 'Apara as “costas” dos bolos com uma faca de serra para as camadas ficarem direitinhas — e as aparas são do padeiro. 😄',
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
      <a href="/receitas/">Receitas</a>
      <a href="/dicas/">Dicas</a>
      <a href="/revendedores/">Revendedores</a>
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
        <a href="/#historia">A nossa história</a><a href="/receitas/">Receitas</a><a href="/dicas/">Dicas e sugestões</a><a href="/revendedores/">Revendedores</a><a href="/#onde">Onde comprar</a>
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

function headHTML(titulo, desc, canon, ogimg) {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titulo}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="https://www.quenteebom.co.ao${canon}">
<meta property="og:title" content="${titulo}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="https://www.quenteebom.co.ao${ogimg}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%E2%98%80%EF%B8%8F%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="/assets/css/qeb.css">`;
}

// ---------- hub de receitas ----------
function hubReceitas() {
  const cards = RECEITAS.map(r => `      <a class="rec-card" data-reveal href="/receitas/${r.slug}/">
        <div class="im"><img src="${r.img}" alt="${r.titulo}" loading="lazy"></div>
        <div class="bd">
          <h3>${r.titulo}</h3>
          <div class="meta"><span class="pill">⏱ ${r.tempo}</span><span class="pill">${r.dif}</span></div>
        </div>
      </a>`).join('\n');
  return `<!DOCTYPE html>
<html lang="pt">
<head>
${headHTML('Receitas — Quente e Bom · Feito em Angola', 'Receitas simples e deliciosas com os produtos Quente e Bom — do lanche à festa, o Bento ensina.', '/receitas/', '/assets/img/rec_rabanadas.jpg')}
</head>
<body>
${headerHTML()}
<section class="phero">
  <img src="/assets/img/dicas_hero.jpg" alt="Receitas Quente e Bom">
  <div class="wrap">
    <div class="eyebrow">Da nossa cozinha para a tua</div>
    <h1>Receitas</h1>
    <p>Simples, deliciosas e com os produtos que já tens em casa. O Bento ensina — tu brilhas.</p>
  </div>
</section>
<section class="sec">
  <div class="wrap">
    <div class="rec-grid">
${cards}
    </div>
  </div>
</section>
${footerHTML()}
<script src="/assets/js/site.js"></script>
<script src="/assets/js/bento.js"></script>
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
<section class="phero" style="min-height:46vh;">
  <img src="${r.img}" alt="${r.titulo}">
  <div class="wrap">
    <div class="eyebrow">Receita · ${r.dif} · ${r.tempo}</div>
    <h1>${r.titulo}</h1>
    <p>${r.intro}</p>
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
        <img src="/assets/img/bento_face.jpg" alt="Bento">
        <div><b>Dica do Bento</b><p>${r.dicaBento}</p></div>
      </div>
      <div style="margin-top:34px;"><a class="btn btn-orange" href="/receitas/">← Mais receitas</a></div>
    </div>
  </div>
</section>
${footerHTML()}
<script src="/assets/js/site.js"></script>
<script src="/assets/js/bento.js"></script>
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
${headHTML('Dicas e Sugestões — Quente e Bom', 'Os truques do Bento para pão sempre fresco, torradas perfeitas, bolos fofos e lanches felizes.', '/dicas/', '/assets/img/dicas_hero.jpg')}
</head>
<body>
${headerHTML()}
<section class="phero" style="min-height:46vh;">
  <img src="/assets/img/dicas_hero.jpg" alt="Dicas Quente e Bom">
  <div class="wrap">
    <div class="eyebrow">Os truques do padeiro</div>
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
      <img src="/assets/img/bento_face.jpg" alt="Bento">
      <div><b>Tens uma dúvida?</b><p>Pergunta-me! Estou aqui no canto do ecrã, sempre pronto a ajudar. 🧡</p></div>
    </div>
  </div>
</section>
${footerHTML()}
<script src="/assets/js/site.js"></script>
<script src="/assets/js/bento.js"></script>
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
