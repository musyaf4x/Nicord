# Branch Protection Setup Guide

## Branch Strategy

```
main          ← production releases (tag on merge)
├── develop   ← integration branch (all features merge here first)
│   ├── feat/s1-foundation
│   ├── feat/s2-core-order
│   ├── feat/s3-payment-stock
│   ├── feat/s4-finance-reports
│   └── feat/s5-polish
├── fix/*     ← bug fixes (merge to develop, hotfix to main)
├── chore/*   ← tooling, deps, config
└── hotfix/*  ← critical prod fixes (merge to main AND develop)
```

## Branch Rules (configure on GitHub)

### `main` — Protected
- ✅ Require PRs (no direct push)
- ✅ Require CI to pass (ci.yml: lint + typecheck + build)
- ✅ Require 1 review (or 0 for solo dev)
- ✅ Dismiss stale reviews on push
- ✅ Enforce for admins

### `develop` — Protected  
- ✅ Require PRs
- ✅ Require CI to pass
- ❌ No review required (solo dev)
- ✅ Delete head branch on merge

## Commit Convention (Conventional Commits)

```
feat:     new feature
fix:      bug fix
chore:    tooling, config, deps
docs:     documentation
test:     tests
refactor: code change without feature/fix
perf:     performance improvement
ci:       CI/CD changes
style:    formatting, semicolons, etc.
```

Examples:
```
feat(auth): add login and register pages
feat(orders): implement order creation form
fix(stock): correct stock deduction on cancel
chore(deps): upgrade prisma to 5.15
ci: add docker build step to deploy workflow
```

## PR Naming

```
feat/s1-auth → develop: "feat: Sprint 1 - Auth & Profil Usaha"
fix/order-total → develop: "fix: Incorrect grand total calculation with discount"
develop → main: "release: Sprint 1 - Foundation complete"
hotfix/critical-bug → main: "hotfix: Fix order number collision"
```

## GitHub Secrets Required

For `deploy.yml` to work, set these in GitHub → Settings → Secrets:

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | IP or hostname of VPS |
| `VPS_USER` | SSH user (e.g. `deploy` or `ubuntu`) |
| `VPS_SSH_KEY` | Private SSH key for VPS access |

And these in GitHub → Settings → Variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Production URL (e.g. `https://nicord.app`) |

Production secrets (DATABASE_URL, NEXTAUTH_SECRET, etc.) are set directly on VPS in `/opt/nicord/.env`, not in GitHub Secrets.

## VPS Deployment Setup (one-time)

```bash
# On VPS
mkdir -p /opt/nicord
cd /opt/nicord
# Copy docker-compose.yml from repo
# Create .env from .env.example and fill in values
# Pull initial image and start
docker compose up -d
```
