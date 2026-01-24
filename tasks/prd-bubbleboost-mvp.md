[PRD]
# BubbleBoost MVP - Product Requirements Document

**Created**: 2026-01-24
**Status**: Draft
**Owner**: Product/Engineering
**Clarity Score**: 88/100

---

## 1. Overview

### Problem Statement
Bubble founders and agencies whose apps have hit 1,000+ users suffer from apps taking 10-30 seconds to load. This directly impacts revenue, user retention, and client satisfaction. They currently spend $200-1,500/mo on upgraded Bubble plans or $50-200/hr on consultants, yet zero dedicated performance tools exist despite 50+ forum threads monthly about slow apps.

**Research/Evidence**: Forum.bubble.io analysis, "Bubble performance" search volume up 340% in 24 months

### Goals
1. Deliver real-time performance scoring (0-100) for Bubble apps in the editor
2. Identify 15+ common performance issues with severity classification
3. Provide actionable fix suggestions with copy-paste solutions
4. Convert free users to premium tier at 5%+ rate within 90 days
5. Achieve 200 installs, 50 active weekly users in first 4 weeks

### Non-Goals (Out of Scope)
- Auto-fix implementation (user must apply fixes manually)
- Historical tracking and trend analysis
- Team collaboration features
- API for CI/CD integration
- Mobile performance testing
- Multi-app dashboards
- Automated Bubble editor modifications
- Performance monitoring of live/production apps (editor only for MVP)

---

## 2. Quality Gates

> Commands that MUST pass for every user story in this PRD.

```bash
npm run lint
npm run type-check
npm run test
npm run build
```

---

## 3. User Stories

### US-001: Install and Activate Extension

**Research Backing**: Chrome Web Store standard flow - validated pattern

**As a** Bubble developer
**I want** to install BubbleBoost from the Chrome Web Store with one click
**So that** I can start analyzing my apps without complex setup

**Acceptance Criteria:**
- [ ] Extension available in Chrome Web Store (Manifest V3 compliant)
- [ ] Extension icon appears in Chrome toolbar after install
- [ ] Extension auto-detects when user opens Bubble editor (*.bubble.io/page*)
- [ ] Badge shows "Active" state when on Bubble editor pages
- [ ] Badge shows "Inactive" state on non-Bubble pages
- [ ] No permissions requested beyond activeTab and storage

**Priority**: P0 (Must Have)

---

### US-002: View Performance Score Overlay

**Research Backing**: Lighthouse/PageSpeed patterns - proven UI for performance metrics

**As a** Bubble developer viewing my app in the editor
**I want** to see a real-time 0-100 performance score
**So that** I instantly understand my app's health at a glance

**Acceptance Criteria:**
- [ ] Floating badge displays in bottom-right corner of Bubble editor
- [ ] Score updates within 3 seconds of page/element changes
- [ ] Score color-coded: Green (80-100), Yellow (50-79), Red (0-49)
- [ ] Clicking badge opens detailed panel
- [ ] Badge is draggable to reposition
- [ ] Badge can be minimized to icon-only mode
- [ ] Score persists during editor navigation (same app)

**Priority**: P0 (Must Have)

---

### US-003: Run DOM-Based Performance Checks

**Research Backing**: Bubble forum pain points - specific issues validated

**As a** Bubble developer
**I want** the extension to analyze my app's DOM and detect performance issues
**So that** I know exactly what's slowing down my app

**Acceptance Criteria:**
- [ ] Extension runs 15 rule-based checks on current page:
  1. Element count per page (warn >100, critical >200)
  2. Repeating group nesting depth (warn >2 levels)
  3. Visible elements on page load (warn >50)
  4. Condition complexity (warn >5 conditions per element)
  5. Custom states count (warn >20 per page)
  6. Reusable element duplication (warn if same reusable >3x)
  7. Image elements without dimension constraints
  8. Text elements with dynamic expressions (count)
  9. Hidden elements loaded on page (count)
  10. Group nesting depth (warn >5 levels)
  11. Floating group count (warn >3)
  12. Input validation complexity
  13. Option set usage (large option sets)
  14. Plugin count on page (warn >5)
  15. Workflow trigger density (warn >10 per page)
- [ ] Each check returns: pass/warn/critical status
- [ ] Each check includes element count affected
- [ ] Checks complete within 5 seconds of page load
- [ ] Results cached until page changes

**Priority**: P0 (Must Have)

---

### US-004: View Issue Breakdown Panel

**Research Backing**: ASSUMPTION - standard UX for diagnostic tools (Lighthouse, ESLint)

**As a** Bubble developer
**I want** to see all detected issues organized by severity
**So that** I can prioritize which problems to fix first

**Acceptance Criteria:**
- [ ] Panel groups issues by severity: Critical (red), Warning (yellow), Info (blue)
- [ ] Each issue shows: title, affected element count, impact description
- [ ] Issues sorted by impact within each severity group
- [ ] Clicking issue scrolls/highlights affected elements in editor (if possible)
- [ ] Panel shows total counts: "3 Critical, 7 Warnings, 2 Info"
- [ ] Panel includes overall score breakdown by category
- [ ] Panel has search/filter for specific issue types

**Priority**: P0 (Must Have)

---

### US-005: View Fix Suggestions

**Research Backing**: Bubble forum solutions - common fixes validated

**As a** Bubble developer
**I want** to see specific fix suggestions for each issue
**So that** I know exactly how to resolve performance problems

**Acceptance Criteria:**
- [ ] Each issue includes "How to Fix" section
- [ ] Fix suggestions are copy-paste ready where applicable
- [ ] Suggestions show before/after comparison (text description)
- [ ] Suggestions link to relevant Bubble documentation (external)
- [ ] Generic templates provided (not AI-generated in free tier)
- [ ] Each suggestion includes estimated impact: High/Medium/Low

**Priority**: P0 (Must Have)

---

### US-006: Monitor Network Requests

**Research Backing**: Performance best practices - validated diagnostic approach

**As a** Bubble developer
**I want** the extension to monitor API calls and data loading
**So that** I can identify slow database queries and API bottlenecks

**Acceptance Criteria:**
- [ ] Extension intercepts network requests to Bubble backend
- [ ] Tracks: request count, total data transferred, slowest requests
- [ ] Flags queries returning >100 rows as warnings
- [ ] Flags API calls taking >2 seconds as warnings
- [ ] Shows request timeline visualization
- [ ] Groups requests by type: database, workflow, external API
- [ ] Identifies duplicate/redundant requests

**Priority**: P1 (Should Have)

---

### US-007: Analyze JSON Export (Premium Prep)

**Research Backing**: ASSUMPTION - JSON export contains full app structure

**As a** Bubble developer
**I want** to export my app JSON and get deeper analysis
**So that** I can find issues not visible in the editor DOM

**Acceptance Criteria:**
- [ ] UI provides "Deep Scan" button (grayed out for free tier)
- [ ] Clicking shows upgrade prompt for premium tier
- [ ] Premium users can upload JSON file
- [ ] Analysis runs client-side parsing (no LLM in v1)
- [ ] Detects: privacy rule complexity, backend workflow count, database structure issues
- [ ] Results integrated into main issue panel

**Priority**: P1 (Should Have)

---

### US-008: Export PDF Report (Premium)

**Research Backing**: Agency use case - validated need for client deliverables

**As a** Bubble agency developer
**I want** to export a professional PDF report of the analysis
**So that** I can share findings with clients and stakeholders

**Acceptance Criteria:**
- [ ] Export button visible (locked for free tier with upgrade prompt)
- [ ] PDF includes: overall score, issue breakdown, fix recommendations
- [ ] PDF branded with BubbleBoost logo (white-label in Scale tier - future)
- [ ] PDF includes timestamp and app name
- [ ] PDF generated client-side (no server required)
- [ ] PDF under 5MB file size

**Priority**: P1 (Should Have)

---

### US-009: Manage Free vs Premium Features

**Research Backing**: Freemium SaaS standard - validated model

**As a** BubbleBoost user
**I want** clear visibility into free vs premium features
**So that** I understand the value of upgrading

**Acceptance Criteria:**
- [ ] Free tier includes: score, 15 checks, issue breakdown, generic fixes
- [ ] Premium indicators (lock icon) on: PDF export, JSON deep scan, AI explanations
- [ ] Upgrade prompts are non-intrusive (shown only when accessing premium features)
- [ ] "Upgrade" button links to Stripe checkout
- [ ] Premium status stored in extension storage after purchase
- [ ] License validation on extension load (check Supabase)

**Priority**: P0 (Must Have)

---

### US-010: Track Analytics

**Research Backing**: Product validation requirement - standard practice

**As a** BubbleBoost product owner
**I want** to track usage analytics
**So that** I can validate product-market fit and iterate

**Acceptance Criteria:**
- [ ] PostHog integration captures: installs, active sessions, feature usage
- [ ] Events tracked: scan_started, scan_completed, issue_clicked, fix_viewed, upgrade_clicked
- [ ] No PII collected (anonymous user IDs only)
- [ ] Analytics respect Do Not Track browser setting
- [ ] Dashboard shows: DAU, feature adoption, conversion funnel

**Priority**: P1 (Should Have)

---

## 4. Functional Requirements

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| FR-001 | Extension detects Bubble editor | URL pattern match: `*.bubble.io/page*`, `*.bubble.io/version-*` | P0 |
| FR-002 | DOM analysis runs automatically | Analysis triggers on page load and element changes (debounced 2s) | P0 |
| FR-003 | Score calculation is deterministic | Same page state = same score, every time | P0 |
| FR-004 | Extension works offline | Core features function without internet (except premium validation) | P0 |
| FR-005 | State persists across sessions | Last scan results cached in extension storage | P1 |
| FR-006 | Extension doesn't modify Bubble | Read-only access, no DOM mutations in Bubble editor | P0 |
| FR-007 | Graceful degradation | If a check fails, continue with others; show partial results | P0 |

---

## 5. Technical Considerations

### Architecture

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

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Extension Framework | Plasmo | Modern DX, TypeScript, React support |
| UI | React + Tailwind | Fast development, consistent styling |
| State | Zustand | Lightweight, TypeScript-friendly |
| PDF Generation | jsPDF | Client-side, no server needed |
| Analytics | PostHog | Free tier generous, privacy-friendly |
| Auth/License | Supabase | Free tier, easy setup |
| Payments | Stripe | Industry standard |

### Constraints
- Must comply with Manifest V3 requirements
- No remote code execution (Chrome policy)
- Content scripts cannot access Bubble's internal state directly
- Must not trigger Bubble's security measures

### Performance Requirements
- Extension popup loads in <500ms
- DOM analysis completes in <5s for typical apps
- Network monitoring adds <50ms latency
- Memory usage <50MB

---

## 6. Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Chrome Web Store Installs | 200 in 4 weeks | Chrome Developer Dashboard |
| Weekly Active Users | 50 in 4 weeks | PostHog events |
| Scan Completion Rate | >80% | PostHog funnel |
| Average Session Duration | >3 minutes | PostHog |
| Free-to-Premium Conversion | 5% | Stripe + PostHog |
| Chrome Web Store Rating | 4.5+ stars | Chrome Web Store |
| Support Tickets | <10/week | Email/Discord |

---

## 7. Dependencies

| Dependency | Type | Status | Owner |
|------------|------|--------|-------|
| Chrome Web Store Developer Account | External | Ready | Product |
| Supabase Project | Technical | To Create | Engineering |
| Stripe Account | External | Ready | Product |
| PostHog Account | External | To Create | Engineering |
| Plasmo CLI | Technical | Available | Engineering |

---

## 8. Assumptions Log

| ID | Assumption | Risk Level | Validation Plan |
|----|------------|------------|-----------------|
| A-001 | Bubble editor DOM is stable enough to scrape | Medium | Test on 10 different apps during beta |
| A-002 | Users will accept rule-based suggestions without AI | Medium | Beta user feedback, track fix_viewed rates |
| A-003 | 15 checks cover 80% of common issues | Medium | Bubble forum analysis, beta feedback |
| A-004 | $49/mo is acceptable price point | Medium | Price testing during beta |
| A-005 | Network request interception works reliably | Low | Chrome API well-documented |
| A-006 | PDF export is valuable enough for premium | Medium | Track upgrade clicks from PDF prompt |

---

## 9. Open Questions

- [ ] Should we support Firefox/Edge in v1.1? (Chrome-first for MVP)
- [ ] What's the exact URL pattern for all Bubble editor variations?
- [ ] Do we need terms of service acceptance in extension?
- [ ] Should free tier have usage limits (scans per day)?

---

## 10. Appendix

### Glossary
- **Repeating Group**: Bubble's list/table component that renders data dynamically
- **Custom State**: Temporary variable stored in browser memory
- **Reusable Element**: Bubble's component system for shared UI pieces
- **Option Set**: Bubble's equivalent to enums/dropdowns
- **Backend Workflow**: Server-side automation in Bubble

### 15 Performance Checks Detail

| # | Check Name | What It Detects | Threshold |
|---|------------|-----------------|-----------|
| 1 | Element Count | Total elements on page | Warn >100, Critical >200 |
| 2 | Repeating Group Nesting | Nested RGs cause N+1 queries | Warn >2 levels |
| 3 | Visible Elements on Load | Elements not hidden/collapsed | Warn >50 |
| 4 | Condition Complexity | Conditions per element | Warn >5 per element |
| 5 | Custom States | States on page | Warn >20 |
| 6 | Reusable Duplication | Same reusable used multiple times | Warn >3 instances |
| 7 | Image Dimensions | Images without width/height | Any = Warning |
| 8 | Dynamic Text | Text with expressions | Info only (count) |
| 9 | Hidden Elements | Hidden but loaded | Warn >20 |
| 10 | Group Nesting | Deep nesting affects layout | Warn >5 levels |
| 11 | Floating Groups | Performance-heavy overlays | Warn >3 |
| 12 | Input Validation | Complex validation rules | Warn >3 rules/input |
| 13 | Option Sets | Large option sets loaded | Warn >50 options |
| 14 | Plugin Count | Plugins add bloat | Warn >5 |
| 15 | Workflow Triggers | Too many triggers | Warn >10 per page |

### References
- [Bubble Performance Best Practices](https://bubble.io/blog/bubble-app-performance/)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Plasmo Framework](https://docs.plasmo.com/)

[/PRD]
