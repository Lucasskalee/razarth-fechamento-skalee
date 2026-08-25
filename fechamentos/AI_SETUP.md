# Analise de fechamento com IA

O botao **Analisar com IA** envia somente indicadores consolidados do recorte gerencial atual. A chave da OpenAI permanece na Function da Vercel e nunca e enviada ao navegador.

## Variaveis de ambiente

Configure no projeto da Vercel, para os ambientes desejados:

```text
OPENAI_API_KEY=chave-secreta-do-projeto
OPENAI_MODEL=gpt-5-mini
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-publicavel
```

`OPENAI_MODEL` e opcional. As outras tres variaveis sao obrigatorias.

Depois de salvar as variaveis, gere um novo deploy. O endpoint aceita apenas `POST`, exige um access token valido do Supabase e limita temporariamente a quantidade de analises por usuario.

## Limites funcionais

- A IA nao altera totais, notas, classificacoes ou status.
- O resultado e uma orientacao gerencial e precisa de validacao humana.
- Somente os 10 maiores agrupamentos e os 12 produtos mais relevantes sao enviados.
- A resposta nao e persistida pela aplicacao nem solicitada para armazenamento na API da OpenAI.
