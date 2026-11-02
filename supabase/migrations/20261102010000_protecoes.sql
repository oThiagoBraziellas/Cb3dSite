-- =====================================================================
-- Proteções contra spam
-- Rode depois da migração inicial (SQL Editor → cole → Run)
-- =====================================================================

-- Limita pedidos vindos do site: no máximo 30 em 10 minutos no total
-- e 5 por hora para o mesmo WhatsApp. A Cintia (admin) não tem limite.
create or replace function public.throttle_orders()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if (select count(*) from public.orders where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'muitos pedidos agora, tente em alguns minutos';
  end if;
  if new.customer_phone <> '' and (
    select count(*) from public.orders
     where customer_phone = new.customer_phone and created_at > now() - interval '1 hour'
  ) >= 5 then
    raise exception 'muitos pedidos deste whatsapp, tente mais tarde';
  end if;
  return new;
end;
$$;
create trigger orders_throttle before insert on public.orders
  for each row execute function public.throttle_orders();

create or replace function public.throttle_alerts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.stock_alerts where created_at > now() - interval '10 minutes') >= 30 then
    raise exception 'muitos pedidos de aviso agora';
  end if;
  return new;
end;
$$;
create trigger stock_alerts_throttle before insert on public.stock_alerts
  for each row execute function public.throttle_alerts();

-- A foto de referência agora sobe só pelo servidor do site (chave secreta),
-- então ninguém consegue jogar arquivos direto no storage com a chave pública.
drop policy if exists "cliente envia referência" on storage.objects;
