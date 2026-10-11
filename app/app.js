/* App Quente e Bom (consumidor) · quenteebom.com/app/
   Ecrãs por hash: #/ #/receitas #/talao #/produtos #/pontos #/entrar
   Dados: /app/dados.json (gerado por _gen-app.js) · Pontos: RPCs public.app_* no Supabase
   Talões: /api/talao (Netlify Function com IA). */
(function () {
  'use strict';
  var SB_URL = 'https://qciagsktkqljvknmahfu.supabase.co';
  var SB_KEY = 'sb_publishable_cG_NBNF8YR1gJwyOYg7FAw_qtpKgIaG';
  var INSIGNIAS = ['Kero', 'Candando', 'Maxi', 'Kibabo', 'Nossa Casa', 'Shoprite', 'Deskontão', 'BigOne', 'Alimenta Angola', 'Africana Discount'];
  var MUNICIPIOS = ['Belas', 'Cacuaco', 'Cazenga', 'Icolo e Bengo', 'Kilamba Kiaxi', 'Luanda', 'Talatona', 'Viana', 'Quiçama', 'Benguela', 'Lobito', 'Huambo', 'Lubango', 'Cabinda', 'Malanje', 'Uíge', 'Saurimo', 'Namibe', 'Soyo', 'Outro'];

  var ecra = document.getElementById('ecra');
  var D = null;          // dados.json
  var EU = null;         // perfil do utilizador (app_eu)
  var filtroRec = { q: '', tag: 'Todas' };
  var filtroProd = 'pao';

  // ---------- utilitários ----------
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function guarda(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  function le(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function token() { return le('qeb_token'); }
  function kz(n) { return Number(n || 0).toLocaleString('pt-PT', { maximumFractionDigits: 0 }) + ' Kz'; }
  function dataCurta(s) { var d = new Date(s); return isNaN(d) ? '' : d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }); }
  function diaDoAno() { var a = new Date(); return Math.floor((a - new Date(a.getFullYear(), 0, 0)) / 864e5) + a.getFullYear() * 400; }
  function toast(t) {
    var el = document.createElement('div'); el.className = 'toast'; el.textContent = t;
    document.body.appendChild(el); setTimeout(function () { el.remove(); }, 3200);
  }
  function rpc(nome, args) {
    return fetch(SB_URL + '/rest/v1/rpc/' + nome, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: SB_KEY, authorization: 'Bearer ' + SB_KEY },
      body: JSON.stringify(args)
    }).then(function (r) { if (!r.ok) throw new Error('rede'); return r.json(); });
  }
  function carregaDados() {
    if (D) return Promise.resolve(D);
    return fetch('/app/dados.json').then(function (r) { return r.json(); }).then(function (j) { D = j; return D; });
  }
  function carregaEu() {
    if (!token()) { EU = null; mostraSaldo(); return Promise.resolve(null); }
    return rpc('app_eu', { p_token: token() }).then(function (j) {
      if (j && j.erro === 'sessao') { guarda('qeb_token', null); EU = null; }
      else EU = j;
      mostraSaldo(); return EU;
    }).catch(function () { return EU; });
  }
  function mostraSaldo() {
    var a = document.getElementById('topoPts');
    a.hidden = !EU; if (EU) { document.getElementById('topoSaldo').textContent = EU.saldo; document.getElementById('topoPal').textContent = EU.saldo === 1 ? 'ponto' : 'pontos'; }
  }
  function saudacao() { var h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 19 ? 'Boa tarde' : 'Boa noite'; }
  function primeiroNome() { return EU ? String(EU.nome).split(' ')[0] : ''; }
  function receitaUrl(r) { return '/receitas/' + r.slug + '/'; }
  function cartaoReceita(r) {
    return '<a class="rec" href="' + receitaUrl(r) + '"><img loading="lazy" src="' + esc(r.img) + '" alt=""><div><b>' + esc(r.titulo) + '</b><small>' + esc(r.tempo) + ' · ' + esc(r.dif) + '</small></div></a>';
  }
  function pedeConta(motivo) {
    return '<div class="card"><h3>' + esc(motivo) + '</h3><p class="sub" style="margin:6px 0 14px">Cria a tua conta em 30 segundos. Só precisamos do nome e do telemóvel.</p><a class="btn laranja cheio" href="#/entrar">Criar conta</a></div>';
  }

  // ---------- ecrãs ----------
  var ECRAS = {};

  ECRAS.inicio = function () {
    var n = diaDoAno();
    var rec = D.receitas[n % D.receitas.length];
    var dica = D.dicas[n % D.dicas.length];
    var streak = EU ? EU.streak : 0;
    var barras = '';
    for (var i = 1; i <= 7; i++) barras += '<span class="' + (i <= (streak % 7 || (streak && streak % 7 === 0 ? 7 : 0)) ? 'on' : '') + '"></span>';
    var html = '<div class="card sol"><div class="eyebrow" style="color:#F6C440">O Sol Nasce</div>' +
      '<h2>' + saudacao() + (EU ? ', ' + esc(primeiroNome()) : '') + ' ☀️</h2>';
    if (!EU) {
      html += '<p style="opacity:.9">Junta pontos com os talões das tuas compras e todos os dias com a visita da manhã.</p>' +
        '<a class="btn ouro" style="margin-top:14px" href="#/entrar">Começar a juntar pontos</a>';
    } else if (!EU.checkin_hoje) {
      html += '<p style="opacity:.9">Passa por cá todos os dias. Ao 7.º dia seguido ganhas 10 pontos extra.</p>' +
        '<div class="dias">' + barras + '</div><button class="btn ouro" id="checkin">Receber o ponto de hoje</button>';
    } else {
      html += '<p style="opacity:.9">Já recebeste o ponto de hoje. Vais com <b>' + streak + (streak === 1 ? ' dia' : ' dias') + '</b> seguidos. Volta amanhã!</p><div class="dias">' + barras + '</div>';
    }
    html += '</div>';
    html += '<h2>A receita de hoje</h2>' + '<a class="rec" href="' + receitaUrl(rec) + '"><img src="' + esc(rec.img) + '" alt="" style="aspect-ratio:16/9"><div><b style="font-size:17px">' + esc(rec.titulo) + '</b><small>' + esc(rec.tempo) + ' · ' + esc(rec.dif) + ' · ' + esc(rec.rende) + '</small><p class="sub" style="margin-top:6px">' + esc(rec.intro) + '</p></div></a>';
    html += '<div class="card" style="display:flex;gap:14px;align-items:center"><div style="font-size:30px">🧾</div><div style="flex:1"><b>Compraste Quente e Bom?</b><div class="sub">Fotografa o talão e ganha 1 ponto por cada 100 Kz.</div></div><a class="btn laranja" href="#/talao">Enviar</a></div>';
    html += '<h2>Dica do Chef</h2><div class="card"><div style="font-size:26px">' + esc(dica.ico) + '</div><h3 style="margin:6px 0">' + esc(dica.t) + '</h3><p class="sub" style="color:var(--tinta)">' + esc(dica.p) + '</p></div>';
    html += '<div class="card" style="display:flex;gap:14px;align-items:center"><img src="/assets/img/bento_face.jpg" alt="" style="width:52px;height:52px;border-radius:50%;object-fit:cover"><div style="flex:1"><b>O que tens em casa?</b><div class="sub">Diz ao Chef Joaquim o que tens no frigorífico e ele dá-te uma receita.</div></div></div>' +
      '<button class="btn linha cheio" id="perguntaChef">Perguntar ao Joaquim</button>';
    ecra.innerHTML = html;
    var b = document.getElementById('checkin');
    if (b) b.onclick = function () {
      b.disabled = true;
      rpc('app_checkin', { p_token: token() }).then(function (j) {
        if (j.erro) throw new Error(j.erro);
        toast(j.ganho ? '+' + j.ganho + (j.ganho === 1 ? ' ponto' : ' pontos') + '. Até amanhã! ☀️' : 'Já tinhas recebido o ponto de hoje.');
        return carregaEu();
      }).then(function () { ECRAS.inicio(); }).catch(function () { b.disabled = false; toast('Sem ligação. Tenta outra vez.'); });
    };
    document.getElementById('perguntaChef').onclick = function () { abrirChef('O que posso fazer com o que tenho em casa?'); };
  };

  ECRAS.receitas = function () {
    var tags = ['Todas', 'Angola', 'Bolos', 'Docinhos', 'Sobremesas', 'Sandes', 'Salgado', 'Sem forno', 'Rápido', 'Festa'];
    ecra.innerHTML = '<h1 style="margin-top:18px">Receitas</h1><p class="sub">' + D.receitas.length + ' receitas com produtos Quente e Bom.</p>' +
      '<input class="busca" id="buscaRec" type="search" placeholder="Procurar: bolo, sandes, coco…" value="' + esc(filtroRec.q) + '">' +
      '<div class="chips" id="chipsRec">' + tags.map(function (t) { return '<button class="chip' + (t === filtroRec.tag ? ' on' : '') + '" data-t="' + esc(t) + '">' + esc(t) + '</button>'; }).join('') + '</div>' +
      '<div class="grelha" id="listaRec"></div>';
    function desenha() {
      var q = norm(filtroRec.q);
      var lista = D.receitas.filter(function (r) {
        return (filtroRec.tag === 'Todas' || r.tags.indexOf(filtroRec.tag) >= 0) &&
          (!q || norm(r.titulo + ' ' + r.intro + ' ' + r.produtos.join(' ')).indexOf(q) >= 0);
      });
      document.getElementById('listaRec').innerHTML = lista.length ? lista.map(cartaoReceita).join('') : '<p class="sub">Nenhuma receita com essa pesquisa.</p>';
    }
    document.getElementById('buscaRec').oninput = function (e) { filtroRec.q = e.target.value; desenha(); };
    document.getElementById('chipsRec').onclick = function (e) {
      var t = e.target.closest('.chip'); if (!t) return;
      filtroRec.tag = t.dataset.t;
      Array.prototype.forEach.call(this.children, function (c) { c.classList.toggle('on', c === t); });
      desenha();
    };
    desenha();
  };

  ECRAS.produtos = function () {
    ecra.innerHTML = '<h1 style="margin-top:18px">Produtos</h1><p class="sub">' + D.produtos.length + ' produtos, à venda nos supermercados de toda a Angola.</p>' +
      '<div class="chips" id="chipsProd" style="margin-top:10px">' + D.mundos.map(function (m) { return '<button class="chip' + (m.slug === filtroProd ? ' on' : '') + '" data-m="' + m.slug + '">' + esc(m.nome) + '</button>'; }).join('') + '</div>' +
      '<div class="grelha" id="listaProd"></div>';
    function desenha() {
      document.getElementById('listaProd').innerHTML = D.produtos.filter(function (p) { return p.mundo === filtroProd; }).map(function (p) {
        return '<button class="prod" data-s="' + p.slug + '"><img loading="lazy" src="' + esc(p.img) + '" alt=""><b>' + esc(p.nome) + '</b></button>';
      }).join('');
    }
    document.getElementById('chipsProd').onclick = function (e) {
      var t = e.target.closest('.chip'); if (!t) return;
      filtroProd = t.dataset.m;
      Array.prototype.forEach.call(this.children, function (c) { c.classList.toggle('on', c === t); });
      desenha();
    };
    document.getElementById('listaProd').onclick = function (e) {
      var b = e.target.closest('.prod'); if (b) abreProduto(b.dataset.s);
    };
    desenha();
  };

  function receitasCom(p) {
    var n = norm(p.nome);
    return D.receitas.filter(function (r) {
      return r.produtos.some(function (x) { var m = norm(x); return m.indexOf(n) >= 0 || n.indexOf(m) >= 0; });
    });
  }

  function abreProduto(slug) {
    var p = D.produtos.filter(function (x) { return x.slug === slug; })[0]; if (!p) return;
    var recs = receitasCom(p).slice(0, 4);
    var f = document.getElementById('folha');
    f.innerHTML = '<div class="puxa"></div><button class="fechar" aria-label="Fechar">✕</button><div class="wrap">' +
      '<img class="prod-img" src="' + esc(p.img) + '" alt="">' +
      '<div class="eyebrow" style="text-align:center;margin-top:8px">' + esc(p.grupo) + '</div>' +
      '<h2 style="text-align:center;margin:4px 0 8px">' + esc(p.nome) + '</h2>' +
      '<p style="text-align:center">' + esc(p.desc) + '</p>' +
      '<div class="card"><h3>Informação nutricional</h3><p class="sub" style="margin-top:4px">Em breve, com os valores das fichas técnicas.</p></div>' +
      (recs.length ? '<h3 style="margin:18px 0 10px">Receitas com este produto</h3><div class="grelha">' + recs.map(cartaoReceita).join('') + '</div>' : '') +
      '<div class="card" style="margin-top:18px"><h3>Não encontraste no supermercado?</h3><p class="sub" style="margin:4px 0 10px">Diz-nos onde procuraste. A nossa equipa comercial trata do resto.</p>' +
      '<form id="fNE"><label class="campo" for="neIns">Supermercado</label><select class="campo-in" id="neIns" required><option value="">Escolhe</option>' +
      INSIGNIAS.concat(['Outro']).map(function (i) { return '<option>' + esc(i) + '</option>'; }).join('') + '</select>' +
      '<label class="campo" for="neLoja">Que loja? (bairro ou nome)</label><input class="campo-in" id="neLoja" maxlength="80" placeholder="Ex.: Kero da Gika">' +
      '<button class="btn ameixa cheio" style="margin-top:14px">Avisar a Quente e Bom</button></form></div>' +
      '</div>';
    f.querySelector('.fechar').onclick = fechaFolha;
    f.querySelector('#fNE').onsubmit = function (e) {
      e.preventDefault();
      var btn = this.querySelector('button'); btn.disabled = true;
      rpc('app_nao_encontrei', { p_token: token(), p_produto: p.nome, p_insignia: document.getElementById('neIns').value, p_loja: document.getElementById('neLoja').value, p_municipio: EU ? EU.municipio : null })
        .then(function (j) { if (j.erro) throw new Error(j.erro); toast('Obrigado! Já avisámos a equipa. 🧡'); fechaFolha(); })
        .catch(function () { btn.disabled = false; toast('Não conseguimos enviar. Tenta outra vez.'); });
    };
    document.getElementById('veu').classList.add('on');
    requestAnimationFrame(function () { f.classList.add('on'); f.scrollTop = 0; });
  }
  function fechaFolha() {
    document.getElementById('folha').classList.remove('on');
    document.getElementById('veu').classList.remove('on');
  }
  document.getElementById('veu').onclick = fechaFolha;

  ECRAS.talao = function () {
    if (!EU) { ecra.innerHTML = '<h1 style="margin-top:18px">Talão vale pontos</h1>' + pedeConta('Para juntar pontos precisas de conta'); return; }
    ecra.innerHTML = '<h1 style="margin-top:18px">Talão vale pontos</h1><p class="sub">1 ponto por cada 100 Kz em produtos Quente e Bom.</p>' +
      '<div class="card"><ol class="passos"><li>Compra produtos Quente e Bom em qualquer supermercado.</li><li>Fotografa o talão inteiro, esticado e com boa luz.</li><li>Nós lemos o talão e os pontos entram na tua conta.</li></ol>' +
      '<p class="nota">Aceitamos talões dos últimos 7 dias, até 3 por dia. Cada talão só conta uma vez.</p></div>' +
      '<input type="file" id="fotoTalao" accept="image/*" capture="environment" hidden>' +
      '<div id="zonaTalao"><button class="btn laranja cheio" id="tirarFoto" style="padding:16px">📷 Fotografar o talão</button></div>';
    var input = document.getElementById('fotoTalao');
    document.getElementById('tirarFoto').onclick = function () { input.click(); };
    input.onchange = function () { if (input.files && input.files[0]) preparaTalao(input.files[0]); };
  };

  function comprime(ficheiro) {
    return new Promise(function (ok, falha) {
      var url = URL.createObjectURL(ficheiro);
      var img = new Image();
      img.onload = function () {
        var maxW = 1100, maxH = 2600;
        var s = Math.min(1, maxW / img.width, maxH / img.height);
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        ok(c.toDataURL('image/jpeg', 0.74));
      };
      img.onerror = function () { URL.revokeObjectURL(url); falha(new Error('imagem')); };
      img.src = url;
    });
  }

  function preparaTalao(ficheiro) {
    var zona = document.getElementById('zonaTalao');
    comprime(ficheiro).then(function (dataUrl) {
      zona.innerHTML = '<img class="foto-talao" src="' + dataUrl + '" alt="O teu talão">' +
        '<p class="sub" style="text-align:center;margin-bottom:10px">Os valores lêem-se bem? Se não, tira outra foto.</p>' +
        '<button class="btn laranja cheio" id="enviarTalao">Enviar talão</button>' +
        '<button class="btn linha cheio" id="outraFoto" style="margin-top:10px">Tirar outra foto</button>';
      document.getElementById('outraFoto').onclick = function () { document.getElementById('fotoTalao').value = ''; document.getElementById('fotoTalao').click(); };
      document.getElementById('enviarTalao').onclick = function () { enviaTalao(dataUrl); };
    }).catch(function () { toast('Não conseguimos abrir a foto. Tenta outra vez.'); });
  }

  function enviaTalao(dataUrl) {
    var zona = document.getElementById('zonaTalao');
    zona.innerHTML = '<div class="card resultado"><div class="girar"></div><b>A ler o teu talão…</b><p class="sub">Demora uns segundos.</p></div>';
    fetch('/api/talao', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: token(), imagem: dataUrl }) })
      .then(function (r) { return r.json().catch(function () { return { erro: 'servidor' }; }); })
      .then(function (j) {
        var msgs = {
          limite: 'Já enviaste 3 talões hoje. Guarda este e envia amanhã.',
          sessao: 'A tua sessão terminou. Entra outra vez.',
          grande: 'A foto é demasiado grande. Tenta outra vez.',
          origem: 'Abre a app em quenteebom.com/app.',
          pedido: 'Houve um problema com a foto. Tenta outra vez.'
        };
        if (j.erro) {
          zona.innerHTML = '<div class="card resultado"><div style="font-size:42px">😕</div><h3 style="margin:8px 0">Não deu desta vez</h3><p>' + esc(j.msg || msgs[j.erro] || 'Tenta outra vez daqui a pouco.') + '</p></div>' +
            '<a class="btn laranja cheio" href="#/talao" id="denovo">Tentar outra vez</a>';
          document.getElementById('denovo').onclick = function (e) { e.preventDefault(); ECRAS.talao(); };
          return;
        }
        var html = '<div class="card resultado">';
        if (j.estado === 'aprovado') {
          html += '<div style="font-size:42px">🎉</div><div class="grande">+' + j.pontos + '</div><b>pontos na tua conta</b>' +
            '<p class="sub" style="margin-top:8px">' + kz(j.total_qeb) + ' em produtos Quente e Bom' + (j.insignia ? ' no ' + esc(j.insignia) : '') + '.</p>';
        } else if (j.estado === 'revisao') {
          html += '<div style="font-size:42px">🔎</div><h3 style="margin:8px 0">Recebido, em revisão</h3><p>' + esc(j.motivo) + '</p>' +
            '<p class="sub" style="margin-top:8px">Se for aprovado, ganhas ' + j.pontos + ' pontos.</p>';
        } else {
          html += '<div style="font-size:42px">😕</div><h3 style="margin:8px 0">Talão não aceite</h3><p>' + esc(j.motivo) + '</p>';
        }
        if (j.produtos && j.produtos.length) html += '<p class="nota">Lemos: ' + j.produtos.map(esc).join(', ') + '</p>';
        html += '</div><a class="btn ameixa cheio" href="#/pontos">Ver os meus pontos</a>';
        zona.innerHTML = html;
        carregaEu();
      })
      .catch(function () {
        zona.innerHTML = '<div class="card resultado"><p>Sem ligação à internet. O talão não foi enviado.</p></div><button class="btn laranja cheio" id="repetir">Tentar outra vez</button>';
        document.getElementById('repetir').onclick = function () { enviaTalao(dataUrl); };
      });
  }

  ECRAS.pontos = function () {
    if (!EU) { ecra.innerHTML = '<h1 style="margin-top:18px">Os meus pontos</h1>' + pedeConta('Ainda não tens conta'); return; }
    var premios = [['🧺', 'Cabaz Quente e Bom', 'Uma seleção dos nossos produtos'], ['🍞', 'Torradeira', 'Para o pão de forma de todas as manhãs'], ['🥪', 'Tostadeira', 'Tostas mistas em minutos'], ['♨️', 'Forno eléctrico de bancada', 'Para as receitas de forno']];
    var hist = (EU.historico || []).map(function (h) { return '<div class="linha-h"><span>' + esc(h.motivo) + ' <small class="sub">' + dataCurta(h.criado_em) + '</small></span><span class="mais">' + (h.delta > 0 ? '+' : '') + h.delta + '</span></div>'; }).join('');
    var tal = (EU['talões'] || []).map(function (t) {
      var nomes = { aprovado: 'Aprovado', revisao: 'Em revisão', rejeitado: 'Não aceite' };
      return '<div class="linha-h"><span>' + esc(t.insignia || 'Talão') + ' · ' + kz(t.total_qeb) + ' <small class="sub">' + dataCurta(t.criado_em) + '</small></span><span class="estado ' + t.estado + '">' + nomes[t.estado] + '</span></div>';
    }).join('');
    ecra.innerHTML = '<h1 style="margin-top:18px">Os meus pontos</h1>' +
      '<div class="card" style="text-align:center"><div class="saldo">' + EU.saldo + '</div><b>' + (EU.saldo === 1 ? 'ponto' : 'pontos') + '</b><p class="sub" style="margin-top:6px">' + esc(EU.nome) + (EU.municipio ? ' · ' + esc(EU.municipio) : '') + '</p>' +
      '<a class="btn laranja" href="#/talao" style="margin-top:14px">🧾 Enviar talão</a></div>' +
      '<h2>Prémios</h2><div class="card">' + premios.map(function (p) { return '<div class="premio"><div class="ic">' + p[0] + '</div><div><b>' + p[1] + '</b><div class="sub">' + p[2] + '</div></div></div>'; }).join('') +
      '<p class="nota">Os prémios e os pontos de cada um são anunciados em breve. Os teus pontos já estão a contar.</p></div>' +
      (tal ? '<h2>Talões</h2><div class="card">' + tal + '</div>' : '') +
      '<h2>Histórico</h2><div class="card">' + (hist || '<p class="sub">Ainda sem movimentos. Começa pela visita da manhã!</p>') + '</div>' +
      '<p class="nota" style="text-align:center;margin:20px 0">Programa em fase piloto. <a href="/privacidade.html">Privacidade</a></p>';
  };

  ECRAS.entrar = function () {
    if (EU) { location.hash = '#/'; return; }
    ecra.innerHTML = '<div class="card sol" style="margin-top:18px"><div class="eyebrow" style="color:#F6C440">Bem-vindo</div><h2>Compras Quente e Bom valem pontos</h2>' +
      '<p style="opacity:.9">Fotografa os talões, junta pontos e troca-os por prémios. E todos os dias há uma receita nova à tua espera.</p></div>' +
      '<form class="card" id="fEntrar"><label class="campo" for="eNome">Nome</label><input class="campo-in" id="eNome" autocomplete="name" maxlength="60" required>' +
      '<label class="campo" for="eTel">Telemóvel</label><input class="campo-in" id="eTel" type="tel" inputmode="tel" autocomplete="tel" placeholder="9XX XXX XXX" required>' +
      '<label class="campo" for="eMun">Município</label><input class="campo-in" id="eMun" list="lMun" maxlength="60" placeholder="Ex.: Viana" required><datalist id="lMun">' + MUNICIPIOS.map(function (m) { return '<option value="' + esc(m) + '">'; }).join('') + '</datalist>' +
      '<div class="erro" id="eErro" hidden></div>' +
      '<button class="btn laranja cheio" style="margin-top:16px">Criar conta</button>' +
      '<p class="nota">Ao criar conta aceitas a <a href="/privacidade.html">Política de Privacidade</a>. Usamos o teu telemóvel só para te contactar se ganhares um prémio.</p></form>' +
      '<a class="btn linha cheio" href="#/receitas">Só quero ver receitas</a>';
    document.getElementById('fEntrar').onsubmit = function (e) {
      e.preventDefault();
      var btn = this.querySelector('button'), err = document.getElementById('eErro');
      btn.disabled = true; err.hidden = true;
      rpc('app_registar', { p_nome: document.getElementById('eNome').value, p_telemovel: document.getElementById('eTel').value, p_municipio: document.getElementById('eMun').value })
        .then(function (j) {
          if (j.token) { guarda('qeb_token', j.token); return carregaEu().then(function () { toast('Conta criada. Bem-vindo! ☀️'); location.hash = '#/'; }); }
          var m = { telemovel_invalido: 'Confirma o número: são 9 algarismos e começa por 9.', nome_invalido: 'Escreve o teu nome.', telemovel_existe: 'Este número já tem conta. Se mudaste de telemóvel, fala com o Joaquim e a equipa ajuda-te.' };
          err.textContent = m[j.erro] || 'Não conseguimos criar a conta. Tenta outra vez.'; err.hidden = false; btn.disabled = false;
        })
        .catch(function () { err.textContent = 'Sem ligação. Tenta outra vez.'; err.hidden = false; btn.disabled = false; });
    };
  };

  // ---------- Joaquim ----------
  function abrirChef(pergunta) {
    if (typeof window.openBento !== 'function') return;
    window.openBento();
    if (pergunta) {
      var i = document.getElementById('bpInput');
      if (i) { i.value = pergunta; i.focus(); }
    }
  }
  document.getElementById('abrirChef').onclick = function () { abrirChef(); };

  // ---------- router ----------
  function rota() {
    var r = (location.hash.replace(/^#\/?/, '').split('?')[0]) || 'inicio';
    if (!ECRAS[r]) r = 'inicio';
    fechaFolha();
    if (typeof window.closeBento === 'function') { try { window.closeBento(); } catch (e) {} }
    Array.prototype.forEach.call(document.querySelectorAll('.tabs a'), function (a) { a.classList.toggle('on', a.dataset.r === r); });
    ECRAS[r]();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', rota);

  ecra.innerHTML = '<div class="girar" style="margin-top:60px"></div>';
  Promise.all([carregaDados(), carregaEu()]).then(function () {
    if (!token() && !le('qeb_visto') && !location.hash) { guarda('qeb_visto', '1'); location.hash = '#/entrar'; }
    rota();
  }).catch(function () {
    ecra.innerHTML = '<div class="card resultado" style="margin-top:30px"><p>Sem ligação à internet.</p><button class="btn laranja" onclick="location.reload()" style="margin-top:12px">Tentar outra vez</button></div>';
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/app/sw.js', { scope: '/app/' }).catch(function () {}); });
  }
})();
