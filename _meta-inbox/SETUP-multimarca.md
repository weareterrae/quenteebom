# Inbox supervisionado — replicar para Água Minda e Massa Prima

O **mesmo `index.ts`** serve as 3 marcas (código generalizado: `BRAND_NAME`, `BRAND_BG`, `BRAND_ACCENT` por variável; a voz vem do `PROMPT_URL`; os tokens vêm dos secrets). Só muda a **configuração por deployment**.

## Config por marca

| Variável | Quente e Bom | Água Minda | Massa Prima |
|---|---|---|---|
| `BRAND_NAME` | Quente e Bom | Água Minda | Massa Prima |
| `BRAND_BG` (cabeçalho/texto botão) | `#5B2A4A` | `#0d2b52` | `#77310A` |
| `BRAND_ACCENT` (realces/fundo botão) | `#F6C440` | `#C9A24B` | `#EC6607` |
| `PROMPT_URL` (voz) | quenteebom.com/bento-prompt.txt (Joaquim) | **aguaminda.com/kianda-prompt.txt (Kianda)** ✅ criado | **massaprima.com/prima-prompt.txt (Chef Prima)** ✅ já existe |
| `FROM_EMAIL` | Joaquim … | Kianda da Água Minda <…> | Chef Prima <…> |
| `NOTIFY_EMAIL` | sandro.qb@gmail.com | (email da marca) | geral@quenteebom.co.ao |
| Página / IG | Quente e Bom Angola / @quenteebom | facebook.com/aguaminda / @aguaminda | facebook.com/1109918612215834 / @massaprima |
| Metricool brandId | 6362422 | 6499555 | (o da Massa Prima) |

Os restantes secrets (`META_VERIFY_TOKEN`, `META_APP_SECRET`, `META_PAGE_TOKEN`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `HMAC_SECRET`, `FN_BASE`) são **por marca** (tokens da app dessa marca).

## ⚠️ GOTCHA importante: secrets do Supabase são por PROJETO, não por função
Todas as funções de um projeto Supabase **partilham os mesmos secrets**. Como a `meta-inbox` (QeB) e a `CHEFPRIMAIA` (Chef Prima) já vivem no projeto `qciagsktkqljvknmahfu`, **não** se pode pôr lá 3 funções cada uma com o seu `META_PAGE_TOKEN` diferente. Opções (escolha do Sandro):

- **(A) Recomendado — 1 projeto Supabase por marca de inbox.** Cada marca tem os seus próprios secrets e usa o **mesmo `index.ts` sem alterações**. Mais limpo, isolado. Custo: criar 1-2 projetos Supabase novos (grátis, ~5 min).
- **(B) Secrets com prefixo no projeto partilhado** (ex.: `MINDA_META_PAGE_TOKEN`). Obriga a mudar os nomes das variáveis no topo de cada cópia da função. Menos limpo.
- **(C) 1 função multi-marca** que decide a marca pelo `entry.id` (id da página) do webhook, com um mapa de config guardado num secret. Mais elegante mas mais código (e validação de assinatura contra vários app secrets).

**Decisão pendente do Sandro.** Por defeito seguimos (A) quando chegarmos ao setup.

## Passos por marca (quando a verificação/app estiverem prontas)
1. App criada no portefólio da marca (casos de utilização: Instagram + Manage everything on your Page; remover `instagram_content_publish`).
2. System user + atribuir Página + IG + App; gerar token de Página (com `pages_manage_engagement`, `instagram_manage_comments/messages`, etc.).
3. Projeto Supabase (opção A) → correr `schema.sql` → deploy do `index.ts` como função (ex.: `meta-inbox`).
4. Secrets (tabela acima + tokens) → **redeploy**.
5. Webhooks (Page: feed; Instagram: comments+messages) → Callback = URL da função, Verify token = `META_VERIFY_TOKEN`.
6. Testing requirements + **Publish** (a verificação do negócio: Água Minda não precisa; Massa Prima em revisão ~2 dias).
7. Testar com o botão "Test" → confirmar email com a voz certa.

## Estado (2026-07-05, fim do dia)
- Código generalizado ✅ · Voz Kianda publicada ✅ · Voz Chef Prima confirmada ✅
- **ÁGUA MINDA — SETUP COMPLETO (opção A):** app "Água Minda Bot" (portefólio Agua Minda, use cases IG + Page, SEM content_publish); system user "Água Minda Inbox" (Employee) com Página+IG+App; token com 7 permissões (incl. `business_management` — necessária para o testing! foi preciso regenerar); projeto Supabase **`bxnxyrzjfyqvogcahrvh`** (org Terrae) com função `meta-inbox` + tabela + secrets (BRAND_NAME=Água Minda, BRAND_BG #0d2b52, ACCENT #C9A24B, PROMPT_URL kianda-prompt.txt, VERIFY=aguaminda-minda-2026); webhooks IG `comments`+`messages` subscritos e verificados; **teste E2E OK** (email com cores navy/dourado e voz da Kianda 💧). Testing requirements IG carimbados via rota `/igtest` (só-leitura; `/feed` dá #10 → usar `published_posts`); `pages_manage_engagement` REMOVIDO (IG-first, FB público = fase 2). **✅ PUBLICADA/LIVE 2026-07-05** (bastou acrescentar a Privacy Policy URL aguaminda.com/privacidade.html; os badges do Dashboard contaram mesmo com a página "A testar" ainda a mostrar "not started"). Rotas de teste removidas do index.ts — redeploy pós-limpeza nas DUAS funções (Minda + QeB). Pós-live: desligar ManyChat/automações nativas do @aguaminda.
- Massa Prima: verificação do negócio **em revisão** (~2 dias úteis) → depois replicar o mesmo guião.
- Quente e Bom: à espera da **access verification** (in review, submetida 3 Jul, ~5 dias úteis; prazo-limite 3 Set) → depois Publish. **AO PUBLICAR:** (1) redeployar a função QeB com o index.ts ATUAL (a versão dela foi limpa antes da rota `/subscribe` existir), (2) correr `GET /meta-inbox/subscribe?key=quenteebom-sol-2026` para instalar a app na Página (sem isto os eventos reais NÃO chegam — lição da Minda), (3) o token QeB já tem pages_manage_metadata ✓.
- **ÁGUA MINDA CONFIRMADA EM PRODUÇÃO (2026-07-05):** IG comentários (pública+DM) ✅ + IG DMs ✅ + **FB comentários (resposta pública) ✅** — tudo validado com interações reais. Para o FB funcionar foi preciso, DEPOIS de publicar: re-adicionar `pages_manage_engagement` ao use case (+ Add — funciona em Standard access com a app Live, lição Leads Terrae), token com **9 permissões**, e configurar o webhook do objeto **Page** (Manage everything on your Page → Customize → Webhooks → product Page → callback+verify → subscrever `feed`) — tinha ficado por fazer (só o do IG estava). **Fase 2 FB FEITA no mesmo dia:** use case "Engage with customers on Messenger" adicionado, webhook Page `messages` subscrito (no Customize do Messenger, product=Page — o gerador de token só mostra `pages_messaging` depois de F5), token final com **10 permissões** (as 9 + `pages_messaging`), `/subscribe` atualizado para `feed,messages` → subscribed_fields [feed, messages] ✅. Água Minda = pacote completo: IG comentários (pública+DM) + IG DMs + FB comentários (pública+DM privada) + FB Messenger DMs.
- ⚠️ Lição 3: cada objeto (Instagram E Page) precisa do SEU webhook configurado no use case respetivo — configurar só o IG não cobre o FB.
- ⚠️ Lição 1: o token do system user precisa de **8 permissões**: `pages_manage_engagement`, `pages_read_engagement`, `pages_show_list`, **`pages_manage_metadata`** (para o subscribed_apps!), `business_management` (o testing exige-o), `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`. Testar leituras com `published_posts`, não `/feed`.
- ⚠️ Lição 2 (CRÍTICA): configurar o webhook na app NÃO chega para eventos REAIS — é preciso "instalar" a app na Página via **`POST /{page-id}/subscribed_apps`** (o botão "Test" funciona sem isso e engana). A função tem a rota admin **`GET /subscribe?key=<META_VERIFY_TOKEN>`** que o faz (idempotente). Correr 1× por marca depois do token estar completo. Na Água Minda: success true, subscribed_fields [feed].
