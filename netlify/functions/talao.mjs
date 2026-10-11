// Talão vale pontos: leitura do talão do supermercado com IA (Netlify Function v2)
// Fluxo: app envia {token, imagem} → limite diário (Supabase) → Gemini lê o talão →
// regista no Supabase com o segredo APP_FN_SECRET → pontos (ou revisão pela equipa).
// Os dados vivem no esquema "app" do projeto Supabase quente-e-bom-bot; só os RPCs
// public.app_* lhes tocam, e os de escrita de talões exigem o segredo.

import { createHash } from "node:crypto";
import { chamarGemini } from "./_shared/gemini.mjs";

const SUPABASE_URL = "https://qciagsktkqljvknmahfu.supabase.co";
const SUPABASE_ANON = "sb_publishable_cG_NBNF8YR1gJwyOYg7FAw_qtpKgIaG"; // chave pública (o acesso é controlado nos RPCs)
const ORIGENS = ["https://quenteebom.com", "https://www.quenteebom.com", "https://quenteebom.netlify.app", "http://localhost"];
const MAX_IMG = 2_500_000; // caracteres base64 (~1,8 MB)

// Insígnias aprovadas (whitelist pública). Talões de outras lojas vão para revisão.
const INSIGNIAS = ["Kero", "Candando", "Maxi", "Kibabo", "Nossa Casa", "Shoprite", "Deskontão", "BigOne", "Alimenta Angola", "Africana Discount"];
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

async function rpc(nome, args) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nome}`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: SUPABASE_ANON, authorization: `Bearer ${SUPABASE_ANON}` },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`rpc ${nome} ${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

const PROMPT = `És um leitor de talões de supermercados de Angola. Recebes a fotografia de um talão (recibo de caixa).
Responde APENAS com JSON válido, sem texto à volta, neste formato:
{"e_talao":true,"insignia":"Kero","loja":"Kero Gika","numero":"FR 2026/12345","data":"2026-10-11","linhas":[{"descricao":"PAO FORMA QB 600G","valor":1250.00,"qeb":"sim"}],"confianca":"alta"}

Regras:
- "e_talao": false se a imagem não for um talão de compra.
- "insignia": o nome da cadeia (ex.: Kero, Candando, Maxi, Kibabo, Nossa Casa, Shoprite, Deskontão, BigOne, Alimenta Angola, Africana Discount). null se não se ler.
- "loja": nome ou morada da loja, se aparecer. "numero": número do documento/factura/talão. "data": data da compra em AAAA-MM-DD. null quando não se lê.
- "linhas": TODAS as linhas de artigos, com o valor total da linha em Kwanzas (número, com IVA, depois de descontos da linha).
- "qeb": "sim" só quando a linha é claramente da marca Quente e Bom (aparece QUENTE E BOM, QUENTE BOM, Q&B, QB, Q.BOM ou equivalente, ou o nome de um produto da marca com a marca indicada). "duvida" quando parece um produto da marca mas a marca não se lê. "nao" nos outros casos. Pão, bolos ou bolachas de outras marcas são "nao".
- "confianca": "alta" se o talão está legível e tens certeza dos valores; "media" ou "baixa" caso contrário.
- Não inventes valores. Se não consegues ler, usa null e baixa a confiança.`;

function lerJSON(txt) {
  const limpo = String(txt || "").replace(/```json|```/g, "").trim();
  const a = limpo.indexOf("{"), b = limpo.lastIndexOf("}");
  if (a < 0 || b < 0) return null;
  try { return JSON.parse(limpo.slice(a, b + 1)); } catch { return null; }
}

export default async (req) => {
  if (req.method !== "POST") return json({ erro: "metodo" }, 405);
  const o = req.headers.get("origin") || req.headers.get("referer") || "";
  if (!ORIGENS.some((p) => o.startsWith(p))) return json({ erro: "origem" }, 403);
  const segredo = process.env.APP_FN_SECRET;
  if (!segredo) return json({ erro: "inativo", msg: "A leitura de talões ainda não está ativa. Volta daqui a pouco." }, 503);

  let body;
  try { body = await req.json(); } catch { return json({ erro: "pedido" }, 400); }
  const token = String(body?.token || "");
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(body?.imagem || ""));
  if (!token || !m) return json({ erro: "pedido" }, 400);
  if (m[2].length > MAX_IMG) return json({ erro: "grande" }, 413);

  try {
    const pode = await rpc("app_talao_pode", { p_secret: segredo, p_token: token });
    if (pode.erro) return json(pode, pode.erro === "sessao" ? 401 : 429);

    const imgHash = createHash("sha256").update(m[2]).digest("hex");
    const base = (process.env.GOOGLE_GEMINI_BASE_URL || "https://generativelanguage.googleapis.com").replace(/\/$/, "");
    const r = await chamarGemini({
      contents: [{ role: "user", parts: [{ text: PROMPT }, { inline_data: { mime_type: `image/${m[1]}`, data: m[2] } }] }],
      maxOutputTokens: 4096,
      models: ["gemini-flash-latest", "gemini-2.5-pro"],
      baseUrl: base,
      logPrefix: "talao",
      timeoutMs: 15000,
      tentativas: 1,
    });
    const lido = lerJSON(r?.text);
    if (!lido) return json({ erro: "ia", msg: "Não conseguimos ler o talão agora. Tenta outra vez daqui a um minuto." }, 502);
    if (lido.e_talao === false) return json({ erro: "nao_talao", msg: "Isto não parece um talão. Fotografa o talão inteiro, bem esticado e com boa luz." }, 422);

    const linhas = (Array.isArray(lido.linhas) ? lido.linhas : []).slice(0, 200).map((l) => ({
      descricao: String(l?.descricao || "").slice(0, 80),
      valor: Number(l?.valor) || 0,
      qeb: ["sim", "duvida"].includes(l?.qeb) ? l.qeb : "nao",
    }));
    // Linhas em dúvida contam para o total, mas mandam o talão para revisão da equipa.
    const doQeb = linhas.filter((l) => l.qeb !== "nao");
    const totalQeb = Math.round(doQeb.reduce((s, l) => s + Math.max(0, l.valor), 0) * 100) / 100;
    const temDuvidas = linhas.some((l) => l.qeb === "duvida");
    const confianca = lido.confianca === "alta" && !temDuvidas ? "alta" : "media";
    const insignia = INSIGNIAS.find((i) => norm(lido.insignia).includes(norm(i))) || (lido.insignia ? String(lido.insignia).slice(0, 40) : null);
    const data = /^\d{4}-\d{2}-\d{2}$/.test(lido.data || "") ? lido.data : null;

    const res = await rpc("app_talao_registar", {
      p_secret: segredo, p_token: token, p_img_hash: imgHash,
      p_insignia: insignia, p_loja: lido.loja ? String(lido.loja) : null,
      p_numero: lido.numero ? String(lido.numero).slice(0, 40) : null, p_data: data,
      p_total_qeb: totalQeb, p_linhas: linhas, p_confianca: confianca,
      p_insignia_valida: INSIGNIAS.includes(insignia),
    });
    if (res.erro === "repetido") return json({ erro: "repetido", msg: "Este talão já foi enviado." }, 409);
    if (res.erro) return json(res, 400);
    return json({ ...res, insignia, produtos: doQeb.map((l) => l.descricao) });
  } catch (e) {
    console.error("talao:", e?.message || e);
    return json({ erro: "servidor", msg: "Houve um problema do nosso lado. Tenta outra vez daqui a pouco." }, 500);
  }
};

export const config = { path: "/api/talao" };
