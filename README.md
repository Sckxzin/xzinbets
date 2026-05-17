# BetTracker Pro v3 — Multi-usuário com Supabase Auth

## Passo 1 — Banco de dados
1. Abra o Supabase → SQL Editor → New query
2. Cole o conteúdo de `supabase_setup.sql` e execute
3. Verifique que aparece "Setup concluído! ✅"

## Passo 2 — Configurar .env
Edite o arquivo `.env`:
```
REACT_APP_SUPABASE_URL=https://xgglmmzyrazvpmguuupl.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJ...
REACT_APP_ADMIN_EMAIL=seu@email.com   ← SEU email aqui
```

## Passo 3 — Rodar
```bash
npm install
npm start
```

## Passo 4 — Seu primeiro acesso
1. No Supabase → Authentication → Users → Invite User
2. Digite seu email e envie o convite
3. Clique no link do email, defina sua senha
4. Acesse http://localhost:3000 e faça login

## Convidar novos usuários
No painel Admin (visível só para o seu email) → botão "Convidar Usuário"

## Como funciona a segurança
- Row Level Security (RLS) garante que cada usuário vê APENAS suas apostas
- Nenhum usuário consegue ler dados de outro, mesmo que tente via API
- O Admin vê todos via query especial
