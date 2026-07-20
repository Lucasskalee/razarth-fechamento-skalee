# NEXT_30_DAYS_CODE_ONLY.md

## The Next 30 Days: Nothing But Code

**Period:** 2026-07-20 → 2026-08-20  
**Mantra:** Build, Test, Deploy, Learn  
**New Documents:** ZERO (except fixing bugs found in code)

---

## THE COMMITMENT

```
✅ Coding (100%)
✅ Testing (daily)
✅ Deploying (when ready)
✅ Learning (from users)

❌ Documenting (forbidden)
❌ Architecture debates (forbidden)
❌ Planning 2.0 (forbidden)
❌ "What if" discussions (forbidden)
```

---

## WEEK 1: Database + Auth

### Monday-Wednesday
```
Sprint Goals:
  [ ] Workspace entity implemented
  [ ] Company model updated
  [ ] Auth flow (signup → email verification)
  [ ] TenantMiddleware updated

Definition of Done:
  [ ] Zero auth bugs in testing
  [ ] User can create account + first workspace
  [ ] Email verification works
  
Daily Standup:
  "Did I write code? Any blockers?"
  
No 1-hour architecture debates.
```

### Thursday-Friday
```
Sprint Goals:
  [ ] URL routing (workspace/company)
  [ ] Database migrations run
  [ ] Tests pass (>85% coverage)
  
Daily Testing:
  [ ] Manual test: signup flow 5 times
  [ ] Test edge cases (bad password, duplicate email, etc)
  
Deploy:
  [ ] To staging Friday EOD
  [ ] 2 people test signup over weekend
```

---

## WEEK 2: Catalog + Public

### Monday-Wednesday
```
Sprint Goals:
  [ ] Catalog CRUD endpoints
  [ ] Template system (applies default theme)
  [ ] Public profile rendering
  [ ] Basic styling (template CSS)

Daily:
  [ ] Code compile without errors
  [ ] Database queries optimized (<50ms)
  
Testing:
  [ ] Add 5 products manually
  [ ] Public profile loads < 1s
```

### Thursday-Friday
```
Sprint Goals:
  [ ] Share functionality (URL copy, QR code)
  [ ] WhatsApp button integration (just a link)
  [ ] Analytics tracking (basic: page views)
  [ ] Mobile responsive

Deploy to Staging:
  [ ] Full flow testable
  [ ] 3 people test "signup to publish" flow
```

---

## WEEK 3: Polish + Testing

### Monday-Tuesday
```
Sprint Goals:
  [ ] Error handling (user-friendly messages)
  [ ] Empty states (when catalog is empty)
  [ ] Loading states (while catalog loads)
  [ ] Edge cases handled

Focus on UX Details:
  [ ] Button text is clear
  [ ] Error messages explain what went wrong
  [ ] Mobile layout works
  
No "let's improve the architecture"
Just "does it work?"
```

### Wednesday-Thursday
```
Sprint Goals:
  [ ] Run THE FIVE USER TEST
  [ ] 5 different people test
  [ ] Time to publish for each
  [ ] Questions they ask
  [ ] Fix any critical UX issues found

If test fails:
  [ ] Identify UX problem
  [ ] Fix immediately
  [ ] Re-test with 2 new people
  
If test passes:
  [ ] Mark READY FOR BETA
```

### Friday
```
Sprint Goals:
  [ ] Deploy to production
  [ ] 99%+ uptime monitoring
  [ ] Error tracking enabled
  [ ] Ready for 10 beta users
```

---

## WEEK 4: Beta Launch

### Monday-Wednesday
```
Beta Phase 1 (3 users):
  [ ] Recruit: 1 barbeiro, 1 restaurante, 1 fotógrafo
  [ ] Monitor: Every action they take
  [ ] Watch: Do they get stuck?
  [ ] Note: What breaks?
  
Daily Standup:
  "What did our 3 users do today?"
  "Did anything break?"
  "Do we need to fix it NOW?"
  
Critical bugs only.
No feature creep.
```

### Thursday-Friday
```
Beta Phase 2 (7 more users):
  [ ] Add 7 more testers (different segments)
  [ ] Total 10 users
  [ ] Monitor: Every action
  [ ] Track KPI WALL numbers
  
Update Wall Daily:
  [ ] Companies published: __/10
  [ ] Time to publish: __min avg
  [ ] Critical bugs: __ (fix immediately)
  [ ] Day-2 retention: __/10
```

---

## WEEK 5: Decision Point

### Monday-Wednesday
```
Beta Analysis:
  [ ] Are 8+/10 users publishing? → GOOD
  [ ] Are 7+/10 returning day 2? → GOOD
  [ ] Critical bugs = 0? → GOOD
  [ ] Average time < 10 min? → GOOD
  
If YES to all:
  [ ] RELEASE 1.0 (next week)
  
If NO to 2+ items:
  [ ] ANALYZE why
  [ ] FIX root cause
  [ ] EXTEND beta another week
```

### Thursday-Friday
```
Get Ready for 1.0:
  [ ] Marketing messaging
  [ ] Beta user testimonials
  [ ] Deployment checklist
  [ ] Monitoring setup
  [ ] Support email ready
```

---

## RULES FOR THESE 30 DAYS

### ✅ ALLOWED
```
✅ Writing code
✅ Fixing bugs found in testing
✅ Refactoring code that doesn't work
✅ Optimizing performance that's slow
✅ Adding tests
✅ Deploying
✅ Talking to test users
✅ Fixing UX based on what users say
```

### ❌ FORBIDDEN
```
❌ Writing new documents
❌ Debating architecture
❌ Planning Release 2.0
❌ Adding features not in RELEASE_1_0_MINIMAL.md
❌ Optimizing code "for future scale"
❌ Refactoring "just because"
❌ Long meetings about "what if?"
❌ Philosophy discussions
```

---

## WHEN SOMEONE WANTS TO DEVIATE

### They Say:
```
"We should document this for future..."
```

You Say:
```
"Freeze is on. If users ask for it, we'll document it then."
```

### They Say:
```
"Let's refactor the auth module..."
```

You Say:
```
"Does it work? Is it causing problems?"
(If no) "Keep moving. Refactor if it breaks."
```

### They Say:
```
"What about Release 2.0 architecture?"
```

You Say:
```
"After we have 10 real users, we'll talk about 2.0."
```

### They Say:
```
"I have an idea for improving..."
```

You Say:
```
"Write it in Slack, we'll revisit after 1.0 ships."
```

---

## DAILY STANDUP (NEW STYLE)

### Old Standup (BAD)
```
Dev 1: "I refactored the auth service"
Dev 2: "I improved the architecture"
Dev 3: "I read 3 documents on microservices"
Lead: "Great progress!"

Reality: Nothing ships, no users engaged
```

### New Standup (GOOD)
```
Dev 1: "Implemented catalog CRUD, wrote 10 tests, code deploys"
Dev 2: "Fixed email verification bug, tested 5x, ready to merge"
Dev 3: "Public profile rendering works, mobile responsive"
Lead: "Excellent. Any blockers?"

Reality: Features ship, code builds, product works
```

---

## IF THERE'S A MAJOR BUG

### Definition: "Major Bug"
```
Users can't use the product at all.
Example: Signup broken, catalog doesn't save, public page crashes
```

### Response:
```
1. Stop all work
2. All hands on fixing
3. Deploy fix immediately
4. Resume normal work

This is the only exception to "freeze on new work".
```

### Definition: "Minor Bug"
```
Works but awkward.
Example: Button text is confusing, page loads slow, error message unclear
```

### Response:
```
Add to list: Fix next.
Keep building.
No disruption.
```

---

## WHAT SUCCESS LOOKS LIKE AFTER 30 DAYS

```
Week 1: Database and auth work
Week 2: Public profiles render
Week 3: 5-user test passes (<10 min, no questions)
Week 4: 10 beta users publishing + returning
Week 5: SHIP Release 1.0

KPI Wall shows:
  Companies published: 10/10 ✅
  Day-2 retention: 8/10 ✅
  Critical bugs: 0 ✅
  Time to publish: 8 min ✅
  User happiness: 4.2/5 ✅

Next: Monitor real users, gather feedback, decide what's next
```

---

## WHAT FAILURE LOOKS LIKE

```
Week 1-3: Code doesn't compile, core features break
Week 4: 5-user test fails (users take 20+ min, ask questions)
Week 5: Analysis shows UX is broken

Action: EXTEND Sprint, don't launch
Fix root causes
Re-test
Ship when ready (even if later than expected)
```

---

## THE PROMISE

```
In 30 days:

If we follow this plan:
  → You'll have a working product
  → 10 real users will have used it
  → You'll know what actually works
  → You'll have real feedback
  → You'll know what's next

If we don't:
  → You'll have perfect documentation
  → Perfect architecture
  → Perfect philosophy
  → Zero users
  → Zero learning
```

---

## THE MANTRA FOR THESE 30 DAYS

```
"Shipped beats perfect."

"Real users beat assumptions."

"Code beats documents."

"Learning beats planning."

"Go faster than feels comfortable."
```

---

## ON DAY 31 (2026-08-20)

We freeze ends.

We look at the wall.

We look at the users.

We talk.

Then we decide what's next.

Based on REALITY.

Not plans.

Not documents.

Reality.

---

**NEXT 30 DAYS:**

**NO DOCUMENTS**

**ONLY CODE**

**LET'S SHIP**

🚀
