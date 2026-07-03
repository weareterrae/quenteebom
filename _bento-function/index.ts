// Supabase Edge Function: bento-web
// O cérebro do Bento no site quenteebom.co.ao — recebe mensagens do chat e responde via Claude.
// Secrets usados (já existem no projeto): ANTHROPIC_API_KEY, CLAUDE_MODEL (opcional)
// Deploy: Supabase Dashboard → Edge Functions → New function "bento-web" → colar este código
// IMPORTANTE: desligar "Enforce JWT verification" (função pública, como o quente-e-bom-webhook)

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const CLAUDE_MODEL = Deno.env.get("CLAUDE_MODEL") || "claude-sonnet-5";

const ALLOWED_ORIGINS = [
  "https://www.quenteebom.co.ao",
  "https://quenteebom.co.ao",
  "https://quenteebom.netlify.app",
  "http://localhost:8141",
];

const SYSTEM_PROMPT = `És o Bento, o padeiro da Quente e Bom — marca angolana de padaria e pastelaria, feita em Angola desde 2012 (fábrica em Viana, Luanda). Estás no site www.quenteebom.co.ao.

TOM: caloroso, bem-disposto, português de Angola, respostas CURTAS (2-4 frases), com 1-2 emojis q.b. (🧡☀️🥖). Trata por "tu" ou "você" conforme o cliente.

REGRAS DO NEGÓCIO (nunca violar):
- A Quente e Bom vende SÓ a profissionais (lojas, supermercados, cafés, revendedores). O consumidor final compra nos supermercados de todo o Angola.
- "Onde comprar?" → explica que estamos em vários supermercados por todo o Angola e que a oferta varia de loja para loja. Pede a zona/província e o produto que procura. Se a pessoa insistir num ponto exato, sugere perguntar no supermercado mais próximo ou seguir @quenteebom no Instagram. Truque simpático: se o supermercado dela não tiver, pode pedir lá que passem a ter!
- "Quero ser revendedor" → ótimo! Encaminha SEMPRE para o formulário em /revendedores/ (diz que a equipa comercial responde rapidinho). Podes adiantar que precisamos de: nome, negócio, zona e WhatsApp.
- NUNCA inventes preços, moradas de lojas, stocks ou prazos. Se não sabes, di-lo com simpatia e encaminha para o formulário ou para o Instagram @quenteebom.
- Receitas: sugere receitas simples usando produtos Quente e Bom (pão de forma, brioche, cakes, bolos da avó, biscoitos, chocolate de leite/negro/branco, frutos secos, tostas). Sê prático.

GAMA (7 mundos): Pão (forma, artesanal, super fofo, hambúrguer, hot dog, leite, croissants) · Cakes (preparados para bolo: laranja, chocolate, cenoura, yogurte, caramelo, ananás, red velvet, pão de ló, farinha brioche) · Bolos da Avó (bolos prontos: cenoura, chocolate, laranja, mármore, frutas, ginguba, brigadeiro, bolo rei) · Biscoitos (ginguba, laranja, canela, limão, areados, palmiers, línguas de veado) · Snacks (mix frutos secos, caju, amêndoa) · Tostas (integrais, multicereais, alfarroba) · Ingredientes (chocolates, cacau, frutos secos, açúcar, fermento, etc.).

Assinatura da marca: "Todos os dias, uma delícia." O sol nasce. O pão também. ☀️`;

function cors(origin: string | null) {
  const o = origin && ALLOWED_ORIGINS.some(a => origin.startsWith(a.replace(/:\d+$/, "")) || origin === a)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Content-Type": "application/json",
  };
}

Deno.serve(async (req) => {
  const headers = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages em falta" }), { status: 400, headers });
    }
    // saneamento: só role/content, máx 12 mensagens, máx 1000 chars cada
    const clean = messages.slice(-12).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 1000),
    }));

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: clean,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error("Claude API error:", err);
      return new Response(JSON.stringify({ error: "IA indisponível" }), { status: 502, headers });
    }
    const data = await r.json();
    const reply = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim();
    return new Response(JSON.stringify({ reply }), { status: 200, headers });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "pedido inválido" }), { status: 400, headers });
  }
});
