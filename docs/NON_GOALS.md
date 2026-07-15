# NON_GOALS.md — O Que NÃO Fazemos

> **A mais importante defesa contra scope creep. Destruiu mais cronogramas que bugs.**

---

## Princípio

**Dizer não é tão importante quanto dizer sim.**

Se uma pergunta aparecer ("vamos adicionar X?"), a resposta é:

1. ✅ "Está em NON_GOALS? Então NÃO."
2. ✅ "Não está listado? Vamos discutir."
3. ✅ "É crítico? Abre RFC para reavaliação."

---

## O Que NÃO Vamos Fazer (Por Agora)

### ERP Completo
❌ Módulo Financeiro  
❌ Módulo Contábil  
❌ Emissão de Notas Fiscais  
❌ Gestão de Contas a Pagar/Receber  

**Por quê?** Razarth é especializada em **inteligência operacional**, não em gestão financeira. Sistema Financeiro é domínio diferente, com regulamentações, complexidade maior. Quando o mercado pedir, criamos módulo especializado ou parceria.

---

### Marketplace Público
❌ Vender módulos de terceiros  
❌ Marketplace de extensões  
❌ Ecossistema aberto de plugins  

**Por quê?** Controlamos qualidade do que oferecemos. Marketplace público = suporte a código de terceiro = pesadelo. Quando chegarmos a Sprint 5+, reavaliamos.

---

### Comunicação Interna
❌ Chat interno  
❌ Video conferência  
❌ Gerenciador de documentos  
❌ Kanban interno  

**Por quê?** Existem ferramentas especializadas (Slack, Teams, Google Meet). Razarth é analytics, não hub de comunicação. Acoplamento com comunicação complica a plataforma.

---

### Mobile Nativo
❌ App iOS nativo  
❌ App Android nativo  

**Por quê?** Começamos com Web. Se demanda real surgir, Progressive Web App funciona. Apps nativos multiplicam custo de desenvolvimento. Reavaliamos em Sprint 4.

---

### Integrações com Todos os ERPs
❌ Integração com SAP  
❌ Integração com Oracle  
❌ Integração com Omie  
❌ Integração com Bling  
❌ "Integração com sistema X"  

**Por quê?** Existem mil ERPs. Integrar com alguns é possível (REST, webhooks). Integrar com todos é impossível e não é nosso foco. Se necessário, criamos adapter simples.

---

### Business Intelligence Genérica
❌ Dashboard genérico para qualquer métrica  
❌ Builder de relatórios drag-and-drop  
❌ Data warehouse

**Por quê?** Razarth é **especializada** por domínio. Intelligence de supermercado é diferente de restaurante. Dashboard genérico vira irrelevante. Cada módulo tem seus dashboards.

---

### API GraphQL
❌ Suporte a GraphQL  

**Por quê?** REST é suficiente. GraphQL adiciona complexidade sem resolver problemas reais hoje. Se 3+ clientes pedirem, reavaliamos.

---

### Rate Limiting Agressivo
❌ Limites por API key que quebrem integrações reais  

**Por quê?** Rate limiting é proteção, não monetização. Clientes pagantes têm acesso. Implementamos proteção contra abuso, não punição.

---

### Machine Learning Customizado
❌ Modelos ML treinados por cliente  
❌ Sistema preditivo que aprende com histórico  

**Por quê?** IA é genérica (via prompts). ML customizado = infraestrutura complexa, overhead. Se evidência de demanda real, reavaliamos em Sprint 5.

---

### Suporte a Múltiplas Moedas/Países
❌ Multi-currency (USD, EUR, BRL diferente)  
❌ Multi-country (Brasil, Argentina, México)  

**Por quê?** Começamos com Brasil + BRL. Expansão internacional é decisão posterior. Quando chegarmos lá, é refatoração, não MVP.

---

### Conformidade GDPR/LGPD Hipercompleta
❌ Right to be forgotten (apagar dados completamente)  
❌ Data residency por país  
❌ Crypto de dados em repouso  

**Por quê?** LGPD respeitamos (dados no Brasil, logs de acesso, soft delete). Hipercompliance é possível mas adia MVP. Implementamos camada por camada.

---

### SSO Corporativo Complexo
❌ SAML 2.0  
❌ AD/LDAP integration  
❌ Okta/Auth0 customizado  

**Por quê?** JWT + email/password é suficiente para MVP. SSO é upgrade quando cliente corporativo surgir.

---

## Quando Algo em NON_GOALS É Requisitado

### Fluxo

1. **Cliente pede X** (em NON_GOALS)
2. **Resposta:** "X está em NON_GOALS. Não fazemos agora. Você pode:"
   - a) Usar solução alternativa existente
   - b) Esperar Sprint 5+ quando reavaliarmos
   - c) Propor RFC para remoção de NON_GOALS
3. **RFC é aberto** (se crítico)
4. **Time debate** contexto, custo, impacto
5. **Decisão é documentada** (aceito ou ainda NÃO)

---

## Como NON_GOALS Muda

### Critério para Remover de NON_GOALS

Uma coisa sai de NON_GOALS quando:

✅ **3+ clientes** pedem (evidência real)  
✅ **Impacto estratégico** demonstrado  
✅ **Recurso disponível** para fazer bem  
✅ **Time acorda** (consenso, não imposição)  

### Processo

1. Abrir Issue: "Remover X de NON_GOALS"
2. Documentar evidência (clientes, conversas)
3. Tech Lead + Product fazem RFC
4. Review board aprova ou nega
5. Se aprovado, muda para arquivo de decisão histórica

---

## Exemplo: "Vamos Adicionar Chat?"

**Cliente:** "Queremos chat integrado no Razarth."

**Resposta:** "Chat está em NON_GOALS. Razarth é analytics, não hub de comunicação. Você pode:"

1. **Usar Slack** + webhooks (notificações)
2. **Usar Teams** (já faz o que precisa)
3. **Se 3+ clientes pedirem**, reavaliaremos

**Cliente:** "Mas era fácil adicionar..."

**Resposta:** "Não é sobre facilidade. É sobre foco. Se adicionamos chat, alguém pede video, depois wiki, depois... O Core vira tudo. Mantemos foco em inteligência operacional."

---

## Exemplo: "ERP Financeiro?"

**Prospect:** "Vocês fazem gestão de contas a pagar?"

**Resposta:** "Não. Razarth é inteligência operacional (perdas, tendências, análises). Financeiro é outro domínio. Você pode:"

1. **Usar módulo de outra plataforma** (ERP especializado)
2. **Integrar API** entre Razarth + seu ERP
3. **Se modelo de negócio mudar**, reavaliaremos

**Prospect:** "Ah, então não serve para nós."

**Resposta (com educação):** "Serve, mas não completo. Considere: você quer sistema que toca em tudo, ou um que resolve analytics muito bem? Escolhemos o segundo."

---

## Benefícios de NON_GOALS

| Benefício | Como |
|-----------|------|
| **Foco** | Time não dilui esforço |
| **Qualidade** | Fazemos poucos, bem feitos |
| **Velocidade** | Menos features = menos bugs |
| **Manutenção** | Código menor = manutenção menor |
| **Roadmap claro** | Clientes sabem o que esperar |

---

## Revisão de NON_GOALS

**Frequência:** A cada 6 meses (ou quando 3 clientes pedem)

**Processo:**
1. Listar pedidos de clientes
2. Reavaliação de contexto (mercado mudou?)
3. Decidir: manter ou remover de NON_GOALS
4. Documentar decisão

---

**NON_GOALS: O documento que protege o projeto de se virar um Frankenstein.**

