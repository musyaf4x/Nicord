<!-- VORTH:START -->
# Vorth Active

This repository has opted into Vorth.

Before planning, coding, debugging, reviewing, or committing in this repo:
1. Read `.vorth/context.md`.
2. Follow `.vorth/instructions/stack-routing.md`.
3. Follow `.vorth/instructions/superpowers-ecc.md`.
4. Follow `.vorth/instructions/codegraph.md` when CodeGraph is enabled.
5. Follow `.vorth/instructions/ponytail.md` before editing when Ponytail is enabled.
6. Follow `.vorth/instructions/rtk.md` for noisy shell output when RTK is enabled or available.
7. Follow `.vorth/instructions/impeccable.md` for frontend/UI work.
8. Follow `.vorth/instructions/layers.md` when product/UX decisions are unclear.
9. Follow `.vorth/instructions/caveman.md` only for compact subagent or handoff reports.
10. Update `.vorth/context.md` after meaningful work.

Codex loads AGENTS.md at session start. After `/vorth init`, restart Codex or open a new thread for automatic activation.

The Agy Native Bridge is Antigravity-only. Codex must ignore it.
<!-- VORTH:END -->

<!-- ASTRYX:START -->
Astryx v0.1.1 · 148 components
CLI: run every command as `npx astryx <cmd>` (shown below as `astryx ...`).

SETUP (once, in your app entry e.g. main.tsx) — without these, components render unstyled:
  import "@astryxdesign/core/reset.css";
  import "@astryxdesign/core/astryx.css";

WORKFLOW — discover, don't guess. Before writing UI:
1. `astryx build "<idea>"` — START HERE: returns a kit (closest [page] + [block]s + [component]s). No args = full playbook.
2. `astryx template <name> [--skeleton]` — scaffold the [page]/[block]s it named, or study their layout. Templates are reference code.
3. `astryx component <Name>` — props + examples for every component you use.

RULES:
- No <div> — components do all layout/spacing. Full page → AppShell; sidebar nav → SideNav.
- Custom styling: component props first; else style/className with tokens — var(--color-*|--spacing-*|--radius-*). No raw hex/px. (No StyleX/Tailwind compiler here — don't use xstyle/utility classes.)
- Tokens for every value (`astryx docs tokens`). Brand/accent via `astryx theme` — never override --color-* in :root.

MORE CLI:
  search "<query>"   find any component / hook / doc / template / block
  component --list   148 components by category
  template --list    page + block recipes
  docs <topic>       color, elevation, icons, illustrations, migration, motion, principles, shape, spacing, styling, theme, tokens, typography
  swizzle <Name>     eject component source (--gap reports why)
  upgrade --apply    run after any @astryxdesign/core bump
<!-- ASTRYX:END -->
