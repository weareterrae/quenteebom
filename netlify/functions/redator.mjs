// Redator — proxy de IA para o meta-inbox das marcas (Netlify Function v2)
// 18/07/2026: a conta Console da Anthropic foi perdida; este proxy expõe a IA às funções
//   Supabase do meta-inbox, protegido por segredo partilhado (REDATOR_KEY).
// 22/07/2026: PRINCIPAL passou a ser o Google Gemini (chave direta do AI Studio, GEMINI_API_KEY);
//   o Claude fica como RESERVA, só se ANTHROPIC_API_KEY estiver presente e válida.
// Recebe um corpo no formato Anthropic /v1/messages e devolve SEMPRE no formato Anthropic
//   ({content:[{type:"text",...}]}), para o index.ts do meta-inbox não notar a diferença.
// NÃO é público: sem a chave certa responde 401 e não gasta um token.

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
    system: typeof corpo.system === "string" ? corpo.system.slice(0, 60_000) : undefined,
    messages: mensagens,
  };

  // PRINCIPAL: Google Gemini (se GEMINI_API_KEY estiver configurada).
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
async function geminiCall(pedido) {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) return null;
  const base = "https://generativelanguage.googleapis.com"; // chave direta do plano pago (não a AI Gateway)
  const modelo = process.env.GEMINI_MODEL || "gemini-pro-latest";
  try {
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
    const r = await fetch(`${base}/v1beta/models/${modelo}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": chave },
      body: JSON.stringify({
        ...(pedido.system ? { system_instruction: { parts: [{ text: pedido.system }] } } : {}),
        contents,
        // Folga de tokens: os modelos "thinking" gastam parte do orçamento a raciocinar,
        // por isso damos margem para a resposta não sair truncada (o texto final é curto).
        generationConfig: { maxOutputTokens: Math.max(Number(pedido.max_tokens) || 400, 2048) },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
      }),
    });
    if (!r.ok) { console.error("redator: Gemini", r.status, (await r.text()).slice(0, 200)); return null; }
    const j = await r.json();
    const texto = (j?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
    return texto ? { content: [{ type: "text", text: texto }], _via: modelo } : null;
  } catch (e) {
    console.error("redator: Gemini falha de rede", e);
    return null;
  }
}

export const config = { path: "/api/redator" };
