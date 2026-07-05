-- Tabela das respostas pendentes de aprovação (correr no Supabase → SQL Editor)
create table if not exists pending_replies (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  platform      text,           -- Facebook | Instagram
  kind          text,           -- comment | message
  account_id    text,           -- id da Página / conta IG (para a DM privada em comentários)
  target_id     text,           -- id do comentário (comment) ou do remetente (message)
  recipient_id  text,           -- id do autor / remetente
  author        text,           -- nome ou username visível
  incoming      text,           -- o comentário/mensagem recebido
  reply         text,           -- resposta pública (comentário) ou resposta à DM
  private_reply text,           -- mensagem privada (DM) a enviar à pessoa que comentou
  status        text default 'pending',  -- pending | sent | error
  detail        text            -- resposta da Graph API (diagnóstico)
);
alter table pending_replies enable row level security; -- só a função (service role) acede

-- Se já tinhas criado a tabela na versão anterior, corre só estas duas linhas:
-- alter table pending_replies add column if not exists account_id text;
-- alter table pending_replies add column if not exists private_reply text;
