# RAZARTH_MANIFESTO.md

## A Constituição da Plataforma

Este documento não é marketing. É a filosofia de engenharia que protege o Razarth de decay.

Leia isso quando:
- Alguém novo entra no projeto
- Você está decidindo se adiciona uma feature
- Um cliente pede uma exceção
- Você sente que a arquitetura está "pesada"

---

## O QUE ACREDITAMOS

### 1. Toda operação merece infraestrutura profissional
Seja um barbeiro no Rio, um organizador de eventos em SP ou um condomínio em MG.

A tecnologia não deveria ser privilégio de empresas grandes.

O Razarth existe porque pequenas operações merecem a mesma infraestrutura que fintechs têm.

### 2. A tecnologia deve desaparecer para o usuário
Quando alguém usa Razarth, não deveria pensar em "módulos", "APIs" ou "infraestrutura".

Deveria pensar em: "Posso agendar?" "Posso vender?" "Posso comunicar?"

Complexidade é permitida no código.
Complexidade NUNCA é permitida na UX.

### 3. Simplicidade é consequência de uma arquitetura complexa
Arquiteturas simples geram UX simples.

Mas só até um ponto.

Depois, architectures simples geram UX impossível (tudo vira one-off code).

O Razarth aceita complexidade arquitetural para entregar simplicidade ao usuário.

Inversamente, rejeitamos simplificações que cobrem complexidade na UX.

### 4. Nenhuma solução deve depender de um segmento específico
Não existe "módulo Barbearia".

Existe "capacidade de agendamento".

Se a capacidade depender de "ser barbearia", ela falha para clínicas, dentistas, personal trainers, cursos e eventos.

Toda feature é validada contra N segmentos. Se funciona apenas para 1, é customização, não feature.

### 5. Capacidades reutilizáveis sempre vencem soluções customizadas
Quando um cliente diz "preciso de algo especial", a pergunta é: "É realmente especial ou é uma capacidade mal definida?"

99% das vezes é a segunda.

Uma boa arquitetura revela que "diferenças" são apenas configurações diferentes da mesma capacidade.

### 6. A plataforma cresce por composição, nunca por duplicação
Cada novo feature aumenta o tamanho da base de código em ~5%.

Se aumentar em 30%, perguntamos: "Essa capacidade poderia reutilizar código existente?"

Duplicação é nosso inimigo número 1.

### 7. Uma operação digital é sempre composta por capacidades, nunca por segmentos
Você não usa "Razarth para Barbearia".

Você usa Razarth e ativa as capacidades que precisa.

A combinação de capacidades define o que é o seu negócio digital.

Barbearia = Agendamento + Portfólio + Catálogo + WhatsApp + Avaliações.

Restaurante = Cardápio + Pedidos + Delivery + Pagamento + WhatsApp.

Competição = Inscrição + Ranking + Agenda + Galeria + Resultados.

---

## O QUE ISSO SIGNIFICA NA PRÁTICA

### Quando Alguém Novo Entra

```
Você: "Bem-vindo ao Razarth."

Novo Dev: "Então, vocês fazem software para barbearias?"

Você: "Não. Fazemos infraestrutura de agendamento que barbearias usam. 
        Mas dentistas, clínicas, personal trainers e eventos também usam 
        a mesma infraestrutura. A diferença é apenas a combinação de capacidades."

Novo Dev: "Ah, entendi. Então quando alguém pedir uma feature, 
           vocês perguntam: 'É realmente específico ou é configuração?'"

Você: "Exatamente."
```

### Quando Você Está Decidindo Se Adiciona Uma Feature

```
Cliente: "Preciso de um módulo para gerenciar comissões de vendedores."

Você pensa:
  ✅ "É isso uma capacidade reutilizável?" (Sim, qualquer operação com múltiplos vendedores pode precisar)
  ✅ "Funcionaria para barbearias, restaurantes E eventos?" (Sim)
  ✅ "Posso construir isso sem código específico para 'vendedor'?" (Sim, é apenas distribuição de receita)
  ✅ "Reutiliza código existente ou duplica?" (Reutiliza: Permissions + Finance + Notifications)

Decisão: BUILD

---

Cliente: "Preciso de um módulo para gerenciar apelidos de jogadores em competições de eSports."

Você pensa:
  ❌ "É isso uma capacidade reutilizável?" (Não, é muito específico)
  ❌ "Funcionaria para barbearias?" (Não)
  ❌ "Posso construir sem código de eSports?" (Não, todo código seria de eSports)

Decisão: NÃO BUILD. Sugerir template customizado ou partner/plugin no marketplace.
```

### Quando Um Cliente Pede Uma Exceção

```
Cliente: "Vocês conseguem fazer o agendamento funcionarem 
          só com horários que acabam em :00 ou :30? 
          (não em :15 ou :45)"

Você pensa:
  ✅ "Outros tipos de operação precisam disso?" 
     Clínicas: Sim (consultas de 30min)
     Salões: Sim (cortes de 30-60min)
     Academia: Não (aulas de 1h exata)
     Eventos: Não (flexível)
     
  ✅ "Isso é configuração ou código?"
     É CONFIGURAÇÃO: slot_duration_options: [15, 30, 60]
  
  ✅ "Reutiliza código existente?"
     Sim, é apenas um campo no Schedule Engine

Decisão: ADD. Isso aumenta a plataforma, não a complexifica.

---

Cliente: "Vocês conseguem fazer um sistema onde cada vendedor 
          tem uma comissão diferente BASEADA NA FASE DA LUA?"

Você pensa:
  ❌ "Outros tipos de operação precisam disso?"
     Ninguém. Nunca. Isso é específico demais.

  ❌ "Isso é configuração ou código?"
     É CUSTOMIZAÇÃO. Seria código dedicado.

Decisão: NÃO. Sugerir solução via integração com planilha ou partner.
```

---

## AS CINCO QUESTÕES

Quando você ou alguém da equipe quer adicionar algo ao Razarth, pergunta:

```
1. Essa feature é uma capacidade reutilizável?
   (Se não, é customização, não feature)

2. Funcionaria em 3+ segmentos diferentes?
   (Se não, é específica demais)

3. Pode ser construída sem código de segmento?
   (Se não, reutilização vai falhar)

4. Reutiliza código existente?
   (Se duplica, é porque falta abstração)

5. Passa no teste do "genérico ou específico"?
   (Genérico = ADD. Específico = Marketplace/Partner)
```

Se respondeu "não" em 3+, é marketplace item, não feature do core.

---

## A REGRA SUPREMA

```
"Toda nova funcionalidade deve tornar a plataforma MAIS GENÉRICA,
nunca mais ESPECÍFICA."
```

Essa regra protege o Razarth de um dos maiores problemas de plataformas horizontais:

### Antipadrão (Plataformas que envelhecem)

```
Ano 1: 5 clientes, 2 features específicas
Ano 2: 50 clientes, cada um pede 1 exceção → 50 features específicas
Ano 3: 500 clientes, cada um pede 1 exceção → 500 features específicas
Ano 4: Codebase é um mosaico de one-offs. Impossível de manter.
Ano 5: Startup novo surge com arquitetura limpa. Você perde mercado.
```

### Padrão (Plataformas que crescem)

```
Ano 1: 5 clientes, 2 features reutilizáveis
Ano 2: 50 clientes, mesmas 2 features (não 50 features)
Ano 3: Identifica que 50 clientes compartilham 10 padrões → 10 features reutilizáveis
Ano 4: 500 clientes, ainda com ~10 features + marketplace de customizações
Ano 5: Codebase é limpo, escalável, fácil de manter. Novos clientes onboarded em dias.
```

É essa disciplina que separa Shopify de uma centena de "plataformas de comércio" que ninguém usa.

---

## COMO ISSO APARECE EM CADA DECISÃO

### Code Review

```
PR: "Adicionei agendamento com slots de 15min para barbearias"

Review: "Isso funciona para dentistas, academias e eventos também? 
         Se sim, remove 'para barbearias' do PR title."

---

PR: "Adicionei agendamento com validação de 'código-de-barbearia-válido'"

Review: "Isso é specific demais. Se é para validar código, 
         deve usar generic 'business-entity-code'. Refatore?"
```

### Architecture Decisions

```
Pergunta: "Devemos ter um Schedule Engine genérico ou um para barbearia?

Resposta: "Um genérico. Se barbearia tem necessidades especiais, 
          elas resolvem com: Features + Configuration + Templates."
```

### Feature Prioritization

```
Backlog:

1. "Add recurrence to scheduling" 
   → Genérico? Sim (clínicas, academias, eventos usam)
   → Priority: P0

2. "Add comission by stylist" 
   → Genérico? Sim (qualquer multi-user operation)
   → Priority: P1

3. "Validate CPF at checkout"
   → Genérico? Não (Brasil specific)
   → Priority: Marketplace/Partner
```

---

## A LONGO PRAZO

Essa filosofia tem uma consequência:

O Razarth deixa de ser um "produto que você constrói".

Vira uma "infraestrutura que outras pessoas constroem sobre".

```
Hoje:
Razarth → Cliente

5 Anos:
Razarth → Marketplace de Parceiros → Clientes de Parceiros
```

Quando você atinge isso, a escala muda fundamentalmente.

Você não precisa construir "módulo para eSports".

Um parceiro constrói "eSports Tournament Manager" usando Ranking + Messaging + File Storage (capabilities que já existem).

Você ganha 30% de revenue.

Parceiro ganha 70%.

Cliente tem exatamente o que precisa.

---

## MANTER ESSA FILOSOFIA

### Para Manter Viva Essa Filosofia

1. **Code Review** — Sempre perguntar "isso é genérico?"
2. **Architecture Review** — Sempre validar contra "5 questões"
3. **Onboarding** — Todo novo dev lê RAZARTH_MANIFESTO.md
4. **Architecture Decision Records** — Documentar quando rejeitou feature "porque específica"
5. **Architecture Board** — Revisar features semestralmente contra essa filosofia

### Sinais de Alerta

Se você identificar QUALQUER um desses:
- Nova feature só funciona para 1 segmento
- PR com código "se é barbearia então..."
- Cliente pedindo exceção e time dizendo "ok"
- Features crescendo 30%+ ao ano enquanto clientes crescem 10%
- Code ficando "pesado" (linhas por feature)

→ **PARAR E RE-AVALIAR**

---

## FINAL

Esse manifesto não é poético.

É pragmático.

Ele diz: "Se você quer que Razarth cresça como Shopify cresceu, discipline-se."

Shopify não tem 10 features específicas para lojistas americanos.

Tem 1 platform que todo lojista adapta para seus casos.

Isso é arquitetura.

Essa é a diferença entre software que envelhece e plataforma que cresce.

O Razarth é escolhido para ser a segunda.

---

**Assinado:**

"Razarth é uma plataforma de capacidades reutilizáveis.

Tudo que não reutiliza é marketplace.

Tudo que é específico é template.

Tudo que é genérico é core.

Pronto. Esse é o princípio."
