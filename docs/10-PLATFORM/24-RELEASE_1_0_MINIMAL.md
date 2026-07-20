# RELEASE_1_0_MINIMAL.md

## Release 1.0 — The Absolute Minimum

**Goal:** One person creates a business page in <10 minutes without help

**Scope:** EXTREMELY Limited  
**Status:** This is ALL that goes in 1.0

---

## WHAT'S IN 1.0

### 1. Signup
```
User enters:
  - Email
  - Password

System creates:
  - Account
  - First Workspace (auto)
  
Time: < 1 minute
```

### 2. Create First Company
```
User chooses:
  - Business type (dropdown: Barbearia, Restaurante, Mercado, Clínica, Pet Shop, etc.)

System creates:
  - Company object
  - Default theme
  - Default logo
  - Default template

Time: < 1 minute
```

### 3. Add Basic Info
```
User enters:
  - Business name (required)
  - Phone (optional)
  - Address (optional)
  - Bio/description (optional)

System auto-fills:
  - Logo (placeholder)
  - Colors (template default)

Time: < 3 minutes
```

### 4. Catalog (Products/Services)
```
User can:
  - Add product or service
  - Set name + price
  - Add photo (optional)
  - That's it

System does:
  - Creates public listing
  - Generates product page
  - Shows on public profile

Time: < 3 minutes
```

### 5. Public Profile
```
URL: company.razarth.app/{workspace}/{company}

Shows:
  - Business name
  - Logo
  - Bio
  - Catalog (products/services)
  - Contact info
  - WhatsApp button
  
Design: Simple, fast, mobile-first

Time: Automatic (< 1 second)
```

### 6. WhatsApp Button
```
Shows on public profile:
  - Green button: "Chat on WhatsApp"
  - Clicks → Opens WhatsApp with business number

Integration: Just a link (no complex setup)

Time: Automatic
```

### 7. Share Link
```
User gets:
  - Public link
  - QR code (optional)
  - Can copy/paste/share

System does:
  - Analytics tracking (simple: visits, clicks)

Time: < 1 minute
```

---

## WHAT'S EXPLICITLY NOT IN 1.0

### ❌ ZERO OF THIS
- Scheduling (TODO Release 1.3)
- Analytics (TODO Release 2.0)
- Delivery (TODO Release 1.4)
- AI/Chatbot (TODO Release 2.0)
- Automations (TODO Release 3.0)
- Marketplace (TODO Release 2.5)
- Payments (TODO Release 1.4)
- Multi-page website builder
- Custom domain
- Email integration
- SMS integration
- Inventory management
- Financial reports
- Team management

### This is Intentional
```
22 documents of architecture.
1 product with 7 features.

Everything else can wait until we have users.
```

---

## THE FULL 1.0 USER JOURNEY

### START
```
Landing page
↓
"Sign up for free"
```

### SIGNUP (1 min)
```
Email + password + verify email
↓
First workspace created automatically
↓
Redirect to dashboard
```

### CREATE BUSINESS (1 min)
```
"Create your first company"
↓
Choose type: Barbearia
↓
System creates company + applies template + sets theme
↓
Redirect to company dashboard
```

### ADD INFO (3 min)
```
Dashboard shows:
  [ ] Add business name
  [ ] Add phone
  [ ] Add address
  [ ] Add bio

User fills in name + phone + address
↓
Logo = auto-generated (from template)
↓
Color = template default
↓
"Next" button
```

### ADD CATALOG (3 min)
```
"Add your products/services"
↓
"Add item"
  - Name: "Corte simples"
  - Price: "R$ 30"
  - Photo: (optional, skip button)
  - Add
↓
Item appears in list
↓
Can add 2-3 more items
↓
"Publish" button
```

### PUBLISH & SHARE (1 min)
```
"Your page is live!"
↓
Shows URL: company.razarth.app/lucas/barbearia-do-joao
↓
"Share this link:"
  - Copy button
  - WhatsApp button
  - Email button
↓
Done
```

### TOTAL TIME
```
Signup: 1 min
Create business: 1 min
Add info: 3 min
Add catalog: 3 min
Publish: 1 min
────────────
TOTAL: 9 minutes
```

---

## TECHNICAL CHECKLIST FOR 1.0

### Backend
- [ ] Auth (signup, login, email verification)
- [ ] Workspace creation (auto-first)
- [ ] Company CRUD
- [ ] Template application (auto)
- [ ] Catalog (product/service CRUD)
- [ ] URL routing (workspace/company)
- [ ] Basic analytics (page views, clicks)
- [ ] WhatsApp link generation

### Frontend
- [ ] Signup/login page
- [ ] Dashboard (empty state → onboarding)
- [ ] Company creation wizard
- [ ] Edit company info
- [ ] Catalog manager (add/edit/delete items)
- [ ] Public profile (template rendering)
- [ ] Share modal

### Database
- [ ] Users table
- [ ] Workspaces table
- [ ] Companies table
- [ ] Catalog items table
- [ ] Analytics events table

### Infrastructure
- [ ] Auth service
- [ ] URL generation
- [ ] CDN for photos
- [ ] Analytics tracking
- [ ] Error monitoring
- [ ] 99%+ uptime

### Testing
- [ ] Auth flows (signup, login, email verification)
- [ ] Company creation (all template types)
- [ ] Catalog CRUD
- [ ] URL routing (edge cases)
- [ ] Public profile rendering
- [ ] Mobile responsiveness
- [ ] 100+ concurrent users

---

## WHAT GETS MEASURED

### Primary Metrics (Only These Matter)
```
Companies created: 0 → X
Companies published: 0 → X
Companies with items: 0 → X
Time to publish (average): ?
```

### Secondary (Nice to Know)
```
Error rate
Page load time
Mobile vs desktop
```

### NOT Measured
```
Code quality
Architecture score
Documentation completeness
```

---

## CRITICAL REQUIREMENT: SIMPLICITY

### If a User Has to Ask a Question, 1.0 Is Not Ready

Test:
```
Give link to 5 people.
Ask them to "create your business page"
Give them 10 minutes.
Don't answer any questions.

If all 5 succeed:
  ✅ 1.0 is ready
  
If even 1 asks "how do I...?"
  ❌ UX needs work
```

---

## DEFINITION OF DONE

```
Release 1.0 is done when:

✅ Signup works
✅ Company creation works
✅ Template applied correctly
✅ Catalog items display
✅ Public profile renders
✅ WhatsApp link works
✅ Share works
✅ 5 random users can complete journey in <10min without questions
✅ Zero critical bugs
✅ 99%+ uptime in beta
✅ Mobile works perfectly
```

---

## AFTER 1.0 SHIPS

Do NOT:
- Add features
- Refine UI
- Improve architecture
- Document anything

DO:
- Recruit 10 beta users (real people, real use)
- Watch them use it
- Note what breaks
- Note what confuses them
- Fix critical issues only
- Gather feedback
- Decide what's next based ONLY on real feedback

---

## THE PHILOSOPHY

```
Perfect for 0 users > Pretty for 0 users

Working for users > Perfect for nobody

Real feedback > Assumed feedback

Ship, then iterate.
Not iterate forever, then ship.
```

---

## ESTIMATED TIMELINE

```
Sprint 1 (Week 1): Database + Auth
  ├─ Workspace entity
  ├─ Company entity
  ├─ Auth flow
  └─ URL routing

Sprint 2 (Week 2-3): Catalog + Public
  ├─ Catalog CRUD
  ├─ Template system
  ├─ Public profile rendering
  └─ Share functionality

Sprint 3 (Week 3): Polish + Testing
  ├─ UX refinement
  ├─ Performance
  ├─ Mobile testing
  ├─ Error handling
  └─ QA

Deploy: End of Week 3-4

Beta Testing: Week 4-5
  ├─ 10 users
  ├─ Daily monitoring
  ├─ Critical bugs only
  
GA Release: Week 5-6
```

---

## SUCCESS = FIRST USER GOES LIVE

Not:
- "Architecture is perfect"
- "Code is beautiful"
- "Documentation is complete"

Just:
```
One real person published their business.
They got their first contact via WhatsApp.
They came back the next day.
```

That's 1.0 success.

Everything else is bonus.

---

**Release 1.0 is not "all features".**

**It's "minimum viable product that one person can use alone".**

That's all.

Ship it.
