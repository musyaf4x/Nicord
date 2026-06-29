# RekapUsaha — Database Schema

**Date:** 2026-06-30  
**ORM:** Prisma  
**DB:** PostgreSQL

---

## Entity Relationship Overview

```
users ──< business_members >── businesses
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
               products         customers       expenses
                    │               │
              order_items       orders ──< payments
                    │               │
              stock_movements   invoices
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Auth ────────────────────────────────────────────────────────────────────

model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  emailVerified DateTime?
  password      String   // bcrypt hash
  image         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  memberships   BusinessMember[]
  accounts      Account[]
  sessions      Session[]

  @@map("users")
}

// NextAuth.js v5 tables
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// ─── Business ────────────────────────────────────────────────────────────────

model Business {
  id                 String   @id @default(cuid())
  name               String
  category           String
  whatsappNumber     String?
  address            String?
  logoUrl            String?
  paymentMethods     String[] // ["cash","transfer","qris","gopay","ovo","dana"]
  lowStockThreshold  Int      @default(5)
  stockDeductOn      StockDeductTrigger @default(CONFIRMED)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  members            BusinessMember[]
  products           Product[]
  customers          Customer[]
  orders             Order[]
  expenses           Expense[]

  @@map("businesses")
}

model BusinessMember {
  id         String       @id @default(cuid())
  businessId String
  userId     String
  role       MemberRole   @default(ADMIN)
  joinedAt   DateTime     @default(now())

  business   Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([businessId, userId])
  @@map("business_members")
}

// ─── Products ────────────────────────────────────────────────────────────────

model ProductCategory {
  id         String    @id @default(cuid())
  businessId String
  name       String
  createdAt  DateTime  @default(now())

  products   Product[]

  @@unique([businessId, name])
  @@map("product_categories")
}

model Product {
  id           String   @id @default(cuid())
  businessId   String
  categoryId   String?
  name         String
  description  String?
  imageUrl     String?
  sellingPrice Decimal  @db.Decimal(12, 2)
  costPrice    Decimal? @db.Decimal(12, 2)  // HPP/modal
  stock        Int      @default(0)
  unit         String   @default("pcs")     // pcs, porsi, kg, pack, lusin, dll
  isActive     Boolean  @default(true)
  isUnlimited  Boolean  @default(false)     // stok unlimited = pre-order mode
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  business        Business         @relation(fields: [businessId], references: [id], onDelete: Cascade)
  category        ProductCategory? @relation(fields: [categoryId], references: [id])
  orderItems      OrderItem[]
  stockMovements  StockMovement[]

  @@map("products")
}

// ─── Customers ───────────────────────────────────────────────────────────────

model Customer {
  id             String   @id @default(cuid())
  businessId     String
  name           String
  whatsappNumber String?
  address        String?
  notes          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  orders   Order[]

  @@unique([businessId, whatsappNumber])
  @@map("customers")
}

// ─── Orders ──────────────────────────────────────────────────────────────────

model Order {
  id             String        @id @default(cuid())
  businessId     String
  customerId     String
  orderNumber    String        // ORD-20260630-0001
  orderDate      DateTime      @default(now())
  deliveryDate   DateTime?
  channel        OrderChannel  @default(WHATSAPP)
  status         OrderStatus   @default(DRAFT)
  paymentStatus  PaymentStatus @default(UNPAID)
  notes          String?

  // Calculated fields (denormalized for performance)
  subtotal       Decimal @db.Decimal(12, 2) @default(0)
  discount       Decimal @db.Decimal(12, 2) @default(0)
  shippingCost   Decimal @db.Decimal(12, 2) @default(0)
  grandTotal     Decimal @db.Decimal(12, 2) @default(0)
  amountPaid     Decimal @db.Decimal(12, 2) @default(0)
  amountDue      Decimal @db.Decimal(12, 2) @default(0)

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  business       Business    @relation(fields: [businessId], references: [id], onDelete: Cascade)
  customer       Customer    @relation(fields: [customerId], references: [id])
  items          OrderItem[]
  payments       Payment[]
  invoice        Invoice?
  statusHistory  OrderStatusHistory[]

  @@unique([businessId, orderNumber])
  @@map("orders")
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  productId   String
  productName String  // snapshot at order time
  unitPrice   Decimal @db.Decimal(12, 2)
  quantity    Int
  subtotal    Decimal @db.Decimal(12, 2)

  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@map("order_items")
}

model OrderStatusHistory {
  id        String      @id @default(cuid())
  orderId   String
  status    OrderStatus
  notes     String?
  changedAt DateTime    @default(now())
  changedBy String      // userId

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("order_status_history")
}

// ─── Payments ─────────────────────────────────────────────────────────────────

model Payment {
  id            String        @id @default(cuid())
  orderId       String
  method        PaymentMethod
  amount        Decimal       @db.Decimal(12, 2)
  paidAt        DateTime      @default(now())
  notes         String?
  proofImageUrl String?
  createdBy     String        // userId

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("payments")
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

model Invoice {
  id          String   @id @default(cuid())
  orderId     String   @unique
  invoiceNumber String
  issuedAt    DateTime @default(now())
  publicSlug  String?  @unique  // for shareable link

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("invoices")
}

// ─── Stock ────────────────────────────────────────────────────────────────────

model StockMovement {
  id          String            @id @default(cuid())
  productId   String
  type        StockMovementType
  quantity    Int               // positive = masuk, negative = keluar
  stockBefore Int
  stockAfter  Int
  referenceId String?           // orderId or adjustmentId
  notes       String?
  createdAt   DateTime          @default(now())
  createdBy   String            // userId

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@map("stock_movements")
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

model Expense {
  id           String          @id @default(cuid())
  businessId   String
  category     ExpenseCategory
  amount       Decimal         @db.Decimal(12, 2)
  date         DateTime
  notes        String?
  proofImageUrl String?
  createdAt    DateTime        @default(now())
  createdBy    String          // userId

  business Business @relation(fields: [businessId], references: [id], onDelete: Cascade)

  @@map("expenses")
}

// ─── Enums ────────────────────────────────────────────────────────────────────

enum MemberRole {
  OWNER
  ADMIN
  STAFF_PRODUCTION
}

enum OrderChannel {
  WHATSAPP
  INSTAGRAM
  TIKTOK
  MARKETPLACE
  OFFLINE
  OTHER
}

enum OrderStatus {
  DRAFT
  CONFIRMED
  PROCESSING
  READY
  DELIVERED
  CANCELLED
}

enum PaymentStatus {
  UNPAID
  PARTIAL
  PAID
  REFUNDED
}

enum PaymentMethod {
  CASH
  TRANSFER
  QRIS
  GOPAY
  OVO
  DANA
  SHOPEEPAY
  OTHER
}

enum StockMovementType {
  ORDER_OUT     // dikurangi karena order
  ADJUSTMENT_IN  // tambah stok manual
  ADJUSTMENT_OUT // koreksi kurang manual
  RETURN_IN      // retur dari order cancelled
}

enum ExpenseCategory {
  BAHAN_BAKU
  PACKAGING
  ONGKIR
  IKLAN
  OPERASIONAL
  GAJI
  LAIN_LAIN
}

enum StockDeductTrigger {
  CONFIRMED
  PAID
}
```

---

## Indexes (Performance)

```sql
-- orders: frequent queries
CREATE INDEX idx_orders_business_status ON orders(business_id, status);
CREATE INDEX idx_orders_business_payment_status ON orders(business_id, payment_status);
CREATE INDEX idx_orders_business_date ON orders(business_id, order_date DESC);

-- products: active products per business
CREATE INDEX idx_products_business_active ON products(business_id, is_active);

-- stock_movements: per product history
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id, created_at DESC);

-- expenses: cashflow queries
CREATE INDEX idx_expenses_business_date ON expenses(business_id, date DESC);

-- payments: settlement queries
CREATE INDEX idx_payments_order ON payments(order_id);
```

---

## Notes

1. **Denormalized totals di Order** (subtotal, grandTotal, amountPaid, amountDue) — disengaja untuk performa dashboard query. Harus diupdate atomically saat ada payment baru atau item berubah.

2. **productName di OrderItem** — snapshot nama produk saat order dibuat. Jika produk diedit kemudian, riwayat order tetap akurat.

3. **publicSlug di Invoice** — untuk fitur "share link invoice" tanpa login. Harus random CUID, bukan sequential.

4. **stockBefore / stockAfter di StockMovement** — audit trail lengkap, tidak perlu reconstruct history dari query aggregate.

5. **businessId di setiap entity** — isolasi data antar workspace di query level, bukan hanya aplikasi level.
