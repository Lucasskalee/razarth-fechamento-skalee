# THE_FIVE_USER_TEST.md

## The Test That Matters More Than Any Document

**Duration:** 1-2 hours  
**Participants:** 5 completely different people  
**Pass/Fail:** Black and white

---

## WHY THIS TEST

This test is more valuable than:
- 100 pages of documentation
- Code review by architects
- Performance testing
- Security audits

Because it answers the ONE question that matters:

```
"Can a complete stranger use this without help?"
```

If the answer is NO, everything else is irrelevant.

---

## THE SETUP

### Pick 5 People (Completely Different)

```
Person 1: Barbeiro (from local barbershop)
Person 2: Manicure (nail salon)
Person 3: Vendedor de espetinho (street food)
Person 4: Fotógrafo (freelancer)
Person 5: Organizador de campeonato de futebol (event organizer)
```

**Why different?** Proves it works for multiple segments, not just one.

---

## THE TEST PROTOCOL

### What They Get
```
- A link to Razarth
- One sentence: "Create your business page"
- A timer (visible)
- Nothing else
```

### What They DON'T Get
```
❌ Explanation
❌ Documentation
❌ Help
❌ Hints
❌ Your presence (you watch silently)
```

### What You DO
```
✅ Sit silently and watch
✅ Note when they hesitate
✅ Note when they click wrong button
✅ Note when they ask a question
✅ Time everything
✅ Watch their face (frustration vs. flow)
```

---

## THE JOURNEY (What They Should Do)

```
1. Visit link (10 seconds)
2. Click "Sign up" (5 seconds)
3. Enter email + password (30 seconds)
4. Verify email (30 seconds)
5. See dashboard (10 seconds)
6. Click "Create company" (5 seconds)
7. Choose type: Barbearia (20 seconds)
8. Enter name + phone (30 seconds)
9. Add 1-2 items (1 minute)
10. Publish (10 seconds)
11. Copy link (10 seconds
12. Share on WhatsApp (10 seconds)

TOTAL TARGET: 10 minutes max
```

---

## PASS CRITERIA

### ✅ PASS
```
All 5 people:
  ✅ Create account
  ✅ Create company
  ✅ Add catalog items
  ✅ Publish page
  ✅ Share link
  ✅ In < 10 minutes
  ✅ WITHOUT asking any questions
  ✅ WITHOUT visible frustration
```

Result: Release 1.0 is **READY**

### ⚠️ PARTIAL PASS
```
4 people succeed without questions
1 person needs 1 hint or asks 1 question

Result: UX needs work, but close
Action: Fix UX issue, re-test with 2 new people
```

### ❌ FAIL
```
3 or fewer people succeed without questions
OR
More than 1 person asks multiple questions
OR
Anyone takes > 15 minutes

Result: Product is NOT ready
Action: Back to Sprint, redesign UX, re-test
```

---

## WHAT TO WATCH FOR

### Red Flag #1: Confusion at Signup
```
They try to log in before signing up
They don't understand what email is for
They forget password midway

Action: Simplify signup flow
```

### Red Flag #2: Company Creation Confusion
```
They don't know which type to pick
They think they can only have 1 company
They think template means "design"

Action: Add tooltips, clarify language
```

### Red Flag #3: Catalog Confusion
```
They don't understand what "catalog" means
They try to add a photo before name
They think "add item" = "add feature"

Action: Rename, reorder form, add help text
```

### Red Flag #4: Publish Confusion
```
They don't know when it's live
They don't know how to share
They're confused about the URL

Action: Add confirmation, make sharing obvious
```

### Red Flag #5: The Long Silence
```
They go 2+ minutes without clicking
They scroll back and forth multiple times
They sigh and lean back

Action: They're lost or overwhelmed
```

---

## DATA TO COLLECT

### For Each Person:
```
Time to signup: __ min
Time to create company: __ min
Time to add catalog: __ min
Time to publish: __ min
Total time: __ min

Questions asked:
  [ ] None
  [ ] 1
  [ ] 2+

Frustration level:
  [ ] None (smile/flow state)
  [ ] Mild (slight confusion, self-corrected)
  [ ] Significant (stuck, needed help)

What confused them (if anything):
  ________________
```

---

## AFTER THE TEST

### Success (All 5 Pass in <10min, No Questions)
```
Action: SHIP IT
Timeline: This week
Next: Monitor 10 beta users

Celebrate: You have a product
```

### Partial Success (4 Pass, Clear UX Issue)
```
Action: Fix UX issue, re-test with 2 new people

Example:
  Person A, B, C, D: Success
  Person E: "Where do I click to publish?"
  
Fix: Make publish button more obvious (add arrow? color? animation?)
Re-test: 2 new people

If both succeed: Ship it
If either fails: Go back to Sprint
```

### Failure (3 or Fewer Pass)
```
Action: DO NOT SHIP
Timeline: Back to Sprint, redesign UX

Example:
  Person A, B: Success
  Person C, D, E: Multiple questions

Issue: Product is too confusing in current form
Fix: Redesign entire flow, simplify more
Re-test: When ready

This is okay. Better to find now than after launch.
```

---

## THE SCRIPT YOU READ to Them

```
"Hi [Name], thanks for doing this.

We're testing a new platform.
Your job is super simple: create a page for your [business type].

You have this link: [PASTE]

Just visit it and create your business page.
I'm here to watch, but I won't help you.
I'm not testing you, I'm testing the product.

If it's confusing, that's a problem with the product, not you.
Take your time.
I'll be timing you.
Just let me know when you're done.

Any questions before we start?"

(If they ask "should I...?" — say "Whatever seems right to you")
```

---

## RED BUTTON RULE

If someone is stuck for > 2 minutes:
```
Offer: "Do you want to keep going or should we stop here?"

If they say stop: Mark as FAIL for that person
If they say keep going: They're motivated, that's good

But still count it as long/difficult.
```

---

## TIMING VARIATION ANALYSIS

```
If times are: 5min, 6min, 7min, 8min, 9min
→ Consistent, UX is clear

If times are: 2min, 5min, 12min, 6min, 20min
→ Inconsistent, some people are lost

If average is 15+ minutes
→ Too slow, needs simplification
```

---

## BONUS: Ask Them After

```
"Great! Quick questions:

1. What was easiest?
2. What was confusing?
3. Would you use this?
4. What would you change?"

Most important: Let them talk freely
Don't argue, just listen
```

---

## WHAT YOU DON'T DO

```
❌ Help them if they get stuck
❌ Explain features
❌ Suggest what to click
❌ Correct their understanding
❌ Intervene if they're slow
❌ Show your disappointment if they fail
```

Just watch. Time. Note.

---

## WHAT THIS TEST PROVES

```
If they pass:
  → Your product is intuitive
  → Marketing effort < expected
  → Users don't need tutorials
  → You're ready for real users

If they fail:
  → Your product is too complex
  → You need to simplify
  → Fixing now < fixing later
  → You're not ready yet
```

---

## DO THIS TEST

Not in 2 weeks.  
Not "when we think we're ready."  

**As soon as Release 1.0 branch is testable (even buggy).**

Why?

Because if 5 random people can't figure it out, 10,000 random people won't either.

And it's better to know now.

---

## THE QUOTE TO REMEMBER

```
"If you have to explain it, it's not intuitive.
If it's not intuitive, it won't scale.
If it won't scale, why build it?"

— The Five User Test
```

---

**Do this test.**

**Seriously.**

**Before you ship.**

The results will tell you EVERYTHING you need to know.
