// Confere a migração e o seed num Postgres em memória (PGlite),
// com stubs mínimos de auth/storage do Supabase, e testa as regras principais.
// Uso: npm run db:check
import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const db = new PGlite()

const stubs = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth; create schema storage;
create table auth.users (id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
grant usage on schema public, auth, storage to anon, authenticated;
grant execute on all functions in schema auth to anon, authenticated;
`

const ok = (m) => console.log('  ✓ ' + m)
const fail = (m) => {
  console.error('  ✗ ' + m)
  process.exitCode = 1
}
async function expectError(sql, label) {
  try {
    await db.exec(sql)
    fail(label + ' (deveria falhar)')
  } catch {
    ok(label)
  }
}
const as = async (role, sub, aal) => {
  await db.exec(`reset role;`)
  await db.exec(`select set_config('request.jwt.claim.sub', '${sub ?? ''}', false), set_config('request.jwt.claims', '${JSON.stringify(sub ? { sub, aal } : {})}', false);`)
  await db.exec(`set role ${role};`)
}

await db.exec('create extension if not exists pgcrypto;').catch(() => {})
await db.exec(stubs)
for (const f of readdirSync(join(root, 'supabase/migrations')).sort()) {
  await db.exec(readFileSync(join(root, 'supabase/migrations', f), 'utf8').replace('create extension if not exists pgcrypto;', ''))
  ok('migração ' + f)
}
// Supabase concede estes privilégios por padrão
await db.exec(`grant select, insert, update, delete on all tables in schema public to anon, authenticated;
               grant select, insert on storage.objects to anon, authenticated;`)
await db.exec(readFileSync(join(root, 'supabase/seed.sql'), 'utf8'))
ok('seed')

// --- visitante
await as('anon')
let r = await db.query(`select count(*)::int n from public.products`)
if (r.rows[0].n === 9) ok('visitante vê 9 peças publicadas')
else fail('visitante viu ' + r.rows[0].n)
r = await db.query(`select count(*)::int n from public.orders`)
if (r.rows[0].n === 0) ok('visitante não lê pedidos')
else fail('visitante leu pedidos')
await db.exec(`update public.products set price_cents = 1`)
r = await db.query(`select price_cents from public.products where slug='ursinho-articulado'`)
if (r.rows[0].price_cents === 3500) ok('preço continua intacto')
else fail('preço mudou!')

const urso = (await db.query(`select id from public.products where slug='ursinho-articulado'`)).rows[0].id
const caixa = (await db.query(`select id from public.products where slug='caixinha-presente'`)).rows[0].id
r = await db.query(`select * from public.submit_order('Juliana', '61912345678', null, 'teste',
  '[{"product_id":"${urso}","qty":2,"color":"Rosa chiclete","gift":true,"gift_message":"Parabéns!","price_cents":1}]'::jsonb)`)
if (r.rows[0].total === 2 * (3500 + 500)) ok('submit_order calcula o total no banco (ignora preço do navegador)')
else fail('total errado ' + JSON.stringify(r.rows))
const num = r.rows[0].order_number
await expectError(`select * from public.submit_order('Ana', '', null, '', '[{"product_id":"${caixa}","qty":1}]'::jsonb)`, 'não deixa pedir peça esgotada com regra "avisar"')
await db.exec(`select public.subscribe_stock_alert('${caixa}', 'Ana', '61999990000')`)
ok('“avisar quando voltar” aceito')
r = await db.query(`select public.submit_custom_request('Marcos', '(61) 91234-5678', null, 'Lembrancinha', '30 chaveiros de unicórnio', array['Rosa','Amarelo'], 'Pequeno', 30, 'pedidos/0b9a1f2e-3c4d-4e5f-8a9b-0c1d2e3f4a5b.jpg') n`)
if (r.rows[0].n > num) ok('pedido personalizado criado #' + r.rows[0].n)
else fail('personalizado')
await expectError(`select public.submit_custom_request('X', '123', null, 'a', 'descricao longa', null, null, 1, null)`, 'recusa WhatsApp inválido')
await expectError(`select public.submit_custom_request('X', '61912345678', null, 'a', 'descricao longa', null, null, 1, '../segredo.png')`, 'recusa caminho de foto estranho')

// --- admin sem 2FA
const cintia = '11111111-1111-1111-1111-111111111111'
await db.exec(`reset role; insert into auth.users values ('${cintia}', 'cintia@exemplo.com'); insert into public.admins values ('${cintia}');`)
await as('authenticated', cintia, 'aal1')
r = await db.query(`select count(*)::int n from public.orders`)
if (r.rows[0].n === 0) ok('admin sem 2 etapas não vê pedidos')
else fail('aal1 viu pedidos')

// --- admin com 2FA
await as('authenticated', cintia, 'aal2')
r = await db.query(`select count(*)::int n from public.orders`)
if (r.rows[0].n === 2) ok('admin com 2 etapas vê os 2 pedidos')
else fail('aal2 viu ' + r.rows[0].n)
await db.exec(`update public.orders set status = 'producao' where number = ${num}`)
r = await db.query(`select stock from public.products where id = '${urso}'`)
if (r.rows[0].stock === 1) ok('estoque baixou 3 → 1 ao ir pra produção')
else fail('estoque ' + r.rows[0].stock)
await db.exec(`update public.orders set status = 'cancelado' where number = ${num}`)
r = await db.query(`select stock from public.products where id = '${urso}'`)
if (r.rows[0].stock === 3) ok('cancelar devolve o estoque')
else fail('estoque ' + r.rows[0].stock)
await db.exec(`update public.products set stock = 0 where slug = 'coracao-decorativo'`)
r = await db.query(`select status from public.products where slug = 'coracao-decorativo'`)
if (r.rows[0].status === 'esgotado') ok('regra "esgotado" muda o status sozinha')
else fail('status ' + r.rows[0].status)
await db.exec(`update public.products set price_cents = 3600 where id = '${urso}'`)
ok('admin altera preço')

await db.exec('reset role;')
console.log(process.exitCode ? '\nFalhou.' : '\nTudo certo.')
