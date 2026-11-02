-- =====================================================================
-- CB3D Impressão 3D · banco do site e do painel
-- Rode no Supabase: SQL Editor → cole este arquivo → Run
-- (ou `supabase db push` se usar a CLI)
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.product_status as enum ('publicado', 'rascunho', 'oculto', 'esgotado');
create type public.stock_policy   as enum ('esgotado', 'encomenda', 'avisar');
create type public.highlight      as enum ('nenhum', 'novo', 'destaque');
create type public.media_kind     as enum ('foto', 'video');
create type public.order_status   as enum ('orcamento', 'producao', 'pronto', 'entregue', 'cancelado');
create type public.order_source   as enum ('lista', 'personalizado', 'whatsapp', 'manual');
create type public.online_mode    as enum ('auto', 'ligado', 'desligado');

-- ---------------------------------------------------------------------
-- Quem é admin (a Cintia). Adicione o user_id dela depois do 1º login.
-- ---------------------------------------------------------------------
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Admin = está na tabela E entrou com verificação em 2 etapas (aal2).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
     and coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2';
$$;

-- Admin sem exigir 2FA (só pra telas de login saberem quem é admin)
create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------
create table public.categories (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name     text not null check (char_length(name) between 1 and 60),
  icon     text not null default 'cubo',
  color    text not null default 'rosa',
  position int  not null default 0
);

create table public.occasions (
  id       uuid primary key default gen_random_uuid(),
  slug     text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name     text not null check (char_length(name) between 1 and 60),
  position int  not null default 0
);

create table public.products (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name            text not null check (char_length(name) between 1 and 80),
  description     text not null default '' check (char_length(description) <= 2000),
  price_cents     int  not null check (price_cents >= 0),
  production_time text not null default '3 a 7 dias úteis',
  pickup_time     text not null default '1 a 2 dias',
  stock           int  not null default 0 check (stock >= 0),
  stock_policy    public.stock_policy not null default 'encomenda',
  measures        text not null default '',
  material        text not null default 'PLA',
  weight          text not null default '',
  category_id     uuid references public.categories (id) on delete set null,
  highlight       public.highlight not null default 'nenhum',
  status          public.product_status not null default 'rascunho',
  customizable    boolean not null default false,
  gift_wrap       boolean not null default true,
  gift_wrap_cents int  not null default 500 check (gift_wrap_cents >= 0),
  icon            text not null default 'cubo',
  color           text not null default 'rosa',
  position        int  not null default 0,
  popularity      int  not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index products_status_idx on public.products (status, position);
create index products_category_idx on public.products (category_id);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

create table public.product_occasions (
  product_id  uuid not null references public.products (id) on delete cascade,
  occasion_id uuid not null references public.occasions (id) on delete cascade,
  primary key (product_id, occasion_id)
);

create table public.product_colors (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  hex        text not null check (hex ~ '^#[0-9a-fA-F]{6}$'),
  position   int  not null default 0
);
create index product_colors_product_idx on public.product_colors (product_id, position);

create table public.product_media (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  path       text not null,
  kind       public.media_kind not null default 'foto',
  alt        text not null default '',
  position   int  not null default 0
);
create index product_media_product_idx on public.product_media (product_id, position);

-- ---------------------------------------------------------------------
-- Pedidos (lista do site, peça personalizada, manual)
-- ---------------------------------------------------------------------
create table public.orders (
  id                 uuid primary key default gen_random_uuid(),
  number             int generated always as identity (start with 100) unique,
  source             public.order_source not null default 'lista',
  status             public.order_status not null default 'orcamento',
  customer_name      text not null check (char_length(customer_name) between 1 and 80),
  customer_phone     text not null default '' check (char_length(customer_phone) <= 30),
  needed_by          date,
  notes              text not null default '' check (char_length(notes) <= 1000),
  total_cents        int  not null default 0,
  agreed_cents       int,
  -- campos da peça personalizada
  custom_type        text,
  custom_description text check (char_length(custom_description) <= 2000),
  custom_colors      text[] not null default '{}',
  custom_size        text,
  custom_qty         int check (custom_qty between 1 and 10000),
  reference_path     text,
  -- controle
  stock_applied      boolean not null default false,
  seen_at            timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index orders_status_idx on public.orders (status, created_at desc);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table public.order_items (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  product_id      uuid references public.products (id) on delete set null,
  product_name    text not null,
  color           text not null default '',
  personalization text not null default '' check (char_length(personalization) <= 60),
  gift            boolean not null default false,
  gift_message    text not null default '' check (char_length(gift_message) <= 200),
  qty             int  not null check (qty between 1 and 99),
  unit_cents      int  not null check (unit_cents >= 0)
);
create index order_items_order_idx on public.order_items (order_id);

-- Baixa automática do estoque: quando o pedido sai de "orçamento"
-- (produção/pronto/entregue) o estoque desce; se for cancelado, volta.
create or replace function public.apply_order_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not old.stock_applied and new.status in ('producao', 'pronto', 'entregue') then
    update public.products p
       set stock = greatest(0, p.stock - i.qty)
      from (select product_id, sum(qty)::int as qty
              from public.order_items
             where order_id = new.id and product_id is not null
             group by product_id) i
     where p.id = i.product_id;
    new.stock_applied := true;
  elsif old.stock_applied and new.status in ('cancelado', 'orcamento') then
    update public.products p
       set stock = p.stock + i.qty
      from (select product_id, sum(qty)::int as qty
              from public.order_items
             where order_id = new.id and product_id is not null
             group by product_id) i
     where p.id = i.product_id;
    new.stock_applied := false;
  end if;
  return new;
end;
$$;
create trigger orders_stock before update of status on public.orders
  for each row execute function public.apply_order_stock();

-- Estoque zerou + regra "esgotado" → produto aparece como esgotado.
create or replace function public.sync_sold_out()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.stock = 0 and new.stock_policy = 'esgotado' and new.status = 'publicado' then
    new.status := 'esgotado';
  elsif new.stock > 0 and new.status = 'esgotado' then
    new.status := 'publicado';
  end if;
  return new;
end;
$$;
create trigger products_sold_out before insert or update of stock, stock_policy, status on public.products
  for each row execute function public.sync_sold_out();

-- "Avisar quando voltar"
create table public.stock_alerts (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 80),
  phone      text not null check (char_length(phone) between 8 and 30),
  notified   boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Conteúdo do site editável pela Cintia
-- ---------------------------------------------------------------------
create table public.settings (
  id               int primary key default 1 check (id = 1),
  whatsapp         text not null default '5561900000000' check (whatsapp ~ '^[0-9]{12,13}$'),
  instagram        text not null default 'cb3d.impressao3d',
  tiktok           text not null default '',
  online_mode      public.online_mode not null default 'auto',
  -- {"seg":["09:00","18:00"], ..., "dom":null}
  hours            jsonb not null default '{"seg":["09:00","18:00"],"ter":["09:00","18:00"],"qua":["09:00","18:00"],"qui":["09:00","18:00"],"sex":["09:00","18:00"],"sab":["09:00","13:00"],"dom":null}',
  offline_message  text not null default 'Respondo amanhã cedinho 💖',
  notice_on        boolean not null default false,
  notice_text      text not null default '',
  notice_start     date,
  notice_end       date,
  deadlines_text   text not null default 'Produção de 3 a 7 dias úteis',
  pickup_text      text not null default 'Retirada em mãos, combinada pelo WhatsApp',
  notify_whatsapp  boolean not null default true,
  notify_email     boolean not null default true,
  notify_panel     boolean not null default true,
  updated_at       timestamptz not null default now()
);
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- Dados que não podem aparecer no site (só o servidor e a Cintia leem)
create table public.settings_private (
  id               int primary key default 1 check (id = 1),
  notify_email_to  text not null default '',
  notify_phone     text not null default '',
  callmebot_apikey text not null default ''
);

create table public.slides (
  id           uuid primary key default gen_random_uuid(),
  kicker       text not null default '',
  title        text not null check (char_length(title) between 1 and 90),
  subtitle     text not null default '',
  button_label text not null default 'Ver o catálogo',
  button_href  text not null default '/catalogo' check (button_href ~ '^/'),
  icon         text not null default 'ursinho',
  color        text not null default 'rosa',
  image_path   text,
  active       boolean not null default true,
  position     int not null default 0
);

create table public.testimonials (
  id       uuid primary key default gen_random_uuid(),
  quote    text not null check (char_length(quote) between 1 and 400),
  author   text not null check (char_length(author) between 1 and 60),
  place    text not null default '',
  stars    int not null default 5 check (stars between 1 and 5),
  active   boolean not null default true,
  position int not null default 0
);

create table public.special_dates (
  id       uuid primary key default gen_random_uuid(),
  name     text not null,
  day      date not null,
  order_by date not null,
  active   boolean not null default true
);

-- ---------------------------------------------------------------------
-- Funções públicas (o site chama estas; ninguém escreve direto nas tabelas)
-- ---------------------------------------------------------------------

-- Lista do site → pedido "orçamento". Os preços vêm do banco, não do navegador.
create or replace function public.submit_order(
  p_name text,
  p_phone text,
  p_needed_by date,
  p_notes text,
  p_items jsonb
)
returns table (order_number int, total int)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_item     jsonb;
  v_product  public.products%rowtype;
  v_qty      int;
  v_gift     boolean;
  v_unit     int;
  v_total    int := 0;
  v_color    text;
begin
  if p_name is null or char_length(trim(p_name)) = 0 or char_length(p_name) > 80 then
    raise exception 'nome inválido';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'lista inválida';
  end if;
  if p_needed_by is not null and p_needed_by < current_date then
    raise exception 'data no passado';
  end if;

  insert into public.orders (source, customer_name, customer_phone, needed_by, notes)
  values ('lista', trim(p_name), coalesce(left(p_phone, 30), ''), p_needed_by, coalesce(left(p_notes, 1000), ''))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from public.products
     where id = (v_item ->> 'product_id')::uuid
       and status in ('publicado', 'esgotado');
    if not found then
      raise exception 'peça indisponível';
    end if;
    if v_product.stock = 0 and v_product.stock_policy <> 'encomenda' then
      raise exception 'peça esgotada: %', v_product.name;
    end if;

    v_qty  := least(greatest(coalesce((v_item ->> 'qty')::int, 1), 1), 99);
    v_gift := coalesce((v_item ->> 'gift')::boolean, false) and v_product.gift_wrap;
    v_unit := v_product.price_cents + case when v_gift then v_product.gift_wrap_cents else 0 end;

    v_color := coalesce(v_item ->> 'color', '');
    if v_color <> '' and not exists (
      select 1 from public.product_colors c where c.product_id = v_product.id and c.name = v_color
    ) then
      v_color := '';
    end if;

    insert into public.order_items (order_id, product_id, product_name, color, personalization, gift, gift_message, qty, unit_cents)
    values (
      v_order_id, v_product.id, v_product.name, v_color,
      case when v_product.customizable then left(coalesce(v_item ->> 'personalization', ''), 60) else '' end,
      v_gift,
      case when v_gift then left(coalesce(v_item ->> 'gift_message', ''), 200) else '' end,
      v_qty, v_unit
    );
    v_total := v_total + v_unit * v_qty;
    update public.products set popularity = popularity + v_qty where id = v_product.id;
  end loop;

  update public.orders set total_cents = v_total where id = v_order_id;

  return query select o.number, v_total from public.orders o where o.id = v_order_id;
end;
$$;

-- Formulário "peça personalizada"
create or replace function public.submit_custom_request(
  p_name text,
  p_phone text,
  p_needed_by date,
  p_type text,
  p_description text,
  p_colors text[],
  p_size text,
  p_qty int,
  p_reference_path text
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_number int;
begin
  if p_name is null or char_length(trim(p_name)) = 0 or char_length(p_name) > 80 then
    raise exception 'nome inválido';
  end if;
  if p_phone is null or char_length(regexp_replace(p_phone, '\D', '', 'g')) < 10 then
    raise exception 'whatsapp inválido';
  end if;
  if p_description is null or char_length(trim(p_description)) < 5 then
    raise exception 'descreva a ideia';
  end if;
  if p_needed_by is not null and p_needed_by < current_date then
    raise exception 'data no passado';
  end if;
  if p_reference_path is not null and p_reference_path !~ '^pedidos/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$' then
    raise exception 'foto inválida';
  end if;

  insert into public.orders (
    source, customer_name, customer_phone, needed_by,
    custom_type, custom_description, custom_colors, custom_size, custom_qty, reference_path
  ) values (
    'personalizado', trim(p_name), left(p_phone, 30), p_needed_by,
    left(p_type, 40), left(p_description, 2000), coalesce(p_colors[1:8], '{}'), left(p_size, 40),
    least(greatest(coalesce(p_qty, 1), 1), 10000), p_reference_path
  )
  returning number into v_number;

  return v_number;
end;
$$;

create or replace function public.subscribe_stock_alert(p_product uuid, p_name text, p_phone text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.products
     where id = p_product and stock = 0 and stock_policy = 'avisar'
       and status in ('publicado', 'esgotado')
  ) then
    raise exception 'peça não aceita aviso';
  end if;
  if (select count(*) from public.stock_alerts where product_id = p_product and phone = p_phone) > 0 then
    return;
  end if;
  insert into public.stock_alerts (product_id, name, phone) values (p_product, left(trim(p_name), 80), left(p_phone, 30));
end;
$$;

revoke all on function public.submit_order(text, text, date, text, jsonb) from public;
revoke all on function public.submit_custom_request(text, text, date, text, text, text[], text, int, text) from public;
revoke all on function public.subscribe_stock_alert(uuid, text, text) from public;
grant execute on function public.submit_order(text, text, date, text, jsonb) to anon, authenticated;
grant execute on function public.submit_custom_request(text, text, date, text, text, text[], text, int, text) to anon, authenticated;
grant execute on function public.subscribe_stock_alert(uuid, text, text) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_admin_user() to authenticated;

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.admins            enable row level security;
alter table public.categories        enable row level security;
alter table public.occasions         enable row level security;
alter table public.products          enable row level security;
alter table public.product_occasions enable row level security;
alter table public.product_colors    enable row level security;
alter table public.product_media     enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.stock_alerts      enable row level security;
alter table public.settings          enable row level security;
alter table public.settings_private  enable row level security;
alter table public.slides            enable row level security;
alter table public.testimonials      enable row level security;
alter table public.special_dates     enable row level security;

create policy "admin vê o próprio registro" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- leitura pública do que é vitrine
create policy "categorias públicas" on public.categories for select using (true);
create policy "ocasiões públicas"   on public.occasions  for select using (true);
create policy "produtos visíveis" on public.products for select
  using (status in ('publicado', 'esgotado') or (select public.is_admin()));
create policy "ocasiões de produtos visíveis" on public.product_occasions for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.status in ('publicado', 'esgotado') or (select public.is_admin()))));
create policy "cores de produtos visíveis" on public.product_colors for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.status in ('publicado', 'esgotado') or (select public.is_admin()))));
create policy "mídia de produtos visíveis" on public.product_media for select
  using (exists (select 1 from public.products p where p.id = product_id and (p.status in ('publicado', 'esgotado') or (select public.is_admin()))));
create policy "configurações públicas" on public.settings for select using (true);
create policy "slides ativos"       on public.slides        for select using (active or (select public.is_admin()));
create policy "depoimentos ativos"  on public.testimonials  for select using (active or (select public.is_admin()));
create policy "datas ativas"        on public.special_dates for select using (active or (select public.is_admin()));

-- só a Cintia (com 2FA) escreve
do $$
declare t text;
begin
  foreach t in array array['categories','occasions','products','product_occasions','product_colors','product_media',
                           'settings','slides','testimonials','special_dates'] loop
    execute format('create policy "admin insere" on public.%I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('create policy "admin altera" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy "admin apaga"  on public.%I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
  foreach t in array array['orders','order_items','stock_alerts','settings_private'] loop
    execute format('create policy "só admin" on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Storage: fotos/vídeos das peças (público) e fotos de referência (privado)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('produtos', 'produtos', true, 26214400, array['image/jpeg','image/png','image/webp','video/mp4','video/webm']),
  ('referencias', 'referencias', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "admin envia mídia" on storage.objects for insert to authenticated
  with check (bucket_id = 'produtos' and (select public.is_admin()));
create policy "admin troca mídia" on storage.objects for update to authenticated
  using (bucket_id = 'produtos' and (select public.is_admin()));
create policy "admin apaga mídia" on storage.objects for delete to authenticated
  using (bucket_id in ('produtos', 'referencias') and (select public.is_admin()));
create policy "cliente envia referência" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'referencias' and (storage.foldername(name))[1] = 'pedidos');
create policy "admin vê referências" on storage.objects for select to authenticated
  using (bucket_id = 'referencias' and (select public.is_admin()));

-- ---------------------------------------------------------------------
-- Linha única de configurações
-- ---------------------------------------------------------------------
insert into public.settings (id) values (1) on conflict do nothing;
insert into public.settings_private (id) values (1) on conflict do nothing;
