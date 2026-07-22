/* Joaquim — o Chef da Quente e Bom (widget partilhado).
   Com BENTO_ENDPOINT definido: chat de IA a sério (Netlify Function + Claude).
   Sem endpoint / se falhar: fluxos guiados por botões (fallback). */
(function () {
  var BENTO_ENDPOINT = '/api/joaquim';
  var aiOk = !!BENTO_ENDPOINT; // desliga-se sozinho se a função falhar
  var history = [];

  var root = document.createElement('div');
  root.innerHTML =
    '<button class="bento-btn" id="bentoBtn" aria-label="Falar com o Joaquim">' +
    '<img src="/assets/img/bento_face.jpg" class="bento-btn-av" alt="">Falar com o Joaquim</button>' +
    '<div class="bento-panel" id="bentoPanel" role="dialog" aria-modal="true" aria-label="Conversa com o Joaquim">' +
    '<div class="bp-head"><div class="bp-av"><img src="/assets/img/bento_face.jpg" alt="Joaquim"></div>' +
    '<div><b>Joaquim</b><span>O Chef · responde na hora</span></div>' +
    '<button type="button" id="bentoClose" class="bp-close" aria-label="Fechar conversa">✕</button></div>' +
    '<div class="bp-body" id="bpBody">' +
    '<div class="msg bot">Olá! 🧡 Sou o Joaquim, o Chef da Quente e Bom. Como te posso ajudar hoje?</div></div>' +
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
    '.msg.typing{color:#8a7157;font-style:italic;background:#fff;border:1px solid #eaddc9;}' +
    '.bp-head{position:relative}' +
    '.bp-close{position:absolute;top:10px;right:12px;width:30px;height:30px;border:0;border-radius:50%;background:rgba(255,255,255,.2);color:#fff;font-size:13px;line-height:1;cursor:pointer}' +
    '.bp-close:hover{background:rgba(255,255,255,.35)}' +
    '.bp-close:focus-visible{outline:2px solid #fff;outline-offset:2px}';
  document.head.appendChild(st);

  var panel = document.getElementById('bentoPanel');
  var body = document.getElementById('bpBody');
  var btns = document.getElementById('bpBtns');
  var input = document.getElementById('bpInput');
  var bentoBtn = document.getElementById('bentoBtn');
  var lastFocus = null;
  bentoBtn.setAttribute('aria-expanded', 'false');

  function focusables() {
    return Array.prototype.filter.call(
      panel.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.offsetParent !== null && !el.disabled; }
    );
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeBento(); return; }
    if (e.key !== 'Tab') return;
    var f = focusables(); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openBento() {
    lastFocus = document.activeElement;
    panel.classList.add('open');
    bentoBtn.setAttribute('aria-expanded', 'true');
    panel.addEventListener('keydown', onKey);
    input.focus();
    if (window.qbTrack) window.qbTrack('JoaquimAberto');
  }
  function closeBento() {
    panel.classList.remove('open');
    bentoBtn.setAttribute('aria-expanded', 'false');
    panel.removeEventListener('keydown', onKey);
    (lastFocus && lastFocus.focus ? lastFocus : bentoBtn).focus();
  }
  window.openBento = openBento;
  window.closeBento = closeBento;
  bentoBtn.addEventListener('click', function () { panel.classList.contains('open') ? closeBento() : openBento(); });
  document.getElementById('bentoClose').addEventListener('click', closeBento);

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  // markdown leve: links [texto](url), URLs soltos, **bold** e quebras de linha
  var LNK = ' style="color:inherit;text-decoration:underline;font-weight:700"';
  function fmt(s) {
    var h = esc(s);
    h = h.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener"' + LNK + '>$1</a>');
    h = h.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    h = h.replace(/(^|[^"'>])(https?:\/\/[^\s<]*[^\s<.,)!?])/g, '$1<a href="$2" target="_blank" rel="noopener"' + LNK + '>$2</a>');
    h = h.replace(/(^|[\s(])((?:www\.)?quenteebom\.com(?:\/[^\s<]*[^\s<.,)!?])?)/g, '$1<a href="https://$2" target="_blank" rel="noopener"' + LNK + '>$2</a>');
    return h.replace(/\n/g, '<br>');
  }
  function bot(html) { body.insertAdjacentHTML('beforeend', '<div class="msg bot">' + html + '</div>'); body.scrollTop = body.scrollHeight; }
  function me(txt) { body.insertAdjacentHTML('beforeend', '<div class="msg me">' + esc(txt) + '</div>'); body.scrollTop = body.scrollHeight; }

  // ---------- IA ----------
  function sendAI(text) {
    me(text);
    history.push({ role: 'user', content: text });
    var typing = document.createElement('div');
    typing.className = 'msg bot typing';
    typing.textContent = 'O Joaquim está a escrever…';
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
        bot(fmt(reply));
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
    bot('Boa! 🛒 Estamos nos supermercados de toda a Angola — a oferta varia de loja para loja. Diz-me a tua <b>zona/província</b> e o produto que procuras, ou vê a nossa página Onde comprar! ☀️');
    setBtns([
      { label: 'Ver onde comprar', go: function () { location.href = '/onde-comprar/'; } },
      { label: 'Falar no Instagram', go: function () { window.open('https://www.instagram.com/quenteebom/', '_blank'); home(); } },
      { label: 'Voltar', go: function () { home(); bot('Em que mais posso ajudar? 🧡'); } }
    ]);
  }
  function revendedor() {
    bot('Que bom quereres trabalhar connosco! 🤝 Preenche o formulário e a equipa comercial fala contigo rapidinho. 🥖');
    setBtns([
      { label: 'Tornar-me revendedor', go: function () { location.href = '/profissional/revendedor/'; } },
      { label: 'Voltar', go: function () { home(); bot('Em que mais posso ajudar? 🧡'); } }
    ]);
  }
  function produtos() {
    bot('Temos 7 mundos de sabor: pão fresquinho, cakes, os famosos <b>Bolos da Avó</b>, biscoitos, snacks, tostas e ingredientes. 😋');
    setBtns([
      { label: 'Pão', go: function () { location.href = '/pao/'; } },
      { label: 'Bolos da Avó', go: function () { location.href = '/bolos-da-avo/'; } },
      { label: 'Ver todos', go: function () { location.href = '/produtos/'; } }
    ]);
  }
  home();
})();
