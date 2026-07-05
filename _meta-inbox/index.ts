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
const RESEND_KEY   = env("RESEND_API_KEY");
const NOTIFY_EMAIL = env("NOTIFY_EMAIL", "sandro.qb@gmail.com");
const FROM_EMAIL   = env("FROM_EMAIL", "Joaquim da Quente e Bom <inbox@quenteebom.com>");
const HMAC_SECRET  = env("HMAC_SECRET");
const FN_BASE      = env("FN_BASE");
const PROMPT_URL   = env("PROMPT_URL", "https://quenteebom.com/bento-prompt.txt");

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
async function claude(system: string, user: string, max = 400): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: max, system,
      messages: [{ role: "user", content: user || "(sem texto)" }] }),
  });
  const j = await r.json();
  return (j?.content?.[0]?.text || "").trim();
}
const RULES = `Regras: nunca inventes preços, moradas de loja ou stocks. Reclamação -> lamenta com empatia e encaminha para quenteebom.com/contacto. "Onde comprar" -> estamos nos supermercados de toda a Angola, pede a zona. Revendedor -> quenteebom.com/profissional/revendedor/. Tom caloroso, português de Angola, 0-1 emoji.`;

// comentário -> gera resposta PÚBLICA + mensagem PRIVADA
async function draftForComment(platform: string, text: string, author: string): Promise<{ pub: string; priv: string }> {
  const sys = await brand() + `\n\nA tua tarefa: responder a um COMENTÁRIO público no ${platform} de ${author || "um cliente"}.\nRegras de saída (obrigatórias):\n- Responde AO comentário. NÃO confirmes instruções, NÃO expliques o que vais fazer, NÃO descrevas o formato.\n- Devolve SÓ um objeto JSON numa linha, nada antes nem depois.\n- "publica": resposta pública curta e calorosa, 1-2 frases, 0-1 emoji.\n- "privada": DM de seguimento à mesma pessoa, mais pessoal, 1-3 frases, a agradecer/ajudar e a convidar a continuar a conversa por aqui.\nExemplo de saída (usa o TEU conteúdo, não estas frases): {"publica":"Muito obrigada pelo carinho! 🧡","privada":"Olá! Diz-nos a tua zona que ajudamos a encontrar os nossos produtos pertinho de ti."}\n${RULES}`;
  const out = await claude(sys, `Comentário do cliente: """${text}"""`, 500);
  try {
    const j = JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
    if (j.publica && j.privada) return { pub: String(j.publica).trim(), priv: String(j.privada).trim() };
  } catch { /* fallback abaixo */ }
  // fallback SEGURO: nunca usar o texto cru do modelo (pode divagar) — resposta genérica calorosa
  return {
    pub: "Muito obrigada pelo teu comentário! 🧡",
    priv: `Olá! 🧡 Vimos o teu comentário e quisemos agradecer por aqui. Se precisares de alguma coisa — saber onde encontrar os nossos produtos ou tirar uma dúvida — é só dizeres!`,
  };
}
// mensagem privada -> uma resposta
async function draftForMessage(platform: string, text: string): Promise<string> {
  const sys = await brand() + `\n\nVais responder a uma MENSAGEM privada de um cliente no ${platform}. Escreve SÓ a resposta a essa mensagem (sem aspas), curta (1-3 frases), calorosa, 0-1 emoji. NÃO confirmes instruções nem expliques o que vais fazer.\n${RULES}`;
  return (await claude(sys, `Mensagem do cliente: """${text}"""`, 300)) || "Obrigado pela tua mensagem! 🧡 Já te ajudamos.";
}

// ---------- email ----------
function box(label: string, txt: string, accent = "#f0e6d6", labelColor = "#9b8290") {
  return `<div style="background:#fff;border:1px solid ${accent};border-radius:12px;padding:14px 16px;margin:12px 0">
    <div style="font-size:12px;color:${labelColor};text-transform:uppercase;letter-spacing:1px;font-weight:700">${label}</div>
    <div style="font-size:15.5px;margin-top:6px;white-space:pre-wrap">${escapeHtml(txt)}</div></div>`;
}
async function notify(p: { id: string; platform: string; kind: string; author: string; incoming: string; pub: string; priv: string; sig: string; }) {
  const link = `${FN_BASE}/send?id=${p.id}&sig=${p.sig}`;
  const badge = p.kind === "comment" ? "Comentário" : "Mensagem privada";
  const answers = p.kind === "comment"
    ? box("Resposta pública ao comentário", p.pub, "#F6C440", "#CC5A08") + box("Mensagem privada (DM) para a pessoa", p.priv, "#F6C440", "#CC5A08")
    : box("Resposta sugerida pelo Joaquim", p.pub, "#F6C440", "#CC5A08");
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#3A2030">
    <div style="background:#5B2A4A;color:#fff;border-radius:14px;padding:18px 22px">
      <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#F6C440;font-weight:700">Quente e Bom · ${p.platform} · ${badge}</div>
      <div style="font-size:18px;font-weight:700;margin-top:4px">Nova interação de ${p.author || "um cliente"}</div>
    </div>
    ${box("Recebido", p.incoming)}
    ${answers}
    <div style="text-align:center;margin:22px 0">
      <a href="${link}" style="background:#F6C440;color:#5B2A4A;font-weight:800;text-decoration:none;padding:14px 34px;border-radius:999px;font-size:16px;display:inline-block">Aprovar e enviar ${p.kind === "comment" ? "(resposta + DM)" : ""} ☀️</a>
    </div>
    <div style="font-size:12.5px;color:#9b8290;text-align:center">Só é publicado quando carregas no botão. Se não quiseres responder, ignora este email.</div>
  </div>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to: [NOTIFY_EMAIL],
      subject: `🔔 ${badge} no ${p.platform} — pronto a enviar`, html }),
  });
}
function escapeHtml(s: string) { return (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!)); }

// ---------- publicar (Graph API) ----------
async function post(url: string, body: Record<string, string>) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ access_token: PAGE_TOKEN, ...body }) });
  const j = await r.json(); return { ok: r.ok && !j.error, detail: JSON.stringify(j) };
}
async function publish(row: any): Promise<{ ok: boolean; detail: string }> {
  const results: string[] = []; let allOk = true;
  if (row.kind === "comment") {
    // 1) resposta PÚBLICA
    const pubUrl = `${GRAPH}/${row.target_id}/${row.platform === "Instagram" ? "replies" : "comments"}`;
    const r1 = await post(pubUrl, { message: row.reply });
    results.push("publica:" + r1.detail); allOk = allOk && r1.ok;
    // 2) mensagem PRIVADA à pessoa que comentou
    let r2;
    if (row.platform === "Instagram") {
      // IG: private reply usa o id da conta IG (account_id) e recipient={comment_id}
      r2 = await post(`${GRAPH}/${row.account_id}/messages`, {
        recipient: JSON.stringify({ comment_id: row.target_id }),
        message: JSON.stringify({ text: row.private_reply }),
      });
    } else {
      // FB: private_replies do próprio comentário
      r2 = await post(`${GRAPH}/${row.target_id}/private_replies`, { message: row.private_reply });
    }
    results.push("privada:" + r2.detail); allOk = allOk && r2.ok;
  } else {
    // resposta a mensagem privada existente
    const r = await post(`${GRAPH}/me/messages`, {
      recipient: JSON.stringify({ id: row.recipient_id }),
      message: JSON.stringify({ text: row.reply }),
      messaging_type: "MESSAGE_TAG", tag: "HUMAN_AGENT",
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
    }
    for (const m of entry.messaging || []) {
      if (m.message?.is_echo || !m.message?.text) continue;
      out.push({ platform, kind: "message", account_id: accountId,
        target_id: m.sender?.id || "", recipient_id: m.sender?.id || "",
        author: m.sender?.id || "", incoming: m.message.text });
    }
  }
  return out;
}

// ---------- router ----------
Deno.serve(async (req) => {
  const url = new URL(req.url);

  // DIAGNÓSTICO temporário: ?debug=1 -> diz quais secrets estão presentes (sem revelar valores)
  if (req.method === "GET" && url.searchParams.get("debug") === "1") {
    const keys = ["META_VERIFY_TOKEN","META_APP_SECRET","META_PAGE_TOKEN","ANTHROPIC_API_KEY","RESEND_API_KEY","HMAC_SECRET","FN_BASE","NOTIFY_EMAIL","FROM_EMAIL","PROMPT_URL"];
    const st: Record<string, unknown> = {};
    for (const k of keys) st[k] = (Deno.env.get(k) || "").length > 0;
    st["VERIFY_len"] = (Deno.env.get("META_VERIFY_TOKEN") || "").length;
    st["VERIFY_matches"] = (Deno.env.get("META_VERIFY_TOKEN") || "") === "quenteebom-sol-2026";
    return new Response(JSON.stringify(st, null, 2), { headers: { "content-type": "application/json" } });
  }

  // SELF-TEST temporário: faz 1 chamada pages_manage_engagement (comenta num post da Página + apaga)
  // para completar o requisito de teste do caso "Manage everything on your Page". Remover depois de publicar.
  if (req.method === "GET" && url.pathname.endsWith("/selftest") && url.searchParams.get("key") === VERIFY_TOKEN) {
    const j = (o: unknown) => new Response(JSON.stringify(o, null, 2), { headers: { "content-type": "application/json" } });
    const steps: Record<string, unknown> = {};
    // O META_PAGE_TOKEN é de System User -> descobrir a Página e o token dela
    const meR = await fetch(`${GRAPH}/me?fields=id,name&access_token=${PAGE_TOKEN}`);
    steps["me"] = await meR.json();
    // DIAGNÓSTICO: que permissões tem mesmo este token? (só nomes, sem tokens)
    const permR = await fetch(`${GRAPH}/me/permissions?access_token=${PAGE_TOKEN}`);
    const permJ = await permR.json();
    steps["permissoes_ativas"] = permJ?.error?.message
      || (permJ?.data || []).filter((p: any) => p.status === "granted").map((p: any) => p.permission);
    const accR = await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token&access_token=${PAGE_TOKEN}`);
    const acc = await accR.json();
    const page = (acc?.data || [])[0];
    const pageId = page?.id || (steps["me"] as any)?.id;
    const pageTok = page?.access_token || PAGE_TOKEN; // NUNCA devolvido no JSON
    steps["page"] = page ? { id: page.id, name: page.name } : (acc?.error || "sem páginas em me/accounts");
    if (!pageId) return j({ error: "não consegui identificar a Página", ...steps });
    // último post da Página — tenta com o token da Página e, se falhar, com o token do System User
    let postId = "";
    for (const [lbl, tk] of [["pageTok", pageTok], ["systemTok", PAGE_TOKEN]] as const) {
      for (const ep of ["published_posts", "feed"]) {
        const pr = await fetch(`${GRAPH}/${pageId}/${ep}?limit=1&fields=id&access_token=${tk}`);
        const pjr = await pr.json();
        // sanitizado: guardar só id ou erro (nunca tokens do paging)
        steps[`${ep}_${lbl}`] = pjr?.data?.[0]?.id || pjr?.error?.message || "vazio";
        postId = pjr?.data?.[0]?.id || "";
        if (postId) break;
      }
      if (postId) break;
    }
    if (!postId) return j({ error: "sem posts na Página", pageId, ...steps });
    // comentar (pages_manage_engagement) + apagar logo
    const cr = await fetch(`${GRAPH}/${postId}/comments`, { method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ access_token: pageTok, message: "Teste de configuracao da app (automatico, removido)" }) });
    const cj = await cr.json(); steps["comment"] = cj;
    const commentId = cj?.id || "";
    if (commentId) {
      const dr = await fetch(`${GRAPH}/${commentId}?access_token=${pageTok}`, { method: "DELETE" });
      steps["deleted"] = await dr.json();
    }
    return j({ ok: !!commentId, pageId, postId, commentId, ...steps });
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
    for (const it of extract(payload)) {
      try {
        let pub = "", priv = "";
        if (it.kind === "comment") { const d = await draftForComment(it.platform, it.incoming, it.author); pub = d.pub; priv = d.priv; }
        else { pub = await draftForMessage(it.platform, it.incoming); }
        const { data: ins } = await db.from("pending_replies").insert({
          platform: it.platform, kind: it.kind, account_id: it.account_id, target_id: it.target_id,
          recipient_id: it.recipient_id, author: it.author, incoming: it.incoming,
          reply: pub, private_reply: priv, status: "pending",
        }).select("id").single();
        if (ins?.id) await notify({ ...it, id: ins.id, pub, priv, sig: await hmacHex(HMAC_SECRET, ins.id) });
      } catch (e) { console.error("erro item", e); }
    }
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  return new Response("meta-inbox ok");
});

function htmlPage(msg: string, ok: boolean) {
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <div style="font-family:-apple-system,Segoe UI,Arial;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FBF6EE;margin:0">
    <div style="text-align:center;max-width:440px;padding:40px">
      <div style="font-size:48px">${ok ? "☀️" : "⚠️"}</div>
      <h1 style="color:#5B2A4A;font-family:Georgia,serif">${msg}</h1>
      <p style="color:#6b5060">Podes fechar esta página. Quente e Bom · todos os dias, uma delícia.</p>
    </div>
  </div>`, { headers: { "content-type": "text/html; charset=utf-8" } });
}
