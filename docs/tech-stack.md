# Nicord — Tech Stack Decision

**Date:** 2026-06-30  
**Status:** Proposed — needs owner confirmation before sprint 1

---

## 1. Constraint

- Mobile-first PWA
- Tim kecil / solo developer
- UMKM audience: HP mid-range, koneksi tidak selalu stabil
- Stack harus bisa move fast untuk MVP
- Design system sudah ditentukan: **Astryx Design System** (installed)

---

## 2. Stack Decision

### Frontend

| Layer | Pilihan | Alasan |
|-------|---------|--------|
| Framework | **Next.js 14 (App Router)** | SSR/SSG untuk performa, file-based routing, mudah deploy |
| Language | **TypeScript** | Type safety, ECC typescript-reviewer tersedia |
| Design System | **Astryx Design System v0.1.1** | Sudah installed, 148 components, token-based theming |
| Theme | **@astryxdesign/theme-neutral** | Sudah installed |
| PWA | **next-pwa** atau **@ducanh2912/next-pwa** | Service worker, offline cache |
| State | **Zustand** | Ringan, mudah, cocok untuk state lokal |
| Server state | **TanStack Query v5** | Cache, optimistic updates, error handling |
| Form | **React Hook Form + Zod** | Validasi, type-safe schema |
| Date | **date-fns** | Ringan, tree-shakeable |
| Export | **react-pdf** (PDF) + native CSV | Invoice PDF + laporan CSV |

### Backend

| Layer | Pilihan | Alasan |
|-------|---------|--------|
| Backend | **Next.js API Routes / Route Handlers** | Monorepo sederhana, tidak perlu server terpisah untuk MVP |
| ORM | **Prisma** | Type-safe, migration workflow, generate client |
| Database | **PostgreSQL** | Relasional, cocok untuk schema terstruktur ini |
| Auth | **NextAuth.js v5 (Auth.js)** | Credential provider, extensible, session management |
| File storage | **Supabase Storage** (atau Cloudinary) | Foto produk, bukti bayar — S3-compatible |
| Email | **Resend** | Invite staff, reset password |

### Infrastructure

| Layer | Pilihan | Alasan |
|-------|---------|--------|
| Deploy | **Vercel** | Next.js native, preview deploys, free tier MVP |
| DB Host | **Supabase** (PostgreSQL) | Managed Postgres, backup otomatis, free tier kuat |
| DB alternative | **Railway** | Jika butuh lebih kontrol, mudah scale |
| Storage | **Supabase Storage** | Terintegrasi dengan DB host |
| Monitoring | **Sentry** (free tier) | Error tracking produksi |

---

## 3. Project Structure

```
umkm/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes group
│   │   ├── login/
│   │   ├── register/
│   │   └── onboarding/
│   ├── (dashboard)/              # Protected routes
│   │   ├── dashboard/
│   │   ├── orders/
│   │   │   ├── page.tsx          # Order list
│   │   │   ├── new/              # Buat order
│   │   │   └── [id]/             # Detail order
│   │   ├── products/
│   │   ├── customers/
│   │   ├── payments/
│   │   ├── expenses/
│   │   ├── stock/
│   │   ├── reports/
│   │   │   ├── sales/
│   │   │   └── cashflow/
│   │   └── settings/
│   ├── api/                      # Route handlers (API)
│   │   ├── auth/
│   │   ├── orders/
│   │   ├── products/
│   │   ├── customers/
│   │   ├── payments/
│   │   ├── expenses/
│   │   ├── stock/
│   │   └── reports/
│   ├── layout.tsx                # Root layout + Theme provider
│   └── globals.css
├── components/                   # Shared components
│   ├── ui/                       # Astryx wrappers / custom composites
│   ├── forms/                    # Form components
│   ├── tables/                   # Table views
│   └── charts/                   # Dashboard charts
├── lib/                          # Utilities
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # Auth.js config
│   ├── validations/              # Zod schemas
│   │   ├── order.ts
│   │   ├── product.ts
│   │   └── ...
│   └── utils/
│       ├── currency.ts           # Format Rupiah
│       ├── order-number.ts       # Generate ORD-YYYYMMDD-XXXX
│       └── wa-template.ts        # WhatsApp message template
├── store/                        # Zustand stores
│   ├── ui.ts
│   └── filters.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── manifest.json             # PWA manifest
│   └── icons/
├── docs/                         # Project docs
│   ├── PRD.md
│   ├── tech-stack.md
│   ├── schema.md
│   └── backlog.md
├── package.json
├── next.config.ts
├── tsconfig.json
└── .env.example
```

---

## 4. Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "typescript": "^5.x",
    "@astryxdesign/core": "^0.1.1",
    "@astryxdesign/theme-neutral": "^0.1.1",
    "@prisma/client": "^5.x",
    "next-auth": "^5.x",
    "@tanstack/react-query": "^5.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "zustand": "^4.x",
    "date-fns": "^3.x",
    "@react-pdf/renderer": "^3.x",
    "bcryptjs": "^2.x",
    "resend": "^3.x"
  },
  "devDependencies": {
    "prisma": "^5.x",
    "@astryxdesign/cli": "^0.1.1",
    "@types/bcryptjs": "^2.x"
  }
}
```

---

## 5. Environment Variables

```env
# App
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://...

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email
RESEND_API_KEY=

# App config
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOW_STOCK_THRESHOLD=5
```

---

## 6. Astryx Integration Notes

Semua layout menggunakan Astryx components — **no raw `<div>` untuk layout**.

Entry point setup:
```tsx
// app/layout.tsx
import "@astryxdesign/core/reset.css";
import "@astryxdesign/core/astryx.css";
import { Theme } from "@astryxdesign/core";
import { neutralTheme } from "@astryxdesign/theme-neutral";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Theme theme={neutralTheme} mode="system">
          {children}
        </Theme>
      </body>
    </html>
  );
}
```

Discover before building:
```bash
npx astryx build "order management dashboard mobile"
npx astryx build "form input multi product order"
npx astryx build "financial report table mobile"
```
