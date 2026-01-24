# BubbleBoost - Ralph Loop Instructions

## Your Task

1. Read `prd.json` in this directory
2. Check you're on branch `ralph/bubbleboost-mvp` (create from main if not)
3. Pick the highest priority story where `passes: false`
4. Implement that single story
5. Run validation steps from the story
6. If checks pass, commit: `feat: [Story ID] - [Story Title]`
7. Update prd.json to set `passes: true`

## Quality Gates

```bash
pnpm run type-check
pnpm run build
```

## Project Context

Free Chrome extension for Bubble.io performance analysis:
- Plasmo + TypeScript + React + Tailwind
- 7 DOM-based checks with actionable fixes
- No backend, no AI, no monetization

## The 7 Checks

1. Element count (>200 warn, >500 critical)
2. RG nesting depth (>1 warn, >2 critical)
3. Visible elements on load (>50 warn)
4. Hidden but loaded (>20 warn)
5. Images without dimensions (any = warn)
6. RG cell element count (>5 = warn)
7. Group nesting depth (>5 warn)

## What NOT to Build

- JSON export / deep scan (Option B - later)
- Premium features or paywalls
- Backend services
- Analytics or tracking

## Stop Condition

When ALL stories have `passes: true`:
```
LOOP_COMPLETE
```
