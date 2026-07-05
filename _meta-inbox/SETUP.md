# Inbox supervisionado da Quente e Bom — guia de instalação

Sistema de resposta a comentários e mensagens do Facebook/Instagram com **aprovação humana**:
o Joaquim redige a resposta, recebes um **email com botão "Aprovar e enviar"**, e só quando carregas é publicada.

Arquitetura: Webhook Meta → Edge Function Supabase (`meta-inbox`) → Claude (cérebro do Joaquim) → email (Resend) → clique → Graph API publica.

> ⚠️ Nunca colar tokens/segredos no chat. Todos vão para os **Secrets** do Supabase.

---

## 1. Base de dados (Supabase → SQL Editor)
Correr o conteúdo de `schema.sql` (cria a tabela `pending_replies`).

## 2. Deploy da função (Supabase → Edge Functions)
- Nova função com o nome **`meta-inbox`**.
- Colar o conteúdo de `index.ts`.
- URL pública fica: `https://qciagsktkqljvknmahfu.functions.supabase.co/meta-inbox`

## 3. Conta de email de envio (Resend — resend.com)
- Criar conta gratuita, verificar o domínio `quenteebom.com` (ou usar o remetente de teste no início).
- Gerar uma **API key**.

## 4. Secrets (Supabase → Edge Functions → Manage secrets)
| Secret | O que é |
|---|---|
| `META_VERIFY_TOKEN` | uma palavra à tua escolha (ex.: `quenteebom-sol-2026`) — usada no passo 6 |
| `META_APP_SECRET` | App Secret da app Meta (Definições → Básico) |
| `META_PAGE_TOKEN` | **token de acesso da Página** (ver passo 5) |
| `ANTHROPIC_API_KEY` | chave da API Claude (console.anthropic.com) |
| `RESEND_API_KEY` | chave do Resend (passo 3) |
| `HMAC_SECRET` | uma palavra-passe longa à tua escolha (assina o link do email) |
| `FN_BASE` | `https://qciagsktkqljvknmahfu.functions.supabase.co/meta-inbox` |
| `NOTIFY_EMAIL` | `sandro.qb@gmail.com` (para onde vão os avisos) |
| `FROM_EMAIL` | ex.: `Joaquim da Quente e Bom <inbox@quenteebom.com>` |
| `PROMPT_URL` | `https://quenteebom.com/bento-prompt.txt` (já existe) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | já disponíveis no projeto |

## 5. Token de Página (Meta → Graph API Explorer ou Business Settings)
- App: a mesma app do bot (já em App Review). Tu és admin → funciona em **modo de desenvolvimento** para as TUAS contas, sem esperar pela aprovação.
- Permissões a pedir: `pages_manage_engagement`, `pages_read_engagement`, `pages_messaging`,
  `instagram_basic`, `instagram_manage_comments`, `instagram_manage_messages`, `pages_show_list`.
- Gerar um **token de página de longa duração** e guardar em `META_PAGE_TOKEN`.

## 6. Webhooks (Meta → a app → Webhooks)
- **Callback URL:** `https://qciagsktkqljvknmahfu.functions.supabase.co/meta-inbox`
- **Verify Token:** o mesmo valor de `META_VERIFY_TOKEN`.
- Subscrever o objeto **Page**: campos `feed` (comentários) e `messages`.
- Subscrever o objeto **Instagram**: campos `comments` e `messages`.
- Ligar a Página (e o IG business ligado) à subscrição.

## 7. Testar
- Comenta num post teu / envia uma DM de teste.
- Deves receber um email com a resposta sugerida + botão. Carrega → confirma que publica.

---

### Notas
- **Janela das mensagens:** a função usa a etiqueta `HUMAN_AGENT`, que dá **7 dias** para responder a DMs com revisão humana — ideal para este fluxo.
- **Automações nativas do Business Suite:** quando este inbox estiver a funcionar, desligar as automações nativas (FAQ / resposta instantânea / comentários por palavra-chave) para não haver respostas a dobrar.
- **Só as tuas contas por agora:** em modo de desenvolvimento funciona nas contas onde és admin. Quando a App Review for aprovada, passa a funcionar sem essa limitação (não muda nada no código).
