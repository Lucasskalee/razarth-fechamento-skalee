# KPI_WALL.md

## What Goes on the Physical Wall Above the Desk

**This is what you measure. Everything else is noise.**

---

## THE WALL

### Display #1: Companies Published

```
╔═══════════════════════════════════════╗
║     COMPANIES PUBLISHED / ACTIVE      ║
║                                       ║
║           📊  0  /  10                ║
║                                       ║
║  Weekly Progress:                     ║
║  Week 1:  0                           ║
║  Week 2:  0                           ║
║  Week 3:  2                           ║
║  Week 4:  4                           ║
║  Week 5:  8                           ║
║  Week 6:  10 ✅ TARGET REACHED        ║
╚═══════════════════════════════════════╝
```

### Display #2: Day-2 Retention

```
╔═══════════════════════════════════════╗
║   RETURNED NEXT DAY                   ║
║                                       ║
║           📊  0  /  10                ║
║                                       ║
║  Day-2 Active:                        ║
║  10 companies published               ║
║  8 returned day 2 (80%) ✅            ║
║  9 returned day 3 (90%) ✅            ║
║  8 still active day 7 (80%) ✅        ║
╚═══════════════════════════════════════╝
```

### Display #3: Critical Bugs

```
╔═══════════════════════════════════════╗
║   CRITICAL BUGS (should be 0)        ║
║                                       ║
║           🔴  2                        ║
║                                       ║
║  Bug 1: Email verification fails      ║
║         (Affects 3/10 users)          ║
║         Status: IN PROGRESS           ║
║                                       ║
║  Bug 2: Catalog doesn't save          ║
║         (Affects 1/10 users)          ║
║         Status: READY TO FIX           ║
╚═══════════════════════════════════════╝
```

### Display #4: Average Time to Publish

```
╔═══════════════════════════════════════╗
║   TIME TO PUBLISH (Target: <10 min)  ║
║                                       ║
║           ⏱️  8 min (avg)             ║
║                                       ║
║  Latest users:                        ║
║  User A: 7 min ✅                     ║
║  User B: 9 min ✅                     ║
║  User C: 10 min ⚠️ (borderline)       ║
║  User D: 8 min ✅                     ║
║  User E: 6 min ✅                     ║
╚═══════════════════════════════════════╝
```

### Display #5: User Happiness

```
╔═══════════════════════════════════════╗
║   WOULD YOU RECOMMEND THIS? (1-5)    ║
║                                       ║
║           ⭐ 4.2 / 5                   ║
║                                       ║
║  User feedback:                       ║
║  5 stars: "Easy, fast" (2 votes)      ║
║  4 stars: "Works well" (4 votes)      ║
║  3 stars: "Okay" (3 votes)            ║
║  2 stars: "Needs work" (1 vote)       ║
║  1 stars: (0 votes)                   ║
╚═══════════════════════════════════════╝
```

---

## WHAT'S NOT ON THE WALL

### ❌ NOT HERE:
```
Code coverage percentage
Number of commits
Architecture score
Documentation completeness
Test count
Performance benchmarks
Lines of code
```

### Why?
```
These don't tell you if users are happy.
These don't tell you if product works.
These don't tell you if you're winning.

Users tell you everything.
```

---

## HOW TO UPDATE THE WALL

### Daily (5 min update)
```
✅ Critical bugs: Add any new, remove any fixed
✅ Time to publish: Update with latest user average
```

### Weekly (30 min review)
```
✅ Companies published: Update count
✅ Retention: Check who came back
✅ User happiness: New feedback
✅ Trends: Is it getting better or worse?
```

---

## THE GREEN LINE

When this line goes from 0 to 10 and stays green:

```
╔═══════════════════════════════════════╗
║   RETENTION AT DAY 7                  ║
║                                       ║
║   10 ███████████████ 100%  ✅         ║
║    9 ███████████████                  ║
║    8 ██████████████                   ║
║    7 █████████████                    ║
║    6 ████████████                     ║
║    5 ███████████                      ║
║    4 ██████████                       ║
║    3 █████████                        ║
║    2 ████████                         ║
║    1 ███████                          ║
║    0 ██████                           ║
║      Week 1                           ║
╚═══════════════════════════════════════╝
```

**That moment = You've won.**

Razarth is now a product, not a project.

---

## IF A NUMBER GOES RED

### Scenario: Critical bugs = 5

```
Stop everything.

Not:
  - New features
  - Optimization
  - Documentation

Only:
  - Fix bugs
  - Test fixes
  - Deploy

Resume normal work when critical bugs = 0
```

### Scenario: Average time to publish = 15 min

```
5 users tested, all > 12 minutes

This means:
  - UX is too complex
  - Users are lost
  
Action:
  - Pull back all users
  - Redesign flow
  - Re-test before shipping more users
```

### Scenario: Retention = 3 / 10

```
10 companies created.
Only 3 returned day 2.

This means:
  - Product isn't sticky
  - Users don't see value
  - Something is broken
  
Action:
  - Interview the 3 who stayed: "Why?"
  - Interview the 7 who left: "Why?"
  - Fix core issue
  - Re-test
```

---

## THE CONVERSATION AT THE WALL

### GOOD CONVERSATION
```
Manager: "How's Release 1.0?"
Developer: "8 companies published, 7 returned day 2, avg time 8 min, critical bugs = 1"
Manager: "Great! Fix that bug, bring on 2 more test users"
```

### BAD CONVERSATION
```
Manager: "How's Release 1.0?"
Developer: "Uh... we're at 87% test coverage, code is clean, architecture is sound..."
Manager: "Do we have users?"
Developer: "Not yet, but we're close"
Manager: (sighs)
```

---

## THE TRUTH THE WALL TELLS

### If Numbers Look Like This:
```
Published: 10/10 ✅
Day-2 Retention: 9/10 ✅
Critical Bugs: 0 ✅
Time to Publish: 8 min ✅
User Happiness: 4.5/5 ✅
```

**Message: You're ready for Release 1.0 → 1.1**

### If Numbers Look Like This:
```
Published: 2/10
Day-2 Retention: 1/10
Critical Bugs: 5
Time to Publish: 22 min
User Happiness: 2/5
```

**Message: Go back to Sprint, don't ship**

### If Numbers Look Like This:
```
Published: 10/10
Day-2 Retention: 8/10
Critical Bugs: 1
Time to Publish: 8 min
User Happiness: 4/5
```

**Message: Almost there. Fix 1 bug, add 2 more test users, ship**

---

## THE ONLY CONVERSATION THAT MATTERS

```
"Do users want to come back?"

If YES → Everything else is detail
If NO → Everything else is irrelevant

The wall answers this question every day.
```

---

## PUT THIS ON THE ACTUAL WALL

Print these and tape them:

```
📊 COMPANIES PUBLISHED: __/10
📊 DAY-2 RETENTION: __/10
🔴 CRITICAL BUGS: __
⏱️  AVG TIME: __ min
⭐ HAPPINESS: __/5
```

Update daily by hand.

Nothing fancy.

The physical act of writing it makes it real.

---

## THE WALL WINS WHEN

All five numbers are:
- Published: 10/10
- Retention: 8+/10
- Bugs: 0-1
- Time: < 10 min
- Happiness: 4+/5

That's Release 1.0 success.

Ship it.

Tell the world.

You have a product now.

🚀
