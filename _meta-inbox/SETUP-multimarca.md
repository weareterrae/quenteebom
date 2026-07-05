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

## Estado (2026-07-05)
- Código generalizado ✅ · Voz Kianda publicada ✅ · Voz Chef Prima confirmada ✅
- Água Minda: negócio **não precisa de verificação** → pode ser a primeira a publicar depois da QeB.
- Massa Prima: verificação do negócio **em revisão** (~2 dias úteis).
- Quente e Bom: à espera da **access verification** (in review) → depois Publish.
