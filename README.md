# BubbleBoost

<div align="center">

**Performance analyzer for Bubble.io apps**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)](https://chrome.google.com/webstore)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green.svg)](https://developer.chrome.com/docs/extensions/mv3/)

**Real-time performance scoring for your Bubble apps. Find what's slowing you down.**

[Install Extension](#installation) · [How It Works](#how-it-works) · [Premium Features](#free-vs-premium)

</div>

---

## TL;DR

**The Problem**: Bubble apps with 1,000+ users often take 10-30 seconds to load. Developers spend $200-1,500/mo on upgrades or $50-200/hr on consultants, yet no dedicated performance tools exist.

**The Solution**: BubbleBoost analyzes your Bubble app in real-time, scores performance 0-100, identifies 15 common issues, and tells you exactly how to fix them.

### Why Use BubbleBoost?

| Feature | What It Does |
|---------|--------------|
| **Real-time Score** | 0-100 performance score updates as you edit |
| **15 Automated Checks** | Detects element bloat, nesting issues, query problems |
| **Severity Classification** | Critical, Warning, Info — know what to fix first |
| **Copy-Paste Fixes** | Actionable suggestions, not vague advice |
| **Zero Setup** | Works instantly on any Bubble editor page |

---

## Quick Example

1. Install from Chrome Web Store
2. Open your Bubble app editor
3. See your score immediately

```
┌─────────────────────────────────────┐
│  BubbleBoost                    72  │  ← Your performance score
├─────────────────────────────────────┤
│  2 Critical · 5 Warnings · 3 Info   │
├─────────────────────────────────────┤
│  ⛔ Element count: 247 (>200)       │
│     → Split into reusable elements  │
│                                     │
│  ⚠️ Repeating group nesting: 3      │
│     → Flatten to max 2 levels       │
│                                     │
│  ⚠️ Hidden elements loaded: 34      │
│     → Use conditions on group level │
└─────────────────────────────────────┘
```

---

## How It Works

BubbleBoost runs **15 rule-based checks** on your Bubble editor DOM:

| # | Check | Threshold |
|---|-------|-----------|
| 1 | Element count | Warn >100, Critical >200 |
| 2 | Repeating group nesting | Warn >2 levels |
| 3 | Visible elements on load | Warn >50 |
| 4 | Condition complexity | Warn >5 per element |
| 5 | Custom states | Warn >20 per page |
| 6 | Reusable element duplication | Warn >3 instances |
| 7 | Images without dimensions | Any = Warning |
| 8 | Dynamic text expressions | Info (count) |
| 9 | Hidden elements loaded | Warn >20 |
| 10 | Group nesting depth | Warn >5 levels |
| 11 | Floating groups | Warn >3 |
| 12 | Input validation complexity | Warn >3 rules/input |
| 13 | Large option sets | Warn >50 options |
| 14 | Plugin count | Warn >5 |
| 15 | Workflow triggers | Warn >10 per page |

**Scoring**: Start at 100. Critical issues deduct 10 points, warnings deduct 3 points. Same page = same score, every time.

---

## Installation

### Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store listing](#) *(coming soon)*
2. Click "Add to Chrome"
3. Open any Bubble editor page — BubbleBoost activates automatically

### From Source (Development)

```bash
git clone https://github.com/ProofOfReach/bubbleboost.git
cd bubbleboost
pnpm install
pnpm dev
```

Then load the `build/chrome-mv3-dev` folder as an unpacked extension in Chrome.

---

## Free vs Premium

| Feature | Free | Premium ($49/mo) |
|---------|:----:|:----------------:|
| Performance score (0-100) | ✅ | ✅ |
| 15 rule-based checks | ✅ | ✅ |
| Issue breakdown by severity | ✅ | ✅ |
| Generic fix suggestions | ✅ | ✅ |
| JSON deep analysis | ❌ | ✅ |
| PDF export for clients | ❌ | ✅ |
| AI-powered explanations | ❌ | ✅ *(future)* |

**Free tier is fully functional** — premium adds agency/consultant features.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                      │
├─────────────────────────────────────────────────────────┤
│  Content Script          │  Popup UI (React)            │
│  - DOM analysis          │  - Score display             │
│  - Network monitoring    │  - Issue panel               │
│  - Message passing       │  - Settings                  │
├─────────────────────────────────────────────────────────┤
│  Background Service Worker                               │
│  - Analytics dispatch    │  - License validation        │
│  - Storage management    │  - PDF generation            │
└─────────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐        ┌─────────────────┐
│    PostHog      │        │    Supabase     │
│   (Analytics)   │        │  (Auth/License) │
└─────────────────┘        └─────────────────┘
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| Extension Framework | [Plasmo](https://docs.plasmo.com/) |
| UI | React + Tailwind CSS |
| State | Zustand |
| PDF Generation | jsPDF (client-side) |
| Analytics | PostHog |
| Auth/License | Supabase |
| Payments | Stripe |

---

## Limitations

### What BubbleBoost Doesn't Do (Yet)

- **Auto-fix** — You apply fixes manually (we just tell you what to fix)
- **Historical tracking** — No trend analysis over time
- **Production monitoring** — Editor analysis only, not live apps
- **Multi-app dashboards** — One app at a time
- **Firefox/Edge** — Chrome only for MVP

### Known Constraints

| Constraint | Reason |
|------------|--------|
| DOM-based analysis only | Can't access Bubble's internal state |
| Editor pages only | Content script URL pattern limitation |
| No remote code execution | Chrome Manifest V3 policy |

---

## FAQ

### Why "BubbleBoost"?

Bubble apps need a boost. We boost them. Simple.

### Is my app data safe?

Yes. All analysis runs **locally in your browser**. No app data is sent to our servers. We only collect anonymous usage analytics (which checks you run, not what they find).

### Does it work with all Bubble apps?

Works on any app in the Bubble editor (`*.bubble.io/page*`, `*.bubble.io/version-*`). Does not analyze live/deployed apps.

### Can I use this for client work?

Absolutely. Premium tier includes PDF export specifically for sharing reports with clients.

### Why rule-based instead of AI?

Deterministic rules = consistent scores. Same page always gets the same score. AI explanations are planned for premium tier.

---

## Troubleshooting

### Extension not activating on Bubble editor

**Cause:** URL doesn't match expected pattern.

**Solution:** Make sure you're on a page like `myapp.bubble.io/page/index` or `myapp.bubble.io/version-test/page/index`.

### Score not updating after changes

**Cause:** Debounce timer (2 seconds) hasn't elapsed.

**Solution:** Wait 3 seconds after making changes. Score updates automatically.

### "Premium feature" message on free tier

**Cause:** You clicked a premium-only feature.

**Solution:** Upgrade to premium, or use the free alternatives (all 15 checks are free).

### Still having issues?

1. Check [existing issues](https://github.com/ProofOfReach/bubbleboost/issues)
2. Open a [new issue](https://github.com/ProofOfReach/bubbleboost/issues/new)

---

## Contributing

We welcome contributions! See our development setup:

```bash
git clone https://github.com/ProofOfReach/bubbleboost.git
cd bubbleboost
pnpm install
pnpm dev        # Development mode with hot reload
pnpm build      # Production build
pnpm test       # Run tests
pnpm lint       # Lint code
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built for the Bubble community**

[Report Bug](https://github.com/ProofOfReach/bubbleboost/issues) · [Request Feature](https://github.com/ProofOfReach/bubbleboost/issues) · [Get Premium](#free-vs-premium)

</div>
