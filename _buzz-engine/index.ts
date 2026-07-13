// ============================================================================
//  MOTOR DE BUZZ — Água Minda
//  Patrocina automaticamente o post do dia, com objetivo a rodar por dia,
//  para gerar notoriedade contínua em Luanda. 100% autónomo, com travões.
//
//  Deploy: Supabase → Edge Functions → função "buzz-engine" → colar este ficheiro.
//  Cron: chamar GET {FN_BASE}/run?key=<ADMIN_KEY> uma vez por dia (~14h Luanda).
//
//  Rotas:
//    GET /run?key=…            corre o dia (cria 1 anúncio). Suporta:
//                              &dry=1   → só simula, não cria nada (log "dry")
//                              &budget=1→ força verba de canário (€1) neste run
//    GET /status?key=…         mostra gasto do mês + últimos runs + config
//    GET /health               ping simples
//
//  TRAVÕES (protegem o gasto mesmo em modo automático):
//    • BUZZ_ENABLED != "on"     → não faz nada (interruptor de emergência)
//    • gasto do mês ≥ MONTHLY_CAP → recusa criar anúncio
//    • cada anúncio tem lifetime_budget = verba do dia (teto rígido por dia)
//    • só patrocina posts publicados com sucesso
// ============================================================================

const GRAPH = "https://graph.facebook.com/v21.0";

const env = (k: string, d = "") => (Deno.env.get(k) ?? d);
const TOKEN      = env("META_ADS_TOKEN");
const ACT        = env("META_AD_ACCOUNT");            // ex.: act_2845241972497282
const PAGE_ID    = env("META_PAGE_ID");               // 109090215363804
const IG_ID      = env("META_IG_ID");                 // 17841457113250466 (opcional)
const ADMIN_KEY  = env("ADMIN_KEY");
const ENABLED    = env("BUZZ_ENABLED", "off");        // "on" para ligar o automático
const MONTHLY_CAP= Number(env("MONTHLY_CAP", "240")); // teto rígido do mês, €
const DAILY_EUR  = Number(env("DAILY_BUDGET", "8"));  // verba por dia, €
const REGION_KEY = env("LUANDA_REGION_KEY", "4514");  // Luanda Province
const FN_BASE    = env("FN_BASE");
const RESEND_KEY = env("RESEND_API_KEY");
const NOTIFY     = env("NOTIFY_EMAIL", "sandro.qb@gmail.com");
const FROM       = env("FROM_EMAIL", "Motor de Buzz Minda <buzz@aguaminda.com>");

// Supabase (service role — já disponível no projeto)
const SB_URL = env("SUPABASE_URL");
const SB_KEY = env("SUPABASE_SERVICE_ROLE_KEY");

// --- mini cliente Supabase REST (sem SDK) ---
const sb = {
  async select(table: string, query: string) {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
    });
    return r.ok ? await r.json() : [];
  },
  async insert(table: string, row: unknown) {
    await fetch(`${SB_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "content-type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
  },
  async upsert(table: string, row: unknown) {
    await fetch(`${SB_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "content-type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(row),
    });
  },
};

// --- Graph helpers ---
async function gGet(path: string) {
  const sep = path.includes("?") ? "&" : "?";
  const r = await fetch(`${GRAPH}/${path}${sep}access_token=${TOKEN}`);
  return await r.json();
}
async function gPost(path: string, body: Record<string, unknown>) {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) form.set(k, typeof v === "string" ? v : JSON.stringify(v));
  form.set("access_token", TOKEN);
  const r = await fetch(`${GRAPH}/${path}`, { method: "POST", body: form });
  return await r.json();
}

// --- troca o token do system user por um token de PÁGINA (necessário p/ ler posts) ---
let _pt: { tok: string; at: number } | null = null;
async function pageTok(): Promise<string> {
  if (_pt && Date.now() - _pt.at < 50 * 60 * 1000) return _pt.tok;
  const j = await gGet(`${PAGE_ID}?fields=access_token`);
  if (j?.access_token) { _pt = { tok: j.access_token, at: Date.now() }; return j.access_token; }
  // fallback: via me/accounts
  const a = await gGet(`me/accounts?fields=id,access_token`);
  const p = (a?.data || []).find((x: { id: string }) => x.id === PAGE_ID);
  if (p?.access_token) { _pt = { tok: p.access_token, at: Date.now() }; return p.access_token; }
  // "Nova Experiência de Páginas" (NPE): não há page token separado — usa-se o token
  // do system user diretamente (requer pages_read_engagement + Página atribuída).
  _pt = { tok: TOKEN, at: Date.now() };
  return TOKEN;
}

// --- rotação de objetivo por dia da semana (0=Dom … 6=Sáb) ---
// objective = campanha (fixa); goal = otimização (ad set, varia)
type Plan = { label: string; objective: "OUTCOME_AWARENESS" | "OUTCOME_ENGAGEMENT"; goal: string; billing: string; dest?: string };
const ENG:   Plan = { label: "Interações", objective: "OUTCOME_ENGAGEMENT", goal: "POST_ENGAGEMENT", billing: "IMPRESSIONS", dest: "ON_POST" };
const REACH: Plan = { label: "Alcance",    objective: "OUTCOME_AWARENESS",  goal: "REACH",           billing: "IMPRESSIONS" };
const VIDEO: Plan = { label: "Vídeo",      objective: "OUTCOME_AWARENESS",  goal: "THRUPLAY",        billing: "IMPRESSIONS" };
function planForDay(dow: number, isVideo: boolean): Plan {
  if (isVideo) return VIDEO;                 // qualquer post de vídeo → reproduções
  const map: Record<number, Plan> = { 1: REACH, 2: ENG, 3: ENG, 4: ENG, 5: ENG, 6: REACH, 0: ENG };
  return map[dow];
}

// --- gasto do mês SÓ das campanhas do buzz (não conta o launch) ---
async function monthSpend(): Promise<number> {
  const now = new Date();
  const y = now.getUTCFullYear(), m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const since = `${y}-${m}-01`;
  const until = now.toISOString().slice(0, 10);
  const tr = encodeURIComponent(JSON.stringify({ since, until }));
  const cfg = await sb.select("buzz_config", "select=key,value");
  const ids = (cfg || []).filter((r: { key: string }) => String(r.key).startsWith("camp_")).map((r: { value: string }) => r.value).filter(Boolean);
  let total = 0;
  for (const id of ids) {
    const j = await gGet(`${id}/insights?fields=spend&time_range=${tr}`);
    const s = j?.data?.[0]?.spend;
    if (s) total += Number(s);
  }
  return total;
}

// --- garante as 3 campanhas-base (uma por objetivo), cacheadas em buzz_config ---
async function ensureCampaign(objective: string): Promise<string> {
  const rows = await sb.select("buzz_config", `key=eq.camp_${objective}&select=value`);
  if (rows?.[0]?.value) {
    await gPost(`${rows[0].value}`, { status: "ACTIVE" }); // garante que fica ativa
    return rows[0].value;
  }
  const res = await gPost(`${ACT}/campaigns`, {
    name: `Buzz Diário — ${objective}`,
    objective,
    status: "ACTIVE",                 // ACTIVE: o controlo de gasto é o ad set (verba+janela)
    special_ad_categories: "[]",
    is_adset_budget_sharing_enabled: "false", // exigido pela Meta (orçamento por ad set, não CBO)
  });
  if (!res.id) throw new Error(`falha a criar campanha ${objective}: ${JSON.stringify(res.error || res)}`);
  await sb.upsert("buzz_config", { key: `camp_${objective}`, value: res.id });
  return res.id;
}

// --- posts recentes da Página (robusto: páginas clássicas E "Nova Experiência de Páginas") ---
// Tenta published_posts e feed, com o page token e com o token do system user, até um funcionar.
async function fetchRecent(): Promise<{ error: unknown; posts: Array<Record<string, unknown>> }> {
  const fields = "id,created_time,message,status_type,attachments{media_type}";
  let pt = TOKEN;
  try { pt = await pageTok(); } catch { /* fica o token do system user */ }
  const tokens = [...new Set([pt, TOKEN])];
  let lastErr: unknown = null;
  for (const tok of tokens) {
    for (const edge of ["published_posts", "feed"]) {
      try {
        const r = await fetch(`${GRAPH}/${PAGE_ID}/${edge}?fields=${fields}&limit=8&access_token=${tok}`);
        const j = await r.json();
        if (!j?.error && Array.isArray(j?.data)) return { error: null, posts: j.data };
        lastErr = j?.error || lastErr;
      } catch (e) { lastErr = String(e); }
    }
  }
  return { error: lastErr, posts: [] };
}
function mapPost(p: Record<string, unknown>): { id: string; message: string; isVideo: boolean } {
  const att = (p.attachments as { data?: Array<{ media_type?: string }> } | undefined)?.data?.[0]?.media_type;
  const mt = att || (p.status_type as string) || "";
  return { id: p.id as string, message: String(p.message || ""), isVideo: /video/i.test(String(mt)) };
}
function pickToday(posts: Array<Record<string, unknown>>): { id: string; message: string; isVideo: boolean } | null {
  const today = new Date().toISOString().slice(0, 10);
  for (const p of posts) {
    if (String(p.created_time || "").slice(0, 10) === today) return mapPost(p);
  }
  return null;
}
function pickLatest(posts: Array<Record<string, unknown>>): { id: string; message: string; isVideo: boolean } | null {
  return posts[0] ? mapPost(posts[0]) : null;
}

// --- media do Instagram publicada hoje (para o buzz aparecer no IG e no FB) ---
async function todaysIgMedia(anyDate = false): Promise<string | null> {
  try {
    if (!IG_ID) return null;
    const pt = await pageTok();
    const r = await fetch(`${GRAPH}/${IG_ID}/media?fields=id,timestamp&limit=8&access_token=${pt}`);
    const j = await r.json();
    if (anyDate) return (j?.data?.[0]?.id as string) || null;
    const today = new Date().toISOString().slice(0, 10);
    for (const m of (j?.data || [])) {
      if (String(m.timestamp || "").slice(0, 10) === today) return m.id as string;
    }
  } catch { /* sem IG media → cai no post do FB */ }
  return null;
}

async function sendEmail(subject: string, html: string) {
  if (!RESEND_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [NOTIFY], subject, html }),
  });
}

// ------------------------------- RUN -----------------------------------------
async function run(dry: boolean, canary: boolean, force = false): Promise<Record<string, unknown>> {
  const stamp = new Date().toISOString();
  const log = async (status: string, detail: string, extra: Record<string, unknown> = {}) => {
    await sb.insert("buzz_runs", { created_at: stamp, status, detail, ...extra });
    return { status, detail, ...extra };
  };

  // 1) interruptor
  if (ENABLED.trim() !== "on" && !dry) return await log("skipped", "BUZZ_ENABLED != on");

  // 2) teto mensal (só buzz)
  const spent = await monthSpend();

  // 3) post do dia (+ diagnóstico de leitura)
  const { error: postErr, posts } = await fetchRecent();
  const post = force ? pickLatest(posts) : pickToday(posts);
  const dow = new Date().getUTCDay();
  const eur = canary ? 1 : Math.max(1, DAILY_EUR);
  const budgetCents = Math.round(eur * 100);

  if (dry) {
    const plan = planForDay(dow, post?.isVideo || false);
    return await log("dry", post ? `simulação OK: obj=${plan.objective} goal=${plan.goal} verba=€${eur} post=${post.id}` : "simulação: sem post de hoje", {
      spend: spent, buzz_month_spend: spent, objective: plan.objective, goal: plan.goal, budget_eur: eur,
      post_id: post?.id || null, is_video: post?.isVideo || false,
      dow, post_read_error: postErr,
      recent_posts: posts.map((p) => ({ id: p.id, date: String(p.created_time || "").slice(0, 10) })),
    });
  }

  if (spent >= MONTHLY_CAP) {
    const r = await log("capped", `gasto do buzz €${spent.toFixed(2)} ≥ teto €${MONTHLY_CAP}`, { spend: spent });
    await sendEmail("💧 Buzz Minda — teto do mês atingido", `Gasto do buzz este mês: €${spent.toFixed(2)} (teto €${MONTHLY_CAP}). Sem novo anúncio hoje.`);
    return r;
  }
  if (!post) return await log("no_post", postErr ? `erro a ler posts: ${JSON.stringify(postErr)}` : "sem post publicado hoje na Página", { post_read_error: postErr });

  const plan = planForDay(dow, post.isVideo);

  try {
    // 5) campanha-base do objetivo do dia
    const campId = await ensureCampaign(plan.objective);

    // 6) ad set do dia (lifetime = verba do dia; janela de 24h; Luanda 18-65; FB+IG auto)
    const start = new Date();
    const end = new Date(Date.now() + 24 * 3600 * 1000);
    // criativo preferido = post do INSTAGRAM (aparece no IG e no FB); recurso = post do FB
    const igMedia = await todaysIgMedia(force);
    const useIg = !!igMedia;

    const targeting: Record<string, unknown> = {
      geo_locations: { regions: [{ key: REGION_KEY }] },
      age_min: 18, age_max: 65,
      publisher_platforms: ["facebook", "instagram"], // explícito: as duas redes
      targeting_automation: { advantage_audience: 1 },
    };
    const adsetBody: Record<string, unknown> = {
      name: `Buzz ${stamp.slice(0, 10)} — ${plan.label}`,
      campaign_id: campId,
      lifetime_budget: String(budgetCents),
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      billing_event: plan.billing,
      optimization_goal: plan.goal,
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      targeting,
      status: "ACTIVE",
    };
    // ON_POST só faz sentido no criativo do FB; com criativo do IG, omitir
    if (plan.dest && !useIg) adsetBody.destination_type = plan.dest;
    const adset = await gPost(`${ACT}/adsets`, adsetBody);
    if (!adset.id) throw new Error(`ad set: ${JSON.stringify(adset.error || adset)}`);

    // 7) anúncio: criativo do IG se houver, senão o post do FB
    const storyId = post.id.includes("_") ? post.id : `${PAGE_ID}_${post.id}`;
    const igCreative = { instagram_user_id: IG_ID, source_instagram_media_id: igMedia };
    const fbCreative = { object_story_id: storyId };
    let ad = await gPost(`${ACT}/ads`, {
      name: `Buzz ${stamp.slice(0, 10)} — ${plan.label}`,
      adset_id: adset.id,
      creative: useIg ? igCreative : fbCreative,
      status: "ACTIVE",
    });
    let via = useIg ? "IG(FB+IG)" : "FB";
    if (ad?.error && useIg) { // recurso: se o criativo do IG falhar, usa o post do FB
      ad = await gPost(`${ACT}/ads`, {
        name: `Buzz ${stamp.slice(0, 10)} — ${plan.label}`,
        adset_id: adset.id, creative: fbCreative, status: "ACTIVE",
      });
      via = "FB(fallback)";
    }
    if (!ad.id) throw new Error(`ad: ${JSON.stringify(ad.error || ad)}`);

    const r = await log("created", `${plan.label} · €${eur} · ${via} · post ${post.id}`, {
      spend: spent, objective: plan.objective, goal: plan.goal, budget_eur: eur,
      post_id: post.id, adset_id: adset.id, ad_id: ad.id,
    });
    await sendEmail(
      `💧 Buzz Minda — hoje: ${plan.label} (€${eur})`,
      `<p>Patrocínio do dia criado.</p><ul>
       <li><b>Objetivo:</b> ${plan.label} (${plan.objective} / ${plan.goal})</li>
       <li><b>Verba:</b> €${eur}</li>
       <li><b>Post:</b> ${post.id}</li>
       <li><b>Gasto do mês até agora:</b> €${spent.toFixed(2)} / €${MONTHLY_CAP}</li></ul>
       <p>Ad set ${adset.id} · Anúncio ${ad.id}</p>`,
    );
    return r;
  } catch (e) {
    const r = await log("error", String(e));
    await sendEmail("⚠️ Buzz Minda — erro no run de hoje", `<pre>${String(e)}</pre>`);
    return r;
  }
}

// ------------------------------- ROUTER --------------------------------------
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");

  if (url.pathname.endsWith("/health")) {
    return new Response(JSON.stringify({ ok: true, enabled: ENABLED, cap: MONTHLY_CAP, daily: DAILY_EUR }), { headers: { "content-type": "application/json" } });
  }

  if (key !== ADMIN_KEY) return new Response("forbidden", { status: 403 });

  if (url.pathname.endsWith("/status")) {
    const spent = await monthSpend();
    const runs = await sb.select("buzz_runs", "select=created_at,status,detail,budget_eur,objective,post_id,ad_id&order=created_at.desc&limit=10");
    return new Response(JSON.stringify({ enabled: ENABLED, month_spend: spent, cap: MONTHLY_CAP, daily_budget: DAILY_EUR, runs }, null, 2), { headers: { "content-type": "application/json" } });
  }

  if (url.pathname.endsWith("/run")) {
    const dry = url.searchParams.get("dry") === "1";
    const canary = url.searchParams.get("budget") === "1";
    const force = url.searchParams.get("test") === "1"; // promove o post mais recente (ignora a data)
    const out = await run(dry, canary, force);
    return new Response(JSON.stringify(out, null, 2), { headers: { "content-type": "application/json" } });
  }

  return new Response("buzz-engine ok");
});
