// Redator — proxy de IA para o meta-inbox das marcas (Netlify Function v2)
// 18/07/2026: a conta Console da Anthropic foi perdida; este proxy expõe a IA às funções
//   Supabase do meta-inbox, protegido por segredo partilhado (REDATOR_KEY).
// 22/07/2026: PRINCIPAL passou a ser o Google Gemini (chave direta do AI Studio, GEMINI_API_KEY);
//   o Claude fica como RESERVA, só se ANTHROPIC_API_KEY estiver presente e válida.
// Recebe um corpo no formato Anthropic /v1/messages e devolve SEMPRE no formato Anthropic
//   ({content:[{type:"text",...}]}), para o index.ts do meta-inbox não notar a diferença.
// NÃO é público: sem a chave certa responde 401 e não gasta um token.

import { chamarGemini } from "./_shared/gemini.mjs";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

// Teto diário por instância — o inbox das marcas nunca chega perto disto.
const DIA_LIMITE = 1000;
let diaTotal = 0;
let diaInicio = 0;

export default async (req) => {
  if (req.method !== "POST") return json({ erro: "POST only" }, 405);

  const segredo = process.env.REDATOR_KEY;
  if (!segredo || req.headers.get("x-redator-key") !== segredo) {
    return json({ erro: "não autorizado" }, 401);
  }

  const agora = Date.now();
  if (agora - diaInicio > 86_400_000) { diaInicio = agora; diaTotal = 0; }
  if (++diaTotal > DIA_LIMITE) return json({ erro: "teto diário" }, 429);

  let corpo;
  try { corpo = await req.json(); } catch { return json({ erro: "pedido inválido" }, 400); }

  // Só deixamos passar um pedido de mensagens bem formado e limitado.
  const modelo = String(corpo?.model || "");
  const mensagens = Array.isArray(corpo?.messages) ? corpo.messages.slice(-16) : null;
  if (!modelo.startsWith("claude-") || !mensagens?.length) {
    return json({ erro: "pedido inválido" }, 400);
  }
  const pedido = {
    model: modelo,
    max_tokens: Math.min(Number(corpo.max_tokens) || 400, 1024),
    system: typeof corpo.system === "string" ? corpo.system.slice(0, 200_000) : undefined,
    messages: mensagens,
  };

  // PRINCIPAL: o gateway do Nº 5.
  //
  // Os oito bots sociais nunca passaram por ele — falavam com a Google
  // diretamente daqui. Isso deixava-os sem tudo o que o gateway tem:
  // disjuntor, cadeia de modelos entre DOIS fornecedores, registo de
  // pedidos, incidentes, orçamento. Se a Google tivesse um mau dia, os
  // oito calavam-se ao mesmo tempo e nada dizia porquê.
  //
  // Mudou-se aqui e não nos oito projetos Supabase de propósito: uma só
  // publicação, e o `meta-inbox` não muda uma linha.
  const viaGateway = await gatewayN5(pedido);
  if (viaGateway) return json(viaGateway);

  // RESERVA: Google Gemini direto, como era até agora.
  //
  // O gateway é uma melhoria, não uma dependência nova. Se ele estiver em
  // baixo, os bots continuam a responder pelo caminho antigo — que é
  // exatamente o que se quer de uma migração: nunca ficar pior.
  const g = await geminiCall(pedido);
  if (g) return json(g);

  // RESERVA: Anthropic Claude (só se ainda houver chave).
  const chave = process.env.ANTHROPIC_API_KEY;
  if (!chave) return json({ erro: "IA indisponível" }, 503);
  const base = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
  try {
    const pedirClaude = () => fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: { "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify(pedido),
    });
    let r = await pedirClaude();
    if (!r.ok && (r.status === 429 || r.status >= 500)) {
      console.error("redator: Claude", r.status, "→ retry em 1.2s");
      await new Promise((res) => setTimeout(res, 1200));
      r = await pedirClaude();
    }
    const texto = await r.text();
    if (!r.ok) console.error("redator: Claude", r.status, texto.slice(0, 300));
    return new Response(texto, { status: r.status, headers: { "content-type": "application/json; charset=utf-8" } });
  } catch (e) {
    console.error("redator: Claude falha de rede", e);
    return json({ erro: "falha de rede" }, 502);
  }
};

// Chama o Gemini e devolve a resposta EMBRULHADA no formato Anthropic. Converte o pedido
// Anthropic → Gemini (incluindo imagens base64 das stories). Usa a chave DIRETA do plano
// pago (GEMINI_API_KEY) no endpoint público do Google — NÃO passa pela AI Gateway.
// Modelo por omissão: gemini-2.5-pro (topo); pode mudar-se com a variável GEMINI_MODEL.
/**
 * Fala com o gateway do Nº 5 e devolve no formato que o meta-inbox espera.
 *
 * O gateway responde em SSE (streaming), porque é isso que um chat de site
 * precisa. Aqui não há ninguém a ver as letras a aparecer — a resposta vai
 * para uma caixa de entrada do Instagram. Junta-se tudo e devolve-se de uma
 * vez, no envelope Anthropic que o meta-inbox já sabe ler.
 *
 * DEVOLVE NULL EM VEZ DE ATIRAR. Quem chama tem uma reserva a seguir, e uma
 * exceção aqui apagaria essa reserva — o bot ficava mudo por causa da
 * melhoria que o vinha proteger.
 */
/**
 * De que marca é este pedido, lido pelo prompt que veio.
 *
 * Os oito bots partilham este proxy e cada um envia o SEU prompt. Sem os
 * distinguir, o custo de todos aparecia numa linha só — e «social-inbox:
 * 4 dólares» não permite decidir nada sobre nenhuma marca.
 *
 * A via limpa é cada projeto dizer quem é num cabeçalho. Isso obriga a
 * publicar os oito, e a medição não pode esperar por isso: reconhece-se
 * pelo texto, que é determinístico e não custa nada.
 *
 * O que não se reconhece cai em `social-inbox`, e isso é informação: uma
 * marca a aparecer ali quer dizer que falta registá-la, em vez de
 * desaparecer diluída numa média.
 */
function marcaDoPrompt(system) {
  const t = String(system || "").toLowerCase();
  // Ordem importa: os nomes mais específicos primeiro, para «joaquim»
  // (que é da Terrae e da Quente e Bom) não roubar o outro.
  const marcas = [
    [/chef\s*kool|kool\s*nature/, "social-koolnature"],
    [/massa\s*prima|chef\s*prima/, "social-massaprima"],
    [/[áa]gua\s*minda|kianda/, "social-aguaminda"],
    [/av[óo]\s*maria|externato/, "social-externato"],
    [/maria\s*goreti/, "social-mariagoreti"],
    [/quente\s*e\s*bom/, "social-quenteebom"],
    [/terrae/, "social-terrae"],
    [/n[úu]mero\s*cinco|\bquinto\b/, "social-numerocinco"],
  ];
  for (const [re, chave] of marcas) if (re.test(t)) return chave;
  return process.env.N5_ASSISTANT_KEY || "social-inbox";
}

async function gatewayN5(pedido) {
  const url = process.env.N5_GATEWAY_URL;
  if (!url) return null;

  const ctrl = new AbortController();
  // Uma caixa de entrada tolera segundos, não minutos. Passado isto, mais
  // vale ir pela reserva do que deixar a pessoa sem resposta.
  const t = setTimeout(() => ctrl.abort(), 25_000);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // O gateway usa allowlist de origem. Isto é servidor-para-servidor,
        // por isso a origem é declarada — quem protege este endpoint é a
        // REDATOR_KEY que já foi verificada acima.
        origin: process.env.N5_GATEWAY_ORIGIN || "https://quenteebom.com",
      },
      body: JSON.stringify({
        assistant_key: marcaDoPrompt(pedido.system),
        system: pedido.system,
        messages: (pedido.messages || []).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: typeof m.content === "string"
            ? m.content
            : (m.content || []).map((b) => b?.text || "").join("\n"),
        })),
        max_output_tokens: pedido.max_tokens,
      }),
      signal: ctrl.signal,
    });
    if (!r.ok) { console.error("redator/gateway:", r.status); return null; }

    const bruto = await r.text();
    let texto = "";
    let erro = null;
    for (const linha of bruto.split("\n")) {
      if (!linha.startsWith("data: ")) continue;
      let j;
      try { j = JSON.parse(linha.slice(6)); } catch { continue; }
      if (j.type === "delta") texto += (j.text ?? j.data?.text ?? "");
      if (j.type === "error") erro = j.message;
    }
    if (erro || !texto.trim()) {
      console.error("redator/gateway:", erro || "resposta vazia");
      return null;
    }
    return { content: [{ type: "text", text: texto.trim() }], _via: "n5-gateway" };
  } catch (e) {
    console.error("redator/gateway:", (e && e.message) || e);
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function geminiCall(pedido) {
  const modelo = process.env.GEMINI_MODEL || "gemini-pro-latest";
  const contents = pedido.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: (Array.isArray(m.content) ? m.content : [{ type: "text", text: String(m.content ?? "") }])
      .map((b) => {
        if (b.type === "text") return { text: b.text || "" };
        if (b.type === "image" && b.source?.type === "base64") {
          return { inline_data: { mime_type: b.source.media_type, data: b.source.data } };
        }
        return null;
      })
      .filter(Boolean),
  }));
  // A resiliência (várias chaves/modelos, retries com backoff a absorver os 503
  // "overloaded" da Google) fica no helper partilhado; aqui só montamos o pedido.
  const r = await chamarGemini({
    system: pedido.system,
    contents,
    // Folga de tokens: os modelos "thinking" gastam parte do orçamento a raciocinar.
    // Com prompts grandes (ex.: Massa Prima ~69 KB) o modelo gastava TODO o orçamento a
    // pensar e devolvia texto vazio → o inbox caía no fallback. Damos margem generosa
    // (8192) para caberem raciocínio + resposta (o texto final é curto).
    maxOutputTokens: Math.max(Number(pedido.max_tokens) || 400, 8192),
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
    ],
    // Principal (topo) + duas reservas, caso o "latest" ande sobrecarregado.
    //
    // A reserva era só `gemini-2.0-flash`, e esse modelo já está aposentado
    // — está OFF no registo de modelos do Nº 5. Quando o principal se
    // sobrecarregasse, a rede que devia apanhá-lo já não existia, e os oito
    // bots sociais ficariam mudos ao mesmo tempo. Uma reserva caducada é
    // pior do que não ter reserva: dá a sensação de haver uma.
    //
    // As duas de agora estão HEALTHY no registo, contra a mesma API da
    // Google. Quem mexer nisto tem de as ir lá confirmar primeiro.
    models: [modelo, "gemini-3.5-flash", "gemini-flash-lite-latest"],
    baseUrl: "https://generativelanguage.googleapis.com", // chave direta do plano pago (não a AI Gateway)
    logPrefix: "redator",
  });
  // Embrulha no formato Anthropic; _via reporta o modelo que respondeu de facto.
  return r?.text ? { content: [{ type: "text", text: r.text }], _via: r.model } : null;
}

export const config = { path: "/api/redator" };
