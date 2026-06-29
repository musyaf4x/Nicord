# Nicord — Development Backlog

**Date:** 2026-06-30  
**Format:** Sprint-ready user stories dengan acceptance criteria

---

## Sprint 1 — Foundation (Week 1-2)
**Goal:** User bisa register, buat profil usaha, tambah produk dan pelanggan.

---

### S1-01 — Project Setup
**Type:** Chore  
**Effort:** M

**Tasks:**
- [ ] Init Next.js 14 dengan TypeScript (`npx create-next-app@latest`)
- [ ] Setup Astryx: import `reset.css` + `astryx.css` di `app/layout.tsx`, wrap `<Theme>`
- [ ] Setup Prisma + PostgreSQL (Supabase)
- [ ] Setup NextAuth.js v5 (credential provider)
- [ ] Setup TanStack Query provider
- [ ] Setup Zustand
- [ ] Setup `.env.example`
- [ ] Commit initial scaffold

**Done when:** `npm run dev` jalan, DB connected, Prisma client generated.

---

### S1-02 — Auth: Register & Login
**Type:** Feature | **Priority:** Must Have

**User story:**  
_Sebagai user baru, saya ingin mendaftar dan login agar bisa menggunakan aplikasi._

**Tasks:**
- [ ] API: `POST /api/auth/register` — create user + business + owner membership
- [ ] API: `POST /api/auth/[...nextauth]` — NextAuth credential provider
- [ ] Screen: Register form (nama, email, password, konfirmasi password)
- [ ] Screen: Login form (email, password)
- [ ] Validasi Zod: email valid, password min 8 char
- [ ] Error handling: email sudah ada, wrong password

**AC:**
- ✓ User baru bisa register, otomatis dapat workspace
- ✓ Login redirect ke dashboard
- ✓ Password di-hash bcrypt
- ✓ Session persistent dengan JWT

---

### S1-03 — Onboarding Profil Usaha
**Type:** Feature | **Priority:** Must Have

**User story:**  
_Sebagai owner baru, saya ingin mengisi profil usaha agar invoice dan sistem siap digunakan._

**Tasks:**
- [ ] Screen: Onboarding multi-step (Nama Usaha → Kategori → No WA → Metode Bayar)
- [ ] API: `PATCH /api/businesses/[id]`
- [ ] Redirect ke dashboard setelah onboarding selesai
- [ ] Skip onboarding jika sudah diisi

**AC:**
- ✓ First login → redirect onboarding jika profil belum lengkap
- ✓ Profil tersimpan di DB
- ✓ Bisa diedit kembali di Settings

---

### S1-04 — Manajemen Produk
**Type:** Feature | **Priority:** Must Have

**User story:**  
_Sebagai owner, saya ingin menambah, mengedit, dan menonaktifkan produk agar admin bisa memilihnya saat buat order._

**Tasks:**
- [ ] API: `GET/POST /api/products`
- [ ] API: `GET/PATCH/DELETE /api/products/[id]`
- [ ] Screen: Daftar Produk (list card mobile, search, filter aktif/nonaktif)
- [ ] Screen: Form Tambah/Edit Produk
- [ ] Upload foto produk ke Supabase Storage

**AC:**
- ✓ CRUD produk
- ✓ Produk nonaktif tidak muncul di order form
- ✓ Validasi harga jual > 0, stok ≥ 0
- ✓ Satuan bisa custom

---

### S1-05 — Manajemen Pelanggan
**Type:** Feature | **Priority:** Must Have

**User story:**  
_Sebagai admin, saya ingin menyimpan data pelanggan agar tidak perlu input berulang saat ada order baru._

**Tasks:**
- [ ] API: `GET/POST /api/customers`
- [ ] API: `GET/PATCH /api/customers/[id]`
- [ ] Screen: Daftar Pelanggan (list, search by nama/WA)
- [ ] Screen: Detail Pelanggan (info + riwayat order)
- [ ] Screen: Form Tambah/Edit Pelanggan

**AC:**
- ✓ CRUD pelanggan
- ✓ Warning jika nomor WA sama dengan pelanggan lain
- ✓ Detail pelanggan tampilkan histori order + total belanja lifetime

---

## Sprint 2 — Core Order (Week 3-4)
**Goal:** Admin bisa mencatat order, lihat daftar, update status, dan kirim invoice ke WA.

---

### S2-01 — Buat Order
**Type:** Feature | **Priority:** Must Have

**User story:**  
_Sebagai admin, saya ingin mencatat order dari chat dengan memilih pelanggan, produk, dan jumlah agar total dihitung otomatis._

**Tasks:**
- [ ] API: `POST /api/orders`
- [ ] Screen: Form Buat Order
  - [ ] Step 1: Pilih/tambah pelanggan inline
  - [ ] Step 2: Tambah produk + qty (search produk, multi-item)
  - [ ] Step 3: Detail order (channel, tanggal kirim, diskon, ongkir, catatan)
  - [ ] Preview total sebelum simpan
- [ ] Generate nomor order: `ORD-YYYYMMDD-XXXX`
- [ ] Kurangi stok otomatis saat Confirmed (sesuai setting)

**AC:**
- ✓ Bisa pilih pelanggan lama atau tambah baru tanpa pindah screen
- ✓ Bisa tambah multiple produk
- ✓ Total = subtotal - diskon + ongkir
- ✓ Nomor order unik per usaha

---

### S2-02 — Daftar & Filter Order
**Type:** Feature | **Priority:** Must Have

**Tasks:**
- [ ] API: `GET /api/orders` dengan query params (status, payment_status, date_from, date_to, customer_id, search)
- [ ] Screen: Order List (filter tabs: Semua / Baru / Proses / Siap / Selesai / Batal)
- [ ] Card order: nomor, pelanggan, total, status, status bayar
- [ ] Search by nomor order / nama pelanggan

**AC:**
- ✓ Filter multi-status berfungsi
- ✓ Sorting by tanggal terbaru
- ✓ Pagination atau infinite scroll

---

### S2-03 — Detail Order & Update Status
**Type:** Feature | **Priority:** Must Have

**Tasks:**
- [ ] API: `GET /api/orders/[id]`
- [ ] API: `PATCH /api/orders/[id]/status`
- [ ] Screen: Detail Order
  - [ ] Info order (nomor, pelanggan, items, total)
  - [ ] Status order dengan tombol update
  - [ ] Status payment summary
  - [ ] History status changes
- [ ] Konfirmasi sebelum Cancel

**AC:**
- ✓ Status bisa diubah sesuai state machine
- ✓ Cancelled → stok dikembalikan otomatis
- ✓ Timestamp history tersimpan

---

### S2-04 — Invoice & Copy WA
**Type:** Feature | **Priority:** Must Have

**Tasks:**
- [ ] Screen: Invoice view dari detail order
- [ ] Tombol "Copy Pesan WA" → copy text ke clipboard
- [ ] Format pesan WA (nama usaha, order number, items, total, info bayar)
- [ ] Should Have: Share link invoice

**AC:**
- ✓ Invoice tampil lengkap
- ✓ Copy WA message 1-tap berhasil
- ✓ Pesan WA diformat dengan benar

---

## Sprint 3 — Payment & Stock (Week 5-6)
**Goal:** Owner bisa catat pembayaran, lihat piutang, dan kelola stok.

---

### S3-01 — Catat Pembayaran
**Type:** Feature | **Priority:** Must Have

**Tasks:**
- [ ] API: `POST /api/orders/[id]/payments`
- [ ] Screen: Form Catat Pembayaran (dari detail order)
  - [ ] Pilih metode bayar
  - [ ] Input nominal (default: sisa tagihan)
  - [ ] Upload bukti bayar opsional
- [ ] Update paymentStatus otomatis (Partial/Paid)
- [ ] Update amountPaid + amountDue di order

**AC:**
- ✓ Bisa catat bayar sebagian
- ✓ Bisa catat multiple payment untuk 1 order
- ✓ Status order otomatis update ke Paid ketika lunas

---

### S3-02 — Daftar Piutang
**Type:** Feature | **Priority:** Must Have

**Tasks:**
- [ ] API: `GET /api/receivables` (order Unpaid + Partial)
- [ ] Screen: Piutang List
  - [ ] Total piutang keseluruhan
  - [ ] List per pelanggan
  - [ ] Filter umur piutang (7/14/30+ hari)
  - [ ] Tombol "Catat Bayar" langsung dari list

**AC:**
- ✓ Total piutang real-time
- ✓ Bisa filter dan sort by pelanggan / tanggal tua
- ✓ 1-tap ke form bayar

---

### S3-03 — Manajemen Stok
**Type:** Feature | **Priority:** Must Have

**Tasks:**
- [ ] API: `GET /api/products/[id]/stock-movements`
- [ ] API: `POST /api/products/[id]/stock-adjust`
- [ ] Screen: Stok Overview (list produk dengan stok, alert merah jika menipis)
- [ ] Screen: Tambah/Kurangi Stok Manual (dengan catatan)
- [ ] Screen: Riwayat Stok per produk

**AC:**
- ✓ Produk stok rendah highlight merah / badge
- ✓ Adjustment tersimpan di riwayat
- ✓ Bisa set mode unlimited

---

## Sprint 4 — Finance & Reports (Week 7-8)
**Goal:** Owner bisa catat pengeluaran, lihat dashboard, dan export laporan.

---

### S4-01 — Pengeluaran
**Type:** Feature | **Priority:** Must Have

**Tasks:**
- [ ] API: `GET/POST /api/expenses`
- [ ] API: `PATCH/DELETE /api/expenses/[id]`
- [ ] Screen: Daftar Pengeluaran (filter kategori, tanggal)
- [ ] Screen: Form Tambah Pengeluaran
- [ ] Upload bukti pengeluaran opsional

**AC:**
- ✓ CRUD pengeluaran
- ✓ Masuk ke cashflow outflow
- ✓ Total per kategori bisa dilihat

---

### S4-02 — Dashboard
**Type:** Feature | **Priority:** Must Have

**Tasks:**
- [ ] API: `GET /api/dashboard?period=today|week|month`
- [ ] Screen: Dashboard
  - [ ] Omzet periode (today/MTD)
  - [ ] Jumlah order + breakdown status
  - [ ] Total piutang
  - [ ] Pengeluaran MTD
  - [ ] Estimasi laba kasar (omzet paid - pengeluaran - HPP sold)
  - [ ] Produk terlaris (top 5)
  - [ ] Stok menipis alert (top 5)
- [ ] Filter: Hari ini / Minggu ini / Bulan ini
- [ ] Role gate: Staff Produksi tidak lihat finansial

**AC:**
- ✓ Load < 2 detik
- ✓ Mobile-friendly single scroll
- ✓ Semua angka real dari DB

---

### S4-03 — Laporan Penjualan
**Type:** Feature | **Priority:** Must Have

**Tasks:**
- [ ] API: `GET /api/reports/sales?from=&to=`
- [ ] Screen: Laporan Penjualan
  - [ ] Date range picker
  - [ ] Summary: omzet, jumlah order, item terjual
  - [ ] Tabel produk terjual dengan qty + revenue
  - [ ] Breakdown metode bayar
- [ ] Export CSV

**AC:**
- ✓ Filter custom date range berfungsi
- ✓ CSV ter-download dengan data lengkap

---

### S4-04 — Laporan Cashflow
**Type:** Feature | **Priority:** Must Have

**Tasks:**
- [ ] API: `GET /api/reports/cashflow?from=&to=`
- [ ] Screen: Cashflow
  - [ ] Total inflow (dari payment paid)
  - [ ] Total outflow (dari expenses)
  - [ ] Saldo bersih
  - [ ] Timeline inflow/outflow
- [ ] Export CSV

**AC:**
- ✓ Inflow dan outflow akurat
- ✓ Saldo bersih = inflow - outflow
- ✓ Export berfungsi

---

## Sprint 5 — Polish & Role (Week 9-10)
**Goal:** Role staff berfungsi, UX diperhalus, siap pilot.

---

### S5-01 — Role & Staff Management
**Type:** Feature | **Priority:** Should Have

**Tasks:**
- [ ] API: `POST /api/businesses/[id]/members/invite`
- [ ] Screen: Settings → Tim & Akses
- [ ] Invite staff via email (kirim link atau kode)
- [ ] Role selection: Admin / Staff Produksi
- [ ] Permission gate di semua screen yang relevan

**AC:**
- ✓ Owner bisa invite staff
- ✓ Staff login masuk ke workspace yang sama
- ✓ Menu tersembunyi sesuai role

---

### S5-02 — Export PDF Invoice
**Type:** Feature | **Priority:** Should Have

**Tasks:**
- [ ] Setup `@react-pdf/renderer`
- [ ] Template PDF Invoice (header usaha, items, total, QR code opsional)
- [ ] Tombol "Download PDF" di detail order / invoice screen

**AC:**
- ✓ PDF ter-generate dan ter-download
- ✓ Format rapi di HP

---

### S5-03 — Notifikasi Stok Menipis
**Type:** Feature | **Priority:** Should Have

**Tasks:**
- [ ] Badge/alert di dashboard ketika ada produk stok ≤ threshold
- [ ] Setting threshold per usaha
- [ ] List detail produk yang menipis

**AC:**
- ✓ Alert muncul otomatis saat dashboard dibuka
- ✓ Owner bisa set threshold

---

### S5-04 — UX Polish
**Type:** Improvement | **Priority:** Must Have sebelum pilot

**Tasks:**
- [ ] Loading skeleton di semua list/table
- [ ] Empty state yang informatif
- [ ] Error states dengan pesan yang berguna
- [ ] Optimistic UI untuk status update
- [ ] Search/filter yang responsif
- [ ] Back navigation yang konsisten
- [ ] Toast notifications untuk aksi penting
- [ ] Confirm dialog untuk aksi destruktif

---

### S5-05 — PWA Setup
**Type:** Feature | **Priority:** Should Have

**Tasks:**
- [ ] `next-pwa` atau `@ducanh2912/next-pwa` config
- [ ] `manifest.json` (nama app, icons, theme color)
- [ ] Offline page
- [ ] "Add to Home Screen" prompt

**AC:**
- ✓ App bisa di-install di HP
- ✓ Buka offline → halaman offline informatif

---

## Bugs & Tech Debt Backlog

- [ ] Rate limiting di API auth endpoints
- [ ] Input sanitization di semua form
- [ ] Audit log untuk aksi sensitif (delete produk, ubah harga, dll)
- [ ] Pagination yang konsisten di semua list
- [ ] Prisma query optimization untuk query laporan besar
- [ ] Image compression sebelum upload

---

## v2 Backlog (Post-MVP)

- [ ] WhatsApp Business API integration (auto kirim invoice)
- [ ] Laporan siap pembiayaan (format sesuai OJK POJK 19/2025)
- [ ] Multi-cabang
- [ ] Integrasi marketplace (Shopee, TikTok)
- [ ] QRIS payment gateway real-time
- [ ] Chatbot sederhana untuk input order via WA
- [ ] Analitik lanjutan (prediksi stok, tren penjualan)
- [ ] Verifikasi / top-up subscription
