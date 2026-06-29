# Nicord — Product Requirements Document (PRD)
**Version:** 1.0  
**Project:** Vierth Labs × UMKM  
**Date:** 2026-06-30  
**Status:** Ready for Development

---

## 1. Executive Summary

**Nicord** adalah web app PWA mobile-first untuk membantu UMKM mikro-kecil yang sudah berjualan secara digital (WhatsApp, Instagram, TikTok, marketplace ringan) namun operasional internalnya masih berantakan — order tercecer di chat, stok tidak tersinkron, uang masuk tidak otomatis menjadi laporan.

**Positioning:** Bukan aplikasi kasir umum. Ini adalah **sistem kerja untuk social commerce UMKM** — mencatat order dari chat, mengelola status pesanan + stok + pembayaran, dan menghasilkan laporan usaha sederhana.

**Decisions locked:** Nama = Nicord · Monetisasi = Freemium · Host = Self-hosted VPS · Auth = Email+password · Bahasa = Indonesia+English · Storage = Supabase Storage

**Market signal:**
- 56,3% UMKM berjualan via media sosial (INDEF/Katadata)
- 39,3 juta merchant QRIS, 93% UMKM (Bank Indonesia 2025)
- 25,5 juta UMKM sudah go-digital (Kemenkop UKM 2024)
- Gap: digitalisasi pemasaran ✓, digitalisasi operasional ✗

---

## 2. Problem Statement

UMKM yang sudah jualan digital mengalami masalah berikut secara simultan:

| # | Pain Point | Dampak |
|---|-----------|--------|
| P1 | Order masuk dari banyak channel, dicatat manual di chat/buku/Excel | Order tercecer, potensi lost revenue |
| P2 | Status pesanan tidak jelas (sudah dibayar? sudah dikirim?) | Konflik dengan pelanggan, reputasi turun |
| P3 | Stok tidak sinkron dengan order | Overselling, kekecewaan pelanggan |
| P4 | Uang masuk (cash/transfer/QRIS) tidak otomatis jadi laporan | Owner tidak tahu cashflow real |
| P5 | Tidak tahu omzet, laba kasar, produk terlaris, piutang | Keputusan bisnis berdasarkan perasaan |
| P6 | Data tidak rapi untuk evaluasi atau akses pembiayaan | UMKM sulit naik kelas |

---

## 3. Product Vision & Objectives

**Vision:** Setiap UMKM social commerce punya sistem kerja yang rapi, bukan hanya medsos yang rapi.

**Objectives MVP:**
1. UMKM bisa mencatat ≥80% order harian dalam sistem
2. Waktu rekap penjualan harian turun ≥50%
3. Owner bisa lihat order belum lunas tanpa cek chat
4. Owner tahu produk terlaris dan stok menipis kapan saja
5. Owner bisa export laporan penjualan bulanan

---

## 4. Target Segment

**Primary (MVP focus):**
- Kuliner rumahan, snack pre-order, frozen food
- Katering kecil (max 20-50 order/hari)
- Reseller produk fisik berbasis WA/IG
- Toko online kecil (1-5 orang operator)

**Why this segment:**
- Order via chat → butuh sistem rekap
- Stok atau kuota produksi ada → butuh tracking
- Pakai transfer/QRIS → pembayaran perlu dicatat
- Belum butuh POS kompleks → tidak mau belajar lama

**Secondary (v2+):** UMKM dengan kasir fisik, multi-cabang, franchise kecil

---

## 5. User Personas

### Persona 1 — Sari, Owner Kuliner Rumahan
- **Usia:** 32 tahun
- **Gadget:** Android mid-range
- **Volume:** 20-50 order/hari
- **Pain:** Mencatat order di Notes HP, sering lupa siapa sudah bayar
- **Goal:** Tahu omzet hari ini tanpa hitung manual, kirim invoice ke WA cepat
- **Job to be done:** *"Ketika ada order masuk dari WA, saya ingin catat dan kirim total + rekening tanpa buka Excel."*

### Persona 2 — Andi, Admin Order
- **Usia:** 22 tahun
- **Gadget:** Android, akses via HP pribadi
- **Pain:** Harus lapor ke owner via WA, takut salah catat harga
- **Goal:** Input order cepat, tidak perlu hitung manual
- **Job to be done:** *"Ketika membalas chat pelanggan, saya ingin langsung input order dan sistem yang hitung totalnya."*

### Persona 3 — Budi, Staff Produksi/Packing
- **Usia:** 25 tahun
- **Gadget:** HP apapun
- **Pain:** Tidak tahu urutan order mana yang harus dibuat dulu
- **Goal:** Lihat daftar order yang perlu diproses hari ini
- **Job to be done:** *"Pagi hari saya ingin buka aplikasi dan lihat langsung order mana yang harus saya kerjakan."*

---

## 6. Scope MVP

### ✅ In Scope

| FR | Feature | Priority |
|----|---------|----------|
| FR-01 | Auth (register, login, logout) | Must Have |
| FR-02 | Profil Usaha | Must Have |
| FR-03 | Manajemen Produk (CRUD, stok, HPP opsional) | Must Have |
| FR-04 | Manajemen Pelanggan (CRUD, riwayat order) | Must Have |
| FR-05 | Pencatatan Order (multi-produk, channel, diskon, ongkir) | Must Have |
| FR-06 | Status Order (Draft→Confirmed→Processing→Ready→Delivered/Cancelled) | Must Have |
| FR-07 | Status Pembayaran (Unpaid/Partial/Paid/Refunded) + metode | Must Have |
| FR-08 | Invoice/Ringkasan Order (tampil, copy WA template) | Must Have |
| FR-09 | Manajemen Stok Sederhana (auto-kurang, tambah manual, riwayat) | Must Have |
| FR-10 | Pencatatan Pengeluaran (kategori, nominal, catatan) | Must Have |
| FR-11 | Piutang (daftar belum lunas, filter by pelanggan) | Must Have |
| FR-12 | Dashboard (omzet, order count, stok menipis, piutang) | Must Have |
| FR-13 | Laporan Penjualan (filter date, export CSV) | Must Have |
| FR-14 | Laporan Cashflow Sederhana (inflow/outflow/saldo) | Must Have |
| FR-15 | Role & Akses Staff (Owner/Admin/Staff Produksi) | Should Have |
| FR-16 | Export PDF Invoice | Should Have |
| FR-17 | Notifikasi stok menipis (in-app) | Should Have |

### ❌ Out of Scope MVP

- WhatsApp Business API otomatis / chatbot
- Integrasi QRIS real-time (pembayaran tetap dicatat manual)
- Sinkronisasi mutasi bank
- Integrasi marketplace (Shopee/TikTok/Tokopedia)
- Akuntansi formal (neraca, P&L standar)
- Pajak (PPh, PPN)
- Multi-cabang kompleks
- Payroll karyawan
- Loan application langsung ke lender

---

## 7. Functional Requirements Detail

### FR-01 — Auth

**User stories:**
- Sebagai user baru, saya ingin mendaftar dengan email/nomor HP + password
- Sebagai user, saya ingin login dan logout
- Sebagai owner, saya otomatis memiliki satu workspace usaha saat pertama daftar

**Acceptance criteria:**
- ✓ Register: nama, email, password (min 8 char)
- ✓ Login dengan email + password
- ✓ Session persistent (remember me atau JWT refresh)
- ✓ Password di-hash (bcrypt/argon2)
- ✓ Owner otomatis jadi admin workspace usaha pertama

**Edge cases:**
- Email sudah terdaftar → error jelas
- Wrong password → pesan generic (jangan beritahu email tidak ada)

---

### FR-02 — Profil Usaha

**Fields:**
| Field | Type | Required |
|-------|------|----------|
| nama_usaha | string | Yes |
| kategori_usaha | enum | Yes |
| nomor_wa | string | Yes |
| alamat | text | No |
| metode_pembayaran | array enum | Yes |
| logo | image | No |

**Acceptance criteria:**
- ✓ Owner bisa buat & edit profil usaha
- ✓ Data usaha tampil di invoice (nama, WA, metode bayar)
- ✓ Onboarding screen muncul setelah register pertama kali

---

### FR-03 — Manajemen Produk

**Fields:**
| Field | Type | Required |
|-------|------|----------|
| nama | string | Yes |
| kategori | string | No |
| harga_jual | number | Yes |
| harga_modal | number | No |
| stok | number | Yes |
| satuan | string | Yes (default: "pcs") |
| is_active | boolean | Yes |
| foto | image | No |
| deskripsi | text | No |

**Acceptance criteria:**
- ✓ CRUD produk
- ✓ Produk aktif saja yang muncul saat buat order
- ✓ Satuan fleksibel: pcs, porsi, kg, pack, lusin, dll
- ✓ Stok bisa 0 (tetap bisa dijual dengan peringatan) atau dibatasi

---

### FR-04 — Manajemen Pelanggan

**Fields:**
| Field | Type | Required |
|-------|------|----------|
| nama | string | Yes |
| nomor_wa | string | No |
| alamat | text | No |
| catatan | text | No |

**Acceptance criteria:**
- ✓ CRUD pelanggan
- ✓ Saat buat order: pilih pelanggan lama atau tambah baru inline
- ✓ Profil pelanggan menampilkan riwayat order + total belanja
- ✓ Deduplikasi berdasarkan nomor WA (warning jika sama)

---

### FR-05 — Pencatatan Order

**Fields:**
| Field | Type | Required |
|-------|------|----------|
| nomor_order | auto | — |
| pelanggan_id | FK | Yes |
| tanggal_order | date | Yes |
| tanggal_kirim | date | No |
| channel | enum | Yes |
| produk_items | array | Yes (min 1) |
| diskon | number | No |
| ongkir | number | No |
| catatan | text | No |

**Channel enum:** WhatsApp, Instagram, TikTok, Marketplace, Offline, Lainnya

**Acceptance criteria:**
- ✓ Order bisa punya multiple produk dengan qty
- ✓ Sistem hitung: subtotal per item, total diskon, ongkir, grand total
- ✓ Nomor order unik: `ORD-YYYYMMDD-XXXX`
- ✓ Order bisa disimpan draft (tidak kurangi stok) atau confirmed (kurangi stok)

---

### FR-06 — Status Order

**State machine:**
```
Draft → Confirmed → Processing → Ready → Delivered/Picked Up
  ↓           ↓           ↓          ↓
Cancelled  Cancelled  Cancelled  Cancelled
```

**Acceptance criteria:**
- ✓ Status bisa diupdate secara manual
- ✓ Cancelled order tidak dihitung omzet
- ✓ Filter order by status
- ✓ Timestamp setiap perubahan status tersimpan

---

### FR-07 — Status Pembayaran

**Status:** Unpaid → Partial → Paid | Refunded

**Metode:** Cash, Transfer, QRIS, GoPay, OVO, Dana, ShopeePay, Lainnya

**Acceptance criteria:**
- ✓ Bisa catat pembayaran penuh atau sebagian
- ✓ Sistem hitung sisa tagihan = grand_total - jumlah_dibayar
- ✓ Riwayat payment per order
- ✓ Bukti bayar bisa diupload (gambar, optional)
- ✓ Order Paid masuk ke laporan; Unpaid/Partial masuk piutang

---

### FR-08 — Invoice

**Acceptance criteria:**
- ✓ Invoice bisa dilihat dari detail order
- ✓ Konten: nama usaha, nomor order, tanggal, produk+qty+harga, subtotal, diskon, ongkir, total, status bayar, metode bayar
- ✓ Tombol "Copy Pesan WA" → copy template teks ke clipboard
- ✓ Should Have: Export PDF
- ✓ Should Have: Share link invoice (public URL tanpa login)

**Template WA default:**
```
Halo [nama_pelanggan],

Berikut ringkasan pesanan Anda dari [nama_usaha]:

No. Order: [nomor_order]
Tanggal: [tanggal_order]

[item1] x[qty] = Rp[harga]
[item2] x[qty] = Rp[harga]

Subtotal: Rp[subtotal]
Ongkir: Rp[ongkir]
Diskon: -Rp[diskon]
*Total: Rp[grand_total]*

Pembayaran ke:
[metode_pembayaran]

Terima kasih! 🙏
```

---

### FR-09 — Manajemen Stok

**Acceptance criteria:**
- ✓ Stok berkurang otomatis saat order Confirmed (bisa di-setting ke saat Paid)
- ✓ Owner bisa tambah stok manual (stock adjustment)
- ✓ Riwayat stok: tanggal, jenis (order keluar / adjustment masuk / retur)
- ✓ Alert produk stok ≤ threshold (default: 5)
- ✓ Bisa set stok ke 0 = unlimited (mode pre-order)

---

### FR-10 — Pengeluaran

**Kategori:** Bahan Baku, Packaging, Ongkir, Iklan, Operasional, Gaji, Lain-lain

**Fields:**
| Field | Type | Required |
|-------|------|----------|
| tanggal | date | Yes |
| kategori | enum | Yes |
| nominal | number | Yes |
| catatan | text | No |
| bukti | image | No |

**Acceptance criteria:**
- ✓ CRUD pengeluaran
- ✓ Pengeluaran masuk cashflow outflow
- ✓ Filter by tanggal / kategori

---

### FR-11 — Piutang

**Acceptance criteria:**
- ✓ Daftar order Unpaid + Partial otomatis jadi piutang
- ✓ Total piutang per pelanggan
- ✓ Filter by pelanggan / umur piutang (7 hari, 14 hari, 30 hari+)
- ✓ Dari list piutang bisa langsung catat pembayaran

---

### FR-12 — Dashboard

**Metrics:**
| Metric | Periode |
|--------|---------|
| Omzet hari ini | Today |
| Omzet bulan ini | MTD |
| Jumlah order | Today / MTD |
| Order belum diproses | Live count |
| Total piutang | Live |
| Produk terlaris | MTD |
| Stok menipis | Alert |
| Pengeluaran bulan ini | MTD |
| Estimasi laba kasar | MTD |

**Acceptance criteria:**
- ✓ Mobile-friendly, single scroll
- ✓ Filter: hari ini / minggu ini / bulan ini
- ✓ Staff Produksi hanya melihat order yg relevan (tidak finansial)
- ✓ Data real-time dari DB (bukan cache lama)

---

### FR-13 — Laporan Penjualan

**Acceptance criteria:**
- ✓ Filter by tanggal (custom range)
- ✓ Tampil: total omzet, jumlah order, produk terjual per SKU, breakdown metode bayar
- ✓ Export CSV
- ✓ Should Have: Export PDF

---

### FR-14 — Laporan Cashflow

**Acceptance criteria:**
- ✓ Inflow: pembayaran order (Paid)
- ✓ Outflow: pengeluaran
- ✓ Saldo bersih = inflow - outflow
- ✓ Filter by periode
- ✓ Export CSV

---

### FR-15 — Role & Staff

**Role matrix:**

| Permission | Owner | Admin | Staff Produksi |
|-----------|-------|-------|----------------|
| Lihat dashboard finansial | ✓ | ✓ | ✗ |
| Buat/edit order | ✓ | ✓ | ✗ |
| Lihat daftar order processing | ✓ | ✓ | ✓ |
| Update status order | ✓ | ✓ | ✓ (partial) |
| Catat pembayaran | ✓ | ✓ | ✗ |
| Kelola produk | ✓ | ✗ | ✗ |
| Kelola stok | ✓ | ✓ | ✗ |
| Lihat laporan | ✓ | ✗ | ✗ |
| Invite staff | ✓ | ✗ | ✗ |
| Settings usaha | ✓ | ✗ | ✗ |

**Acceptance criteria:**
- ✓ Owner bisa invite staff via email
- ✓ Staff login ke workspace yang sama
- ✓ UI menyembunyikan menu tidak relevan per role

---

## 8. Non-Functional Requirements

| NFR | Requirement | Target |
|-----|------------|--------|
| NFR-01 | Mobile-first UX | Optimal di layar 360-430px |
| NFR-02 | Time to first order | < 5 menit setelah register |
| NFR-03 | Performance | Dashboard load < 2 detik untuk 1.000 order |
| NFR-04 | Security | Password hashed, RBAC, file akses controlled, data antar workspace terisolasi |
| NFR-05 | Availability | 99% uptime (target) |
| NFR-06 | Backup | Daily automated backup DB |
| NFR-07 | Exportability | User selalu bisa export data order, produk, laporan |
| NFR-08 | Offline-readiness | PWA basic: bisa buka dashboard saat offline (data cached) |

---

## 9. MVP Success Metrics

| Metric | Target |
|--------|--------|
| % order harian tercatat | ≥ 80% |
| Waktu rekap harian | Turun ≥ 50% |
| Lihat piutang tanpa cek chat | ✓ |
| Tahu produk terlaris + stok | ✓ |
| Export laporan bulanan | ✓ |
| Retention 2 minggu pilot | ≥ 5 dari 10 UMKM |

---

## 10. Risks

| Risk | Level | Mitigasi |
|------|-------|---------|
| Scope creep (AI/chatbot/QRIS real-time) | Tinggi | Lock scope MVP, fitur lanjut masuk backlog v2 |
| Low adoption (UMKM malas input) | Tinggi | UX harus ≤ 3 tap untuk catat order, template WA 1 klik |
| Kompetitor (Recapp, CatatWA, Majoo) | Sedang | Fokus segmen spesifik, positioning social commerce |
| Data loss | Sedang | Backup otomatis + export selalu tersedia |
| Performance di HP mid-range | Sedang | Astryx components + lazy loading |

---

## 11. Competitor Reference

| Pemain | Kelebihan | Kekurangan | Differensiasi RekapUsaha |
|--------|-----------|------------|--------------------------|
| Majoo | Lengkap, POS, inventori | Kompleks, mahal untuk UMKM mikro | Lebih simpel, chat-first focus |
| Kasir Pintar | POS, jutaan user | POS-centric, bukan order-chat | Order dari WA/IG first |
| CatatWA | Via WA, scan nota AI | Bergantung WA Business API | No dependency API eksternal di MVP |
| Recapp | WA order otomatis | Setup kompleks | Manual tapi lebih cepat setup |

---

## 12. Open Questions (perlu keputusan sebelum sprint 1)

1. **Nama final produk:** RekapUsaha / OrderFlow / nama lain?
2. **Monetisasi MVP:** Gratis sepenuhnya / freemium / berbayar langsung?
3. **Host target:** Self-hosted / Vercel+Supabase / Railway?
4. **Auth: email only atau WA OTP?** (WA OTP lebih relatable tapi perlu API)
5. **Bahasa UI:** Indonesia saja atau bilingual?
6. **Foto produk storage:** Cloudinary / Supabase Storage / S3?
