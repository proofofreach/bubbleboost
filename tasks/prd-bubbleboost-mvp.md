# BubbleBoost MVP - Product Requirements Document

**Created:** 2026-01-24
**Updated:** 2026-01-24
**Status:** Ready for build
**Type:** Free Community Tool (Option A: DOM-only)

---

## Overview

### Problem Statement
Bubble.io apps frequently suffer 8-15 second load times. Forum complaints cite nested repeating groups, too many elements, and hidden bloat as causes. No dedicated diagnostic tool exists despite 50+ monthly forum threads.

### Solution
Free Chrome extension that analyzes Bubble editor DOM in real-time, surfaces 7 performance issues with actionable fixes.

### Goals
1. Real-time 0-100 performance score
2. 7 DOM-detectable checks with clear fixes
3. 200 installs in 4 weeks
4. Build reputation in no-code community

### Non-Goals (Option B - saved for later)
- JSON export deep scan
- Search-in-RG-cell detection
- Plugin/workflow analysis
- Any backend or monetization

---

## The 7 Checks

| # | Check | Threshold | Impact |
|---|-------|-----------|--------|
| 1 | Element count | >200 warn, >500 critical | High |
| 2 | RG nesting depth | >1 warn, >2 critical | Critical |
| 3 | Visible elements on load | >50 warn, >100 critical | High |
| 4 | Hidden but loaded | >20 warn | Medium |
| 5 | Images without dimensions | Any = warn | Medium |
| 6 | RG cell element count | >5 per cell = warn | High |
| 7 | Group nesting depth | >5 warn, >8 critical | Medium |

### Why These 7?

**Included:** DOM-detectable + clear actionable fix exists
**Excluded:** Custom states (actually help performance), floating groups (no clear fix), plugins/workflows (not in DOM)

---

## Fix Templates

Each check includes copy-paste-ready fix guidance:

### Check 1: Element Count
```
Convert repeated groups → Reusable Elements
Add pagination (show 10-20 items, not 100+)
Use "collapse when hidden" on conditional elements
```

### Check 2: RG Nesting (THE CRITICAL ONE)
```
1. Add HIDDEN RG that searches ALL child data once
2. In nested cells, FILTER hidden RG instead of searching
Result: N queries → 1 query
📚 docs.airdev.co/bubble-development-guide/steps/develop/optimize-speed
```

### Check 3: Visible Elements
```
Set "visible on page load" = NO for below-fold content
Add condition: "Only when [parent] is visible"
Use tabs/accordions for secondary content
```

### Check 4: Hidden But Loaded
```
Add condition to data source:
"Do a search (only when this group is visible)"
```

### Check 5: Images Without Dimensions
```
Set fixed width/height on Image element
Or use "fixed aspect ratio" setting
Prevents layout shift
```

### Check 6: RG Cell Elements
```
Keep 3-5 elements per cell max
Use text concatenation instead of multiple texts
Hide secondary actions until hover
```

### Check 7: Group Nesting
```
Flatten hierarchy where possible
Extract deep nesting into Reusable Elements
```

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Plasmo |
| UI | React + Tailwind |
| State | Zustand + chrome.storage |
| Manifest | V3 |

No backend. No AI. No external services.

---

## User Stories Summary

17 stories across categories:
- **setup (1):** Project init
- **state (1):** Zustand store
- **detection (1):** Bubble editor detection
- **ui (5):** Badge, panel, popup, fixes display
- **analysis (8):** 7 checks + auto-analysis
- **scoring (1):** Score calculation
- **release (1):** Final build

Full details in `prd.json`.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Chrome Web Store installs | 200 in 4 weeks |
| Rating | 4.0+ stars |
| GitHub stars | 50 |

---

## Future: Option B

If Option A succeeds (200+ installs, positive feedback), expand with JSON export deep scan. See `tasks/prd-option-b-deep-scan.md`.

Option B would add:
- Search-in-RG-cell detection (N+1 query problem)
- Plugin count analysis
- Workflow trigger density
- Advanced filter detection

But **only build after Option A proves value**.
