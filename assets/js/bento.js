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
    '.bp-close:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
    '.lead-card{background:#FFF6EA;border:1px solid #eaddc9}' +
    '.lead-f{display:flex;flex-direction:column;gap:8px;margin-top:10px}' +
    '.lead-f input{border:1.5px solid #eaddc9;border-radius:12px;padding:10px 14px;font-size:14.5px;font-family:inherit;outline:none;background:#fff}' +
    '.lead-f input:focus{border-color:#EE7A1B}' +
    '.lead-go{border:none;border-radius:999px;padding:11px 16px;background:#EE7A1B;color:#fff;font-weight:800;font-size:14.5px;cursor:pointer;font-family:inherit}' +
    '.lead-go:hover{background:#CC5A08}.lead-go:disabled{opacity:.6;cursor:default}' +
    '.lead-err{color:#b03030;font-size:12.5px;font-weight:600}' +
    '.lead-note{color:#9b8290;font-size:11.5px;line-height:1.4}' +
    '.lead-ok{color:#5B2A4A;font-weight:600}';
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
  // O Joaquim pode marcar uma captação de lead terminando com ((LEAD:tipo)) — invisível para o
  // visitante; o widget deteta, retira o marcador e mostra o mini-formulário.
  function stripLead(s) {
    return String(s || '')
      .replace(/\(\(\s*LEAD\s*:\s*[a-z_]+\s*\)\)/ig, '')  // marcador completo
      .replace(/\(\(\s*LEAD[^)]*$/i, '')                   // marcador parcial (a meio do stream)
      .replace(/[ \t]+$/, '');
  }
  function detectLead(s) {
    var m = String(s || '').match(/\(\(\s*LEAD\s*:\s*([a-z_]+)\s*\)\)/i);
    return m ? m[1].toLowerCase() : null;
  }

  function sendAI(text) {
    me(text);
    history.push({ role: 'user', content: text });
    if (window.qbTrack) window.qbTrack('mensagem_enviada', { origem: 'joaquim', pagina: location.pathname });

    var typing = document.createElement('div');
    typing.className = 'msg bot typing';
    typing.textContent = 'O Joaquim está a escrever…';
    body.appendChild(typing); body.scrollTop = body.scrollHeight;

    var bubble = null, acc = '';
    function draw() {
      if (!bubble) { typing.remove(); bubble = document.createElement('div'); bubble.className = 'msg bot'; body.appendChild(bubble); }
      bubble.innerHTML = fmt(stripLead(acc)); body.scrollTop = body.scrollHeight;
    }

    fetch(BENTO_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: history })
    })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        if (r.body && r.body.getReader) {          // streaming: texto a aparecer à medida que é gerado
          var reader = r.body.getReader(), dec = new TextDecoder();
          return (function pump() {
            return reader.read().then(function (res) {
              if (res.done) return;
              acc += dec.decode(res.value, { stream: true });
              draw();
              return pump();
            });
          })();
        }
        return r.text().then(function (t) { acc = t; draw(); });  // sem streaming: de uma vez
      })
      .then(function () {
        var raw = acc.trim();
        // compat: se vier JSON {"reply":"…"} (versão antiga em cache), extrai o texto
        if (raw.charAt(0) === '{' && raw.indexOf('"reply"') !== -1) {
          try { var j = JSON.parse(raw); if (j && typeof j.reply === 'string') acc = j.reply; } catch (e) {}
        }
        var reply = stripLead(acc).trim() || 'Hmm, não percebi — podes repetir? 🧡';
        if (!bubble) { typing.remove(); bot(fmt(reply)); } else { bubble.innerHTML = fmt(reply); }
        history.push({ role: 'assistant', content: reply });
        var lead = detectLead(acc);
        if (lead) setTimeout(function () { leadForm(lead); }, 300);
        body.scrollTop = body.scrollHeight;
      })
      .catch(function () {
        try { typing.remove(); } catch (e) {}
        if (bubble && !stripLead(acc).trim()) { try { bubble.remove(); } catch (e) {} }
        aiOk = false;
        bot('Estou com as mãos na massa 😅 Usa os botões aqui em baixo que eu ajudo na mesma! 🥖');
        home();
      });
  }

  // ---------- Captação de lead DENTRO da conversa ----------
  // Regra da casa (Angola): capta nome+contacto e envia para o MESMO destino do formulário do site
  // (Netlify Form "lead-joaquim" → submission-created → email da equipa). NUNCA WhatsApp.
  var leadEnviado = false;
  var LEAD_LABEL = {
    revendedor: 'Boa! 🤝 Deixa o teu <b>nome</b> e <b>contacto</b> (telefone ou email) que a equipa comercial fala contigo rapidinho.',
    cotacao: 'Combinado! 📋 Deixa o teu <b>nome</b> e <b>contacto</b> que a equipa te prepara a cotação e liga.',
    negocio: 'Que bom! 🤝 Deixa o teu <b>nome</b> e <b>contacto</b> que a equipa comercial trata de tudo contigo.',
    contacto: 'Com certeza! ✉️ Deixa o teu <b>nome</b> e <b>contacto</b> que a equipa te responde.'
  };
  function encodeForm(obj) {
    return Object.keys(obj).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(obj[k]); }).join('&');
  }
  function ultimoPedido() {
    for (var i = history.length - 1; i >= 0; i--) { if (history[i].role === 'user') return history[i].content; }
    return '';
  }
  function leadForm(tipo) {
    if (leadEnviado) return;
    var wrap = document.createElement('div');
    wrap.className = 'msg bot lead-card';
    wrap.innerHTML = (LEAD_LABEL[tipo] || LEAD_LABEL.contacto) +
      '<div class="lead-f">' +
      '<input type="text" class="lead-nome" placeholder="O teu nome" autocomplete="name" maxlength="80">' +
      '<input type="text" class="lead-ct" placeholder="Telefone ou email" autocomplete="tel" maxlength="120">' +
      '<button type="button" class="lead-go">Enviar à equipa ☀️</button>' +
      '<div class="lead-err" hidden></div>' +
      '<div class="lead-note">Ao enviar, a nossa equipa comercial entra em contacto contigo.</div>' +
      '</div>';
    body.appendChild(wrap); body.scrollTop = body.scrollHeight;
    var nome = wrap.querySelector('.lead-nome'), ct = wrap.querySelector('.lead-ct'),
      go = wrap.querySelector('.lead-go'), err = wrap.querySelector('.lead-err');
    try { nome.focus(); } catch (e) {}
    function bad(m) { err.textContent = m; err.hidden = false; }
    go.addEventListener('click', function () {
      var n = nome.value.trim(), c = ct.value.trim();
      if (n.length < 2) return bad('Diz-me o teu nome, por favor. 🧡');
      var okCt = /@/.test(c) ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c) : (c.replace(/\D/g, '').length >= 9);
      if (!okCt) return bad('Deixa um telefone (9 dígitos) ou um email válido.');
      go.disabled = true; go.textContent = 'A enviar…'; err.hidden = true;
      fetch('/', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: encodeForm({ 'form-name': 'lead-joaquim', nome: n, contacto: c, assunto: tipo, mensagem: ultimoPedido().slice(0, 400), origem: location.pathname, 'bot-field': '' })
      })
        .then(function (r) { if (!r.ok) throw new Error(r.status); })
        .then(function () {
          leadEnviado = true;
          if (window.qbTrack) { window.qbTrack('Lead', { content_name: 'joaquim', tipo: tipo }); window.qbTrack('lead_assistente', { tipo: tipo, pagina: location.pathname }); }
          wrap.querySelector('.lead-f').innerHTML = '<div class="lead-ok">Recebido, ' + esc(n.split(/\s+/)[0]) + '! 🧡 A equipa comercial fala contigo em breve. Todos os dias, uma delícia. ☀️</div>';
        })
        .catch(function () {
          go.disabled = false; go.textContent = 'Enviar à equipa ☀️';
          bad('Ups, não consegui enviar agora. Abre o formulário em /profissional/ 🧡');
        });
    });
    ct.addEventListener('keydown', function (e) { if (e.key === 'Enter') go.click(); });
  }
  window.joaquimLead = leadForm;
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
    bot('Que bom quereres trabalhar connosco! 🤝 Posso passar já o teu contacto à equipa comercial — ou abrir o formulário completo. 🥖');
    setBtns([
      { label: 'Deixar o meu contacto aqui', go: function () { leadForm('revendedor'); } },
      { label: 'Abrir formulário', go: function () { location.href = '/profissional/revendedor/'; } },
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
