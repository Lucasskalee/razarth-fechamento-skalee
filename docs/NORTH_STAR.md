# North Star — Razarth Platform

> **Uma sentença que define tudo. Se uma decisão contrariar isso, ela merece ser questionada.**

---

## A Sentença

**"A Razarth Platform é uma plataforma SaaS modular multi-tenant onde cada domínio de negócio é implementado como um módulo independente."**

---

## O que isso significa?

### ✅ Dentro da North Star

- ✅ Supermarket, Barbershop, Restaurant como módulos independentes
- ✅ Cada módulo tem sua própria domain logic
- ✅ Módulos compartilham autenticação, multi-tenancy, IA
- ✅ Novo cliente = novo subscription + ativação de módulos
- ✅ Escalabilidade horizontal (adicionar módulo = não redesenhar Core)
- ✅ Módulos podem evoluir em ritmos diferentes
- ✅ Novo módulo roda sem tocar em código de outro módulo

### ❌ Fora da North Star

- ❌ ERP monolítico onde tudo está junto
- ❌ Sistema feito especificamente para 1 cliente (mesmo que replicável)
- ❌ Lógica de negócio no Core
- ❌ Módulos acoplados entre si
- ❌ "Vamos adicionar Supermercado-específico no Core"
- ❌ Plataforma rígida que não permite customização
- ❌ Integração externa que quebra quando módulo muda

---

## Usando North Star em Decisões

### Exemplo 1: Deveria Score estar no Core?

**Pergunta:** "A Razarth Platform é uma plataforma SaaS modular multi-tenant onde cada **domínio é módulo**?"

**Resposta:** Score é domínio de Supermarket, não genérico.

**Decisão:** ❌ Score fica em Supermarket module, não em Core.

---

### Exemplo 2: Deveria IA estar no Core?

**Pergunta:** "A Razarth Platform é uma plataforma SaaS modular multi-tenant onde cada **módulo é independente**?"

**Resposta:** IA é compartilhada por todos. Não é específica de um domínio.

**Decisão:** ✅ IA interface fica no Core. Cada módulo providencia seu context.

---

### Exemplo 3: Deveria suportar "Chat interno"?

**Pergunta:** "Cada **domínio de negócio** é implementado como um **módulo**?"

**Resposta:** Chat interno é funcionalidade horizontal, não domínio de negócio.

**Decisão:** ❌ Chat interno fica para depois (Sprint 5+), fora do scope atual.

---

## Quando North Star Muda

North Star não muda porque alguém tem uma ideia nova. Muda quando:

1. **Pivô estratégico comprovado** (ex: descobrir que Supermarket não é mercado)
2. **Análise de mercado** (ex: descontinuar suporte para módulo)
3. **Decisão deliberada do time** (documentada como nova ADR)

**Frequência esperada:** A cada 12-18 meses, máximo. Não a cada sprint.

---

## Testando Cada PR Contra North Star

**Antes de submit:**

- [ ] Esta mudança alinha com "plataforma SaaS modular"?
- [ ] Esta mudança alinha com "multi-tenant"?
- [ ] Esta mudança alinha com "cada domínio é módulo"?
- [ ] Esta mudança alinha com "módulos independentes"?

Se responder "não" para qualquer, repense antes de submit.

---

**Esta sentença é o bússola do projeto.**
