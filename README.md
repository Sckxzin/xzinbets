# XzinBets — BetTracker Pro

Aplicação React para controle de apostas esportivas, com autenticação própria
e persistência em **PostgreSQL** (banco provisionado pelo próprio Railway).

## Stack

- Frontend: React 18 (`react-scripts`)
- Backend: API própria em Express (`server/`), acessando o Postgres via `pg`
- Auth: própria (email + senha com `bcrypt`, sessão via cookie httpOnly com JWT)
- Deploy: Railway (`railway.json`)

## Arquitetura

O navegador **não** acessa o banco diretamente — toda leitura/escrita passa
pela API Express (`/api/*`), que valida a sessão (cookie JWT) e sempre filtra
as queries pelo `user_id` autenticado. Isso substitui o que antes era feito
por Row Level Security no Supabase.

```
src/                # frontend React
  utils/api.js       # client fetch para a API (/api/*)
  context/AuthContext.js
server/
  db.js              # pool de conexão Postgres (usa DATABASE_URL)
  auth.js            # hash de senha, JWT, middlewares de autenticação
  stats.js           # cálculo de estatísticas (compartilhado entre rotas)
  routes/            # auth, settings, tipsters, bets, admin
server.js             # sobe a API e (em produção) serve o build do React
db/schema.sql          # schema completo do Postgres
scripts/create-admin.js # cria/promove um usuário admin via CLI
```

## Configuração do banco (Postgres no Railway)

1. No painel do projeto no Railway, clique em **New → Database → PostgreSQL**
   para provisionar o addon. Ele expõe a variável `DATABASE_URL`
   automaticamente para os serviços do mesmo projeto.
2. Rode o schema contra esse banco uma única vez:
   ```bash
   psql "$DATABASE_URL" -f db/schema.sql
   ```
   (pegue a `DATABASE_URL` na aba **Variables** do addon Postgres no Railway;
   localmente, defina-a no seu `.env` antes de rodar o comando.)
3. Crie o primeiro usuário administrador:
   ```bash
   npm run create-admin -- admin@exemplo.com "senha-forte-aqui"
   ```

> O sistema é de acesso somente por convite: não há tela de cadastro público.
> Depois de logado, o admin pode criar novos usuários pela tela **Admin**
> dentro do próprio app (email + senha inicial, compartilhada manualmente —
> não há envio automático de email).

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do Postgres (gerada pelo addon do Railway) |
| `JWT_SECRET` | String aleatória longa para assinar os tokens de sessão |
| `PORT` | Porta local da API (Railway define a sua automaticamente em produção) |

Se `DATABASE_URL` ou `JWT_SECRET` estiverem ausentes, o servidor falha ao
subir com uma mensagem explícita, em vez de rodar com o banco desconectado.

## Rodando localmente

```bash
npm install
npm run dev      # sobe a API (porta 4000) e o React (porta 3000) juntos
```

O React em dev usa `proxy` (em `package.json`) para encaminhar chamadas
`/api/*` para a API local — não precisa configurar CORS.

## Build e produção

```bash
npm run build     # gera a pasta build/
npm start          # sobe server.js: API + estáticos do build/
```

No Railway, build e start são definidos em `railway.json`.
