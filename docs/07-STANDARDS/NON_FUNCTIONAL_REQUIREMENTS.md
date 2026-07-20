# Non-Functional Requirements — Razarth Platform

## Performance

- Uma análise de um único produto deve levar menos de **500 ms**.
- Uma análise de uma loja inteira deve levar menos de **5 s**.
- O endpoint de health deve responder em menos de **200 ms** em condições normais.

## Segurança

- Toda ação importante deve ser auditável.
- Nenhum dado histórico deve ser apagado fisicamente por padrão.
- Toda operação deve respeitar o contexto da empresa (tenant).

## Escalabilidade

- Suportar múltiplas empresas desde o primeiro dia.
- Permitir crescimento para milhões de registros sem reescrever o domínio.
- Módulos novos não devem exigir alteração do Core.

## Confiabilidade

- Toda análise deve ser reproduzível.
- O mesmo conjunto de dados deve gerar o mesmo resultado.
- Falhas de integração não devem corromper o estado do domínio.

## Manutenibilidade

- O Domain permanece independente de banco, API e interface.
- Alterações em um módulo não quebram outros módulos.
- Código novo deve seguir `CONTRIBUTING.md`.

## Observabilidade

- Tempo de requisição, erro e exceção devem ser mensuráveis.
- Uso por empresa e por módulo deve ser rastreável.
