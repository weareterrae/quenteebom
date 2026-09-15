# RUNBOOK — Inbox pessoal do Sandro Sousa (Instagram @sandrosou5a + Página "Sandro Sousa") · 1×, ~1h

Modelo: **supervisionado**. Chega comentário, menção ou DM → o rascunho é escrito na voz do Sandro (primeira pessoa) → email para sandro.qb@gmail.com com botão → só depois do clique é que sai (resposta pública + DM). SEM `AUTO_REPLY`.
Código: o `index.ts` actual desta pasta (já generalizado com `BRAND_DESC`), **sem mais alterações**.
Lado do site: PRONTO em numerocinco.pt/sandrosousa/ (`sandro-prompt.txt` = voz; `inbox.html` = página de confirmação). Privacy Policy: https://numerocinco.pt/politica-de-privacidade/

---

## 1. App Meta "Sandro Sousa Inbox"
- developers.facebook.com → Create App → tipo **Business** → no teu portefólio pessoal (o mesmo onde está a Página "Sandro Sousa").
- Use cases: **Manage everything on your Page** + **Instagram** + **Messenger**. NÃO adicionar `instagram_content_publish`. NÃO iniciar Tech Provider.
- Settings → Basic: guardar o **App Secret** (= `META_APP_SECRET`) e pôr Privacy Policy URL = https://numerocinco.pt/politica-de-privacidade/
- Antes disto confirma: o @sandrosou5a é conta **profissional** ligada à Página "Sandro Sousa", e em Definições → Mensagens → Ferramentas ligadas está **"Permitir acesso a mensagens"** activo.

## 2. System user + token de Página (10 permissões)
- Business Settings → Users → System users → criar/usar um → Add Assets: a **Página "Sandro Sousa"**, o **IG @sandrosou5a** e a **App**.
- Generate token para a Página com: `pages_manage_engagement`, `pages_read_engagement`, `pages_read_user_content`, `pages_show_list`, `pages_manage_metadata`, `business_management`, `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`, `pages_messaging` → é o `META_PAGE_TOKEN`.

## 3. Projecto Supabase novo (opção A)
- supabase.com → New project → org **Terrae** → nome **sandro-inbox** → região eu-west-1.
- SQL Editor → colar e correr `schema.sql`.
- Edge Functions → nova função **`meta-inbox`** → colar o `index.ts` desta pasta → deploy. **Verify JWT = OFF.**
- `FN_BASE` = `https://<ref>.functions.supabase.co/meta-inbox`.

## 4. Secrets (Project Settings → Edge Functions → Secrets) → depois **redeploy**
```
BRAND_NAME=Sandro Sousa
BRAND_DESC=marca pessoal de um fundador com seis marcas em Portugal e Angola
BRAND_BG=#0B0F1A
BRAND_ACCENT=#C9AE7C
BRAND_SITE=https://numerocinco.pt/sandrosousa
PROMPT_URL=https://numerocinco.pt/sandrosousa/sandro-prompt.txt
NOTIFY_EMAIL=sandro.qb@gmail.com
FROM_EMAIL=Rascunhos do Sandro <inbox@quenteebom.com>
BOT_NAME=o rascunho
META_VERIFY_TOKEN=sandrosousa-inbox-2026
HMAC_SECRET=<novo: 64 caracteres hex; gera com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
REDATOR_KEY=<o mesmo das outras marcas: REDATOR_KEY.local.txt>
RESEND_API_KEY=<a partilhada: EXTERNATO-SECRETS.local.txt>
META_APP_SECRET=<passo 1>
META_PAGE_TOKEN=<passo 2>
FN_BASE=<passo 3>
```
(SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem. NÃO pôr ANTHROPIC_API_KEY nem AUTO_REPLY.)

## 5. Webhooks (na app Meta), cada objecto o seu
- **Instagram** (use case IG → Customize → Webhooks): Callback = `FN_BASE`, Verify = `sandrosousa-inbox-2026` → subscrever **comments**, **messages**, **mentions**.
- **Page** (Manage everything on your Page → Customize → Webhooks, product Page): mesmo Callback e Verify → subscrever **feed** e **messages**.

## 6. Instalar a app na Página + testes
- Browser: `FN_BASE/subscribe?key=sandrosousa-inbox-2026` → `success:true, subscribed_fields [feed, messages]`.
- `FN_BASE/igtest?key=sandrosousa-inbox-2026` → 4/4 ok, com o id da Página e o id do IG.

## 7. Publicar + dança do pages_manage_engagement
- Remover `pages_manage_engagement` do use case → **Publish** → re-adicionar (+ Add) → token novo com as 10 permissões → actualizar `META_PAGE_TOKEN` → redeploy.
- Messenger ao público: pedir Advanced Access a `pages_messaging` em App Review (o Instagram já funciona ao público sem isso).

## 8. Teste E2E
- Comentar e mandar DM de teste ao @sandrosou5a → email escuro/champanhe com o rascunho na voz do Sandro + botão.
- Clicar → página numerocinco.pt/sandrosousa/inbox.html "Enviado."
- `FN_BASE/last?key=sandrosousa-inbox-2026` mostra o último registo (vazio depois de um teste = `META_APP_SECRET` errado).

## 9. Pós-live
- Desligar automações nativas do Business Suite no @sandrosou5a (respostas automáticas, comment-to-DM).
- Fica em modo aprovação. Sem `AUTO_REPLY` nesta marca: é pessoal, cada resposta é do Sandro.
- Se a voz precisar de afinação, edita `numero5-site/sandrosousa/sandro-prompt.txt` e faz push (a função lê o ficheiro de 5 em 5 minutos).
