/* Quente e Bom — camada central de medição (analytics.js)
   - window.qebTrack('Evento', {params}) → dataLayer + Meta Pixel (fbq) + GA4 (gtag)
   - Consent-aware: nada de não-essencial carrega antes do "Aceitar" (localStorage 'qb-consent')
   - Debug: abrir qualquer página com ?qebdebug=1 (fica ativo na sessão)
   - IDs: preencher em CONFIG. GA4 vazio = desligado (ativa-se sozinho quando houver ID). */
(function () {
  if (window.__qebAnalytics) return; window.__qebAnalytics = '1.0';

  var CONFIG = {
    pixel: '1428486132666431',                      // Meta Pixel "Quente e Bom Web" (ligado à conta de anúncios)
    ga4: 'G-XK6C5KN9CE',                            // GA4 Measurement ID "Quente e Bom Web"
    metricool: '4f08e52fadba55f51e0d84318564e5d0'   // tracker Metricool QeB
  };

  var KEY = 'qb-consent';                 // 'accepted' | 'rejected' | null (por decidir)
  var state = null; try { state = localStorage.getItem(KEY); } catch (e) {}
  var queue = [], loaded = false, banner = null;
  var STD = { PageView: 1, Lead: 1, Contact: 1, CompleteRegistration: 1, ViewContent: 1, Search: 1, InitiateCheckout: 1, AddToCart: 1 };

  // debug ?qebdebug=1 (persiste na sessão)
  var DEBUG = false;
  try {
    if (/[?&]qebdebug=1/.test(location.search)) sessionStorage.setItem('qeb-debug', '1');
    DEBUG = sessionStorage.getItem('qeb-debug') === '1';
  } catch (e) {}
  function dlog() { if (DEBUG && window.console) try { console.info.apply(console, ['[QeB]'].concat([].slice.call(arguments))); } catch (e) {} }

  function assign(a, b) { for (var k in b) if (Object.prototype.hasOwnProperty.call(b, k)) a[k] = b[k]; return a; }
  function dispatch(name, params) {
    if (window.fbq) { try { STD[name] ? fbq('track', name, params) : fbq('trackCustom', name, params); } catch (e) {} }
    if (window.gtag && CONFIG.ga4) { try { gtag('event', name, params || {}); } catch (e) {} }
  }

  // Camada central — TODO o site chama window.qebTrack('Evento', { ... })
  window.qebTrack = function (name, params) {
    params = params || {};
    (window.dataLayer = window.dataLayer || []).push(assign({ event: name }, params));
    dlog('evento', name, params, 'consent=' + state);
    if (state === 'accepted') dispatch(name, params);
    else if (state == null) queue.push([name, params]);
  };
  window.qbTrack = window.qebTrack; // compatibilidade com código antigo

  function loadTools() {
    if (loaded) return; loaded = true;
    dlog('a carregar ferramentas (consentimento aceite)', CONFIG);
    // Metricool
    var mc = document.createElement('script');
    mc.src = 'https://tracker.metricool.com/resources/be.js'; mc.async = true;
    mc.onload = function () { try { beTracker.t({ hash: CONFIG.metricool }); } catch (e) {} };
    document.head.appendChild(mc);
    // Meta Pixel
    if (CONFIG.pixel) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s) }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', CONFIG.pixel); fbq('track', 'PageView');
    }
    // GA4 — só se houver Measurement ID
    if (CONFIG.ga4) {
      var gs = document.createElement('script');
      gs.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.ga4; gs.async = true;
      document.head.appendChild(gs);
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { dataLayer.push(arguments); };
      gtag('js', new Date()); gtag('config', CONFIG.ga4, { anonymize_ip: true });
    }
    queue.forEach(function (q) { dispatch(q[0], q[1]); }); queue = [];
  }

  function setChoice(v) { state = v; try { localStorage.setItem(KEY, v); } catch (e) {} if (v === 'accepted') loadTools(); else queue = []; hideBanner(); dlog('consentimento:', v); }
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
  else if (state == null) {
    var boot = function () { buildBanner(); setTimeout(function () { if (banner) banner.classList.add('show'); }, 600); };
    document.body ? boot() : document.addEventListener('DOMContentLoaded', boot);
  }

  // ---- Eventos globais (encaminhados pela camada; respeitam o consentimento) ----
  // Receitas
  if (location.pathname.indexOf('/receitas/') === 0 && location.pathname.length > 11) {
    qebTrack('VerReceita', { pagina: location.pathname });
  }
  // Lead na página de obrigado (formulários com redirect: revendedor, candidatura, cotação)
  if (/\/obrigado(\.html)?$/.test(location.pathname)) {
    qebTrack('Lead');
    var _t = new URLSearchParams(location.search).get('t');
    if (_t) qebTrack('LeadB2B', { tipo: _t });
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    // abertura do chat do Chef Joaquim
    var el = t.closest('[onclick*="openBento"], .bento-btn');
    if (el) { qebTrack('Contact', { metodo: 'joaquim' }); qebTrack('AbrirJoaquim', { pagina: location.pathname }); return; }
    // clique "Quero ser revendedor" (qualquer link para a página do formulário)
    var rv = t.closest('a[href*="/profissional/revendedor"]');
    if (rv) { qebTrack('CliqueRevendedor', { origem: location.pathname }); return; }
    // clique em email
    var em = t.closest('a[href^="mailto:"]');
    if (em) { qebTrack('EmailClick', { email: (em.getAttribute('href') || '').replace('mailto:', ''), origem: location.pathname }); }
  }, true);
  // submissão de qualquer formulário Netlify (tentativa; o Lead conta no /obrigado ou no sucesso AJAX)
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f && f.getAttribute && f.hasAttribute('data-netlify')) {
      qebTrack('FormSubmit', { form: f.getAttribute('name') || 'sem-nome', pagina: location.pathname });
    }
  }, true);

  dlog('analytics ativo', { consent: state, pixel: !!CONFIG.pixel, ga4: CONFIG.ga4 || '(vazio)' });
})();
