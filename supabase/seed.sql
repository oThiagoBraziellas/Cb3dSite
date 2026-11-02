-- Dados iniciais (opcional). Rode depois da migração para o site já abrir com conteúdo.
-- Troque/apague pelo painel quando tiver as peças reais.

insert into public.categories (slug, name, icon, color, position) values
  ('presentes',  'Presentes personalizados',   'presente',  'rosa',    1),
  ('decoracao',  'Decoração e organização',     'cubo',      'azul',    2),
  ('brinquedos', 'Brinquedos e colecionáveis',  'ursinho',   'amarelo', 3),
  ('chaveiros',  'Chaveiros',                   'chaveiro',  'roxo',    4)
on conflict (slug) do nothing;

insert into public.occasions (slug, name, position) values
  ('aniversario',   'Aniversário',    1),
  ('natal',         'Natal',          2),
  ('dia-das-maes',  'Dia das Mães',   3),
  ('casamento',     'Casamento',      4),
  ('lembrancinhas', 'Lembrancinhas',  5),
  ('volta-as-aulas','Volta às aulas', 6)
on conflict (slug) do nothing;

with c as (select slug, id from public.categories)
insert into public.products
  (slug, name, description, price_cents, production_time, stock, stock_policy, measures, category_id, highlight, status, customizable, icon, color, position, popularity)
values
  ('chaveiro-com-nome', 'Chaveiro com nome', 'Chaveiro com o nome que você quiser, em até duas cores. Ótimo pra lembrancinha.', 1800, '3 dias úteis', 24, 'encomenda', '5 × 3 cm', (select id from c where slug='chaveiros'), 'novo', 'publicado', true, 'chaveiro', 'azul', 1, 40),
  ('ursinho-articulado', 'Ursinho articulado', 'Braços e pernas que mexem de verdade, impresso numa peça só. Ótimo pra presentear e enfeitar a estante.', 3500, '5 dias úteis', 3, 'encomenda', '8 × 6 × 5 cm', (select id from c where slug='brinquedos'), 'destaque', 'publicado', true, 'ursinho', 'rosa', 2, 35),
  ('caixinha-presente', 'Caixinha presente', 'Caixinha com tampa pra guardar mimos e entregar presentes.', 4200, '4 dias úteis', 0, 'avisar', '10 × 10 × 6 cm', (select id from c where slug='presentes'), 'nenhum', 'publicado', false, 'presente', 'amarelo', 3, 30),
  ('organizador-de-mesa', 'Organizador de mesa', 'Organizador com divisórias pra canetas, clipes e post-its.', 5500, '6 dias úteis', 6, 'encomenda', '18 × 10 × 9 cm', (select id from c where slug='decoracao'), 'nenhum', 'publicado', false, 'cubo', 'nevoa', 4, 22),
  ('coracao-decorativo', 'Coração decorativo', 'Coração com textura de camadas, lindo pra Dia das Mães e casamentos.', 2400, '3 dias úteis', 12, 'esgotado', '9 × 8 cm', (select id from c where slug='decoracao'), 'nenhum', 'publicado', true, 'coracao', 'amarelo', 5, 18),
  ('bobina-porta-trecos', 'Bobina porta-trecos', 'Porta-trecos em formato de bobina de filamento. Gira de verdade!', 2990, '4 dias úteis', 5, 'encomenda', '9 cm de diâmetro', (select id from c where slug='decoracao'), 'novo', 'publicado', false, 'bobina', 'azul', 6, 12),
  ('estrela-de-mesa', 'Estrela de mesa', 'Estrela pra enfeitar a mesa ou a árvore de Natal.', 2200, '3 dias úteis', 8, 'encomenda', '10 × 10 cm', (select id from c where slug='decoracao'), 'nenhum', 'publicado', false, 'brilho', 'roxo', 7, 10),
  ('mini-impressora', 'Mini impressora', 'Miniatura de impressora 3D pra quem ama o hobby. Colecionável.', 4800, '7 dias úteis', 2, 'encomenda', '7 × 7 × 8 cm', (select id from c where slug='brinquedos'), 'nenhum', 'publicado', false, 'impressora', 'amarelo', 8, 8),
  ('cubo-quebra-cabeca', 'Cubo quebra-cabeça', 'Cubo de encaixe pra montar e desmontar. Desafio pra todas as idades.', 2700, '4 dias úteis', 10, 'encomenda', '6 × 6 × 6 cm', (select id from c where slug='brinquedos'), 'nenhum', 'publicado', false, 'cubo', 'rosa', 9, 6)
on conflict (slug) do nothing;

insert into public.product_colors (product_id, name, hex, position)
select p.id, c.name, c.hex, c.pos
  from public.products p
 cross join (values ('Rosa chiclete', '#F9208D', 1), ('Amarelo', '#FCD715', 2), ('Azul', '#05BDFC', 3), ('Roxo', '#8C43F5', 4), ('Branco', '#FFFFFF', 5)) as c(name, hex, pos)
on conflict do nothing;

insert into public.product_occasions (product_id, occasion_id)
select p.id, o.id from public.products p join public.occasions o on
  (p.slug in ('ursinho-articulado','caixinha-presente','estrela-de-mesa') and o.slug = 'natal') or
  (p.slug in ('chaveiro-com-nome','ursinho-articulado') and o.slug = 'aniversario') or
  (p.slug in ('chaveiro-com-nome') and o.slug = 'lembrancinhas') or
  (p.slug in ('coracao-decorativo','caixinha-presente') and o.slug = 'dia-das-maes') or
  (p.slug in ('coracao-decorativo') and o.slug = 'casamento') or
  (p.slug in ('organizador-de-mesa') and o.slug = 'volta-as-aulas')
on conflict do nothing;

insert into public.slides (kicker, title, subtitle, button_label, button_href, icon, color, position) values
  ('pra presentear quem você ama', 'Peças únicas, feitas camada por camada', 'Presentes, decoração e brinquedos impressos em 3D pela Cintia, aqui em Brasília.', 'Ver o catálogo', '/catalogo', 'ursinho', 'rosa', 1),
  ('natal chegando', 'Presentes de Natal até 10/12', 'Escolha agora e retire a tempo da ceia.', 'Ver presentes', '/catalogo?ocasiao=natal', 'presente', 'amarelo', 2),
  ('do seu jeitinho', 'Tem uma ideia? A gente imprime.', 'Mande uma foto de referência, as cores e a data.', 'Peça personalizada', '/personalizada', 'impressora', 'azul', 3);

insert into public.testimonials (quote, author, place, position) values
  ('Encomendei os chaveiros da festa da minha filha e ficaram lindos! A Cintia caprichou em cada detalhe.', 'Juliana', 'Águas Claras', 1),
  ('Pedi um topo de bolo com o nome do meu filho e chegou antes do prazo. Super indico!', 'Marcos', 'Taguatinga', 2),
  ('O organizador de mesa ficou perfeito na cor que eu escolhi. Já quero outro!', 'Renata', 'Asa Norte', 3);

insert into public.special_dates (name, day, order_by) values
  ('Natal', '2026-12-25', '2026-12-10'),
  ('Réveillon', '2026-12-31', '2026-12-15'),
  ('Volta às aulas', '2027-02-14', '2027-01-31');

update public.settings set notice_on = true, notice_text = 'Encomendas de Natal até 10/12 🎄', notice_end = '2026-12-10' where id = 1;
