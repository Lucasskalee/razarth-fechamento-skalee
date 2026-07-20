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

### **Sprint 1** 🚀 Foundation (Versão Final v2.0 — REDEFINIDA)

**REPOSICIONAMENTO ESTRATÉGICO:**
- **De:** Razarth é "Website builder + ERP + Analytics"
- **Para:** Razarth é "Plataforma operacional para digitalização de PMEs"

**4 Pilares Invioláveis:**
```
1. Digital Presence (página, domínio, SEO, galeria, catálogo)
2. Business Operations (pedidos, agenda, estoque, financeiro, CRM)
3. Intelligence (IA, chatbot, marketing, relatórios, insights)
4. Platform (infra invisível: multi-tenancy, billing, storage, auth, audit)
```

**Mudança de Arquitetura: WORKSPACE**
```
ANTES: Platform → Company (centro)
AGORA: Platform → Workspace → Company[] (múltiplas)

Habilita: Agências (múltiplos clientes), Holdings (múltiplas divisões),
Franquias (matriz + franqueados), Usuários com múltiplos workspaces.
SEM necessidade de reescrita futura.
```

**Conceito-Chave: Template (Evolução de BusinessType)**
- Cliente escolhe: Barbearia, Restaurante, Mercado, Clínica, Loja, etc
- Sistema instala: Módulos + Tema + Dados de exemplo + Workflows
- Resultado: Ambiente 100% configurado em 2 minutos
- Zero configuração técnica

**MVP 1.0 Congelado (INEGOCIÁVEL):**
1. Signup (email + password)
2. Criar workspace
3. Criar primeira empresa
4. Selecionar Template (que auto-instala módulos)
5. Perfil público (3 formatos: empresa.razarth.app, razarth.app/empresa, www.dominio.com.br)
6. Catálogo (produtos ou serviços)
7. WhatsApp (botão direto para wa.me/)

**OBJETIVO PRIMÁRIO (NOVO):**
> "Colocar 10 empresas REAIS usando Razarth com zero intervenção técnica"
> 
> Sucesso: 10 diferentes PMEs completam signup → criam perfil → ficam
> ao vivo → recebem contatos pelo WhatsApp → 70% retêm após 30 dias

**NÃO entra em MVP 1.0:**
- ❌ IA/Chatbot, Analytics avançado, Delivery, Agenda, Pagamento

#### Sprint 1.1 ✅ Completo
- Razarth.sln com Clean Architecture (8 projetos)
- First test (Result<T>)
- .editorconfig, global.json, Directory.Build.props
- CI/CD (GitHub Actions)

#### Sprint 1.2 📋 Próximo — DATABASE & WORKSPACE (3-4 dias)
- **Banco:** Workspace, WorkspaceUsers, Companies, Users, Memberships, Plans, Subscriptions, Modules, CompanyModules, Products, Services, AuditLogs
- **EF Core:** DbContext com modelo Workspace-centrado
- **Migrations:** Primeira versão do schema com Workspace
- **Seed:** Planos, módulos, templates, business types
- **Testes:** Integração com database, isolamento de Workspace
- **Novo:** Implementar Workspace como entidade primária (Platform → Workspace → Company[])

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

---

## 🎯 Roadmap Release-Based (Produto, não implementação)

Mudança de foco: **Sprints** são internos, **Releases** são o que importa para clientes.

### Release 1.0: Foundation (4-6 weeks)
- ✅ Multi-tenancy com Workspace
- ✅ Auth + JWT
- ✅ Billing & Plans
- ✅ Storage básico
- 🎯 Métrica: Deploy com zero bugs críticos

### Release 1.1: Public Profiles (2-3 weeks)
- ✅ Página pública ao vivo
- ✅ Logo + Banner + Catálogo
- ✅ WhatsApp integration
- ✅ 3 formatos de domínio
- 🎯 Métrica: Primeira página funcionando

### Release 1.2: Business Templates (2-3 weeks)
- ✅ 8 templates predefinidos
- ✅ Auto-instalação de módulos
- ✅ Theme selection
- ✅ Sample data
- 🎯 Métrica: Onboarding < 5 min

### Release 1.3: Scheduling (3-4 weeks)
- ✅ Agenda
- ✅ Confirmação automática
- ✅ Lembretes
- 🎯 Métrica: 50% das companies usando

### Release 1.4: Commerce (3-4 weeks)
- ✅ Pedidos + Carrinho
- ✅ Pagamentos (Pix, Cartão)
- 🎯 Métrica: Primeira venda real

### Release 2.0: Razarth AI (ongoing)
- ✅ AI Assistant
- ✅ Chatbot inteligente
- ✅ Marketing automation
- 🎯 Métrica: IA utilizada por 70%+ das companies

### Release 2.5: Marketplace (ongoing)
- ✅ Publicação de themes
- ✅ Compra de plugins
- ✅ Revenue sharing (70% creator, 30% Razarth)
- 🎯 Métrica: 10+ creators publicando

### Release 3.0: Automation Engine (future)
- ✅ Workflow builder
- ✅ Triggers avançados
- ✅ Integrações externas
- 🎯 Métrica: Enterprise-grade capabilities

---

## 🎓 Validação com Usuários Reais

### Objetivo Primário (INVIOLÁVEL)
```
"Colocar 10 empresas reais usando Razarth"

Sem ajuda técnica
Completando: Signup → Perfil → Template → Página ao vivo → WhatsApp
Métrica: 7/10 retêm após 30 dias
```

### Timeline
```
WEEKS 1-6: Release 1.0 + 1.1 (Foundation + Public Profiles)
WEEKS 7-8: Beta com 10 real companies
WEEKS 9-10: Pre-launch refinements
WEEKS 11-12: Validation complete
```

### Se Validação Confirmar (Cenário Otimista)
```
✅ IA deixa de ser "aposta" → passa a ser accelerator
✅ Analytics deixa de ser "feature legal" → passa a ser diferencial
✅ Marketplace deixa de ser "ideia" → passa a ser revenue stream
✅ Você tem permissão para ESCALAR (investimento, hiring, marketing)
```

### Se Validação NÃO Confirmar (Cenário Pessimista)
```
❌ Analyze: Por quê? (usabilidade? performance? feature faltando?)
❌ Pivot: Corrija e tente novamente com 10 novas empresas
```

---

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
