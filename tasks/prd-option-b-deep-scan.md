# BubbleBoost Option B: Deep Scan (JSON Export)

**Status:** Saved for later - build only if Option A gets traction
**Prerequisite:** Option A shipped, 200+ installs, positive feedback

---

## Overview

Unlock checks that can't be done via DOM by having users paste their Bubble JSON export. This surfaces the most critical performance issues that DOM analysis misses.

## Why This Matters

The #1 performance killer in Bubble - **searches inside repeating group cells (N+1 queries)** - is invisible to DOM inspection. It's only visible in the app's JSON structure. This feature would catch what the DOM-only version can't.

---

## New Checks (JSON-Only)

| # | Check | Why Critical | Source |
|---|-------|--------------|--------|
| 8 | **Search in RG cell** | N+1 query problem - 100x slowdown | [Airdev guide](https://docs.airdev.co/bubble-development-guide/steps/develop/optimize-speed) |
| 9 | **Plugin count** | Each plugin loads on every page | Bubble docs |
| 10 | **Workflow trigger density** | "Too many events" error | [Forum](https://forum.bubble.io/t/unhandled-error-workflows-could-not-run-because-too-many-events-triggered-at-the-same-time/284111) |
| 11 | **Advanced filter usage** | Client-side = slow | Bubble docs |
| 12 | **Option set size** | Large sets loaded on every page | Bubble docs |
| 13 | **Backend workflow count** | Server capacity impact | Bubble docs |
| 14 | **Privacy rule complexity** | Can slow every query | Bubble docs |

---

## User Flow

```
1. User clicks "Deep Scan" button in panel
2. Modal explains: "Export your app JSON from Bubble Settings"
3. User pastes JSON or uploads file
4. Extension parses JSON client-side (no server)
5. Additional checks run against JSON structure
6. Results merge with DOM checks in panel
```

---

## Technical Approach

### JSON Export Location
Bubble → Settings → General → Export app → Download JSON

### Parsing Strategy
- Client-side only (no backend)
- Parse with browser's native JSON.parse
- Walk structure to find:
  - Elements with `data_source` containing `search`
  - Elements inside `repeating_group` containers
  - Workflow definitions and trigger counts
  - Plugin references
  - Option set definitions

### Privacy
- JSON never leaves browser
- No upload to any server
- Parsing happens in extension context

---

## Fixes for New Checks

### Check 8: Search in RG Cell (THE BIG ONE)
```
🔴 CRITICAL: Search Found Inside Repeating Group Cell

WHAT'S HAPPENING:
You have a "Do a search for" inside a repeating group cell.
If your RG shows 100 items, this creates 100 separate database queries.

THE FIX (Hidden RG Pattern):
1. Create a Repeating Group outside your visible RG (can be hidden)
2. Set its data source to search ALL the data you need ONCE
3. In your cell, change from "Do a search for..." to:
   "HiddenRG's list :filtered (Parent = Current cell's thing)"

RESULT: 100 queries → 1 query

📚 https://docs.airdev.co/bubble-development-guide/steps/develop/optimize-speed
```

### Check 9: Plugin Count
```
⚠️ WARNING: High Plugin Count (12 plugins)

WHY IT MATTERS:
Every plugin loads JavaScript on every page, even if unused on that page.

THE FIX:
1. Go to Plugins tab
2. Review each plugin - when did you last use it?
3. Uninstall unused plugins
4. Consider: can you replace plugin with native Bubble?
```

### Check 10: Workflow Trigger Density
```
⚠️ WARNING: 15 Workflow Triggers on This Page

WHY IT MATTERS:
Too many simultaneous triggers can cause "Workflows could not run" error.

THE FIX:
1. Consolidate similar triggers into one workflow with conditions
2. Use Custom Events to reuse logic instead of duplicating
3. Add conditions to triggers: "Only when [actually needed]"
```

---

## User Stories (For Later)

| ID | Title | Category |
|----|-------|----------|
| US-B01 | Add Deep Scan button to panel | ui |
| US-B02 | Create JSON upload/paste modal | ui |
| US-B03 | Implement JSON parser for Bubble structure | analysis |
| US-B04 | Implement Check 8: Search in RG cell | analysis |
| US-B05 | Implement Check 9: Plugin count | analysis |
| US-B06 | Implement Check 10: Workflow triggers | analysis |
| US-B07 | Implement Check 11: Advanced filters | analysis |
| US-B08 | Implement Check 12: Option set size | analysis |
| US-B09 | Merge JSON results with DOM results | scoring |
| US-B10 | Add JSON-check fixes to panel | ui |

---

## Success Criteria for Building Option B

Before building, Option A should have:
- [ ] 200+ Chrome Web Store installs
- [ ] 4.0+ star rating
- [ ] 3+ forum/Twitter mentions
- [ ] User requests for "deeper analysis"

If these aren't met after 4 weeks, Option A needs iteration, not expansion.

---

## Monetization Consideration

If Option B is built and valuable, this could become a paid tier:
- Free: DOM checks (Option A)
- Pro $29/mo: JSON deep scan (Option B)

But only consider this after proving free adoption.
