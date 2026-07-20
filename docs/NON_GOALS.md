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

## O Que NÃO Vamos Fazer (v1 MVP)

### Analytics & IA
❌ Intelligence/Analytics module (Sprint 3+)  
❌ Forecast module  
❌ Machine learning customizado  

**Por quê?** MVP é presença online, não análise. Analytics é módulo para depois.

---

### Gestão Complexa
❌ Módulo Financeiro  
❌ Módulo Contábil  
❌ Emissão de Notas Fiscais  
❌ Gestão de Contas a Pagar/Receber  

**Por quê?** Escopo diferente. Se necessário, integramos com outra plataforma.

---

### Comunicação Interna
❌ Chat interno  
❌ Video conferência  
❌ Gerenciador de documentos  

**Por quê?** Ferramentas especializadas já fazem. Razarth não é hub.

---

### Mobile Nativo
❌ App iOS nativo  
❌ App Android nativo  

**Por quê?** Progressive Web App é suficiente. Reavaliamos quando > 50% mobile.

---

### Marketplace
❌ Vender módulos de terceiros  
❌ Marketplace público  

**Por quê?** Controlamos qualidade. Marketplace é Sprint 5+.

---

### Integrações Massivas
❌ Integração com SAP  
❌ Integração com Oracle  
❌ Integração com todos os ERPs  

**Por quê?** 1000 ERPs existem. Focamos em REST/webhooks genéricas.

---

### Complexidade Regulatória
❌ Multi-currency  
❌ Multi-country (Brasil apenas na v1)  
❌ GDPR hipercompleto  
❌ Criptografia de repouso  

**Por quê?** LGPD respeitamos. Hipercompliance adia MVP. Fazemos em camadas.

---

## O Que CONTINUA Sendo Fora de Escopo

- ERP monolítico
- Solução "tudo em um" que cresce infinitamente
- Suporte a 1 bilhão de variações
- Compliance de múltiplos países de uma vez

---

## Critério: Se Entra em NON_GOALS, Resposta É NÃO

Exceto se:
1. 3+ clientes pedem (evidência real)
2. Time concorda (RFC aprovada)
3. Roadmap muda (documentado)

Caso contrário: NON_GOALS é sagrado.

