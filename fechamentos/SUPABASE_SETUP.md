# Configuração Do Supabase

## O que foi adaptado

O dashboard agora continua funcionando localmente, mas pode sincronizar os dados com o Supabase usando um snapshot online.

- arquivo principal: `public/index.html`
- tabela usada: `public.dashboard_snapshots`
- chave do snapshot: `gestao-perdas-principal`

## Como configurar

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute o conteúdo de `supabase_schema.sql`.
4. No painel do projeto, copie:
   - `Project URL`
   - `anon public key`
5. Abra o dashboard e preencha os campos:
   - `https://SEU-PROJETO.supabase.co`
   - `SUPABASE_ANON_KEY`
6. Clique em `Salvar dados`.

## Como funciona

- `Salvar dados`:
  - salva no `localStorage`
  - se houver credenciais, também faz `upsert` no Supabase
- `Carregar Supabase`:
  - busca o snapshot online
  - atualiza a tela e também o cache local
- `Limpar dados`:
  - limpa localmente
  - se houver conexão configurada, apaga o snapshot remoto

## Observação importante

As policies do SQL acima permitem acesso com a chave `anon` para simplificar esse dashboard estático. Se depois quisermos endurecer a segurança, o próximo passo é adicionar autenticação e restringir os registros por usuário ou empresa.
