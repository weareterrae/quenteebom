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

// --- rotação de objetivo por dia da semana (0=Dom … 6=Sáb) ---
// objective = campanha (fixa); goal = otimização (ad set, varia)
type Plan = { label: string; objective: "OUTCOME_AWARENESS" | "OUTCOME_ENGAGEMENT" | "OUTCOME_TRAFFIC"; goal: string; billing: string };
function planForDay(dow: number, isVideo: boolean): Plan {
  // Quinta com reel → reproduções de vídeo
  const table: Record<number, Plan> = {
    1: { label: "Alcance",     objective: "OUTCOME_AWARENESS",  goal: "REACH",           billing: "IMPRESSIONS" }, // Seg
    2: { label: "Interações",  objective: "OUTCOME_ENGAGEMENT", goal: "POST_ENGAGEMENT", billing: "IMPRESSIONS" }, // Ter
    3: { label: "Interações",  objective: "OUTCOME_ENGAGEMENT", goal: "POST_ENGAGEMENT", billing: "IMPRESSIONS" }, // Qua (MoV)
    4: { label: "Vídeo",       objective: "OUTCOME_AWARENESS",  goal: "THRUPLAY",        billing: "IMPRESSIONS" }, // Qui (reel)
    5: { label: "Perfil/Tráfego", objective: "OUTCOME_TRAFFIC", goal: "LANDING_PAGE_VIEWS", billing: "IMPRESSIONS" }, // Sex (crescer conta)
    6: { label: "Alcance",     objective: "OUTCOME_AWARENESS",  goal: "REACH",           billing: "IMPRESSIONS" }, // Sáb
    0: { label: "Interações",  objective: "OUTCOME_ENGAGEMENT", goal: "POST_ENGAGEMENT", billing: "IMPRESSIONS" }, // Dom
  };
  const p = table[dow];
  if (isVideo && p.objective !== "OUTCOME_AWARENESS") {
    return { label: "Vídeo", objective: "OUTCOME_AWARENESS", goal: "THRUPLAY", billing: "IMPRESSIONS" };
  }
  return p;
}

// --- gasto do mês (insights da conta) ---
async function monthSpend(): Promise<number> {
  const now = new Date();
  const y = now.getUTCFullYear(), m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const since = `${y}-${m}-01`;
  const until = now.toISOString().slice(0, 10);
  const j = await gGet(`${ACT}/insights?fields=spend&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}`);
  const spend = j?.data?.[0]?.spend;
  return spend ? Number(spend) : 0;
}

// --- garante as 3 campanhas-base (uma por objetivo), cacheadas em buzz_config ---
async function ensureCampaign(objective: string): Promise<string> {
  const rows = await sb.select("buzz_config", `key=eq.camp_${objective}&select=value`);
  if (rows?.[0]?.value) return rows[0].value;
  const res = await gPost(`${ACT}/campaigns`, {
    name: `Buzz Diário — ${objective}`,
    objective,
    status: "PAUSED",                 // a campanha fica PAUSED; os ad sets é que ativam
    special_ad_categories: "[]",
  });
  if (!res.id) throw new Error(`falha a criar campanha ${objective}: ${JSON.stringify(res.error || res)}`);
  await sb.upsert("buzz_config", { key: `camp_${objective}`, value: res.id });
  return res.id;
}

// --- post do dia (Facebook Page): o mais recente publicado hoje ---
async function todaysPost(): Promise<{ id: string; message: string; isVideo: boolean } | null> {
  const j = await gGet(`${PAGE_ID}/published_posts?fields=id,created_time,message,status_type,attachments{media_type}&limit=8`);
  const today = new Date().toISOString().slice(0, 10);
  for (const p of (j?.data || [])) {
    if (String(p.created_time || "").slice(0, 10) === today) {
      const mt = p?.attachments?.data?.[0]?.media_type || p.status_type || "";
      const isVideo = /video/i.test(String(mt));
      return { id: p.id, message: String(p.message || ""), isVideo };
    }
  }
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
async function run(dry: boolean, canary: boolean): Promise<Record<string, unknown>> {
  const stamp = new Date().toISOString();
  const log = async (status: string, detail: string, extra: Record<string, unknown> = {}) => {
    await sb.insert("buzz_runs", { created_at: stamp, status, detail, ...extra });
    return { status, detail, ...extra };
  };

  // 1) interruptor
  if (ENABLED !== "on" && !dry) return await log("skipped", "BUZZ_ENABLED != on");

  // 2) teto mensal
  const spent = await monthSpend();
  if (spent >= MONTHLY_CAP) {
    const r = await log("capped", `gasto do mês €${spent.toFixed(2)} ≥ teto €${MONTHLY_CAP}`, { spend: spent });
    await sendEmail("💧 Buzz Minda — teto do mês atingido", `Gasto do mês: €${spent.toFixed(2)} (teto €${MONTHLY_CAP}). Sem novo anúncio hoje.`);
    return r;
  }

  // 3) post do dia
  const post = await todaysPost();
  if (!post) return await log("no_post", "sem post publicado hoje na Página");

  // 4) plano do dia
  const dow = new Date().getUTCDay();
  const plan = planForDay(dow, post.isVideo);
  const eur = canary ? 1 : Math.max(1, DAILY_EUR);
  const budgetCents = Math.round(eur * 100);

  if (dry) {
    return await log("dry", `simulação: obj=${plan.objective} goal=${plan.goal} verba=€${eur} post=${post.id}`, {
      spend: spent, objective: plan.objective, goal: plan.goal, budget_eur: eur, post_id: post.id, is_video: post.isVideo,
    });
  }

  try {
    // 5) campanha-base do objetivo do dia
    const campId = await ensureCampaign(plan.objective);

    // 6) ad set do dia (lifetime = verba do dia; janela de 24h; Luanda 18-65; FB+IG auto)
    const start = new Date();
    const end = new Date(Date.now() + 24 * 3600 * 1000);
    const targeting = {
      geo_locations: { regions: [{ key: REGION_KEY }] },
      age_min: 18, age_max: 65,
      targeting_automation: { advantage_audience: 1 },
    };
    const adset = await gPost(`${ACT}/adsets`, {
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
    });
    if (!adset.id) throw new Error(`ad set: ${JSON.stringify(adset.error || adset)}`);

    // 7) anúncio a partir do post publicado (creative usa object_story_id)
    const storyId = post.id.includes("_") ? post.id : `${PAGE_ID}_${post.id}`;
    const ad = await gPost(`${ACT}/ads`, {
      name: `Buzz ${stamp.slice(0, 10)} — ${plan.label}`,
      adset_id: adset.id,
      creative: { object_story_id: storyId },
      status: "ACTIVE",
    });
    if (!ad.id) throw new Error(`ad: ${JSON.stringify(ad.error || ad)}`);

    const r = await log("created", `${plan.label} · €${eur} · post ${post.id}`, {
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
    const out = await run(dry, canary);
    return new Response(JSON.stringify(out, null, 2), { headers: { "content-type": "application/json" } });
  }

  return new Response("buzz-engine ok");
});
