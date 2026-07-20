# Razarth v1.0 — MVP Definition

**Objetivo:** Primeiro produto vendável  
**Data de Congelamento:** Sprint 1.2  
**Critério de Sucesso:** Primeira empresa pagando por Razarth  

---

## 🎯 Os 5 Passos

### 1️⃣ Signup (Onboarding)
**O que o usuário faz:**
- Acessa razarth.app/signup
- Insere email + senha
- Email de confirmação (ou magic link)
- Ativa conta

**Backend:**
```
POST /auth/signup
{
  "email": "usuario@email.com",
  "password": "SecurePass123"
}

Response:
{
  "userId": "uuid",
  "email": "usuario@email.com",
  "token": "jwt...",
  "refreshToken": "refresh..."
}
```

**Banco:**
- Users (email, password_hash, status, created_at)
- AuditLog (quem criou conta, quando)

---

### 2️⃣ Empresa (Company Registration)
**O que o usuário faz:**
- Após login, é direcionado para "/criar-empresa"
- Insere: Nome, Logo (upload), Descrição
- Clica "Criar"
- Recebe slug automático: `minha-barbearia.razarth.app`

**Backend:**
```
POST /companies
{
  "name": "Minha Barbearia",
  "logoFile": <binary>,
  "description": "Cortes modernos"
}

Response:
{
  "companyId": "uuid",
  "slug": "minha-barbearia",
  "logoUrl": "https://cdn.razarth.app/logos/uuid.png",
  "ownerId": "uuid" (current user)
}
```

**Banco:**
- Companies (name, slug, logo_url, description, created_by, tenant_id)
- Memberships (user_id, company_id, role='owner')
- Subscriptions (company_id, plan_id='free_plan', status='active')

---

### 3️⃣ Perfil Público (Public Profile)
**O que o usuário vê:**
- Visita `minha-barbearia.razarth.app`
- Vê: Logo, nome, descrição, catálogo de produtos
- Botão WhatsApp (chama `wa.me/55...`)
- Nenhuma autenticação necessária

**Frontend:**
```
GET /{slug}
Renderiza:
  - Header com logo
  - Descrição da empresa
  - Grid de produtos/serviços
  - Botão WhatsApp flutuante
```

**Backend:**
```
GET /public/profile/{slug}
Response:
{
  "company": {
    "name": "Minha Barbearia",
    "slug": "minha-barbearia",
    "logoUrl": "...",
    "description": "...",
    "whatsappNumber": "+55 11 99999-9999"
  },
  "products": [...]
}
```

**Banco:**
- PublicProfile (company_id, description, banner_url, whatsapp_number)
- Nenhuma autenticação (qualquer pessoa vê)

---

### 4️⃣ Catálogo de Produtos (Product Catalog)
**O que o proprietário faz:**
- Após criar empresa, acessa `/dashboard/produtos`
- Vê lista vazia
- Clica "Adicionar Produto"
- Preenche:
  - Nome
  - Descrição
  - Preço
  - Foto
  - Ordem (drag & drop)
- Salva

**Frontend:**
```
CRUD UI:
- Listar produtos (GET /companies/{companyId}/products)
- Criar (POST)
- Editar (PUT)
- Deletar (DELETE)
- Reordenar (PATCH)
```

**Backend:**
```
POST /companies/{companyId}/products
{
  "name": "Corte degradê",
  "description": "Degradê 0 a 3mm",
  "price": 35.00,
  "photoFile": <binary>,
  "order": 1
}

Response:
{
  "productId": "uuid",
  "companyId": "uuid",
  "photoUrl": "...",
  "createdAt": "2024-01-15T..."
}
```

**Banco:**
- Products (company_id, name, description, price, photo_url, order, soft_delete)

**Validações:**
- Usuário deve ser owner/editor da empresa (Membership check)
- Preço > 0
- Foto < 5MB, jpg/png/webp
- Máx. 50 produtos (limite free plan)

---

### 5️⃣ WhatsApp (Integration)
**O que acontece:**
- Cliente vê página pública
- Clica botão WhatsApp
- Abre `https://wa.me/55119999999?text=Olá`
- Mensagem no WhatsApp do proprietário

**Backend:**
- Apenas guardar número de WhatsApp em PublicProfile
- Gerar link de compartilhamento
- Nenhuma integração API (apenas link direto para wa.me)

**Frontend:**
```
<a href={`https://wa.me/${phone}?text=Olá, tenho interesse`}>
  💬 Fale conosco no WhatsApp
</a>
```

---

## 🔐 Segurança & Isolamento

### Multi-Tenancy Validations
```
GET /companies/{companyId}/products
- Middleware: Valida Current User tem Membership.companyId == companyId
- Caso contrário: 403 Forbidden
- Log em AuditLog
```

### Soft Delete
```
DELETE /companies/{companyId}/products/{productId}
- Não remove linha do banco
- Marca deleted_at = now()
- SELECT sempre filtra deleted_at IS NULL
```

### AuditLog
```
Toda ação registra:
- userId
- companyId / tenantId
- entidade (products, companies, users)
- ação (CREATE, UPDATE, DELETE)
- dados_antes / dados_depois (para UPDATE/DELETE)
- timestamp
```

---

## 📊 Plano Técnico (Sprint 1.2-1.8)

| Sprint | O Que Fazer | Duração | Status |
|--------|-----------|---------|--------|
| 1.2 | Banco: Companies, Users, Memberships, Plans, Subscriptions, Products, AuditLog | 3-4 dias | Próximo |
| 1.3 | Multi-tenancy: TenantResolver, Middleware, Current User context | 2-3 dias | |
| 1.4 | Auth: JWT, Refresh Token, RBAC | 3-4 dias | |
| 1.5 | Storage: Upload de logo, banner, foto de produto | 2-3 dias | |
| 1.6 | Public Profile: Endpoint /{slug}, renderizar frontend | 3-4 dias | |
| 1.7 | Product Catalog: CRUD UI + backend | 3-4 dias | |
| 1.8 | Testes: >85% coverage, CI green | 3-5 dias | |

**Total:** 5-6 semanas para MVP vendável

---

## ✅ Checklist Antes de Go-Live

- [ ] Banco está em produção (Supabase)
- [ ] TLS/HTTPS habilitado
- [ ] Signup → Email de confirmação funciona
- [ ] Primeira empresa criada (Supermercado Sol ou teste)
- [ ] Página pública renderizando
- [ ] Catálogo de produtos mostrando
- [ ] WhatsApp link funciona
- [ ] Cobertura de testes > 85%
- [ ] Build < 3 min
- [ ] CI/CD green
- [ ] Logs e monitoramento básico
- [ ] LGPD: Política de privacidade + soft delete

---

## 🚫 O Que NÃO Faz Parte de v1.0

- ❌ Dashboard de vendas
- ❌ Relatórios
- ❌ Analytics
- ❌ IA
- ❌ Agendamento
- ❌ Pagamentos in-app
- ❌ Domínios customizados
- ❌ Chat/Suporte
- ❌ Marketplace
- ❌ Integrações de terceiros (exceto WhatsApp link)

---

## 🎯 Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| **Tempo to First Customer** | < 8 semanas |
| **Churn (primeiros 90 dias)** | < 20% |
| **Cobertura de testes** | > 85% |
| **Build time** | < 3 min |
| **Page load (perfil público)** | < 2 seg |
| **Uptime** | > 99.5% |

---

## 📞 First Customer Profile

**Segmento:** Serviços (não varejos)  
**Tamanho:** 1-5 funcionários  
**Problema:** "Não tenho site, não sei fazer, quer me ajudar?"  
**Solução:** "Deixa comigo em 15 minutos, sem código, sem manutenção"  
**Preço (v1):** Gratuito (validação de mercado)  
**Upgrade (v2):** R$ 29-99/mês com módulos de IA

---

**Próximo documento:** `01-TENANCY_ARCHITECTURE.md`
