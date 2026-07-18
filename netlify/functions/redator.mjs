// Redator — proxy de IA para o meta-inbox das 3 marcas (Netlify Function v2)
// Criado a 18/07/2026: a conta Console da Anthropic foi perdida, e as funções Supabase
// (meta-inbox QeB/Minda/MP) não têm acesso ao AI Gateway da Netlify. Este proxy expõe
// o gateway a essas funções, protegido por segredo partilhado (REDATOR_KEY).
// Recebe o corpo de um pedido /v1/messages e devolve a resposta da Anthropic tal e qual.
// NÃO é um endpoint público: sem a chave certa responde 401 e não gasta um token.

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

// Teto diário por instância — o inbox das 3 marcas nunca chega perto disto;
// se chegar, é abuso ou bug, e é melhor parar.
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

  const chave = process.env.ANTHROPIC_API_KEY;
  if (!chave) return json({ erro: "gateway indisponível" }, 503);

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

  const base = (process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
  try {
    const r = await fetch(`${base}/v1/messages`, {
      method: "POST",
      headers: {
        "x-api-key": chave,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(pedido),
    });
    const texto = await r.text();
    if (!r.ok) {
      console.error("redator: Anthropic", r.status, texto.slice(0, 300));
      const b = await planoBGemini(pedido);
      if (b) return json(b);
    }
    return new Response(texto, { status: r.status, headers: { "content-type": "application/json; charset=utf-8" } });
  } catch (e) {
    console.error("redator: falha de rede", e);
    const b = await planoBGemini(pedido);
    if (b) return json(b);
    return json({ erro: "falha de rede" }, 502);
  }
};

// PLANO B: se o Claude falhar, tenta o Gemini pelo MESMO gateway (GEMINI_API_KEY +
// GOOGLE_GEMINI_BASE_URL injetados). Converte o pedido Anthropic → Gemini (incluindo
// imagens base64 das stories) e devolve a resposta EMBRULHADA no formato Anthropic
// ({content:[{type:"text",...}]}), para o index.ts do meta-inbox não notar a diferença.
async function planoBGemini(pedido) {
  const chave = process.env.GEMINI_API_KEY;
  const base = (process.env.GOOGLE_GEMINI_BASE_URL || "").replace(/\/$/, "");
  if (!chave || !base) return null;
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
    const r = await fetch(`${base}/v1beta/models/gemini-2.5-flash:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": chave },
      body: JSON.stringify({
        ...(pedido.system ? { system_instruction: { parts: [{ text: pedido.system }] } } : {}),
        contents,
        generationConfig: { maxOutputTokens: pedido.max_tokens || 400 },
      }),
    });
    if (!r.ok) { console.error("redator: Gemini", r.status, (await r.text()).slice(0, 200)); return null; }
    const j = await r.json();
    const texto = (j?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
    return texto ? { content: [{ type: "text", text: texto }], _plano_b: "gemini-2.5-flash" } : null;
  } catch (e) {
    console.error("redator: Gemini falha de rede", e);
    return null;
  }
}

export const config = { path: "/api/redator" };
