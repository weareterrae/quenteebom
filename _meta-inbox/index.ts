// Supabase Edge Function: meta-inbox
// Recebe webhooks de comentários e mensagens do Facebook + Instagram da Quente e Bom,
// gera uma resposta no tom do Chef Joaquim e envia email ao Sandro com botão "Aprovar e enviar".
// ⚠️ NADA é publicado sem clique humano. Supervisão total.
//
// Deploy: colar no editor de Edge Functions do Supabase (projeto qciagsktkqljvknmahfu), nome "meta-inbox".
// Secrets necessários (Supabase → Edge Functions → Secrets): ver _meta-inbox/SETUP.md

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GRAPH = "https://graph.facebook.com/v21.0";
const env = (k: string, d = "") => Deno.env.get(k) ?? d;

const VERIFY_TOKEN = env("META_VERIFY_TOKEN");
const APP_SECRET   = env("META_APP_SECRET");
const PAGE_TOKEN   = env("META_PAGE_TOKEN");      // token de PÁGINA (FB); serve para o IG ligado à página
const ANTHROPIC_KEY= env("ANTHROPIC_API_KEY");
const RESEND_KEY   = env("RESEND_API_KEY");
const NOTIFY_EMAIL = env("NOTIFY_EMAIL", "sandro.qb@gmail.com");
const FROM_EMAIL   = env("FROM_EMAIL", "Joaquim da Quente e Bom <inbox@quenteebom.com>");
const HMAC_SECRET  = env("HMAC_SECRET");
const FN_BASE      = env("FN_BASE");              // ex: https://qciagsktkqljvknmahfu.functions.supabase.co/meta-inbox
const PROMPT_URL   = env("PROMPT_URL", "https://quenteebom.com/bento-prompt.txt");

const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

// ---------- helpers de assinatura ----------
async function hmacHex(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}
// valida X-Hub-Signature-256 (a Meta assina o corpo com o App Secret)
async function validSignature(req: Request, raw: string) {
  const sig = req.headers.get("x-hub-signature-256") || "";
  if (!APP_SECRET) return true; // se não configurado, não bloqueia (pilotos)
  const expected = "sha256=" + await hmacHex(APP_SECRET, raw);
  return sig === expected;
}

// ---------- geração da resposta (cérebro do Joaquim) ----------
let cachedPrompt = ""; let cachedAt = 0;
async function brand(): Promise<string> {
  if (Date.now() - cachedAt < 300000 && cachedPrompt) return cachedPrompt;
  try { cachedPrompt = await (await fetch(PROMPT_URL)).text(); cachedAt = Date.now(); }
  catch { cachedPrompt = cachedPrompt || "És o Joaquim, o Chef da Quente e Bom (padaria angolana). Responde curto, caloroso, em português de Angola."; }
  return cachedPrompt;
}
async function draftReply(kind: string, platform: string, text: string, author: string): Promise<string> {
  const sys = await brand() + `\n\nCONTEXTO: estás a responder a um ${kind === "comment" ? "COMENTÁRIO público" : "MENSAGEM privada"} no ${platform} de ${author || "um cliente"}. Escreve SÓ a resposta (sem aspas, sem "Resposta:"), curta (1-3 frases), calorosa, com 0-1 emoji. Se for elogio, agradece. Se for reclamação, lamenta com empatia e encaminha para quenteebom.com/contacto. Se perguntar onde comprar, explica que estamos nos supermercados de toda a Angola e pede a zona. Se quiser ser revendedor, encaminha para quenteebom.com/profissional/revendedor/. NUNCA inventes preços, moradas ou stocks.`;
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 300, system: sys,
      messages: [{ role: "user", content: text || "(sem texto)" }] }),
  });
  const j = await r.json();
  return (j?.content?.[0]?.text || "").trim() || "Obrigado pela tua mensagem! 🧡 A nossa equipa vai já ver isto.";
}

// ---------- email (Resend) ----------
async function notify(p: { id: string; platform: string; kind: string; author: string; incoming: string; reply: string; sig: string; }) {
  const link = `${FN_BASE}/send?id=${p.id}&sig=${p.sig}`;
  const badge = p.kind === "comment" ? "Comentário" : "Mensagem privada";
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;color:#3A2030">
    <div style="background:#5B2A4A;color:#fff;border-radius:14px;padding:18px 22px">
      <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#F6C440;font-weight:700">Quente e Bom · ${p.platform} · ${badge}</div>
      <div style="font-size:18px;font-weight:700;margin-top:4px">Nova interação de ${p.author || "um cliente"}</div>
    </div>
    <div style="background:#faf5ec;border:1px solid #f0e6d6;border-radius:12px;padding:14px 16px;margin:14px 0">
      <div style="font-size:12px;color:#9b8290;text-transform:uppercase;letter-spacing:1px">Recebido</div>
      <div style="font-size:15px;margin-top:6px;white-space:pre-wrap">${escapeHtml(p.incoming)}</div>
    </div>
    <div style="background:#fff;border:2px solid #F6C440;border-radius:12px;padding:14px 16px;margin:14px 0">
      <div style="font-size:12px;color:#CC5A08;text-transform:uppercase;letter-spacing:1px;font-weight:700">Resposta sugerida pelo Joaquim</div>
      <div style="font-size:16px;margin-top:6px;white-space:pre-wrap">${escapeHtml(p.reply)}</div>
    </div>
    <div style="text-align:center;margin:22px 0">
      <a href="${link}" style="background:#F6C440;color:#5B2A4A;font-weight:800;text-decoration:none;padding:14px 34px;border-radius:999px;font-size:16px;display:inline-block">Aprovar e enviar ☀️</a>
    </div>
    <div style="font-size:12.5px;color:#9b8290;text-align:center">Só é publicado quando carregas no botão. Se não quiseres responder, ignora este email.</div>
  </div>`;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({ from: FROM_EMAIL, to: [NOTIFY_EMAIL],
      subject: `🔔 ${badge} no ${p.platform} — resposta pronta a enviar`, html }),
  });
}
function escapeHtml(s: string) { return (s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!)); }

// ---------- publicar a resposta aprovada (Graph API) ----------
async function publish(row: any): Promise<{ ok: boolean; detail: string }> {
  let url = "", body: Record<string, string> = { access_token: PAGE_TOKEN };
  if (row.kind === "comment") {
    // FB: /{comment_id}/comments · IG: /{comment_id}/replies
    url = `${GRAPH}/${row.target_id}/${row.platform === "Instagram" ? "replies" : "comments"}`;
    body.message = row.reply;
  } else {
    // mensagem privada (Messenger + IG DM via mesma Graph API da página)
    url = `${GRAPH}/me/messages`;
    body.recipient = JSON.stringify({ id: row.recipient_id });
    body.message = JSON.stringify({ text: row.reply });
    body.messaging_type = "MESSAGE_TAG";
    body.tag = "HUMAN_AGENT"; // permite responder até 7 dias com revisão humana
  }
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body) });
  const j = await r.json();
  return { ok: r.ok && !j.error, detail: JSON.stringify(j) };
}

// ---------- parse dos eventos de webhook ----------
function extract(payload: any): Array<any> {
  const out: any[] = [];
  const platform = payload.object === "instagram" ? "Instagram" : "Facebook";
  for (const entry of payload.entry || []) {
    // comentários (feed FB / comments IG)
    for (const ch of entry.changes || []) {
      const v = ch.value || {};
      if ((ch.field === "feed" && v.item === "comment" && v.verb === "add") || ch.field === "comments") {
        if (v.from?.id && String(v.from.id) === String(entry.id)) continue; // ignora a própria página
        out.push({ platform, kind: "comment", target_id: v.comment_id || v.id,
          recipient_id: v.from?.id || "", author: v.from?.name || v.from?.username || "",
          incoming: v.message || v.text || "" });
      }
    }
    // mensagens (Messenger + IG DM)
    for (const m of entry.messaging || []) {
      if (m.message?.is_echo) continue; // ignora as nossas próprias mensagens
      if (!m.message?.text) continue;
      out.push({ platform, kind: "message", target_id: m.sender?.id || "",
        recipient_id: m.sender?.id || "", author: m.sender?.id || "", incoming: m.message.text });
    }
  }
  return out;
}

// ---------- router ----------
Deno.serve(async (req) => {
  const url = new URL(req.url);

  // 1) Verificação do webhook (a Meta faz um GET ao ligar)
  if (req.method === "GET" && url.searchParams.get("hub.mode") === "subscribe") {
    if (url.searchParams.get("hub.verify_token") === VERIFY_TOKEN)
      return new Response(url.searchParams.get("hub.challenge") || "", { status: 200 });
    return new Response("forbidden", { status: 403 });
  }

  // 2) Aprovar e enviar (clique no email)
  if (req.method === "GET" && url.pathname.endsWith("/send")) {
    const id = url.searchParams.get("id") || "", sig = url.searchParams.get("sig") || "";
    if (sig !== await hmacHex(HMAC_SECRET, id)) return page("Link inválido.", false);
    const { data: row } = await db.from("pending_replies").select("*").eq("id", id).single();
    if (!row) return page("Resposta não encontrada.", false);
    if (row.status === "sent") return page("Esta resposta já tinha sido enviada. ✅", true);
    const res = await publish(row);
    await db.from("pending_replies").update({ status: res.ok ? "sent" : "error", detail: res.detail }).eq("id", id);
    return page(res.ok ? "Resposta enviada com sucesso! ☀️🧡" : "Não foi possível enviar. Tenta pela app.", res.ok);
  }

  // 3) Eventos de webhook (comentários / mensagens)
  if (req.method === "POST") {
    const raw = await req.text();
    if (!await validSignature(req, raw)) return new Response("bad sig", { status: 401 });
    let payload: any; try { payload = JSON.parse(raw); } catch { return new Response("ok"); }
    for (const it of extract(payload)) {
      try {
        const reply = await draftReply(it.kind, it.platform, it.incoming, it.author);
        const { data: ins } = await db.from("pending_replies").insert({
          platform: it.platform, kind: it.kind, target_id: it.target_id,
          recipient_id: it.recipient_id, author: it.author, incoming: it.incoming,
          reply, status: "pending",
        }).select("id").single();
        if (ins?.id) await notify({ ...it, id: ins.id, reply, sig: await hmacHex(HMAC_SECRET, ins.id) });
      } catch (e) { console.error("erro item", e); }
    }
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  return new Response("meta-inbox ok");
});

function page(msg: string, ok: boolean) {
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <div style="font-family:-apple-system,Segoe UI,Arial;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#FBF6EE;margin:0">
    <div style="text-align:center;max-width:420px;padding:40px">
      <div style="font-size:48px">${ok ? "☀️" : "⚠️"}</div>
      <h1 style="color:#5B2A4A;font-family:Georgia,serif">${msg}</h1>
      <p style="color:#6b5060">Podes fechar esta página. Quente e Bom · todos os dias, uma delícia.</p>
    </div>
  </div>`, { headers: { "content-type": "text/html; charset=utf-8" } });
}
