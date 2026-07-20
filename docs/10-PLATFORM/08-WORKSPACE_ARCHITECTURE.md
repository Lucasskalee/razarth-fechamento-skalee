# Workspace — A Entidade que Muda a Arquitetura

**Data:** 2026-07-20  
**Status:** ✅ **INVIOLÁVEL**

---

## 🎯 O Problema com Company como Centro

### Limitações Atuais
```
Platform
  └── Company (1:1 com usuário proprietário)
      └── Modules
```

**Casos que NÃO suporta:**
- ❌ Uma agência gerenciar múltiplos clientes
- ❌ Uma holding com múltiplas empresas
- ❌ Franquias (matriz + filiais)
- ❌ Um usuário com acesso a múltiplas empresas

---

## ✅ A Solução: Workspace

### Nova Hierarquia
```
Platform
  │
  └── Workspace (contexto administrativo)
      │
      ├── Company A
      ├── Company B
      └── Company C
          │
          ├── Users (quem acessa)
          ├── Permissions (o que pode fazer)
          ├── Modules (quais funcionalidades)
          └── Settings (configurações)
```

---

## 📊 Modelo de Dados

### Workspace
```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    owner_user_id UUID NOT NULL,
    created_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

**O que é Workspace:**
- Agrupamento lógico de empresas
- Contexto administrativo
- Permite compartilhar usuários
- Permite compartilhar permissões
- Permite compartilhar configurações

---

### Company (Agora com Workspace)
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id),
    name VARCHAR(255),
    slug VARCHAR(100),
    business_type_id UUID,
    created_at TIMESTAMP
);
```

**O que mudou:**
- `workspace_id` é obrigatório
- Cada company pertence a um workspace
- Múltiplas companies no mesmo workspace

---

### User (Acesso ao Workspace)
```sql
CREATE TABLE workspace_users (
    id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(20), -- 'admin', 'owner', 'member'
    UNIQUE(workspace_id, user_id)
);
```

**Mudança:**
- Usuário acessa Workspace (não Company diretamente)
- Workspace contém múltiplas empresas
- Usuário vê todas as companies do seu workspace

---

## 🎭 Use Cases que Agora Funcionam

### Use Case 1: Agência Digital
```
Workspace: "Agência XYZ"
Owner: João (agência)
  ├── Company: "Barbearia Prime" (cliente 1)
  ├── Company: "Restaurante Bella" (cliente 2)
  └── Company: "Mercado do Zé" (cliente 3)

Users: [João, Maria (gerente), Pedro (assistente)]

Permissions:
  João: admin (tudo)
  Maria: editor (edita clientes, não vê billing)
  Pedro: viewer (só lê, não muda nada)

Resultado: Uma agência gerenciando múltiplos clientes com permissões granulares
```

---

### Use Case 2: Holding
```
Workspace: "Grupo ABC Holding"
Owner: CEO da holding
  ├── Company: "Loja A (São Paulo)"
  ├── Company: "Loja B (Rio de Janeiro)"
  ├── Company: "Loja C (Minas Gerais)"
  └── Company: "Sede Administrativa"

Users: [CEO, CFO, Gerente Regional 1, Gerente Regional 2]

Permissions:
  CEO: admin (tudo)
  CFO: financeiro (vê DRE, invoices)
  Gerente Regional 1: edita lojas 1 e 2
  Gerente Regional 2: edita loja 3

Resultado: Uma holding com transparência e controle distribuído
```

---

### Use Case 3: Franquia
```
Workspace: "Franquia Café Perfeito"
Owner: Franqueador
  ├── Company: "Unidade Matriz (São Paulo)"
  ├── Company: "Unidade 1 (Campinas)"
  ├── Company: "Unidade 2 (Santos)"
  └── Company: "Unidade 3 (Ribeirão Preto)"

Users: [CEO franqueador, Gerente cada unidade, Contador]

Permissions:
  CEO: admin
  Gerente unidade 1: edita só sua empresa, vê relatórios globais
  Gerente unidade 2: edita só sua empresa, vê relatórios globais
  Gerente unidade 3: edita só sua empresa, vê relatórios globais
  Contador: acesso leitura a DRE de todas

Resultado: Franquia com operação distribuída, controle centralizado
```

---

### Use Case 4: Usuário com Múltiplos Acessos
```
Maria (usuária real):
├── Workspace 1: "Agência Web" (trabalha como employee)
│   └── Companies: 5 clientes
│
└── Workspace 2: "Consultoria" (sócia)
    └── Companies: 2 clientes

Email: maria@email.com
Senha: ***

Login → Escolhe qual workspace quer acessar
```

---

## 🔐 Segurança Multi-Workspace

### Isolamento
```
User1 em Workspace A não pode ver Workspace B
User2 em Workspace B não pode ver Workspace A

Mesmo se tentarem acessar a API com IDs conhecidas:
GET /api/workspace/WORKSPACE-B-ID
↓
403 Forbidden (User1 não tem acesso a WORKSPACE-B)
```

### Permissions (Granular)
```
Workspace.Permission
├── Can view companies
├── Can create companies
├── Can edit companies
├── Can delete companies
├── Can manage users
├── Can manage billing
├── Can view analytics
└── ...
```

---

## 📋 Middleware TenantMiddleware (Atualizado)

### Antes (Company-only)
```csharp
GET /api/products
Header: X-Company-Id: <uuid>
```

### Depois (Workspace-aware)
```csharp
GET /api/products
Header: X-Workspace-Id: <uuid>
Header: X-Company-Id: <uuid>
```

**Validação:**
```
1. Valida que User tem acesso ao Workspace
2. Valida que Workspace possui essa Company
3. Valida que User tem permissão nessa Company
↓
Permite acesso
```

---

## 🚀 Implementação Sprint 1.2

### DDL Adicional
```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    owner_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    deleted_at TIMESTAMP NULL
);

CREATE TABLE workspace_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member', -- 'admin', 'owner', 'member'
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(workspace_id, user_id)
);

-- Atualizar Companies para referenciar Workspace
ALTER TABLE companies ADD COLUMN workspace_id UUID NOT NULL;
ALTER TABLE companies ADD CONSTRAINT fk_companies_workspace 
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

CREATE INDEX idx_companies_workspace ON companies(workspace_id);
```

---

### EF Core Mapping
```csharp
modelBuilder.Entity<Workspace>()
    .HasKey(w => w.Id);

modelBuilder.Entity<Workspace>()
    .HasIndex(w => w.Slug)
    .IsUnique();

modelBuilder.Entity<Workspace>()
    .HasMany<Company>()
    .WithOne()
    .HasForeignKey(c => c.WorkspaceId)
    .OnDelete(DeleteBehavior.Cascade);

modelBuilder.Entity<WorkspaceUser>()
    .HasKey(wu => wu.Id);

modelBuilder.Entity<WorkspaceUser>()
    .HasIndex(wu => new { wu.WorkspaceId, wu.UserId })
    .IsUnique();
```

---

## 🎯 Fluxo de Criação (Atualizado)

### Passo 1: Signup
```
Email + Password
↓
Usuário criado
```

### Passo 2: Criar Workspace
```
Nome do workspace (agência, holding, franquia, etc)
Slug automático
↓
Workspace criado
↓
Usuário recebe role "owner"
```

### Passo 3: Criar Primeira Company
```
Nome da empresa + BusinessType
↓
Empresa criada dentro do workspace
↓
User automaticamente adicionado com role "owner"
```

### Passo 4: Convidar Usuários (Futuro)
```
Adicionar email
Selecionar role (admin, editor, viewer)
↓
Email convite enviado
↓
Novo usuário acessa seu workspace
```

---

## ✅ Benefícios Imediatos

1. **Escalabilidade:** Suporta crescimento do cliente sem reescrever
2. **Flexibilidade:** Múltiplos modelos de negócio (agência, holding, franquia)
3. **Reusabilidade:** Um usuário acessa múltiplos workspaces
4. **Segurança:** Isolamento completo entre workspaces
5. **Governança:** Permissões granulares por workspace

---

## 🔮 Futuro (Não MVP 1.0)

```
Workspace Sharing
├── Convites de acesso
├── Roles granulares
├── Auditoria de acesso
└── Revogação instantânea

Workspace Analytics
├── Uso de recursos
├── Atividade de usuários
└── Billing por workspace

Workspace Teams
├── Sub-times dentro workspace
├── Permissões por time
└── Escalation automática
```

---

**Status:** 🟢 **PRONTO PARA SPRINT 1.2**

Workspace é a mudança arquitetural que torna Razarth verdadeiramente flexível.
Com isso, Razarth suporta qualquer modelo de negócio para PMEs.
