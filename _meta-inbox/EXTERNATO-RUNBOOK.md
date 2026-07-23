# RUNBOOK — Inbox da Avó Maria (Externato) · executar 1×, ~1h

Modelo: **supervisionado** (email com a resposta redigida + botão → envia resposta pública e/ou DM). SEM piloto automático (não pôr `AUTO_REPLY`).
Lado do site: **PRONTO** (avo-prompt.txt, privacidade.html, inbox.html live). Código: o `index.ts` atual, **sem alterações**.
Todos os valores estão em `EXTERNATO-SECRETS.local.txt`. Gotchas → ver "Lições" no SETUP-multimarca.md.

---

## 1. App Meta "Externato Inbox"
- developers.facebook.com → **Create App** → tipo **Business** → portefólio/Business do Externato.
- Use cases: **"Manage everything on your Page"** + **"Instagram"** (+ opcional **"Messenger"** p/ DMs FB). NÃO adicionar `instagram_content_publish`. NÃO iniciar Tech Provider.
- Guardar o **App Secret** (Settings → Basic) → é o `META_APP_SECRET`.
- Privacy Policy URL (Settings → Basic): `https://externatosantamariadebelem.netlify.app/privacidade.html`

## 2. System user + token de Página (10 permissões)
- Business Settings → Users → **System users** → usar/criar um → **Add Assets**: a Página (Externato, id 687996854629618), o **IG** (@externatosantamariadebelem) e a **App**.
- **Generate token** para a Página com estas 10 permissões (Lição 1 + 7):
  `pages_manage_engagement`, `pages_read_engagement`, `pages_read_user_content`, `pages_show_list`, `pages_manage_metadata`, `business_management`, `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`, `pages_messaging`
  → é o `META_PAGE_TOKEN`. (Se o `pages_messaging` não aparecer, F5 depois de configurar o webhook do Messenger.)

## 3. Projeto Supabase novo (opção A — 1 projeto por marca)
- supabase.com → **New project** (org Terrae). Nome ex.: "externato-inbox".
- SQL Editor → colar e correr o **`schema.sql`**.
- Edge Functions → nova função **`meta-inbox`** → colar o **`index.ts`** atual → **deploy**. (Verify JWT = OFF.)
- `FN_BASE` = URL da função (ex.: `https://<ref>.functions.supabase.co/meta-inbox`).

## 4. Secrets (Project Settings → Edge Functions → Secrets) → depois **redeploy**
```
BRAND_NAME=Externato Santa Maria de Belém
BRAND_BG=#3B6B50
BRAND_ACCENT=#C9993F
BRAND_SITE=https://externatosantamariadebelem.netlify.app
PROMPT_URL=https://externatosantamariadebelem.netlify.app/avo-prompt.txt
NOTIFY_EMAIL=sandro.qb@gmail.com
FROM_EMAIL=Avó Maria <o teu remetente Resend verificado>
BOT_NAME=a Avó Maria
META_VERIFY_TOKEN=externato-avomaria-2026
HMAC_SECRET=5098fff2b63cd13c80b228033a881e0766b4c34f36f083c3ec9c64a95799caa5
REDATOR_KEY=570e34b0ee43b4cb1ac69af39a25907f54922b9f6909d860
RESEND_API_KEY=<a partilhada das outras marcas>
META_APP_SECRET=<passo 1>
META_PAGE_TOKEN=<passo 2>
FN_BASE=<passo 3>
```
(SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem por defeito no projeto. NÃO pôr ANTHROPIC_API_KEY — a IA vai pelo redator.)

## 5. Webhooks (na app Meta) — cada objeto o SEU (Lição 3)
- **Instagram** (use case IG → Customize → Webhooks): Callback = `FN_BASE`, Verify = `externato-avomaria-2026` → subscrever **comments**, **messages** (e **mentions** se quiseres, Lição 10).
- **Page** (Manage everything on your Page → Customize → Webhooks, product **Page**): mesmo Callback+Verify → subscrever **feed** (e **messages** se ativaste Messenger).

## 6. Instalar a app na Página + testes
- Correr 1× (Lição 2): abrir no browser `FN_BASE/subscribe?key=externato-avomaria-2026` → deve dar `success:true, subscribed_fields [feed, messages]`.
- `FN_BASE/igtest?key=externato-avomaria-2026` → deve dar 4/4 ok (pageId 687996854629618 + igId).

## 7. Publicar + dança do pages_manage_engagement (Lição 7)
- App Review → Permissions → confirmar Privacy Policy URL.
- Remover `pages_manage_engagement` do use case → **Publish** a app (Standard/Live) → **re-adicionar** `pages_manage_engagement` (+ Add) → **gerar token novo** (as 10 permissões) → atualizar `META_PAGE_TOKEN` → **redeploy**.
- Para FB Messenger ao público: pedir **Advanced Access** ao `pages_messaging` em App Review (o IG já funciona p/ público sem isso).

## 8. Teste E2E
- Comentar/DM de teste no @externatosantamariadebelem → chega email verde/ocre com a voz da Avó Maria + botão.
- Carregar no botão → confirma resposta pública + DM enviadas (página inbox.html verde "Enviado!").
- `FN_BASE/last?key=externato-avomaria-2026` mostra o último registo (se vier vazio após teste → META_APP_SECRET errado, Lição MP).

## 9. Pós-live
- Desligar automações nativas do Business Suite / ManyChat do @externatosantamariadebelem (senão recriam regras comment-to-DM, Lição 8/QeB).
- Deixar em modo aprovação umas semanas; ligar `AUTO_REPLY=all` só quando confiares na triagem (Lição 13).
