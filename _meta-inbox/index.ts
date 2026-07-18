// Supabase Edge Function: meta-inbox
// Recebe webhooks de comentários e mensagens do Facebook + Instagram da Quente e Bom,
// gera respostas no tom do Chef Joaquim e envia email ao Sandro com botão "Aprovar e enviar".
// ⚠️ NADA é publicado sem clique humano.
//
// REGRA: a cada COMENTÁRIO responde SEMPRE de duas formas -> (1) resposta pública ao comentário
//        + (2) mensagem PRIVADA (DM) à mesma pessoa. Ambas no mesmo clique de aprovação.
//        A cada MENSAGEM privada -> uma resposta privada.
//
// Deploy: colar no editor de Edge Functions do Supabase (projeto qciagsktkqljvknmahfu), nome "meta-inbox".
// Secrets: ver _meta-inbox/SETUP.md

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GRAPH = "https://graph.facebook.com/v21.0";
const env = (k: string, d = "") => Deno.env.get(k) ?? d;

const VERIFY_TOKEN = env("META_VERIFY_TOKEN");
const APP_SECRET   = env("META_APP_SECRET");
const PAGE_TOKEN   = env("META_PAGE_TOKEN");
const ANTHROPIC_KEY= env("ANTHROPIC_API_KEY");
// Redator (desde 18/07/2026): a conta Console da Anthropic foi perdida; a IA passa pelo
// proxy /api/redator no quenteebom.com (AI Gateway da Netlify), autenticado por segredo
// partilhado. Secrets novos por projeto: REDATOR_KEY (obrigatório) e REDATOR_URL (opcional).
const REDATOR_URL  = env("REDATOR_URL", "https://quenteebom.com/api/redator");
const REDATOR_KEY  = env("REDATOR_KEY");
const RESEND_KEY   = env("RESEND_API_KEY");
const NOTIFY_EMAIL = env("NOTIFY_EMAIL", "sandro.qb@gmail.com");
// Destino dos LEADS (pedidos de cotação). Por defeito = NOTIFY_EMAIL (o Gmail do Sandro,
// o único destinatário permitido enquanto o Resend não tiver domínio verificado).
// Depois de verificar um domínio, pôr o secret LEADS_EMAIL=geral@quenteebom.co.ao.
const LEADS_EMAIL = env("LEADS_EMAIL", NOTIFY_EMAIL);
const FROM_EMAIL   = env("FROM_EMAIL", "Joaquim da Quente e Bom <inbox@quenteebom.com>");
const HMAC_SECRET  = env("HMAC_SECRET");
const FN_BASE      = env("FN_BASE");
const PROMPT_URL   = env("PROMPT_URL", "https://quenteebom.com/bento-prompt.txt");
// Identidade da marca (por deployment) — defaults = Quente e Bom
const BRAND        = env("BRAND_NAME", "Quente e Bom");
const BRAND_BG     = env("BRAND_BG", "#5B2A4A");     // fundo do cabeçalho + texto do botão
const BRAND_ACCENT = env("BRAND_ACCENT", "#F6C440"); // realces + fundo do botão
const BRAND_SITE   = env("BRAND_SITE", "https://quenteebom.com"); // site da marca (página /inbox.html de confirmação)
// PILOTO AUTOMÁTICO de mensagens privadas (DMs). "" = desligado (tudo por aprovação);
// "fb" = responde sozinho às DMs SIMPLES do Facebook; "all" = FB+Instagram.
// Mesmo ligado, a IA só auto-responde ao que classificar como seguro (saudação, onde comprar,
// produto, receita); reclamações/comercial/preços/ambíguo ficam SEMPRE para aprovação humana.
const AUTO_REPLY   = env("AUTO_REPLY", "").toLowerCase();

const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

// ---------- assinatura ----------
async function hmacHex(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function validSignature(req: Request, raw: string) {
  const sig = req.headers.get("x-hub-signature-256") || "";
  if (!APP_SECRET) return true;
  return sig === "sha256=" + await hmacHex(APP_SECRET, raw);
}

// ---------- cérebro do Joaquim ----------
let cachedPrompt = ""; let cachedAt = 0;
async function brand(): Promise<string> {
  if (Date.now() - cachedAt < 300000 && cachedPrompt) return cachedPrompt;
  try { cachedPrompt = await (await fetch(PROMPT_URL)).text(); cachedAt = Date.now(); }
  catch { cachedPrompt = cachedPrompt || "És o Joaquim, o Chef da Quente e Bom (padaria angolana). Responde curto, caloroso, em português de Angola."; }
  return cachedPrompt;
}
async function claude(system: string, user: string, max = 400, image: { data: string; mime: string } | null = null): Promise<string> {
  // image (opcional, em base64) permite ao Joaquim VER uma imagem — ex.: a story a que alguém respondeu.
  const content: any = image
    ? [{ type: "image", source: { type: "base64", media_type: image.mime, data: image.data } }, { type: "text", text: user || "(sem texto)" }]
    : (user || "(sem texto)");
  const corpo = JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: max, system,
    messages: [{ role: "user", content }] });
  // Via preferida: proxy redator (AI Gateway da Netlify). Fallback: chave direta, se existir.
  const r = REDATOR_KEY
    ? await fetch(REDATOR_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "x-redator-key": REDATOR_KEY },
        body: corpo,
      })
    : await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
        body: corpo,
      });
  const j = await r.json();
  if (!r.ok) console.error("claude/redator:", r.status, JSON.stringify(j).slice(0, 300));
  return (j?.content?.[0]?.text || "").trim();
}
// descarrega uma imagem (ex.: a story) e devolve-a em base64 — URLs lookaside expiram, por isso
// buscamos NO MOMENTO do webhook (fresca). Devolve null se falhar (o redator cai para só-texto).
async function fetchImageB64(u: string): Promise<{ data: string; mime: string } | null> {
  try {
    let r = await fetch(u);
    if (!r.ok) { const tk = await pageTok(); r = await fetch(u + (u.includes("?") ? "&" : "?") + "access_token=" + tk); }
    if (!r.ok) return null;
    const mime = r.headers.get("content-type") || "image/jpeg";
    if (!/^image\//.test(mime)) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    if (buf.length > 4_500_000) return null; // demasiado grande — evita estoirar memória/base64
    let bin = ""; for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return { data: btoa(bin), mime: mime.split(";")[0] };
  } catch { return null; }
}
const RULES = `Regras gerais (aplicam-se sempre, além das regras da marca acima):
- Nunca inventes preços, moradas de loja, stocks, promoções ou factos. Reclamações -> lamenta com empatia e encaminha para os canais oficiais da marca.
- LINKS: isto é uma resposta de rede social, NÃO renderiza markdown. NUNCA uses o formato [texto](url) nem links relativos tipo "receitas.html". **UM link no máximo por resposta** (regra rígida — escolhe o melhor). O link deve ser um URL completo e CURTO, sem #âncora (ex.: ${BRAND_SITE}/receitas.html — âncoras longas não abrem bem no telemóvel); diz por palavras o que procurar na página (ex.: "procura aí 'Queques de Chocolate'"). Usa APENAS URLs que constem do conhecimento da marca — NUNCA inventes caminhos; na dúvida, usa ${BRAND_SITE}.
- NOME: se o nome do cliente for indicado e parecer um nome próprio real (ex.: "Ana", "Carlos M."), cumprimenta-o pelo PRIMEIRO nome na primeira frase ("Olá, Ana! ..."). Se for um nome de utilizador técnico (ex.: "xpto_2384"), não o uses.
- Gramática: Angola é FEMININO — escreve sempre "toda a Angola" / "em toda a Angola" (nunca "todo o Angola" nem "toda Angola").
- ⚠️ PORTUGUÊS EUROPEU/DE ANGOLA, NUNCA do Brasil — regra rígida: a saudação é SEMPRE "Olá" (escrever "Oi" é um ERRO GRAVE); "pequeno-almoço" (nunca "café da manhã"), "fresquinho/gelado" (nunca "geladinho"), ênclise ("encontras-me", nunca "me encontras"), "precisas DE falar" (nunca "precisas falar"), "casa de banho", "autocarro", "telemóvel".
- Tom caloroso e fiel à voz da marca. 0-1 emoji. Responde em português.
- DOMÍNIO: o único site da marca é ${BRAND_SITE}. NUNCA escrevas domínios genéricos ou de exemplo ("site.com", "exemplo.com", "nossosite.com", "o nosso site.com/...") — isso é um erro grave. Se deres um link, escreve o URL COMPLETO começando por https:// e pertencente a ${BRAND_SITE}.`;

// Rede de segurança: converte markdown [texto](url) em texto simples com URL completo
function plainLinks(s: string): string {
  return String(s || "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, t, u) => {
      const abs = /^https?:\/\//i.test(u) ? u : `${BRAND_SITE}/${String(u).replace(/^\//, "")}`;
      return `${t} — ${abs}`;
    })
    // só converte tokens que PARECEM caminhos (têm .htm ou uma /): nunca palavras normais como "receitas"
    .replace(/(^|[\s(])\/?((?:receitas|catalogo|foodcost|cotacao|formacao|dicas|contacto|profissional|revendedor)[\w\-]*(?:\.html?|\/[\w\-\/]+)(?:#[\w\-]*)?)/gi,
      (m, pre, path) => (m.includes("http") ? m : `${pre}${BRAND_SITE}/${path.replace(/^\//, "")}`));
}
// Rede de segurança PT-EU/Angola: corrige brasileirismos que escapem ao prompt.
// Determinística — corre em TODAS as respostas (o tidyLinks é o sanitizador mais exterior).
function fixPtAo(s: string): string {
  return String(s || "")
    .replace(/\bOi\b/g, "Olá").replace(/\boi\b(?=[!,. ])/g, "olá")
    .replace(/café da manhã/gi, "pequeno-almoço")
    .replace(/geladinh(o|a)s?\b/gi, "fresquinho")
    .replace(/\bcelular(es)?\b/gi, "telemóvel")
    .replace(/\bbanheiro\b/gi, "casa de banho")
    .replace(/\b[ôo]nibus\b/gi, "autocarro")
    .replace(/\bsorvetes?\b/gi, "gelado")
    .replace(/\btrem\b/gi, "comboio")
    // "precisas falar" -> "precisas de falar" (precisar + infinitivo pede "de" em PT-EU)
    .replace(/\b(precis(?:as|a|amos|am))\s+((?:[a-zá-úà-ãç]+)(?:ar|er|ir))\b/gi, "$1 de $2");
}
// Arruma os links: se houver um link específico (com caminho), as ocorrências do domínio "solto"
// (normalmente resultado de um URL inventado que foi corrigido) passam a "o nosso site".
function tidyLinks(s: string): string {
  let out = fixPtAo(String(s || ""));
  const urls = out.match(/https?:\/\/[^\s)\]"',]+/g) || [];
  const temEspecifico = urls.some((u) => { try { return new URL(u).pathname.replace(/\/$/, "").length > 1; } catch { return false; } });
  if (temEspecifico) {
    // ⚠️ tem de apanhar o URL INTEIRO (mesmo charset da deteção acima). O regex antigo
    // ([\w.\-]+ com lookahead que incluía ".") podia parar antes de ".com" e transformava
    // "https://massaprima.com/catalogo.html" em "o nosso site.com/catalogo.html" — bug real em produção.
    out = out.replace(/https?:\/\/[^\s)\]"',]+/g, (m) => {
      const clean = m.replace(/[.!?;:]+$/, ""); // pontuação final fora do URL
      const tail = m.slice(clean.length);
      try { return (new URL(clean).pathname.replace(/\/$/, "").length > 1 ? clean : "o nosso site") + tail; } catch { return m; }
    });
  }
  return out;
}
// Rede de segurança 2: apanha DOMÍNIOS INVENTADOS sem protocolo (ex.: "site.com/catalogo.html",
// "exemplo.com") que escapam ao checkLinks (que só valida URLs com https://). Qualquer domínio
// fora da allowlist é substituído: mantém a página se for conhecida, senão aponta para o site da marca.
function fixFakeDomains(s: string): string {
  const brandHost = (() => { try { return new URL(BRAND_SITE).hostname.replace(/^www\./, ""); } catch { return ""; } })();
  const ALLOW = [brandHost, "quenteebom.com", "quenteebom.co.ao", "massaprima.com", "aguaminda.com", "facebook.com", "instagram.com", "wa.me"].filter(Boolean);
  const allowed = (h: string) => ALLOW.some((a) => h === a || h.endsWith("." + a));
  return String(s || "").replace(
    /(https?:\/\/)?\b([a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|pt|co\.ao|ao|net|org|io))((?:\/[\w\-.%#]*)*)/gi,
    (m, _proto, host, path) => {
      const h = String(host).toLowerCase().replace(/^www\./, "");
      if (allowed(h)) return m;
      const page = String(path || "").match(/(receitas|catalogo|foodcost|cotacao|formacao|dicas|contacto|profissional|revendedor)[\w\-]*\.html?/i);
      return page ? `${BRAND_SITE}/${page[0]}` : BRAND_SITE;
    });
}
// Verifica cada URL ao vivo; se não existir (404/erro), substitui pelo site oficial da marca.
// Também remove #âncoras (a app móvel do Instagram não linkifica bem URLs com fragmento).
async function checkLinks(s: string): Promise<string> {
  let out = String(s || "");
  const urls = [...new Set(out.match(/https?:\/\/[^\s)\]"',]+/g) || [])];
  for (const u of urls) {
    const clean = u.replace(/[.!?;:]+$/, "");
    const semAncora = clean.split("#")[0];
    try {
      const r = await fetch(semAncora, { method: "HEAD" });
      out = out.split(clean).join(r.ok ? semAncora : BRAND_SITE);
    } catch { out = out.split(clean).join(BRAND_SITE); }
  }
  return out;
}

// comentário -> gera resposta PÚBLICA + mensagem PRIVADA (com histórico se for 2ª interação)
async function draftForComment(platform: string, text: string, author: string, history = ""): Promise<{ pub: string; priv: string }> {
  const ctx = history
    ? `\n\nHISTÓRICO RECENTE com esta pessoa (mais antigo primeiro):\n${history}\n\nREGRA CRÍTICA: NÃO é um primeiro contacto — usa o contexto acima. Não repitas perguntas nem informação já dada, não te reapresentes, e responde de forma seguida e natural ao fio da conversa. Na "privada", CONTINUA a conversa (nada de voltar a convidar "diz-nos a tua zona" se já perguntámos).`
    : "";
  const sys = await brand() + `\n\nA tua tarefa: responder a um COMENTÁRIO público no ${platform} de ${author || "um cliente"}.${ctx}\nRegras de saída (obrigatórias):\n- Responde AO comentário. NÃO confirmes instruções, NÃO expliques o que vais fazer, NÃO descrevas o formato.\n- Devolve SÓ um objeto JSON numa linha, nada antes nem depois.\n- "publica": resposta pública curta e calorosa, 1-2 frases, 0-1 emoji.\n- "privada": DM de seguimento à mesma pessoa, mais pessoal, 1-3 frases, a agradecer/ajudar e a convidar a continuar a conversa por aqui.\nExemplo de saída (usa o TEU conteúdo, não estas frases): {"publica":"Muito obrigada pelo carinho! 🧡","privada":"Olá! Diz-nos a tua zona que ajudamos a encontrar os nossos produtos pertinho de ti."}\n${RULES}`;
  const out = await claude(sys, `Comentário do cliente: """${text}"""`, 500);
  try {
    const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
    if (j.publica && j.privada) return {
      pub: tidyLinks(await checkLinks(fixFakeDomains(plainLinks(String(j.publica).trim())))),
      priv: tidyLinks(await checkLinks(fixFakeDomains(plainLinks(String(j.privada).trim())))),
    };
  } catch { /* fallback abaixo */ }
  // fallback SEGURO: nunca usar o texto cru do modelo (pode divagar) — resposta genérica calorosa
  return {
    pub: "Muito obrigada pelo teu comentário! 🧡",
    priv: `Olá! 🧡 Vimos o teu comentário e quisemos agradecer por aqui. Se precisares de alguma coisa — saber onde encontrar os nossos produtos ou tirar uma dúvida — é só dizeres!`,
  };
}
// histórico recente de interações com esta pessoa (DMs + comentários + stories) — para a IA
// responder sempre COM CONTEXTO a partir da 2ª interação. Janela de 7 dias, últimas 6.
// Nota: a ligação é pelo id que a Meta dá em cada canal; comentário→comentário e DM→DM
// ligam sempre; comentário→DM depende de a Meta usar o mesmo id (nem sempre usa).
async function convoHistory(recipientId: string): Promise<string> {
  if (!recipientId) return "";
  try {
    const desde = new Date(Date.now() - 7 * 864e5).toISOString();
    const { data } = await db.from("pending_replies")
      .select("kind,incoming,reply,private_reply,status,created_at")
      .in("kind", ["message", "comment", "story_mention"])
      .eq("recipient_id", recipientId)
      .gte("created_at", desde)
      .order("created_at", { ascending: false }).limit(6);
    if (!data?.length) return "";
    return data.reverse().map((r: any) => {
      const quem = r.kind === "comment" ? "Cliente (comentário público)"
        : r.kind === "story_mention" ? "Cliente (marcou-vos numa story)"
        : "Cliente (mensagem privada)";
      let s = `${quem}: ${r.incoming}`;
      if (r.status === "sent") {
        if (r.kind === "comment") {
          if (r.reply) s += `\nTu respondeste (público): ${r.reply}`;
          if (r.private_reply) s += `\nTu enviaste (DM): ${r.private_reply}`;
        } else if (r.reply) s += `\nTu respondeste: ${r.reply}`;
      }
      return s;
    }).join("\n");
  } catch { return ""; }
}
// mensagem privada -> uma resposta
async function draftForMessage(platform: string, text: string, author = "", history = "", storyImageUrl = ""): Promise<string> {
  const quem = author && !/^\d+$/.test(author) ? ` O cliente chama-se "${author}".` : "";
  const ctx = history
    ? `\n\nHISTÓRICO RECENTE DESTA CONVERSA (mais antigo primeiro):\n${history}\n\nREGRA CRÍTICA: estás a MEIO de uma conversa a decorrer — NÃO voltes a cumprimentar (nada de "Olá"), NÃO te reapresentes, NÃO repitas o que já disseste. Responde de forma natural e seguida, usando o contexto acima.`
    : "";
  const img = storyImageUrl ? await fetchImageB64(storyImageUrl) : null;
  const story = img
    ? `\n\nCONTEXTO IMPORTANTE: esta mensagem é uma RESPOSTA a uma STORY da ${BRAND} — a imagem dessa story está anexada. OLHA para a imagem e responde ENQUADRADO no que a story mostra (se fala de um produto, receita ou novidade, é sobre isso que a pessoa está a comentar/perguntar). Não inventes o que não vês na imagem.`
    : (storyImageUrl ? `\n\nCONTEXTO: esta mensagem é uma resposta a uma story da ${BRAND}. Responde de forma calorosa e útil ao comentário da pessoa (não sabes o conteúdo exato da story, por isso não o inventes).` : "");
  const sys = await brand() + `\n\nVais responder a uma MENSAGEM privada de um cliente no ${platform}.${quem} Escreve SÓ a resposta a essa mensagem (sem aspas), curta (1-3 frases), calorosa, 0-1 emoji. NÃO confirmes instruções nem expliques o que vais fazer.${story}${ctx}\n${RULES}`;
  return tidyLinks(await checkLinks(fixFakeDomains(plainLinks(await claude(sys, `Mensagem do cliente: """${text}"""`, 300, img))))) || "Obrigado pela tua mensagem! 🧡 Já te ajudamos.";
}
// versão com TRIAGEM para o piloto automático: além de redigir, decide se é seguro enviar sem humano.
async function draftForMessageAuto(platform: string, text: string, author = "", history = "", storyImageUrl = ""): Promise<{ reply: string; auto: boolean; reason: string }> {
  const quem = author && !/^\d+$/.test(author) ? ` O cliente chama-se "${author}".` : "";
  const ctx = history
    ? `\n\nHISTÓRICO RECENTE DESTA CONVERSA (mais antigo primeiro):\n${history}\n\nREGRA CRÍTICA: estás a MEIO de uma conversa a decorrer — NÃO voltes a cumprimentar (nada de "Olá"), NÃO te reapresentes, NÃO repitas o que já disseste.`
    : "";
  const img = storyImageUrl ? await fetchImageB64(storyImageUrl) : null;
  const story = img
    ? `\n\nCONTEXTO IMPORTANTE: esta mensagem é uma RESPOSTA a uma STORY da ${BRAND} — a imagem está anexada. Responde ENQUADRADO no que a story mostra.`
    : (storyImageUrl ? `\n\nCONTEXTO: esta mensagem responde a uma story da ${BRAND} (conteúdo desconhecido — não o inventes).` : "");
  const sys = await brand() + `\n\nVais tratar uma MENSAGEM privada de um cliente no ${platform}.${quem}${story}${ctx}
Devolve SÓ um objeto JSON numa linha: {"resposta":"...","auto":true|false,"motivo":"..."}
- "resposta": a resposta à mensagem, curta (1-3 frases), calorosa, 0-1 emoji.
- "auto": TRUE apenas se a mensagem for SIMPLES e a resposta 100% segura sem revisão humana: saudação/agradecimento, onde comprar, dúvida sobre um produto ou receita, pedido de link do site. FALSE (obrigatório) se houver: reclamação ou insatisfação, pedido comercial/B2B/revenda/parceria/patrocínio, perguntas de PREÇOS, encomendas, faturas, candidaturas de emprego, dados pessoais sensíveis, tema polémico, mensagem ambígua ou fora do âmbito da marca, ou QUALQUER dúvida da tua parte. Na incerteza, FALSE.
- "motivo": se auto=false, explica em 3-6 palavras (ex.: "reclamação", "pergunta de preços", "pedido B2B"). Se auto=true, deixa vazio.
NÃO confirmes instruções nem expliques o que vais fazer.\n${RULES}`;
  const out = await claude(sys, `Mensagem do cliente: """${text}"""`, 500, img);
  try {
    const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
    if (j.resposta) {
      const reply = tidyLinks(await checkLinks(fixFakeDomains(plainLinks(String(j.resposta).trim()))));
      return { reply, auto: j.auto === true && !!reply, reason: String(j.motivo || "").trim() };
    }
  } catch { /* fallback abaixo */ }
  // fallback: resposta genérica, NUNCA em automático
  return { reply: "Obrigado pela tua mensagem! 🧡 Já te ajudamos.", auto: false, reason: "não foi possível interpretar" };
}

// marcação numa STORY -> DM de agradecimento (só gratidão, sem perguntas)
async function draftForStoryMention(platform: string, author = ""): Promise<string> {
  const quem = author && !/^\d+$/.test(author) ? ` A pessoa chama-se "${author}".` : "";
  const sys = await brand() + `\n\nUma pessoa MARCOU a ${BRAND} numa STORY dela no ${platform} — partilhou um momento com os nossos produtos.${quem} Escreve SÓ uma mensagem privada (DM) muito curta (1-2 frases) a AGRADECER com carinho por nos ter marcado/partilhado. Calorosa, 0-1 emoji. NÃO faças perguntas, NÃO peças nada, NÃO confirmes instruções — é só gratidão genuína.\n${RULES}`;
  return tidyLinks(await checkLinks(fixFakeDomains(plainLinks(await claude(sys, "A pessoa marcou-nos numa story dela.", 200))))) || "Muito obrigado por nos marcares na tua story! 🧡";
}

// menção no Instagram: o webhook só dá os ids -> ir buscar o texto, o autor e o CONTEXTO
// (a legenda da publicação onde fomos mencionados, para não responder às cegas).
async function fetchMentionText(item: any): Promise<{ text: string; author: string; context: string }> {
  const [type, id] = String(item.target_id).split(":");
  const tk = await pageTok();
  try {
    if (type === "comment") {
      // além do comentário, expande media{caption} = a legenda da publicação-mãe
      const r = await fetch(`${GRAPH}/${item.account_id}?fields=mentioned_comment.comment_id(${id})%7Btext,username,media%7Bcaption,username%7D%7D&access_token=${tk}`);
      const j = await r.json(); const mc = j?.mentioned_comment;
      return { text: mc?.text || "", author: mc?.username || "", context: mc?.media?.caption || "" };
    } else {
      // menção na legenda: o próprio texto já é a publicação inteira — não há contexto extra
      const r = await fetch(`${GRAPH}/${item.account_id}?fields=mentioned_media.media_id(${id})%7Bcaption,username%7D&access_token=${tk}`);
      const j = await r.json(); const mm = j?.mentioned_media;
      return { text: mm?.caption || "", author: mm?.username || "", context: "" };
    }
  } catch { return { text: "", author: "", context: "" }; }
}
// menção -> decide SE responde (só a coisas positivas/úteis, nunca em contexto negativo de estranhos) e redige.
async function draftForMention(text: string, author = "", context = "", platform = "Instagram"): Promise<{ shouldReply: boolean; reply: string; reason: string }> {
  const quem = author ? ` A publicação/comentário é de "@${author}".` : "";
  const ctx = context
    ? `\n\n>>> A PUBLICAÇÃO onde fomos mencionados diz o seguinte (LÊ COM ATENÇÃO antes de escreveres):\n"""${context}"""\n\nREGRAS OBRIGATÓRIAS ao responder:\n1. Identifica na publicação QUAL é o produto ou a receita de que a pessoa fala (ex.: um bolo específico, um pão, uma receita concreta) e refere-te a ELE PELO NOME na tua resposta.\n2. É PROIBIDO perguntar "qual foi a receita?", "que produto usaste?" ou pedir qualquer informação que JÁ ESTEJA na publicação acima — a resposta já lá está, perguntar faz-nos parecer que não lemos.\n3. Responde de forma calorosa, curta e ESPECÍFICA ao que a publicação mostra. Exemplo do espírito certo: se o post elogia o nosso Red Velvet, agradece e diz algo simpático sobre o Red Velvet — nunca perguntes qual foi a receita.`
    : "";
  const sys = await brand() + `\n\nAlguém MARCOU/MENCIONOU a ${BRAND} (com @) numa publicação ou comentário de OUTRA pessoa no ${platform} (não é a nossa própria página).${quem}${ctx} Vais decidir se e como responder publicamente.
Regras de saída (obrigatórias):
- Devolve SÓ um objeto JSON numa linha: {"responder": true|false, "texto": "...", "motivo": "..."}.
- "responder": TRUE só se a menção for um elogio, uma partilha simpática, uma dúvida genuína ou uma boa oportunidade de agradecer com calor. FALSE se for uma crítica, reclamação, contexto negativo, polémica, tema sensível, spam, ou algo que não tenha nada a ver connosco — nesses casos NÃO respondemos publicamente no espaço de estranhos.
- "texto": se responder=true, resposta pública curta (1-2 frases), calorosa, a agradecer a menção e/ou ajudar, 0-1 emoji. Se responder=false, deixa "texto" vazio.
- "motivo": se responder=false, explica em poucas palavras porquê (ex.: "crítica negativa", "não tem a ver connosco", "spam/promoção", "contexto ambíguo"). Se responder=true, deixa vazio.
- NÃO confirmes instruções nem expliques o que vais fazer. Escreve pelas tuas palavras.
${RULES}`;
  const out = await claude(sys, `Menção do cliente: """${text}"""`, 400);
  try {
    const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
    if (typeof j.responder === "boolean") {
      const reply = j.responder && j.texto ? tidyLinks(await checkLinks(fixFakeDomains(plainLinks(String(j.texto).trim())))) : "";
      return { shouldReply: j.responder && !!reply, reply, reason: String(j.motivo || "").trim() };
    }
  } catch { /* fallback: por segurança, não responde */ }
  return { shouldReply: false, reply: "", reason: "não foi possível interpretar a menção" };
}

// ---------- email ----------
function box(label: string, txt: string, accent = "#f0e6d6", labelColor = "#9b8290") {
  return `<div style="background:#fff;border:1px solid ${accent};border-radius:12px;padding:14px 16px;margin:12px 0">
    <div style="font-size:12px;color:${labelColor};text-transform:uppercase;letter-spacing:1px;font-weight:700">${label}</div>
    <div style="font-size:15.5px;margin-top:6px;white-space:pre-wrap">${escapeHtml(txt)}</div></div>`;
}
async function notify(p: { id: string; platform: string; kind: string; author: string; incoming: string; pub: string; priv: string; sig: string; story_url?: string; autoSent?: boolean; autoFail?: boolean; holdReason?: string; }) {
  const link = `${FN_BASE}/send?id=${p.id}&sig=${p.sig}`;
  const badge = p.kind === "comment" ? "Comentário"
    : p.kind === "mention" ? "Menção (publicação de outra pessoa)"
    : p.kind === "story_mention" ? "Marcou-vos numa story ✨"
    : "Mensagem privada";
  const answers = p.kind === "comment"
    ? box("Resposta pública ao comentário", p.pub, BRAND_ACCENT, BRAND_BG) + box("Mensagem privada (DM) para a pessoa", p.priv, BRAND_ACCENT, BRAND_BG)
    : box(p.kind === "mention" ? "Resposta pública à menção" : p.kind === "story_mention" ? "Mensagem de agradecimento (DM)" : (p.autoSent ? "Resposta enviada automaticamente" : "Resposta sugerida"), p.pub, BRAND_ACCENT, BRAND_BG);
  const storyImg = p.story_url
    ? `<div style="text-align:center;margin:12px 0;font-size:12.5px;color:#9b8290;line-height:1.6">${p.kind === "story_mention"
        ? "✨ <b>Marcou-vos numa story.</b> Para <b>repartilhares</b>: abre o Instagram, vai à marcação e toca em <b>\"Adicionar à tua story\"</b> (enquanto a story dela estiver no ar). O botão abaixo envia só o agradecimento por DM."
        : "↩️ Isto é uma <b>resposta a uma story vossa</b> — o Joaquim já a viu e respondeu com esse contexto à frente."}</div>`
    : "";
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#3A2030">
    <div style="background:${BRAND_BG};color:#fff;border-radius:14px;padding:18px 22px">
      <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_ACCENT};font-weight:700">${BRAND} · ${p.platform} · ${badge}</div>
      <div style="font-size:18px;font-weight:700;margin-top:4px">Nova interação de ${p.author || "um cliente"}</div>
    </div>
    ${p.kind === "story_mention" ? "" : box("Recebido", p.incoming)}
    ${storyImg}
    ${answers}
    ${p.autoSent
      ? `<div style="text-align:center;margin:22px 0;background:#eefaf0;border:1px solid #bfe3c6;border-radius:12px;padding:13px 16px;color:#1a7f37;font-weight:700">✅ Piloto automático: a resposta acima JÁ FOI ENVIADA ao cliente.</div>
    <div style="font-size:12.5px;color:#9b8290;text-align:center">Este email é só registo. Se quiseres corrigir ou acrescentar algo, responde manualmente na app. · v4</div>`
      : `${p.autoFail ? `<div style="text-align:center;margin:12px 0;background:#fff3f3;border:1px solid #f0c8c8;border-radius:10px;padding:10px 14px;color:#b03030;font-size:13px;font-weight:700">⚠️ O envio automático falhou — aprova pelo botão abaixo.</div>` : ""}
    ${p.holdReason ? `<div style="text-align:center;margin:12px 0;font-size:13px;color:#9b8290">🤖 O piloto automático deixou esta para ti: <b>${escapeHtml(p.holdReason)}</b></div>` : ""}
    <div style="text-align:center;margin:22px 0">
      <a href="${link}" style="background:${BRAND_ACCENT};color:${BRAND_BG};font-weight:800;text-decoration:none;padding:14px 34px;border-radius:999px;font-size:16px;display:inline-block">Aprovar e enviar ${p.kind === "comment" ? "(resposta + DM)" : ""} ☀️</a>
    </div>
    <div style="font-size:12.5px;color:#9b8290;text-align:center">Só é publicado quando carregas no botão. Se não quiseres responder, ignora este email. · v4</div>`}
  </div>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to: [NOTIFY_EMAIL],
      subject: p.autoSent ? `✅ Respondido automaticamente no ${p.platform} — ${p.author || "cliente"}` : `🔔 ${badge} no ${p.platform} — pronto a enviar`, html }),
  });
}
function escapeHtml(s: string) { return (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!)); }

// ---------- LEADS (formulários instantâneos de anúncios) ----------
// Um novo contacto chega no webhook como change.field === "leadgen" com value.leadgen_id.
// O webhook NÃO traz as respostas — vão-se buscar ao Graph (o token da Página precisa de leads_retrieval).
type LeadField = { name: string; values: string[] };
async function fetchLead(leadgenId: string): Promise<{ ok: boolean; fields: LeadField[]; detail: string }> {
  try {
    const tk = await pageTok();
    const r = await fetch(`${GRAPH}/${leadgenId}?fields=field_data,created_time,form_id,ad_id&access_token=${tk}`);
    const j = await r.json();
    if (j?.error) return { ok: false, fields: [], detail: j.error.message || "erro" };
    return { ok: true, fields: j.field_data || [], detail: "ok" };
  } catch (e) { return { ok: false, fields: [], detail: String(e) }; }
}
const LEAD_LABELS: Record<string, string> = {
  full_name: "Nome", email: "Email", phone_number: "Telefone", company_name: "Estabelecimento",
};
const leadLabel = (n: string) => LEAD_LABELS[n] || n.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
async function notifyLead(fields: LeadField[], ok: boolean, detail: string): Promise<string> {
  const val = (n: string) => (fields.find((f) => f.name === n)?.values?.[0]) || "";
  const nome = val("full_name") || "novo contacto";
  const phone = val("phone_number").replace(/[^\d+]/g, "");
  const email = val("email");
  const wa = phone ? `https://wa.me/${phone.replace(/^\+/, "")}` : "";
  // as 5 perguntas custom aparecem primeiro (mais úteis para qualificar), os dados de contacto a seguir
  const order = (f: LeadField) => (["full_name", "phone_number", "email", "company_name"].includes(f.name) ? 1 : 0);
  const rows = ok
    ? [...fields].sort((a, b) => order(a) - order(b)).map((f) => box(leadLabel(f.name), (f.values || []).join(", "), BRAND_ACCENT, BRAND_BG)).join("")
    : box("Aviso", `Chegou um novo contacto, mas não foi possível ler os detalhes automaticamente (${escapeHtml(detail)}). Abre o Centro de Leds do Meta para o ver: business.facebook.com/leads_center`, BRAND_ACCENT, BRAND_BG);
  const btn = (href: string, bg: string, fg: string, txt: string, border = "") =>
    `<a href="${href}" style="background:${bg};color:${fg};font-weight:800;text-decoration:none;padding:12px 24px;border-radius:999px;font-size:15px;display:inline-block;margin:4px${border}">${txt}</a>`;
  const actions = ok ? `<div style="text-align:center;margin:20px 0">
      ${wa ? btn(wa, "#25D366", "#fff", "💬 WhatsApp") : ""}
      ${phone ? btn(`tel:${phone}`, BRAND_ACCENT, BRAND_BG, "📞 Ligar") : ""}
      ${email ? btn(`mailto:${email}`, "transparent", BRAND_BG, "✉️ Email", `;border:2px solid ${BRAND_ACCENT}`) : ""}
    </div>` : "";
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#3A2030">
    <div style="background:${BRAND_BG};color:#fff;border-radius:14px;padding:18px 22px">
      <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_ACCENT};font-weight:700">${BRAND} · Pedido de cotação 🌾</div>
      <div style="font-size:19px;font-weight:700;margin-top:4px">Novo contacto: ${escapeHtml(nome)}</div>
    </div>
    ${rows}
    ${actions}
    <div style="font-size:12.5px;color:#9b8290;text-align:center">Contacto qualificado recebido pelos anúncios. Responde depressa — a rapidez é o que fecha negócio. 🌾</div>
  </div>`;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({ from: FROM_EMAIL, to: [LEADS_EMAIL], subject: `🌾 Novo pedido de cotação — ${nome}`, html }),
    });
    const t = await r.text();
    return `${r.status} ${t.slice(0, 300)}`;
  } catch (e) { return "fetch-erro: " + String(e).slice(0, 200); }
}

// ---------- publicar (Graph API) ----------
// A Meta exige o token da PÁGINA para publicar (o do system user só serve para ler/gerir).
// Trocamos o token do system user pelo da Página via me/accounts (com cache de 50 min).
let _pageTok = ""; let _pageTokAt = 0;
async function pageTok(): Promise<string> {
  if (_pageTok && Date.now() - _pageTokAt < 3000000) return _pageTok;
  try {
    const r = await fetch(`${GRAPH}/me/accounts?fields=access_token&access_token=${PAGE_TOKEN}`);
    const j = await r.json();
    _pageTok = j?.data?.[0]?.access_token || PAGE_TOKEN; _pageTokAt = Date.now();
  } catch { _pageTok = PAGE_TOKEN; }
  return _pageTok;
}
async function post(url: string, body: Record<string, string>) {
  const tk = await pageTok();
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ access_token: tk, ...body }) });
  const j = await r.json(); return { ok: r.ok && !j.error, detail: JSON.stringify(j) };
}
async function publish(row: any): Promise<{ ok: boolean; detail: string }> {
  const results: string[] = []; let allOk = true;
  if (row.kind === "comment") {
    // 1) resposta PÚBLICA
    const pubUrl = `${GRAPH}/${row.target_id}/${row.platform === "Instagram" ? "replies" : "comments"}`;
    const r1 = await post(pubUrl, { message: row.reply });
    results.push("publica:" + r1.detail); allOk = allOk && r1.ok;
    // 2) mensagem PRIVADA à pessoa que comentou — IG e FB: via a PÁGINA (/me/messages com o
    //    token da Página), recipient={comment_id}. Enviar pelo id da conta IG dá "(#3) capability".
    const r2 = await post(`${GRAPH}/me/messages`, {
      recipient: JSON.stringify({ comment_id: row.target_id }),
      message: JSON.stringify({ text: row.private_reply }),
    });
    results.push("privada:" + r2.detail); allOk = allOk && r2.ok;
  } else if (row.kind === "mention") {
    if (row.platform === "Facebook") {
      // menção no FB: responder = comentar no post/comentário onde a Página foi marcada.
      // Nota: pode exigir a permissão pages_manage_engagement — se a Meta recusar, o erro
      // aparece na página de confirmação e no /last (status error), e responde-se à mão na app.
      const r = await post(`${GRAPH}/${row.target_id}/comments`, { message: row.reply });
      results.push("mencao-fb:" + r.detail); allOk = r.ok;
    } else {
      // resposta pública a uma MENÇÃO no Instagram (post/comentário de outra pessoa).
      // A API exige SEMPRE media_id; comment_id extra responde ao comentário específico.
      const parts = String(row.target_id).split(":");
      const body: Record<string, string> = { message: row.reply };
      if (parts[0] === "comment") { body.comment_id = parts[1]; body.media_id = parts[2]; }
      else { body.media_id = parts[1]; }
      const r = await post(`${GRAPH}/${row.account_id}/mentions`, body);
      results.push("mencao:" + r.detail); allOk = r.ok;
    }
  } else {
    // resposta a mensagem privada existente — janela padrão de 24h (RESPONSE).
    // Nota: a etiqueta HUMAN_AGENT (janela de 7 dias) exige aprovação da Meta via App Review;
    // sem ela dá "(#10) App doesn't have Human Agent Tag Access". Pedir mais tarde se fizer falta.
    const r = await post(`${GRAPH}/me/messages`, {
      recipient: JSON.stringify({ id: row.recipient_id }),
      message: JSON.stringify({ text: row.reply }),
      messaging_type: "RESPONSE",
    });
    results.push(r.detail); allOk = r.ok;
  }
  return { ok: allOk, detail: results.join(" | ") };
}

// ---------- parse dos eventos ----------
function extract(payload: any): Array<any> {
  const out: any[] = [];
  const platform = payload.object === "instagram" ? "Instagram" : "Facebook";
  for (const entry of payload.entry || []) {
    const accountId = entry.id;
    for (const ch of entry.changes || []) {
      const v = ch.value || {};
      if ((ch.field === "feed" && v.item === "comment" && v.verb === "add") || ch.field === "comments") {
        if (v.from?.id && String(v.from.id) === String(accountId)) continue; // ignora a própria página/IG
        out.push({ platform, kind: "comment", account_id: accountId,
          target_id: v.comment_id || v.id, recipient_id: v.from?.id || "",
          author: v.from?.name || v.from?.username || "", incoming: v.message || v.text || "" });
      }
      // Instagram: a marca (@quenteebom) foi MENCIONADA num post/comentário de OUTRA pessoa.
      // O webhook só traz os ids — o texto vai-se buscar depois (fetchMentionText).
      if (ch.field === "mentions" && platform === "Instagram") {
        // a API de menções exige SEMPRE o media_id; comment_id extra quando é menção num comentário.
        if (v.comment_id && v.media_id) {
          out.push({ platform, kind: "mention", account_id: accountId,
            target_id: `comment:${v.comment_id}:${v.media_id}`, recipient_id: "", author: "", incoming: "" });
        } else if (v.media_id) {
          out.push({ platform, kind: "mention", account_id: accountId,
            target_id: `media:${v.media_id}`, recipient_id: "", author: "", incoming: "" });
        }
      }
      // Facebook: a Página foi mencionada num post/comentário de outra pessoa (field "mention").
      // O webhook costuma trazer o texto e o nome; a resposta pública é um comentário nesse post.
      if (ch.field === "mention" && platform === "Facebook") {
        out.push({ platform, kind: "mention", account_id: accountId,
          target_id: v.comment_id || v.post_id || "", recipient_id: "",
          author: v.sender_name || "", incoming: v.message || "" });
      }
    }
    for (const m of entry.messaging || []) {
      if (m.message?.is_echo) continue;
      // marcação numa STORY: chega como mensagem com anexo story_mention (sem texto).
      const att = (m.message?.attachments || [])[0];
      if (att?.type === "story_mention") {
        out.push({ platform, kind: "story_mention", account_id: accountId,
          target_id: m.sender?.id || "", recipient_id: m.sender?.id || "",
          author: m.sender?.id || "", incoming: "[Marcou-vos numa story]",
          story_url: att?.payload?.url || "" });
        continue;
      }
      if (!m.message?.text) continue;
      // se for RESPOSTA a uma story nossa, guardamos o link da imagem da story (para dar contexto)
      const storyReplyUrl = m.message?.reply_to?.story?.url || "";
      out.push({ platform, kind: "message", account_id: accountId,
        target_id: m.sender?.id || "", recipient_id: m.sender?.id || "",
        author: m.sender?.id || "", incoming: m.message.text, story_url: storyReplyUrl });
    }
  }
  return out;
}

// ---------- router ----------
Deno.serve(async (req) => {
  const url = new URL(req.url);

  // ADMIN: instala a app na Página (subscribed_apps) — necessário para receber eventos REAIS.
  // GET /subscribe?key=<META_VERIFY_TOKEN>  (protegida; idempotente)
  if (req.method === "GET" && url.pathname.endsWith("/subscribe") && url.searchParams.get("key") === VERIFY_TOKEN) {
    const j = (o: unknown) => new Response(JSON.stringify(o, null, 2), { headers: { "content-type": "application/json" } });
    const accR = await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token&access_token=${PAGE_TOKEN}`);
    const acc = await accR.json();
    if (acc?.error) return j({ step: "me/accounts", error: acc.error });
    const out: Record<string, unknown> = {};
    for (const page of acc?.data || []) {
      // Degradação graciosa: tenta o conjunto completo e, se o token não tiver alguma
      // permissão (ex.: leads_retrieval p/ leadgen, ou pages_messaging p/ messages),
      // vai retirando campos SEM nunca perder os que já funcionavam. Ordem: mais → menos.
      const trySub = async (fields: string) => {
        const rr = await fetch(`${GRAPH}/${page.id}/subscribed_apps`, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ access_token: page.access_token, subscribed_fields: fields }),
        });
        return { fields, resp: await rr.json() };
      };
      const erros: string[] = [];
      let att = await trySub("feed,mention,messages,leadgen");
      if (att.resp?.error) { erros.push("feed,mention,messages,leadgen: " + att.resp.error.message); att = await trySub("feed,mention,messages"); }
      if (att.resp?.error) { erros.push("feed,mention,messages: " + att.resp.error.message); att = await trySub("feed,messages"); }
      if (att.resp?.error) { erros.push("feed,messages: " + att.resp.error.message); att = await trySub("feed"); }
      const rj: Record<string, unknown> = { subscrito: att.fields, resposta: att.resp };
      if (erros.length) rj.avisos = erros;
      const chk = await fetch(`${GRAPH}/${page.id}/subscribed_apps?fields=subscribed_fields&access_token=${page.access_token}`);
      const cj = await chk.json();
      out[page.name || page.id] = { subscribe: rj, atual: cj?.data ?? cj?.error?.message };
    }
    return j(out);
  }

  // ADMIN: últimas 5 interações com estado/erro (diagnóstico de envios)
  // GET /last?key=<META_VERIFY_TOKEN>
  if (req.method === "GET" && url.pathname.endsWith("/last") && url.searchParams.get("key") === VERIFY_TOKEN) {
    const { data, error } = await db.from("pending_replies")
      .select("created_at,platform,kind,author,status,detail,incoming")
      .neq("status", "dropped")   // as menções filtradas vivem em /dropped, não poluem o /last
      .neq("status", "debug")     // esconde eventuais registos antigos de diagnóstico
      .order("created_at", { ascending: false }).limit(5);
    const rows = (data || []).map((r: any) => ({ ...r, incoming: String(r.incoming || "").slice(0, 80) }));
    return new Response(JSON.stringify(error ?? rows, null, 2), { headers: { "content-type": "application/json" } });
  }

  // ADMIN: menções que o filtro NÃO respondeu (sem email) — auditar se algum falso negativo escapou.
  // GET /dropped?key=<META_VERIFY_TOKEN>
  if (req.method === "GET" && url.pathname.endsWith("/dropped") && url.searchParams.get("key") === VERIFY_TOKEN) {
    const { data, error } = await db.from("pending_replies")
      .select("created_at,platform,author,detail,incoming")
      .eq("status", "dropped")
      .order("created_at", { ascending: false }).limit(15);
    const rows = (data || []).map((r: any) => ({ ...r, incoming: String(r.incoming || "").slice(0, 220) }));
    return new Response(JSON.stringify(error ?? rows, null, 2), { headers: { "content-type": "application/json" } });
  }

  // ADMIN: DIGEST semanal — resumo dos últimos 7 dias do inbox, com temas/perguntas frequentes
  // (resumidos pelo Claude) + sentimento + sugestão. Enviado por email. Agendar 1x/semana.
  // GET /digest?key=<META_VERIFY_TOKEN>[&dias=7]
  if (req.method === "GET" && url.pathname.endsWith("/digest") && url.searchParams.get("key") === VERIFY_TOKEN) {
    const dias = Math.max(1, Math.min(31, parseInt(url.searchParams.get("dias") || "7", 10) || 7));
    const desde = new Date(Date.now() - dias * 864e5).toISOString();
    const { data } = await db.from("pending_replies")
      .select("kind,platform,status,author,incoming,created_at")
      .gte("created_at", desde).order("created_at", { ascending: false }).limit(600);
    const rows = data || [];
    const n = (f: (r: any) => boolean) => rows.filter(f).length;
    const stats = {
      total: rows.length,
      comentarios: n(r => r.kind === "comment"),
      mensagens: n(r => r.kind === "message"),
      mencoes: n(r => r.kind === "mention"),
      stories: n(r => r.kind === "story_mention"),
      instagram: n(r => r.platform === "Instagram"),
      facebook: n(r => r.platform === "Facebook"),
      enviadas: n(r => r.status === "sent"),
      pendentes: n(r => r.status === "pending"),
      dropped: n(r => r.status === "dropped"),
    };
    // amostra dos textos recebidos (sem os "dropped") para o Claude detetar temas
    const amostra = rows.filter(r => r.incoming && r.status !== "dropped")
      .map(r => `- [${r.platform}/${r.kind}] ${String(r.incoming).replace(/\s+/g, " ").slice(0, 200)}`)
      .slice(0, 80).join("\n");
    let resumo = "Sem interações com texto suficiente para resumir esta semana.";
    if (amostra) {
      resumo = await claude(
        `És um analista de comunidade da marca ${BRAND} (padaria/pastelaria angolana). Analisas o que os clientes escreveram esta semana nas redes sociais e devolves um briefing curto e útil para a equipa. Português de Angola, direto, sem floreados. NÃO uses markdown de títulos (#); usa texto simples com quebras de linha.`,
        `Interações dos últimos ${dias} dias (${stats.total} no total):\n${amostra}\n\nDevolve exatamente 3 secções curtas:\n1) TEMAS/PERGUNTAS MAIS FREQUENTES — 3 a 5 pontos (o que mais perguntam/comentam).\n2) SENTIMENTO GERAL — 1 frase (positivo/neutro/negativo e porquê).\n3) SUGESTÃO DA SEMANA — 1 ação concreta para a marca (ex.: uma story a fazer, uma dúvida recorrente a esclarecer no site/receitas).`,
        700);
    }
    const chip = (lbl: string, v: number, bg: string) => `<span style="display:inline-block;background:${bg};color:#3A2030;font-weight:700;font-size:13px;border-radius:999px;padding:5px 12px;margin:3px 4px">${v} ${lbl}</span>`;
    const html = `
    <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;color:#3A2030">
      <div style="background:${BRAND_BG};color:#fff;border-radius:14px;padding:18px 22px">
        <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${BRAND_ACCENT};font-weight:700">${BRAND} · Resumo do inbox</div>
        <div style="font-size:19px;font-weight:800;margin-top:4px">Os últimos ${dias} dias em redes sociais</div>
      </div>
      <div style="text-align:center;margin:16px 0">
        ${chip("interações", stats.total, BRAND_ACCENT)}
        ${chip("comentários", stats.comentarios, "#f0e6d6")}
        ${chip("mensagens", stats.mensagens, "#f0e6d6")}
        ${chip("menções", stats.mencoes, "#f0e6d6")}
        ${chip("stories", stats.stories, "#f0e6d6")}
      </div>
      <div style="text-align:center;margin:2px 0 14px;font-size:12.5px;color:#9b8290">
        ${stats.instagram} Instagram · ${stats.facebook} Facebook · ${stats.enviadas} respondidas · ${stats.pendentes} por responder${stats.dropped ? " · " + stats.dropped + " filtradas" : ""}
      </div>
      <div style="background:#fff;border:1px solid #f0e6d6;border-radius:12px;padding:16px 18px;font-size:15px;white-space:pre-wrap;line-height:1.55">${escapeHtml(resumo)}</div>
      <div style="font-size:12px;color:#9b8290;text-align:center;margin-top:12px">Resumo automático do inbox supervisionado. ☀️</div>
    </div>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({ from: FROM_EMAIL, to: [NOTIFY_EMAIL], subject: `📊 Resumo semanal do inbox — ${BRAND}`, html }),
    });
    return new Response(JSON.stringify({ enviado: true, ...stats }, null, 2), { headers: { "content-type": "application/json" } });
  }

  // ADMIN: leituras de teste para carimbar os testing requirements do use case Instagram
  // GET /igtest?key=<META_VERIFY_TOKEN>  (só-leitura; usar published_posts, não /feed)
  if (req.method === "GET" && url.pathname.endsWith("/igtest") && url.searchParams.get("key") === VERIFY_TOKEN) {
    const j = (o: unknown) => new Response(JSON.stringify(o, null, 2), { headers: { "content-type": "application/json" } });
    const g = async (path: string, tk: string) => {
      const r = await fetch(`${GRAPH}/${path}${path.includes("?") ? "&" : "?"}access_token=${tk}`);
      return await r.json();
    };
    const s: Record<string, unknown> = {};
    const acc = await g("me/accounts?fields=id,name,access_token,instagram_business_account{id,username}", PAGE_TOKEN);
    if (acc?.error) return j({ step: "me/accounts", error: acc.error });
    const page = (acc?.data || [])[0];
    const pageTok = page?.access_token || PAGE_TOKEN;
    const pageId = page?.id;
    const igId = page?.instagram_business_account?.id;
    s["pageId"] = pageId; s["igId"] = igId || "sem conta IG ligada à Página";
    if (pageId) { const f = await g(`${pageId}/published_posts?limit=1&fields=id`, pageTok); s["pages_read_engagement"] = f?.error?.message || "ok"; }
    const biz = await g("me/businesses?fields=id,name", PAGE_TOKEN); s["business_management"] = biz?.error?.message || "ok";
    if (igId) {
      const ig = await g(`${igId}?fields=id,username`, pageTok); s["instagram_basic"] = ig?.error?.message || ("ok:" + (ig?.username || ""));
      const media = await g(`${igId}/media?limit=1&fields=id`, pageTok); const mid = media?.data?.[0]?.id;
      s["media"] = mid ? "ok" : (media?.error?.message || "sem media");
      if (mid) { const cm = await g(`${mid}/comments?limit=1&fields=id`, pageTok); s["instagram_manage_comments"] = cm?.error?.message || "ok"; }
    }
    return j(s);
  }

  if (req.method === "GET" && url.searchParams.get("hub.mode") === "subscribe") {
    if (url.searchParams.get("hub.verify_token") === VERIFY_TOKEN)
      return new Response(url.searchParams.get("hub.challenge") || "", { status: 200 });
    return new Response("forbidden", { status: 403 });
  }

  if (req.method === "GET" && url.pathname.endsWith("/send")) {
    const id = url.searchParams.get("id") || "", sig = url.searchParams.get("sig") || "";
    if (sig !== await hmacHex(HMAC_SECRET, id)) return htmlPage("Link inválido.", false);
    const { data: row } = await db.from("pending_replies").select("*").eq("id", id).single();
    if (!row) return htmlPage("Resposta não encontrada.", false);
    if (row.status === "sent") return htmlPage("Isto já tinha sido enviado. ✅", true);
    const res = await publish(row);
    await db.from("pending_replies").update({ status: res.ok ? "sent" : "error", detail: res.detail }).eq("id", id);
    return htmlPage(res.ok
      ? (row.kind === "comment" ? "Resposta pública + mensagem privada enviadas! ☀️🧡" : "Resposta enviada! ☀️🧡")
      : "Não foi possível enviar tudo. Verifica na app.", res.ok);
  }

  if (req.method === "POST") {
    const raw = await req.text();
    if (!await validSignature(req, raw)) return new Response("bad sig", { status: 401 });
    let payload: any; try { payload = JSON.parse(raw); } catch { return new Response("ok"); }
    // LEADS primeiro: os eventos "leadgen" vão direto por email (não precisam de aprovação).
    for (const entry of payload.entry || []) {
      for (const ch of entry.changes || []) {
        if (ch.field !== "leadgen") continue;
        const leadgenId = ch.value?.leadgen_id; if (!leadgenId) continue;
        try {
          // dedup: o Meta reenvia webhooks — não mandar 2 emails do mesmo lead
          const { data: seen } = await db.from("pending_replies").select("id")
            .eq("kind", "lead").eq("target_id", String(leadgenId)).limit(1);
          if (seen?.length) continue;
          const lead = await fetchLead(String(leadgenId));
          await db.from("pending_replies").insert({
            platform: "Facebook", kind: "lead", account_id: entry.id, target_id: String(leadgenId),
            recipient_id: "", author: (lead.fields.find((f) => f.name === "full_name")?.values?.[0]) || "",
            incoming: JSON.stringify(lead.fields), reply: "", private_reply: "",
            status: lead.ok ? "lead" : "lead_error", detail: lead.detail,
          });
          const emailRes = await notifyLead(lead.fields, lead.ok, lead.detail);
          await db.from("pending_replies").update({ detail: `read:${lead.detail} | email:${emailRes}` })
            .eq("kind", "lead").eq("target_id", String(leadgenId));
        } catch (e) { console.error("erro lead", e); }
      }
    }
    for (const it of extract(payload)) {
      try {
        // Em DMs e marcações de story só vem o id do remetente — ir buscar o nome à Meta
        if ((it.kind === "message" || it.kind === "story_mention") && /^\d+$/.test(String(it.author || ""))) {
          try {
            const tk = await pageTok();
            const ur = await fetch(`${GRAPH}/${it.author}?fields=name,first_name,username&access_token=${tk}`);
            const uj = await ur.json();
            const nome = uj?.first_name || uj?.name || uj?.username;
            if (nome) it.author = String(nome);
          } catch { /* fica o id */ }
        }
        let pub = "", priv = "", autoOk = false, autoMotivo = "";
        if (it.kind === "comment") {
          const hist = await convoHistory(String(it.recipient_id || ""));
          const d = await draftForComment(it.platform, it.incoming, it.author, hist);
          pub = d.pub; priv = d.priv;
        }
        else if (it.kind === "mention") {
          let mText = it.incoming, mCtx = "";
          if (it.platform === "Instagram") {
            const m = await fetchMentionText(it);
            if (!m.text) continue;                  // não conseguimos ler a menção — ignora
            it.author = m.author; mText = m.text; mCtx = m.context;
            // no email, mostra a publicação-mãe + o comentário, para o Sandro decidir com contexto
            it.incoming = m.context ? `[Publicação: ${m.context}]\n↳ Marcaram-nos: ${m.text}` : m.text;
          } else {
            // Facebook: o texto vem (quase sempre) no próprio webhook
            if (!it.target_id) continue;
            if (!mText) { mText = "(menção sem texto no webhook — vê na app antes de aprovar)"; }
            it.incoming = `[Menção no Facebook] ${mText}`;
          }
          const d = await draftForMention(mText, it.author, mCtx, it.platform);
          if (!d.shouldReply) {
            // menção negativa/sensível/spam — não respondemos, mas guardamos p/ auditoria em /dropped (SEM email)
            await db.from("pending_replies").insert({
              platform: it.platform, kind: "mention", account_id: it.account_id, target_id: it.target_id,
              recipient_id: "", author: it.author, incoming: it.incoming,
              reply: "", private_reply: "", status: "dropped", detail: "motivo: " + (d.reason || "não especificado"),
            });
            continue;
          }
          pub = d.reply;
        }
        else if (it.kind === "story_mention") {
          pub = await draftForStoryMention(it.platform, it.author);
        }
        else {
          const hist = await convoHistory(String(it.recipient_id || ""));
          // piloto automático: só para DMs, só nas plataformas ligadas pelo secret AUTO_REPLY
          const querAuto = AUTO_REPLY === "all" || (AUTO_REPLY === "fb" && it.platform === "Facebook");
          if (querAuto) {
            const d = await draftForMessageAuto(it.platform, it.incoming, it.author, hist, it.story_url || "");
            pub = d.reply; autoOk = d.auto; autoMotivo = d.reason;
          } else {
            pub = await draftForMessage(it.platform, it.incoming, it.author, hist, it.story_url || "");
          }
          if (it.story_url) it.incoming = `[Resposta à vossa story] ${it.incoming}`; // contexto no email/registo
        }
        const { data: ins } = await db.from("pending_replies").insert({
          platform: it.platform, kind: it.kind, account_id: it.account_id, target_id: it.target_id,
          recipient_id: it.recipient_id, author: it.author, incoming: it.incoming,
          reply: pub, private_reply: priv, status: "pending",
        }).select("id").single();
        if (ins?.id) {
          if (autoOk && pub) {
            // envia já; se falhar, cai para o circuito normal de aprovação (email com botão)
            const res = await publish({ kind: it.kind, platform: it.platform, target_id: it.target_id,
              reply: pub, private_reply: priv, recipient_id: it.recipient_id, account_id: it.account_id });
            await db.from("pending_replies").update({
              status: res.ok ? "sent" : "pending",
              detail: (res.ok ? "auto: " : "auto FALHOU: ") + res.detail,
            }).eq("id", ins.id);
            await notify({ ...it, id: ins.id, pub, priv, sig: await hmacHex(HMAC_SECRET, ins.id),
              autoSent: res.ok, autoFail: !res.ok });
          } else {
            await notify({ ...it, id: ins.id, pub, priv, sig: await hmacHex(HMAC_SECRET, ins.id),
              holdReason: autoMotivo });
          }
        }
      } catch (e) { console.error("erro item", e); }
    }
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  return new Response("meta-inbox ok");
});

// O gateway do Supabase força text/plain (anti-phishing) — por isso a confirmação
// é uma página estática no site da marca, para onde redirecionamos.
function htmlPage(msg: string, ok: boolean) {
  const to = `${BRAND_SITE}/inbox.html?ok=${ok ? 1 : 0}&m=${encodeURIComponent(msg)}`;
  return new Response(null, { status: 302, headers: { Location: to } });
}
