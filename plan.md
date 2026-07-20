# Razarth Platform — Empresa de Software
## Fase atual: Documentação completa + governança organizada, iniciando Sprint 1

---

## 🎯 Estratégia: Casa Primeiro, Depois as Cortinas

**Versão anterior:** Razarth Intelligence (produto único)  
**Nova versão:** Razarth Platform (modular) + Razarth Supermarket (Módulo 1)

### A Diferença Crucial

- ❌ Não fazemos dashboard bonito com arquitetura fraca
- ✅ Primeiro construímos fundação sólida (Sprint 1)
- ✅ Depois colocamos os móveis e pintamos (Sprint 2+)

---

## 📋 Roadmap de Sprints

### **Sprint 0** ✅ Completo
Documentação arquitetural de qualidade.

**Docs criados:**
- PRODUCT_VISION.md, CORE_ARCHITECTURE.md, ARCHITECTURE_DECISIONS.md
- MODULE_SYSTEM.md, BUSINESS_DICTIONARY.md
- ANALYTICS_ENGINE.md, KNOWLEDGE_ENGINE.md, KPI_CATALOG.md, FORMULA_BOOK.md
- SPRINT_0_SUMMARY.md

**Governança adicionada:**
- `docs/README.md`
- `docs/04-RFC/README.md`
- `docs/07-STANDARDS/NON_FUNCTIONAL_REQUIREMENTS.md`
- `docs/07-STANDARDS/PROJECT_METRICS.md`
- `docs/08-DECISIONS/README.md`
- `docs/09-CHANGELOG/README.md`

### **Sprint 1** 🚀 Foundation (Revisado Sprint 1.2)

**PIVOT CRÍTICO:** Razarth é agora **SaaS multi-tenant para PMEs**, não analytics.

**MVP Congelado (5 Passos):**
1. Signup (email + senha)
2. Criar empresa (nome, logo, slug)
3. Página pública (empresa.razarth.app)
4. Catálogo de produtos
5. Botão WhatsApp

#### Sprint 1.1 ✅ Completo
- Razarth.sln com Clean Architecture (8 projetos)
- First test (Result<T>)
- .editorconfig, global.json, Directory.Build.props
- CI/CD (GitHub Actions)

#### Sprint 1.2 📋 Próximo (3-4 dias)
- **Banco:** Companies, Users, Memberships, Plans, Subscriptions, Products, AuditLogs
- **EF Core:** DbContext com novo modelo de domínio
- **Migrations:** Primeira versão do schema
- **Seed:** Planos e módulos padrão
- **Testes:** Integração com database

#### Sprint 1.3 🔐 Multi-Tenancy (2-3 dias)
- TenantMiddleware (X-Company-Id header)
- [RequiresCompanyMembership] attribute
- Row-level security (WHERE company_id = current)
- Teste de isolamento (UserA não vê UserB)

#### Sprint 1.4 🔑 Autenticação (3-4 dias)
- JWT + Refresh Token
- RBAC (owner/editor/viewer)
- Claims + Policies
- Logout e token revocation

#### Sprint 1.5 📤 Storage (2-3 dias)
- Upload de logo
- Upload de banner
- Upload de foto de produto
- Validação (tipo, tamanho)

#### Sprint 1.6 🌐 Página Pública (3-4 dias)
- Endpoint GET /{slug} (sem auth)
- Renderizar perfil + catálogo
- Botão WhatsApp
- SEO básico (meta tags)

#### Sprint 1.7 🛍️ Catálogo de Produtos (3-4 dias)
- CRUD de produtos por empresa
- Upload de foto
- Preço + descrição
- Ordenação

#### Sprint 1.8 🧪 Testes & CI Green (3-5 dias)
- Cobertura > 85%
- Build < 3 min
- Testes passando
- Deploy automático
8. API Base (Health checks, Versioning)
9. Testes (>85% coverage)

**Duração:** 4-6 semanas  
**Resultado:** Plataforma com arquitetura-base, governança e pronto para módulos

### **Sprint 2**: Módulo Supermarket
Primeiro módulo plugável.

**Traz:**
- Razarth.Modules.Supermarket (IModule implementado)
- Domain entities (Product, Store, Sector, Loss, etc)
- Engines puras (Analytics, Knowledge, Investigation)
- Rules Engine (configuração sem código)
- API endpoints
- Dashboard React 19
- Testes >85%

**Duração:** 5-7 semanas  
**Resultado:** Supermercado Sol operacional

### **Sprint 3**: Marketplace + IA
Marketplace de módulos + IA Implementation.

**Traz:**
- Marketplace UI (descoberta, instalação)
- IA com OpenAI/Claude
- Feature flags por módulo

### **Sprint 4**: Segundo Módulo
Prova de conceito: Razarth.Modules.Barbershop.

**Traz:**
- Novo módulo via SDK (sem tocar no Core)
- Validação que arquitetura é extensível

---

## 🏛️ Hierarquia: Core > Módulos > Features

```
Razarth Platform
├── Core (nunca muda para satisfazer 1 módulo)
│   ├── Auth & RBAC
│   ├── Multi-tenancy
│   ├── Data Layer
│   ├── IA Interface
│   └── Module Discovery
│
├── Razarth.Modules.Supermarket
│   ├── Domain (Loss, Product, Store, Sector)
│   ├── Engines (Analytics, Knowledge, Investigation)
│   ├── Rules (Configuração)
│   ├── API
│   └── UI
│
├── Razarth.Modules.Barbershop (Sprint 4)
│   ├── Domain (Appointment, Barber, Service)
│   ├── Engines (Scheduling, Marketing)
│   ├── API
│   └── UI
│
└── ...
```

---

## 🚫 Disciplina de Arquitetura

**Regra de ouro:** 
Se alguém disser "vamos adicionar uma regra específica no Core porque é só essa vez", **a resposta é NÃO**.

**Por quê?**
- Primeira "exceção" = 10% da métrica de pureza
- Décima exceção = 100% corruição, Core virou dumping ground
- Novo módulo herda peso dos anteriores
- Refatoração fica impossível

**Protetor do Core:** Toda PR em Sprint 1 tem checklist:
- Esta mudança está no Core quando deveria estar em um Módulo?
- Esta mudança depende de um módulo específico?
- Esta mudança quebra a interface `IModule`?
- Esta mudança viola DDD?

---

## 📊 Progresso Atual

| Documento | Status |
|-----------|--------|
| PRODUCT_VISION.md | ✅ Completo |
| CORE_ARCHITECTURE.md | ✅ Completo |
| ARCHITECTURE_DECISIONS.md | ✅ Completo (9 decisões) |
| MODULE_SYSTEM.md | ✅ Completo |
| BUSINESS_DICTIONARY.md | ✅ Completo |
| ANALYTICS_ENGINE.md | ✅ Completo |
| KNOWLEDGE_ENGINE.md | ✅ Completo |
| KPI_CATALOG.md | ✅ Completo |
| FORMULA_BOOK.md | ✅ Completo |
| SPRINT_1_FOUNDATION.md | ✅ Completo |
| SPRINT_2_SUPERMARKET_MODULE.md | ✅ Completo |
| **Total** | **11 docs, ~150 KB** |

---

## 🎯 Critério de Sucesso Final

- ✅ Documentação clara e navegável
- ✅ Arquitetura aprovada por review board
- ✅ Sequência de sprints realista
- ✅ Disciplina de Core protegido
- ✅ Pronto para começar Sprint 1

---

**Próximo passo:** Iniciar Sprint 1 — Criar Razarth.sln em Clean Architecture
