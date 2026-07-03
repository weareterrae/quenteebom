/* Bento — o padeiro da Quente e Bom (widget partilhado).
   Hoje: fluxo guiado que capta zona+produto e encaminha para o formulário/WhatsApp.
   Amanhã: apontar BENTO_ENDPOINT para a Edge Function (Supabase + Claude) e fica IA a sério. */
(function () {
  var BENTO_ENDPOINT = null; // ex.: 'https://qciagsktkqljvknmahfu.supabase.co/functions/v1/bento-web'

  var root = document.createElement('div');
  root.innerHTML =
    '<button class="bento-btn" id="bentoBtn" aria-label="Falar com o Bento">' +
    '<img src="/assets/img/bento_face.jpg" class="bento-btn-av" alt="">Falar com o Bento</button>' +
    '<div class="bento-panel" id="bentoPanel" role="dialog" aria-label="Conversa com o Bento">' +
    '<div class="bp-head"><div class="bp-av"><img src="/assets/img/bento_face.jpg" alt="Bento"></div>' +
    '<div><b>Bento</b><span>O padeiro · responde na hora</span></div></div>' +
    '<div class="bp-body" id="bpBody">' +
    '<div class="msg bot">Olá! 🧡 Sou o Bento, o padeiro da Quente e Bom. Como te posso ajudar hoje?</div></div>' +
    '<div class="qbtns" id="bpBtns"></div></div>';
  document.body.appendChild(root);

  var panel = document.getElementById('bentoPanel');
  var body = document.getElementById('bpBody');
  var btns = document.getElementById('bpBtns');
  document.getElementById('bentoBtn').addEventListener('click', function () { panel.classList.toggle('open'); });
  window.openBento = function () { panel.classList.add('open'); };

  function bot(html) { body.insertAdjacentHTML('beforeend', '<div class="msg bot">' + html + '</div>'); body.scrollTop = body.scrollHeight; }
  function me(txt) { body.insertAdjacentHTML('beforeend', '<div class="msg me">' + txt + '</div>'); body.scrollTop = body.scrollHeight; }
  function setBtns(list) {
    btns.innerHTML = '';
    list.forEach(function (b) {
      var el = document.createElement('button');
      el.className = 'qbtn'; el.textContent = b.label;
      el.addEventListener('click', function () { me(b.label); setTimeout(b.go, 420); });
      btns.appendChild(el);
    });
  }

  function home() {
    setBtns([
      { label: 'Onde comprar?', go: onde },
      { label: 'Quero ser revendedor', go: revendedor },
      { label: 'Que produtos têm?', go: produtos }
    ]);
  }
  function onde() {
    bot('Boa! 🛒 Estamos em vários supermercados por Angola — a oferta varia de loja para loja. Diz-me a tua <b>zona/província</b> e o produto que procuras, que ajudamos a encontrar o ponto mais perto de ti! ☀️');
    setBtns([
      { label: 'Falar no Instagram', go: function () { bot('Manda-nos DM no Instagram <b>@quenteebom</b> com a tua zona — respondemos rapidinho! 🧡'); window.open('https://www.instagram.com/quenteebom/', '_blank'); home(); } },
      { label: 'Voltar', go: function () { home(); bot('Em que mais posso ajudar? 🧡'); } }
    ]);
  }
  function revendedor() {
    bot('Que bom quereres trabalhar connosco! 🤝 Preparei-te uma página com tudo — preenche o formulário e a nossa equipa comercial fala contigo rapidinho. 🥖');
    setBtns([
      { label: 'Abrir página de revendedores', go: function () { location.href = '/revendedores/'; } },
      { label: 'Voltar', go: function () { home(); bot('Em que mais posso ajudar? 🧡'); } }
    ]);
  }
  function produtos() {
    bot('Temos 7 mundos de sabor: pão fresquinho, cakes, os famosos <b>Bolos da Avó</b>, biscoitos, snacks, tostas e ingredientes para criar em casa. 😋 Qual queres espreitar?');
    setBtns([
      { label: 'Pão', go: function () { location.href = '/pao/'; } },
      { label: 'Bolos da Avó', go: function () { location.href = '/bolos-da-avo/'; } },
      { label: 'Biscoitos', go: function () { location.href = '/biscoitos/'; } },
      { label: 'Ver todos', go: function () { location.href = '/#mundos'; } }
    ]);
  }
  home();
})();
