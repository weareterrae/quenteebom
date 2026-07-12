# Motor de Buzz — Água Minda (instalação)

Patrocina automaticamente o post do dia, com objetivo a rodar por dia, para gerar
notoriedade contínua em Luanda. Autónomo, com travões (teto mensal + interruptor).

Arquitetura: Cron diário → Edge Function `buzz-engine` → Meta Marketing API cria 1 anúncio
a partir do post publicado → regista + email de resumo (Resend).

> ⚠️ Nunca colar tokens no chat. Todos vão para os **Secrets** do Supabase.

## 1. Base de dados (Supabase → SQL Editor)
Correr `schema.sql` (cria `buzz_runs` e `buzz_config`).

## 2. Deploy da função (Supabase → Edge Functions, projeto bxnxyrzjfyqvogcahrvh)
- Nova função com o nome **`buzz-engine`**.
- Colar o conteúdo de `index.ts`.
- URL pública: `https://bxnxyrzjfyqvogcahrvh.functions.supabase.co/buzz-engine`

## 3. Secrets (Supabase → Edge Functions → Manage secrets)
| Secret | Valor |
|---|---|
| `META_ADS_TOKEN` | token do system user "Água Minda Ads" (ads_management + ads_read) |
| `META_AD_ACCOUNT` | `act_2845241972497282` |
| `META_PAGE_ID` | `109090215363804` |
| `META_IG_ID` | `17841457113250466` |
| `ADMIN_KEY` | palavra à tua escolha (protege /run e /status), ex.: `buzz-minda-2026` |
| `BUZZ_ENABLED` | `off` no início; passar a `on` só depois do canário validar |
| `MONTHLY_CAP` | `240` |
| `DAILY_BUDGET` | `8` |
| `LUANDA_REGION_KEY` | `4514` |
| `FN_BASE` | `https://bxnxyrzjfyqvogcahrvh.functions.supabase.co/buzz-engine` |
| `RESEND_API_KEY` | (o mesmo do inbox) |
| `NOTIFY_EMAIL` | `sandro.qb@gmail.com` |
| `FROM_EMAIL` | `Motor de Buzz Minda <buzz@aguaminda.com>` (ou o remetente do inbox) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | já disponíveis no projeto |

## 4. Validação segura (ANTES do automático)
1. **Simulação (não gasta):** `GET {FN_BASE}/run?key=<ADMIN_KEY>&dry=1`
   → devolve o que faria hoje (objetivo, verba, post). Confirmar que faz sentido.
2. **Canário (€1 real):** `GET {FN_BASE}/run?key=<ADMIN_KEY>&budget=1`
   → cria 1 anúncio de €1. Verificar no Ads Manager que ficou bem.
3. **Estado:** `GET {FN_BASE}/status?key=<ADMIN_KEY>` → gasto do mês + últimos runs.

## 5. Ligar o automático puro
- Mudar o secret `BUZZ_ENABLED` para **`on`**.
- Criar um **Cron** (Supabase → Integrations → Cron, ou pg_cron) que chame
  `GET {FN_BASE}/run?key=<ADMIN_KEY>` **1×/dia ~14h de Luanda** (13:00 UTC),
  já depois de o post do meio-dia estar publicado.

## Travões (sempre ativos)
- `BUZZ_ENABLED != on` → não faz nada (interruptor de emergência).
- Gasto do mês ≥ `MONTHLY_CAP` → recusa criar anúncio (+ email de aviso).
- Cada anúncio tem `lifetime_budget` = verba do dia → teto rígido por dia.
- Só patrocina posts publicados hoje (não amplifica falhas).

## Rotação de objetivo (o "buzz diferente todos os dias")
| Dia | Objetivo | Otimização |
|---|---|---|
| Seg | Alcance | REACH |
| Ter/Qua | Interações | POST_ENGAGEMENT |
| Qui (reel) | Vídeo | THRUPLAY |
| Sex | Perfil/Tráfego | LANDING_PAGE_VIEWS |
| Sáb | Alcance | REACH |
| Dom | Interações | POST_ENGAGEMENT |
(Qualquer dia com reel passa automaticamente a THRUPLAY.)
