<div align="center">

<img src="assets/logo.png" alt="BubbleBoost" height="48" />

**Free performance analyzer for Bubble.io apps**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)

Real-time performance scoring. Find what's slowing your Bubble app down.

[Install](#installation) · [The 7 Checks](#the-7-checks) · [Contributing](#contributing)

</div>

---

## TL;DR

**The Problem**: Bubble.io apps frequently suffer 8-15 second load times. Nested repeating groups, too many elements, and hidden bloat are common causes—but there's no dedicated tool to find them.

**The Solution**: BubbleBoost analyzes your Bubble editor DOM in real-time, scores performance 0-100, and shows you exactly what to fix.

### Why BubbleBoost?

| Feature | What It Does |
|---------|--------------|
| **Real-time Score** | 0-100 score updates as you edit, with delta tracking (+12 pts) |
| **7 Targeted Checks** | Catches the issues that actually slow Bubble apps |
| **Actionable Fixes** | Copy-paste solutions, not vague advice |
| **Element Highlighting** | Click an issue → see exactly which element to fix |
| **Zero Setup** | Works instantly on any Bubble editor page |

---

## Quick Example

```
┌─────────────────────────────────────┐
│  BubbleBoost                  78    │  ← Score (green = good)
│                              +12    │  ← Improved since last check
├─────────────────────────────────────┤
│  1 Critical · 3 Warnings            │
├─────────────────────────────────────┤
│  ⛔ RG nesting: 3 levels            │  ← Click to highlight
│     Best practice: max 1 level      │
│     → Use hidden RG pattern         │
│                                     │
│  ⚠️ Element count: 247              │
│     Best practice: under 200        │
│     → Split into reusable elements  │
└─────────────────────────────────────┘
```

---

## The 7 Checks

| # | Check | Threshold | What to Fix |
|---|-------|-----------|-------------|
| 1 | **Element count** | >200 warn, >500 critical | Split into reusable elements |
| 2 | **RG nesting depth** | >1 warn, >2 critical | Use hidden RG pattern |
| 3 | **Visible on load** | >50 warn, >100 critical | Set "visible on page load" = NO |
| 4 | **Hidden but loaded** | >20 warn | Add "only when visible" condition |
| 5 | **Images no dimensions** | Any = warn | Set fixed width/height |
| 6 | **RG cell elements** | >5 per cell = warn | Keep 3-5 elements max |
| 7 | **Group nesting** | >5 warn, >8 critical | Flatten or extract to reusable |

**Why these 7?** They're DOM-detectable AND have clear, actionable fixes. We excluded custom states (they actually help performance), floating groups (no clear fix), and plugins/workflows (not in DOM).

---

## Installation

### Chrome Web Store

*Coming soon*

### From Source (Development)

```bash
git clone https://github.com/ProofOfReach/bubbleboost.git
cd bubbleboost
pnpm install
pnpm dev
```

Load `build/chrome-mv3-dev` as an unpacked extension in Chrome.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                      │
├─────────────────────────────────────────────────────────┤
│  Content Script          │  Popup UI (React)            │
│  - DOM analysis          │  - Score display             │
│  - 7 performance checks  │  - Issue panel               │
│  - Element highlighting  │  - Delta tracking            │
├─────────────────────────────────────────────────────────┤
│  Background Service Worker                               │
│  - Badge updates         │  - Storage management        │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | [Plasmo](https://docs.plasmo.com/) |
| UI | React + Tailwind CSS |
| State | Zustand + chrome.storage |
| Manifest | V3 |

No backend. No AI. No tracking. Everything runs locally in your browser.

---

## Limitations

### What BubbleBoost Doesn't Do

- **JSON deep scan** — Can't detect search-in-RG-cell (the #1 performance killer). Planned for v2.
- **Plugin/workflow analysis** — Not visible in DOM
- **Production monitoring** — Editor analysis only
- **Auto-fix** — Shows you what to fix, you apply it manually

### Known Constraints

| Constraint | Reason |
|------------|--------|
| Editor pages only | Content script URL pattern |
| Chrome only | MVP scope |
| DOM-based analysis | Can't access Bubble internals |

---

## FAQ

### Is my data safe?

Yes. All analysis runs locally in your browser. No data is sent anywhere.

### Does it work with all Bubble apps?

Works on any app in the Bubble editor (`*.bubble.io/page*`, `*.bubble.io/version-*`).

### Why rule-based instead of AI?

Deterministic rules = consistent scores. Same page always gets the same score.

### What's coming in v2?

JSON export deep scan to catch search-in-RG-cell (N+1 queries) and other issues invisible to DOM analysis.

---

## Contributing

```bash
git clone https://github.com/ProofOfReach/bubbleboost.git
cd bubbleboost
pnpm install
pnpm dev          # Development with hot reload
pnpm build        # Production build
pnpm type-check   # TypeScript validation
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built for the Bubble community**

[Report Bug](https://github.com/ProofOfReach/bubbleboost/issues) · [Request Feature](https://github.com/ProofOfReach/bubbleboost/issues)

</div>
