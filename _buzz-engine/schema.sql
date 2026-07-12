-- Motor de Buzz — tabelas de estado (correr no SQL Editor do Supabase, projeto bxnxyrzjfyqvogcahrvh)

-- registo de cada corrida diária
create table if not exists buzz_runs (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  status      text,          -- created | dry | skipped | capped | no_post | error
  detail      text,
  spend       numeric,       -- gasto do mês no momento do run
  objective   text,
  goal        text,
  budget_eur  numeric,
  post_id     text,
  adset_id    text,
  ad_id       text,
  is_video    boolean
);

-- config/cache (ids das campanhas-base, etc.)
create table if not exists buzz_config (
  key    text primary key,
  value  text
);
