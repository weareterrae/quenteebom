-- Tabela das respostas pendentes de aprovação (correr no Supabase → SQL Editor)
create table if not exists pending_replies (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  platform     text,           -- Facebook | Instagram
  kind         text,           -- comment | message
  target_id    text,           -- id do comentário (comment) ou do remetente (message)
  recipient_id text,           -- id do autor / remetente
  author       text,           -- nome ou username visível
  incoming     text,           -- o comentário/mensagem recebido
  reply        text,           -- a resposta sugerida pelo Joaquim
  status       text default 'pending',  -- pending | sent | error
  detail       text            -- resposta da Graph API (para diagnóstico)
);
-- só a função (service role) mexe nesta tabela; sem acesso público
alter table pending_replies enable row level security;
