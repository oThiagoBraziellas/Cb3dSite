# CB3D Impressão 3D · site e painel

Site da CB3D (catálogo + pedido pelo WhatsApp) e o painel onde a Cintia cuida das peças, dos pedidos e do conteúdo do site.

- **Next.js 16** (App Router, TypeScript) · **Supabase** (banco, login, 2 etapas, fotos e vídeos)
- Visual do Figma *CB3D Site e Painel*: cores, fontes (Fredoka, Nunito, Lobster Two), ícones ilustrados e animações.
- Sem as chaves do Supabase o projeto abre em **modo demonstração**, com dados de exemplo e painel só para ver.

## Rodar no seu computador

```bash
npm install
cp .env.example .env.local   # deixe em branco pra ver a demonstração
npm run dev                  # http://localhost:3000  ·  painel em /admin
```

Outros comandos: `npm run build`, `npm run lint`, `npm run typecheck` e `npm run db:check`. Este último testa o banco num Postgres em memória: permissões, baixa de estoque e validações.

## O que tem

**Site**
- Início com carrossel, categorias, ocasiões, mais pedidos, como pedir, calendário de datas, depoimentos.
- Catálogo com busca e filtros por categoria, ocasião, preço, cor e disponibilidade, mais ordenação. No celular os filtros abrem num painel que sobe da parte de baixo.
- Página da peça: galeria, cores, nome para gravar, opção de presente, quantidade, “pedir só esta”, “avisar quando voltar”, time-lapse, dados estruturados pro Google.
- **Minha lista**: fica no navegador. Ao enviar, o pedido é salvo no banco com o preço calculado lá (não no navegador) e a mensagem já sai pronta no WhatsApp.
- Peça personalizada com foto de referência. A foto fica num armazenamento privado e é apagada quando o pedido termina.
- Favoritos, compartilhar, aviso de cookies (o Google Analytics só carrega depois do “Aceitar”), políticas, sitemap e robots.
- Animações: botão que afunda, card que levanta, título “camada por camada”, revelar ao rolar, filamento que se desenha, pulo da sacola, coração com brilho, WhatsApp flutuante, carrossel. Quem ativa “reduzir movimento” no celular vê o site sem movimento.

**Segurança**
- O banco limita os pedidos que chegam pelo site: no máximo 5 por hora do mesmo WhatsApp e 30 a cada 10 minutos no total. A Cintia não tem limite.
- O storage não aceita upload anônimo. A foto de referência passa pelo servidor do site.
- O CI do GitHub (`.github/workflows/ci.yml`) roda lint, tipos, teste do banco e build a cada push.

**Painel (`/admin`)**
- Login com Google ou e-mail e senha, **sempre com verificação em 2 etapas** (app autenticador). O banco recusa qualquer escrita sem 2 etapas, não é só a tela que esconde.
- Início com alerta de pedido novo, números do dia e botão de “online agora”.
- Pedidos: status orçamento → produção → pronto → entregue/cancelado. Ao ir para produção o **estoque baixa sozinho**; se cancelar, volta.
- Produtos: nome, descrição, preço, prazos, estoque, fotos (comprimidas antes de subir), vídeo time-lapse (regravado em 720p no próprio navegador), cores, medidas, material, categoria, ocasiões, selo, status e regra pra quando o estoque zerar (esgotado / sob encomenda / avisar quando voltar).
- Categorias e ocasiões, carrossel, aviso do topo, horário, textos, depoimentos, calendário de datas.
- Aviso de pedido novo: no painel, por e-mail (Resend) e por WhatsApp (CallMeBot).
- Lista de espera do “avisar quando voltar” na página de cada peça, com botão que abre o WhatsApp da cliente com a mensagem pronta.

## Colocar no ar

### 1. Supabase (plano grátis)
1. Crie um projeto em [supabase.com](https://supabase.com).
2. **SQL Editor**: cole e rode, nesta ordem, os arquivos de `supabase/migrations/` (`…_init.sql` e depois `…_protecoes.sql`). Se quiser começar com as peças de exemplo, rode também `supabase/seed.sql`.
3. **Authentication → Providers → Google**: ative e cole o Client ID e o Secret criados no Google Cloud (OAuth, tipo “Web”). O redirect que o Google pede aparece nessa mesma tela.
4. **Authentication → URL Configuration**: preencha *Site URL* com o endereço do site e adicione `https://SEU-SITE/auth/callback` em *Redirect URLs*.
5. Crie a conta da Cintia: ela entra uma vez pelo `/admin/login`, ou você cria em **Authentication → Users**. Depois libere o acesso dela no SQL Editor:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'email-da-cintia@gmail.com';
   ```
6. No primeiro login, o painel mostra um QR code. Ela escaneia com o Google Authenticator e pronto.
   Se ela perder o celular: **Authentication → Users → (usuária) → MFA factors**, remova o fator e ela cadastra de novo.

> No plano grátis, o Supabase pausa projetos parados por alguns dias. Se o site ficar sem visitas por muito tempo, entre no painel do Supabase e clique em *Restore*.

### 2. Hospedagem
O projeto é um Next.js comum. Confira os termos do plano grátis antes de escolher: a Vercel Hobby, por exemplo, é só para uso não comercial. Na hospedagem:
- cadastre as variáveis do `.env.example`. A `SUPABASE_SERVICE_ROLE_KEY` é obrigatória pra foto de referência e os avisos funcionarem: ela fica só no servidor, nunca no navegador;
- aponte o domínio `.com.br`, registrado no [registro.br](https://registro.br).

### 3. Avisos de pedido (opcional)
- **E-mail**: crie a chave em [resend.com](https://resend.com) e coloque em `RESEND_API_KEY`. Pra enviar com o seu domínio, verifique-o no Resend e ajuste `RESEND_FROM`. O e-mail de destino a Cintia coloca no painel.
- **WhatsApp**: a Cintia segue as instruções que aparecem em *Configurações do site → Avisos de novo pedido* e cola a chave do CallMeBot lá.

## Antes de publicar
- Troque o número do WhatsApp, o Instagram e o TikTok pelo painel.
- Coloque as fotos reais das peças e uma foto da Cintia em `/sobre`: veja o comentário em `src/app/(site)/sobre/page.tsx`.
- Revise os textos de **Trocas** e **Privacidade** com um contador, um advogado ou o Procon-DF. A regra das peças personalizadas, principalmente, precisa dessa confirmação.

## Estrutura
```
src/app/(site)/      páginas públicas + actions.ts (pedido, personalizada, avisar)
src/app/admin/       login, verificação 2 etapas e o painel (painel)/…
src/components/      icons.tsx (ícones do Figma), site/, admin/
src/lib/             dados, formatação, WhatsApp, lista no navegador, Supabase
supabase/            migração (tabelas, RLS, storage, funções) e seed
scripts/             check-migrations.mjs (teste do banco)
```
