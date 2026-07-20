# Core Domain — O Que Todas as Operações Têm em Comum

**Data:** 2026-07-20  
**Status:** ✅ **FOUNDATION FOR ARCHITECTURE**  
**Criticality:** 🔴 **CRITICAL - Define reusability**

---

## 🎯 A Pergunta Central

> **O que todas as operações do Razarth têm em comum?**

Esta pergunta é importante porque a resposta impede que a arquitetura vire uma "coleção de exceções".

Se você não responde com clareza, daqui a 1 ano vai ter:
- "Módulo Barbearia"
- "Módulo Restaurante"  
- "Módulo Evento"
- "Módulo Condomínio"
- 40+ módulos específicos para cada segmento

E volta ao problema original: não é escalável, é apenas uma coleção de verticais.

---

## 📋 O Core Domain (Universal)

### Toda operação no Razarth possui:

#### 1. **Identidade**
```
O que define a operação?

Barbearia:      Nome da barbearia, logo, descrição
Competição:     Nome do campeonato, logo, regulamento
Condomínio:     Nome do condomínio, logo, endereço
Igreja:         Nome da congregação, logo, missão

Abstração:      Entidade = Name + Logo + Description + Metadata
Implementação:  Company + PublicProfile + CompanySettings
```

#### 2. **Participantes**
```
Quem interage com a operação?

Barbearia:      Clientes
Competição:     Pilotos, expectadores
Condomínio:     Moradores
Igreja:         Membros da congregação

Abstração:      Participant = User + Role + Relationship
Implementação:  User + Membership + Permission
```

#### 3. **Recursos**
```
Quais são os "produtos/serviços" da operação?

Barbearia:      Serviços (corte, barba, etc)
Competição:     Prova (time A vs Time B, etc)
Condomínio:     Serviços (limpeza, segurança, etc)
Restaurante:    Pratos (pizza, pasta, etc)

Abstração:      Resource = Name + Description + Metadata
Implementação:  Product + Service + Asset
```

#### 4. **Agenda**
```
Quando acontecem os eventos?

Barbearia:      Horários de agendamento
Competição:     Cronograma de provas
Condomínio:     Reuniões mensais
Igreja:         Cultos, reuniões

Abstração:      Schedule = DateTime + Duration + Recurrence
Implementação:  Appointment + Event + Slot
```

#### 5. **Comunicação**
```
Como a operação se comunica?

Barbearia:      Confirmação de agendamento, lembretes
Competição:     Atualizações de ranking, resultado
Condomínio:     Avisos, comunicados
Igreja:         Convite para eventos

Abstração:      Message = Content + Channel + Recipient
Implementação:  Notification + Email + SMS + WhatsApp
```

#### 6. **Documentos**
```
Quais documentos a operação precisa?

Barbearia:      Política de cancelamento, termos
Competição:     Regulamento, inscrição
Condomínio:     Regimento, atas
Igreja:         Bíblia, estudos, documentos

Abstração:      Document = File + Type + Metadata
Implementação:  Media + PDF + Version
```

#### 7. **Eventos**
```
O que marca momentos importantes?

Barbearia:      Agendamento novo, pagamento
Competição:     Inscrição fechada, prova iniciada, resultado
Condomínio:     Assembléia, manutenção
Igreja:         Batismo, casamento, culto

Abstração:      Event = Type + Trigger + Timestamp
Implementação:  BusinessEvent + Activity + Audit
```

#### 8. **Permissões**
```
Quem pode fazer o quê?

Barbearia:      Dono edita; cliente apenas vê
Competição:     Organizador controla; piloto entra
Condomínio:     Síndico envia avisos; morador vê
Igreja:         Pastor predica; membro participa

Abstração:      Permission = Role + Capability + Scope
Implementação:  Role + Claim + Policy
```

#### 9. **Mídia**
```
Quais conteúdos visuais?

Barbearia:      Fotos do salão, portfolio
Competição:     Fotos dos pilotos, fotos da prova
Condomínio:     Fotos do condomínio, reuniões
Igreja:         Fotos de eventos, logo

Abstração:      MediaAsset = File + Type + Metadata
Implementação:  Media + Image + Gallery
```

#### 10. **Configurações**
```
Qual é a configuração da operação?

Barbearia:      Horário de funcionamento, preços, políticas
Competição:     Regras da prova, limites de inscritos
Condomínio:     Regras do condomínio, taxas
Igreja:         Horários de culto, política de visitantes

Abstração:      Configuration = Key + Value + Type
Implementação:  CompanySettings + Feature Flag
```

---

## 🔗 Visualizando o Core Domain

```
Toda Operação

    ├─ Identidade (nome, logo, descrição)
    │
    ├─ Participantes (usuários com roles)
    │
    ├─ Recursos (produtos, serviços, ativos)
    │
    ├─ Agenda (horários, cronograma, slots)
    │
    ├─ Comunicação (mensagens, notificações)
    │
    ├─ Documentos (arquivos, termos, regulamentos)
    │
    ├─ Eventos (marcos importantes, atividades)
    │
    ├─ Permissões (quem faz o quê)
    │
    ├─ Mídia (fotos, vídeos, galeria)
    │
    └─ Configurações (opções, políticas, limites)
```

---

## 💡 Por Que Isso Importa

### Sem Core Domain Claro
```
Você começa com:
├─ Módulo Barbearia
├─ Módulo Restaurante  
├─ Módulo Evento
└─ Módulo Condomínio

Cada um implementa seu próprio:
├─ Sistema de agendamento (4 versões diferentes!)
├─ Sistema de permissões (4 abordagens!)
├─ Sistema de notificações (4 integrações!)

Resultado: Código duplicado, manutenção impossible
```

### Com Core Domain Claro
```
Você implementa UMA VEZ:
├─ Schedule engine (reutilizável)
├─ Permission system (universal)
├─ Notification service (genérico)

Depois, cada template COMBINA:

Template Barbearia:
    Schedule engine + User permissions + Email/SMS + Portfolio media

Template Competição:
    Schedule engine + Team permissions + WhatsApp + Ranking events

Template Condomínio:
    Schedule engine + Resident permissions + Email/SMS + Billing config

Resultado: Zero duplicação, máxima reutilização
```

---

## 🏗️ Arquitetura do Core Domain

```
Core Platform (Imutável para TODOS)

    ├─ Identity Engine
    │   └─ Company + PublicProfile + CompanySettings + CompanyTheme
    │
    ├─ Participant Engine
    │   └─ User + Membership + Permission + Role + Claim
    │
    ├─ Resource Engine
    │   └─ Product + Service + Asset (abstração)
    │
    ├─ Schedule Engine
    │   └─ Appointment + Event + Slot + Recurrence
    │
    ├─ Communication Engine
    │   └─ Notification + Email + SMS + WhatsApp + Push
    │
    ├─ Document Engine
    │   └─ Media + File + Version + Metadata
    │
    ├─ Event Engine (Business Events)
    │   └─ BusinessEvent + Activity + Audit + Webhook
    │
    ├─ Permission Engine
    │   └─ Role + Claim + Policy + Authorization
    │
    ├─ Media Engine
    │   └─ Image + Video + File + Gallery
    │
    └─ Configuration Engine
        └─ Setting + FeatureFlag + Metadata


Solutions (Combinam engines conforme necessário)

    ├─ Template Barbearia
    │   └─ Identity + Participant + Schedule + Resource + Media + Config
    │
    ├─ Template Competição
    │   └─ Identity + Participant + Schedule + Event + Resource + Media
    │
    ├─ Template Condomínio
    │   └─ Identity + Participant + Communication + Document + Config
    │
    └─ Template Igreja
        └─ Identity + Participant + Communication + Event + Document
```

---

## ✅ The Principle

### PLATFORM PRINCIPLE 01

```
O Razarth NÃO cria módulos para segmentos.

O Razarth cria CAPACIDADES REUTILIZÁVEIS.

Os segmentos apenas COMBINAM capacidades diferentes.
```

**Implementação:**

Quando alguém diz "precisamos de um módulo específico para X":

❌ ERRADO:
```
"Criar Módulo Barbershop"
"Criar Módulo Evento"
"Criar Módulo Condomínio"
```

✅ CERTO:
```
"Que capacidades core estão faltando?"
"Como essa capacidade pode ser reutilizada?"
"Qual template vai usar isso?"
```

**Exemplo:**

Alguém diz: "Eventos precisam de um ranking diferente de barbearias"

❌ ERRADO: "Vamos criar Módulo Ranking para Eventos"

✅ CERTO: 
```
Pergunta: "O que é ranking?"
Resposta: "Lista ordenada de participantes por score"

Pergunta: "Isso é reutilizável?"
Resposta: "Sim! Barbearia pode usar para ranking de clientes"

Pergunta: "Como implementar?"
Resposta: "Leaderboard Engine (core) + API genérica"

Resultado: Um Leaderboard Engine, 10 templates usam
```

---

## 🔮 Implicação para o Futuro

### Year 1
```
Core Domain implementado
Templates: 5-8
Engines: 10-12
Código reutilizado: 70%
```

### Year 2
```
Core Domain refinado
Templates: 20-30
Engines: 12-15
Código reutilizado: 85%
```

### Year 3
```
Core Domain estável
Templates: 50-100
Engines: 15-20
Código reutilizado: 90%+
```

---

## 🚫 O Que Core Domain Previne

### Scope Creep
```
❌ "Vamos adicionar módulo específico para X"
✅ "Vamos estender a capacidade Y (que X também vai usar)"
```

### Code Duplication
```
❌ Cada template implementa seu próprio scheduling
✅ Todos usam o Schedule Engine
```

### Maintenance Nightmare
```
❌ 40 módulos diferentes, cada um com suas regras
✅ 12 engines bem definidos, N templates combinam
```

### Architectural Debt
```
❌ Cada novo template é "novo mundo"
✅ Cada novo template é "nova combinação"
```

---

## 📝 Core Domain Checklist

Quando implementar um novo feature, pergunte:

- [ ] Isso é Core Domain ou template-específico?
- [ ] Isso já existe em outro contexto (ex: Schedule)?
- [ ] Isso pode ser generalizado em um engine?
- [ ] Quantos templates vão usar isso?
- [ ] Estou criando exceção ou padrão?
- [ ] Posso usar abstração genérica?

---

## 🎯 Conclusão

O Core Domain é o que impede o Razarth de virar:

```
❌ Um ERP genérico com 40 "módulos especializados"
✅ Uma plataforma modular com engines reutilizáveis
```

É a resposta para: **"Por que Razarth é escalável?"**

Porque não scale adicionando código.  
Scale adicionando templates que combinam engines existentes.

---

**Status:** 🟢 **CORE DOMAIN DEFINED - FOUNDATION FOR ARCHITECTURE**
