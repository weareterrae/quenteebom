# RUNBOOK — Inbox pessoal do Sandro Sousa (no projecto Supabase do Nº 5) · versão 5 Set 2026
(Substitui o SANDRO-RUNBOOK.md antigo, que previa projecto novo.)

Modelo supervisionado: comentário, menção ou DM -> rascunho na voz do Sandro -> email para sandro.qb@gmail.com com botão -> só sai depois do clique. SEM AUTO_REPLY.

## Onde vive
- Projecto Supabase: numero5 inbox `rycgekqszxyudmchpqvs` (org Terrae).
- Função: `meta-inbox-sandro` (Verify JWT OFF), código `index-sandro.ts` = cópia do index.ts que lê secrets com prefixo `SANDRO_` (fallback aos partilhados REDATOR_KEY, RESEND_API_KEY, SUPABASE_*) e grava na tabela `pending_replies_sandro` (clonada de pending_replies + story_url).
- Regenerar: `node make-sandro-fn.mjs`. Deploy: `node sandro-n5.mjs deploy`. Verificar: `node sandro-n5.mjs check`.
- FN_BASE = https://rycgekqszxyudmchpqvs.functions.supabase.co/meta-inbox-sandro (responde "meta-inbox ok").
- Site: numerocinco.pt/sandrosousa/sandro-prompt.txt (voz) e /sandrosousa/inbox.html (confirmação). Privacy Policy: https://numerocinco.pt/politica-de-privacidade/

## Já feito pelo Sandro (5 Set)
- App Meta "Sandro Sousa Inbox" (portefólio Sandro Sousa 2720269314880873; casos Página + Instagram + Messenger; sem Tech Provider).
- System user "Sandro Sousa Bot" (61594016073989) com a Página, o @sandrosou5a e a app. Token de 10 permissões gerado.

## Secrets a colar (Supabase -> projecto numero5 inbox -> Edge Functions -> Secrets) -> depois redeploy da meta-inbox-sandro
SANDRO_BRAND_NAME=Sandro Sousa
SANDRO_BRAND_DESC=marca pessoal de um fundador com seis marcas em Portugal e Angola
SANDRO_BRAND_BG=#0B0F1A
SANDRO_BRAND_ACCENT=#C9AE7C
SANDRO_BRAND_SITE=https://numerocinco.pt/sandrosousa
SANDRO_PROMPT_URL=https://numerocinco.pt/sandrosousa/sandro-prompt.txt
SANDRO_NOTIFY_EMAIL=sandro.qb@gmail.com
SANDRO_FROM_EMAIL=Rascunhos do Sandro <inbox@quenteebom.com>
SANDRO_BOT_NAME=o rascunho
SANDRO_META_VERIFY_TOKEN=sandrosousa-inbox-2026
SANDRO_HMAC_SECRET=<novo, 64 hex: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
SANDRO_META_APP_SECRET=<App Secret da app Sandro Sousa Inbox>
SANDRO_META_PAGE_TOKEN=<token do Sandro Sousa Bot>
SANDRO_FN_BASE=https://rycgekqszxyudmchpqvs.functions.supabase.co/meta-inbox-sandro
NÃO pôr SANDRO_AUTO_REPLY. REDATOR_KEY e RESEND_API_KEY já existem no projecto.

## Webhooks (app Meta), cada objecto o seu
- Instagram (caso IG -> Customize -> Webhooks): Callback = FN_BASE, Verify = sandrosousa-inbox-2026 -> comments, messages, mentions.
- Page (Manage everything on your Page -> Customize -> Webhooks, product Page): mesmo Callback e Verify -> feed, messages.

## Instalar na Página + testes
- FN_BASE/subscribe?key=sandrosousa-inbox-2026 -> success:true, [feed, messages]
- FN_BASE/igtest?key=sandrosousa-inbox-2026 -> 4/4 ok

## Publicar + dança do pages_manage_engagement
- Remover pages_manage_engagement do caso -> Publish -> re-adicionar -> token novo (10 permissões) -> actualizar SANDRO_META_PAGE_TOKEN -> redeploy.
- Messenger ao público: Advanced Access a pages_messaging (App Review). O Instagram já funciona ao público sem isso.

## Teste E2E
- Comentar e DM de teste ao @sandrosou5a -> email escuro/champanhe com o rascunho + botão -> clicar -> inbox.html "Enviado."
- FN_BASE/last?key=sandrosousa-inbox-2026 mostra o último registo (vazio = SANDRO_META_APP_SECRET errado).

## Pós-live
- Desligar automações nativas do Business Suite no @sandrosou5a. Modo aprovação sempre.
- Afinar a voz em numero5-site/sandrosousa/sandro-prompt.txt (PR + merge; relida de 5 em 5 min).
