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
    if (!r.ok) console.error("redator: Anthropic", r.status, texto.slice(0, 300));
    return new Response(texto, { status: r.status, headers: { "content-type": "application/json; charset=utf-8" } });
  } catch (e) {
    console.error("redator: falha de rede", e);
    return json({ erro: "falha de rede" }, 502);
  }
};

export const config = { path: "/api/redator" };
