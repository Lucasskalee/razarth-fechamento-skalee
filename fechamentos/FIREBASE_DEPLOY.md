# Publicar No Firebase Hosting

## Estrutura

- `public/index.html`: dashboard que sera servido como site
- `firebase.json`: configuracao do Hosting
- `.firebaserc`: arquivo para apontar o projeto Firebase

## Passos

1. Instale o Firebase CLI:

```powershell
npm install -g firebase-tools
```

2. Faça login:

```powershell
firebase login
```

3. Crie um projeto no Firebase Console, copie o `projectId` e troque em `.firebaserc`:

```json
{
  "projects": {
    "default": "seu-project-id"
  }
}
```

4. Publique:

```powershell
firebase deploy
```

## Observacao

Hoje o dashboard continua rodando como site estatico no navegador. Isso significa:

- funciona muito bem no Firebase Hosting como site estatico
- os dados podem ficar no `localStorage` do navegador
- agora tambem podem ser sincronizados com Supabase
- os XMLs continuam sendo importados pelo usuario diretamente no site

## Supabase

Se quiser persistencia online compartilhada:

1. Crie um projeto no Supabase.
2. Execute o SQL de `supabase_schema.sql`.
3. Abra o dashboard e informe:
   - `Project URL`
   - `anon public key`
4. Use o botao `Salvar dados` para sincronizar.

As instrucoes completas ficaram em `SUPABASE_SETUP.md`.
