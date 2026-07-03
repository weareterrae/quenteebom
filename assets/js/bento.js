/* Bento — o Chef da Quente e Bom (widget partilhado).
   Com BENTO_ENDPOINT definido: chat de IA a sério (Supabase Edge Function + Claude).
   Sem endpoint / se falhar: fluxos guiados por botões (fallback). */
(function () {
  var BENTO_ENDPOINT = 'https://qciagsktkqljvknmahfu.supabase.co/functions/v1/bento-web';
  var aiOk = !!BENTO_ENDPOINT; // desliga-se sozinho se a função falhar
  var history = [];

  var root = document.createElement('div');
  root.innerHTML =
    '<button class="bento-btn" id="bentoBtn" aria-label="Falar com o Bento">' +
    '<img src="/assets/img/bento_face.jpg" class="bento-btn-av" alt="">Falar com o Bento</button>' +
    '<div class="bento-panel" id="bentoPanel" role="dialog" aria-label="Conversa com o Bento">' +
    '<div class="bp-head"><div class="bp-av"><img src="/assets/img/bento_face.jpg" alt="Bento"></div>' +
    '<div><b>Bento</b><span>O Chef · responde na hora</span></div></div>' +
    '<div class="bp-body" id="bpBody">' +
    '<div class="msg bot">Olá! 🧡 Sou o Bento, o Chef da Quente e Bom. Como te posso ajudar hoje?</div></div>' +
    '<div class="qbtns" id="bpBtns"></div>' +
    '<div class="bp-input" id="bpInputRow">' +
    '<input type="text" id="bpInput" placeholder="Escreve a tua pergunta…" maxlength="500" autocomplete="off">' +
    '<button id="bpSend" aria-label="Enviar">➤</button></div></div>';
  document.body.appendChild(root);

  // estilos do input (inline para não mexer no css partilhado)
  var st = document.createElement('style');
  st.textContent = '.bp-input{display:flex;gap:8px;padding:12px 14px;background:#fff;border-top:1px solid #eaddc9;}' +
    '.bp-input input{flex:1;border:1.5px solid #eaddc9;border-radius:999px;padding:10px 16px;font-size:14.5px;font-family:inherit;outline:none;background:#FFF6EA;}' +
    '.bp-input input:focus{border-color:#EE7A1B;background:#fff;}' +
    '.bp-input button{width:42px;height:42px;border-radius:50%;border:none;background:#EE7A1B;color:#fff;font-size:16px;cursor:pointer;flex:0 0 auto;transition:.2s;}' +
    '.bp-input button:hover{background:#CC5A08;}' +
    '.msg.typing{color:#8a7157;font-style:italic;background:#fff;border:1px solid #eaddc9;}';
  document.head.appendChild(st);

  var panel = document.getElementById('bentoPanel');
  var body = document.getElementById('bpBody');
  var btns = document.getElementById('bpBtns');
  var input = document.getElementById('bpInput');
  document.getElementById('bentoBtn').addEventListener('click', function () { panel.classList.toggle('open'); if (panel.classList.contains('open')) input.focus(); });
  window.openBento = function () { panel.classList.add('open'); input.focus(); };

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function bot(html) { body.insertAdjacentHTML('beforeend', '<div class="msg bot">' + html + '</div>'); body.scrollTop = body.scrollHeight; }
  function me(txt) { body.insertAdjacentHTML('beforeend', '<div class="msg me">' + esc(txt) + '</div>'); body.scrollTop = body.scrollHeight; }

  // ---------- IA ----------
  function sendAI(text) {
    me(text);
    history.push({ role: 'user', content: text });
    var typing = document.createElement('div');
    typing.className = 'msg bot typing';
    typing.textContent = 'O Bento está a escrever…';
    body.appendChild(typing); body.scrollTop = body.scrollHeight;

    fetch(BENTO_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: history })
    })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        typing.remove();
        var reply = d.reply || 'Hmm, não percebi — podes repetir? 🧡';
        history.push({ role: 'assistant', content: reply });
        // markdown leve: **bold** e quebras de linha
        bot(esc(reply).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>'));
      })
      .catch(function () {
        typing.remove();
        aiOk = false;
        bot('Estou com as mãos na massa 😅 Usa os botões aqui em baixo que eu ajudo na mesma! 🥖');
        home();
      });
  }
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') trySend(); });
  document.getElementById('bpSend').addEventListener('click', trySend);
  function trySend() {
    var v = input.value.trim();
    if (!v) return;
    input.value = '';
    if (aiOk) { sendAI(v); } else { me(v); bot('Usa os botões aqui em baixo que eu guio-te! 🧡'); home(); }
  }

  // ---------- fluxos guiados (arranque rápido + fallback) ----------
  function setBtns(list) {
    btns.innerHTML = '';
    list.forEach(function (b) {
      var el = document.createElement('button');
      el.className = 'qbtn'; el.textContent = b.label;
      el.addEventListener('click', function () {
        if (b.ai && aiOk) { sendAI(b.ai); }
        else { me(b.label); setTimeout(b.go || function () {}, 420); }
      });
      btns.appendChild(el);
    });
  }
  function home() {
    setBtns([
      { label: 'Onde comprar?', ai: 'Onde posso comprar os vossos produtos?', go: onde },
      { label: 'Quero ser revendedor', ai: 'Quero ser revendedor da Quente e Bom.', go: revendedor },
      { label: 'Sugere-me uma receita', ai: 'Sugere-me uma receita simples com produtos Quente e Bom.', go: produtos }
    ]);
  }
  function onde() {
    bot('Boa! 🛒 Estamos em vários supermercados por Angola — a oferta varia de loja para loja. Diz-me a tua <b>zona/província</b> e o produto que procuras! ☀️');
    setBtns([
      { label: 'Falar no Instagram', go: function () { window.open('https://www.instagram.com/quenteebom/', '_blank'); home(); } },
      { label: 'Voltar', go: function () { home(); bot('Em que mais posso ajudar? 🧡'); } }
    ]);
  }
  function revendedor() {
    bot('Que bom quereres trabalhar connosco! 🤝 Preenche o formulário e a equipa comercial fala contigo rapidinho. 🥖');
    setBtns([
      { label: 'Abrir página de revendedores', go: function () { location.href = '/revendedores/'; } },
      { label: 'Voltar', go: function () { home(); bot('Em que mais posso ajudar? 🧡'); } }
    ]);
  }
  function produtos() {
    bot('Temos 7 mundos de sabor: pão fresquinho, cakes, os famosos <b>Bolos da Avó</b>, biscoitos, snacks, tostas e ingredientes. 😋');
    setBtns([
      { label: 'Pão', go: function () { location.href = '/pao/'; } },
      { label: 'Bolos da Avó', go: function () { location.href = '/bolos-da-avo/'; } },
      { label: 'Ver todos', go: function () { location.href = '/#mundos'; } }
    ]);
  }
  home();
})();
