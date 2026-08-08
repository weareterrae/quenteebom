// Chef Joaquim — cérebro de IA (Netlify Function v2)
// Motor: Gemini pelo AI Gateway da Netlify (GEMINI_API_KEY injetado; fatura na conta Netlify).
// O SYSTEM_PROMPT continua REMOTO em /bento-prompt.txt — git push = atualizar o cérebro (cache 5 min).

const PROMPT_URL = "https://quenteebom.com/bento-prompt.txt";
const PROMPT_TTL_MS = 5 * 60 * 1000;

const FALLBACK_PROMPT = `És o Joaquim, o Chef da Quente e Bom — marca angolana de padaria e pastelaria, feita em Angola desde 2012 (fábrica em Viana, Luanda). Tom caloroso, português de Angola, respostas curtas com 1-2 emojis. A marca vende só a profissionais; o consumidor compra nos supermercados de toda a Angola (a oferta varia por loja — pede a zona). Revendedores → formulário em /profissional/revendedor/. Emprego → /recrutamento/. Receitas → https://quenteebom.com/receitas/. Nunca inventes preços, moradas ou stocks. Assinatura: "Todos os dias, uma delícia." ☀️`;

let promptCache = { text: "", ts: 0 };

async function getPrompt() {
  const now = Date.now();
  if (promptCache.text && now - promptCache.ts < PROMPT_TTL_MS) return promptCache.text;
  try {
    const r = await fetch(PROMPT_URL, { headers: { "cache-control": "no-cache" } });
    if (r.ok) {
      const t = (await r.text()).trim();
      if (t.length > 200) {
        promptCache = { text: t, ts: now };
        return t;
      }
    }
  } catch { /* usa fallback */ }
  return promptCache.text || FALLBACK_PROMPT;
}

// Modo de contingência: quando a IA não está disponível, o Joaquim responde com
// os encaminhamentos essenciais em vez de um erro.
const CONTINGENCIA =
  "Olá! ☀️ Estou numa pausa rápida, mas ajudo-te já: encontras as nossas delícias nos supermercados de toda a Angola (a oferta varia por loja — pergunta na tua zona). Revendedores: quenteebom.com/profissional • Receitas: quenteebom.com/receitas • Emprego: quenteebom.com/recrutamento. Volto já — todos os dias, uma delícia!";

// Só aceitamos pedidos vindos do próprio site (regras de uso da Anthropic:
// o endpoint público não pode servir de API aberta a terceiros).
const ORIGENS = ["https://quenteebom.com", "https://www.quenteebom.com", "https://quenteebom.netlify.app", "http://localhost"];
const origemValida = (req) => {
  const o = req.headers.get("origin") || req.headers.get("referer") || "";
  return ORIGENS.some((p) => o.startsWith(p));
};

// Proteção anti-abuso: limite por IP (janela deslizante) + teto diário global.
// Em memória por instância — best-effort, suficiente para travar floods e bots.
const IP_LIMITE = 8;            // pedidos por IP
const IP_JANELA_MS = 60_000;    // por minuto
const DIA_LIMITE = 400;         // teto de pedidos por instância e por dia
const baldeIp = new Map();
let diaTotal = 0;
let diaInicio = 0;

function excedeuLimites(ip) {
  const agora = Date.now();
  if (agora - diaInicio > 86_400_000) { diaInicio = agora; diaTotal = 0; }
  if (++diaTotal > DIA_LIMITE) return true;
  const recentes = (baldeIp.get(ip) ?? []).filter((t) => agora - t < IP_JANELA_MS);
  recentes.push(agora);
  baldeIp.set(ip, recentes);
  if (baldeIp.size > 5000) baldeIp.clear(); // trava crescimento de memória
  return recentes.length > IP_LIMITE;
}

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

// Respostas de CONTEÚDO vão como texto simples (o widget lê em stream ou de uma vez).
// Só os ERROS de guardrail (403/429/400/405) continuam JSON — o widget faz throw neles.
const texto = (str, status = 200) =>
  new Response(String(str ?? ""), {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });

// Converte o stream SSE da Anthropic num stream de texto simples (só os deltas de texto).
function streamAnthropic(resp) {
  const enc = new TextEncoder();
  const dec = new TextDecoder();
  return new ReadableStream({
    async start(controller) {
      const reader = resp.body.getReader();
      let buf = "";
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let nl;
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const ev = JSON.parse(payload);
              if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") {
                controller.enqueue(enc.encode(ev.delta.text));
              }
            } catch { /* linha SSE parcial/keep-alive — ignora */ }
          }
        }
      } catch (e) {
        console.error("joaquim: erro no stream", e);
      }
      controller.close();
    },
  });
}

// PLANO B: se o Claude falhar (erro/429), tenta o Gemini — pelo MESMO gateway da
// Netlify (GEMINI_API_KEY + GOOGLE_GEMINI_BASE_URL injetados; sem chaves pessoais).
async function planoBGemini(system, mensagens, maxTokens) {
  const chave = process.env.GEMINI_API_KEY;
  const base = (process.env.GOOGLE_GEMINI_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
  if (!chave || !base) return null;
  try {
    const r = await fetch(`${base}/v1beta/models/gemini-2.5-flash:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": chave },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: mensagens.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: typeof m.content === "string" ? m.content : "" }],
        })),
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });
    if (!r.ok) { console.error("joaquim: Gemini", r.status, (await r.text()).slice(0, 200)); return null; }
    const j = await r.json();
    const texto = (j?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
    return texto || null;
  } catch (e) {
    console.error("joaquim: Gemini falha de rede", e);
    return null;
  }
}

export default async (req, context) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!origemValida(req)) return json({ error: "origem" }, 403);

  const ip = context?.ip || req.headers.get("x-nf-client-connection-ip") || "?";
  if (excedeuLimites(ip)) return json({ error: "IA indisponível" }, 429);

  const chave = process.env.GEMINI_API_KEY;
  if (!chave) return texto(CONTINGENCIA);

  let corpo;
  try { corpo = await req.json(); } catch { return json({ error: "pedido inválido" }, 400); }

  const raw = Array.isArray(corpo?.messages) ? corpo.messages : [];
  const messages = raw.slice(-12).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || "").slice(0, 1000),
  })).filter((m) => m.content.trim());
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return json({ error: "messages em falta" }, 400);
  }

  const system = await getPrompt();
  const b = await planoBGemini(system, messages, 800);
  return texto(b || CONTINGENCIA);
};

export const config = { path: "/api/joaquim" };
