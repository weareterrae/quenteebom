/* Quente e Bom — comportamento partilhado */
(function () {
  // skip link (acessibilidade) — primeiro elemento focável, salta para o conteúdo principal
  (function () {
    var main = document.querySelector('main');
    if (!main) { var h = document.getElementById('hdr'); main = h && h.nextElementSibling; }
    if (main) {
      if (!main.id) main.id = 'conteudo';
      if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
      var sk = document.createElement('a');
      sk.href = '#' + main.id; sk.className = 'skip-link'; sk.textContent = 'Saltar para o conteúdo';
      document.body.insertBefore(sk, document.body.firstChild);
    }
  })();

  // header
  var hdr = document.getElementById('hdr');
  if (hdr) {
    var onScroll = function () { hdr.classList.toggle('scrolled', scrollY > 60); };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // menu móvel (hambúrguer) — clona os links da nav existente
  var nav = hdr && hdr.querySelector('.nav');
  if (nav) {
    var burger = document.createElement('button');
    burger.className = 'nav-burger';
    burger.setAttribute('aria-label', 'Abrir menu');
    burger.innerHTML = '<span></span><span></span><span></span>';
    nav.appendChild(burger);
    var panel = document.createElement('nav');
    panel.className = 'mnav';
    nav.querySelectorAll('a').forEach(function (a) { panel.appendChild(a.cloneNode(true)); });
    var veil = document.createElement('div');
    veil.className = 'mnav-veil';
    document.body.appendChild(veil);
    document.body.appendChild(panel);
    function setMenu(open) {
      hdr.classList.toggle('menu-open', open);
      panel.classList.toggle('open', open);
      veil.classList.toggle('on', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', function () { setMenu(!panel.classList.contains('open')); });
    veil.addEventListener('click', function () { setMenu(false); });
    panel.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  }

  // reveal
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.14 });
  document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });

  // living sun (homepage hero) — rises with scroll
  var cv = document.getElementById('sun');
  if (!cv) return;
  var ctx = cv.getContext('2d'), W, H, mx = 0, my = 0;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function rz() {
    var DPR = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  addEventListener('resize', rz); rz();
  addEventListener('mousemove', function (e) {
    mx = (e.clientX / innerWidth - 0.5); my = (e.clientY / innerHeight - 0.5);
  }, { passive: true });

  var t = 0;
  function frame() {
    t += 0.0045;
    ctx.clearRect(0, 0, W, H);
    // scroll progress inside the hero: 0 at top → sun risen; scrolling down sets the sun
    var sc = Math.min(1, Math.max(0, scrollY / (H * 0.9)));
    var rise = 1 - sc; // 1 = fully risen
    var cx = W * 0.5 + mx * 40;
    var cy = H * (0.46 + (1 - rise) * 0.38) + my * 24; // sinks as you scroll
    var R = Math.max(70, Math.min(W, H) * (0.12 + rise * 0.03));
    var glowA = 0.25 + rise * 0.30;

    var glow = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 5);
    glow.addColorStop(0, 'rgba(255,224,160,' + (glowA + 0.25) + ')');
    glow.addColorStop(0.35, 'rgba(250,167,43,' + (glowA * 0.55) + ')');
    glow.addColorStop(1, 'rgba(250,167,43,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    var rays = 30;
    for (var i = 0; i < rays; i++) {
      var a = t + i / rays * Math.PI * 2, lng = i % 2 === 0;
      var inner = R * 1.22;
      var outer = R * (lng ? 3.0 : 2.15) + Math.sin(t * 2.2 + i) * R * 0.14;
      var w = lng ? 0.05 : 0.028;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a - w) * inner, cy + Math.sin(a - w) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.lineTo(cx + Math.cos(a + w) * inner, cy + Math.sin(a + w) * inner);
      ctx.closePath();
      var rg = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      rg.addColorStop(0, 'rgba(254,198,74,' + (0.55 + rise * 0.3) + ')');
      rg.addColorStop(1, 'rgba(226,78,27,0)');
      ctx.fillStyle = rg; ctx.fill();
    }
    var core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    core.addColorStop(0, '#FFF8E8'); core.addColorStop(0.55, '#FEC64A'); core.addColorStop(1, '#F0901E');
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    if (!reduce) requestAnimationFrame(frame);
  }
  frame();
})();

/* ===== Consentimento de cookies + camada central de analytics =====
   - Metricool e Meta Pixel (não essenciais) só carregam APÓS o utilizador aceitar.
   - Todo o site mede eventos por window.qbTrack(nome, params); se ainda não há decisão,
     os eventos ficam em fila; se recusar, são descartados (só essenciais). */
(function () {
  var KEY = 'qb-consent';                 // 'accepted' | 'rejected' | null (por decidir)
  var state = null; try { state = localStorage.getItem(KEY); } catch (e) {}
  var queue = [], loaded = false, banner = null;
  var STD = { PageView: 1, Lead: 1, Contact: 1, CompleteRegistration: 1, ViewContent: 1, Search: 1, InitiateCheckout: 1, AddToCart: 1 };

  function assign(a, b) { for (var k in b) if (Object.prototype.hasOwnProperty.call(b, k)) a[k] = b[k]; return a; }
  function dispatch(name, params) {
    if (!window.fbq) return;
    try { STD[name] ? fbq('track', name, params) : fbq('trackCustom', name, params); } catch (e) {}
  }
  // Camada central — TODO o site chama window.qbTrack('Evento', { ... })
  window.qbTrack = function (name, params) {
    params = params || {};
    (window.dataLayer = window.dataLayer || []).push(assign({ event: name }, params));
    if (state === 'accepted') dispatch(name, params);
    else if (state == null) queue.push([name, params]);
  };

  function loadTools() {
    if (loaded) return; loaded = true;
    var mc = document.createElement('script');
    mc.src = 'https://tracker.metricool.com/resources/be.js'; mc.async = true;
    mc.onload = function () { try { beTracker.t({ hash: '4f08e52fadba55f51e0d84318564e5d0' }); } catch (e) {} };
    document.head.appendChild(mc);
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '1428486132666431'); fbq('track', 'PageView');
    queue.forEach(function (q) { dispatch(q[0], q[1]); }); queue = [];
  }

  function setChoice(v) { state = v; try { localStorage.setItem(KEY, v); } catch (e) {} if (v === 'accepted') loadTools(); else queue = []; hideBanner(); }
  function hideBanner() { if (banner) banner.classList.remove('show'); }
  function buildBanner() {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'cookie-banner'; banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Preferências de cookies');
    banner.innerHTML =
      '<div class="cb-txt">Usamos cookies para medir a utilização do site e melhorar a tua experiência. ' +
      'Podes aceitar ou recusar os cookies não essenciais. <a href="/privacidade.html">Saber mais</a>.</div>' +
      '<div class="cb-actions">' +
      '<button type="button" class="btn btn-glass cb-no">Recusar</button>' +
      '<button type="button" class="btn btn-sun cb-yes">Aceitar</button></div>';
    document.body.appendChild(banner);
    banner.querySelector('.cb-yes').addEventListener('click', function () { setChoice('accepted'); });
    banner.querySelector('.cb-no').addEventListener('click', function () { setChoice('rejected'); });
  }
  // reabrir preferências (link "Cookies" no rodapé)
  window.qbConsentOpen = function () { buildBanner(); banner.classList.add('show'); };

  // Arranque
  if (state === 'accepted') loadTools();
  else if (state == null) { buildBanner(); setTimeout(function () { if (banner) banner.classList.add('show'); }, 600); }

  // ---- Eventos globais (encaminhados pela camada; respeitam o consentimento) ----
  if (location.pathname.indexOf('/receitas/') === 0 && location.pathname.length > 11) {
    qbTrack('VerReceita', { pagina: location.pathname });
  }
  if (/\/obrigado(\.html)?$/.test(location.pathname)) {
    qbTrack('Lead');
    var _t = new URLSearchParams(location.search).get('t');
    if (_t) qbTrack('LeadB2B', { tipo: _t });
  }
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest && e.target.closest('[onclick*="openBento"]');
    if (el) qbTrack('Contact', { metodo: 'joaquim' });
  }, true);
})();

/* Rodapé legal — links em todas as páginas com footer + botão de preferências de cookies */
(function () {
  var ft = document.querySelector('footer.ft');
  if (!ft) return;
  var bar = document.createElement('div');
  bar.className = 'ft-legal';
  bar.innerHTML =
    '<a href="/privacidade.html">Privacidade</a>' +
    '<a href="/cookies/">Cookies</a>' +
    '<a href="/termos/">Termos</a>' +
    '<button type="button" class="ft-legal-btn">Preferências de cookies</button>';
  var bot = ft.querySelector('.ft-bot');
  if (bot && bot.parentNode) bot.parentNode.insertBefore(bar, bot);
  else (ft.querySelector('.wrap') || ft).appendChild(bar);
  var b = bar.querySelector('.ft-legal-btn');
  b.addEventListener('click', function () { if (window.qbConsentOpen) window.qbConsentOpen(); });
})();
