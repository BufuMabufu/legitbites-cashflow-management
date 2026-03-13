# 🍽️ LegitBites Cashflow Management

> Aplikasi pencatatan arus kas (cashflow) untuk usaha kuliner. Didesain agar **super mudah digunakan** oleh siapa saja — bahkan yang tidak terbiasa dengan teknologi.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?logo=supabase)](https://supabase.com/)

---

## 📖 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Struktur Folder](#-struktur-folder)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Instalasi Lokal](#-instalasi-lokal)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Sistem RBAC](#-sistem-rbac)
- [Deploy ke Production](#-deploy-ke-production)

---

## 🎯 Tentang Proyek

**LegitBites Cashflow Management** adalah aplikasi web MVP untuk mencatat pemasukan dan pengeluaran harian usaha kuliner. Aplikasi ini dirancang dengan prinsip:

1. **Anti-Gaptek** — UI bersih, tombol besar, alur sederhana. Pengguna non-teknis bisa langsung pakai tanpa pelatihan.
2. **Role-Based Access** — OWNER punya akses penuh (laporan, master data). STAFF hanya bisa input transaksi harian.
3. **Real-time & Cloud** — Data tersimpan aman di cloud (Supabase), bisa diakses dari HP maupun laptop.

---

## ✨ Fitur Utama

| Fitur | OWNER | STAFF |
|---|:---:|:---:|
| Input transaksi harian (pemasukan/pengeluaran) | ✅ | ✅ |
| Lihat riwayat transaksi | ✅ | ✅ |
| Kelola kategori (tambah/edit/hapus) | ✅ | ❌ |
| Laporan keuangan (harian/mingguan/bulanan) | ✅ | ❌ |
| Manajemen user & role | ✅ | ❌ |

---

## 🛠 Tech Stack

| Teknologi | Kegunaan |
|---|---|
| **[Next.js 15](https://nextjs.org/)** (App Router) | Full-stack React framework dengan Server Components & Server Actions |
| **[TypeScript](https://www.typescriptlang.org/)** | Type safety — mengurangi bug sebelum kode dijalankan |
| **[Tailwind CSS 4](https://tailwindcss.com/)** | Utility-first CSS framework untuk styling cepat & konsisten |
| **[Shadcn UI](https://ui.shadcn.com/)** | Komponen UI yang accessible, bisa di-customize, dan siap produksi |
| **[Prisma ORM](https://www.prisma.io/)** | Type-safe database client — query database dengan TypeScript |
| **[Supabase](https://supabase.com/)** | Backend-as-a-Service — menyediakan PostgreSQL database & authentication |

---

## 📁 Struktur Folder

```
budget-manager/
├── prisma/
│   └── schema.prisma          # Definisi model database (User, Category, Transaction)
├── src/
│   ├── app/                   # Next.js App Router — halaman & API routes
│   │   ├── globals.css        # Global styles & Tailwind directives
│   │   ├── layout.tsx         # Root layout (font, metadata)
│   │   └── page.tsx           # Halaman utama
│   ├── components/
│   │   └── ui/                # Shadcn UI components (button, input, dll.)
│   ├── generated/
│   │   └── prisma/            # Auto-generated Prisma Client (jangan edit manual)
│   └── lib/
│       ├── prisma.ts          # Prisma Client singleton
│       ├── supabase/
│       │   ├── client.ts      # Supabase client untuk browser (Client Components)
│       │   └── server.ts      # Supabase client untuk server (Server Components)
│       └── utils.ts           # Utility functions (cn helper dari Shadcn)
├── .env.example               # Template environment variables
├── .gitignore
├── components.json            # Konfigurasi Shadcn UI
├── next.config.ts             # Konfigurasi Next.js
├── package.json
├── prisma.config.ts           # Konfigurasi Prisma CLI
├── postcss.config.mjs
└── tsconfig.json
```

---

## 📋 Persyaratan Sistem

- **Node.js** ≥ 18.18
- **npm** ≥ 9
- **Git**
- Akun **[Supabase](https://supabase.com/)** (gratis)

---

## 🚀 Instalasi Lokal

### 1. Clone Repository

```bash
git clone https://github.com/BufuMabufu/legitbites-cashflow-management.git
cd legitbites-cashflow-management
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
```

Buka file `.env` dan isi semua nilai. Lihat bagian [Environment Variables](#-environment-variables) untuk panduan lengkap.

### 4. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Jalankan migrasi database
npx prisma migrate dev --name init
```

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 🔐 Environment Variables

Salin `.env.example` ke `.env` dan isi nilainya:

| Variable | Deskripsi | Cara Mendapatkan |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anonymous key | Supabase Dashboard → Settings → API → `anon` `public` key |
| `DATABASE_URL` | Connection string (pooled) | Supabase Dashboard → Settings → Database → Connection string (Transaction mode, port 6543) |
| `DIRECT_URL` | Connection string (direct) | Supabase Dashboard → Settings → Database → Connection string (Session mode, port 5432) |

> ⚠️ **PENTING**: Jangan pernah commit file `.env` ke Git. File ini sudah masuk `.gitignore`.

---

## 🗄 Database Setup

### Skema Database

Aplikasi menggunakan 3 model utama:

```
┌──────────┐     ┌────────────┐     ┌─────────────┐
│   User   │────▶│ Transaction│◀────│  Category   │
│          │ 1:N │            │ N:1 │             │
│ id       │     │ id         │     │ id          │
│ email    │     │ amount     │     │ name        │
│ name     │     │ type       │     │ type        │
│ role     │     │ date       │     │ (INCOME/    │
│ (OWNER/  │     │ description│     │  EXPENSE)   │
│  STAFF)  │     │ categoryId │     └─────────────┘
└──────────┘     │ userId     │
                 └────────────┘
```

### Prisma Commands

```bash
# Validate schema
npx prisma validate

# Generate client setelah perubahan schema
npx prisma generate

# Buat migrasi baru
npx prisma migrate dev --name <nama_migrasi>

# Reset database (HATI-HATI: menghapus semua data!)
npx prisma migrate reset

# Buka Prisma Studio (GUI browser untuk lihat data)
npx prisma studio
```

---

## 🛡 Sistem RBAC

Aplikasi menggunakan **Role-Based Access Control** sederhana dengan 2 role:

### 👑 OWNER (Pemilik Usaha)
- Akses penuh ke seluruh fitur
- Melihat laporan keuangan (harian, mingguan, bulanan)
- Mengelola kategori pemasukan & pengeluaran
- Mengelola user dan mengatur role
- Input & lihat semua transaksi

### 👤 STAFF (Karyawan)
- Input transaksi harian (pemasukan/pengeluaran)
- Lihat riwayat transaksi milik sendiri
- **Tidak bisa** mengakses laporan atau master data

### Cara Kerja

1. User login via Supabase Auth (email/password)
2. Middleware Next.js mengecek session dan role dari database
3. Route dilindungi berdasarkan role — STAFF yang mencoba akses halaman OWNER akan di-redirect

---

## 🌐 Deploy ke Production

### Vercel (Recommended)

1. Push kode ke GitHub
2. Buka [vercel.com](https://vercel.com) → Import repository
3. Tambahkan environment variables di Vercel Dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`
   - `DIRECT_URL`
4. Deploy! 🚀

### Supabase Setup

1. Buat proyek baru di [app.supabase.com](https://app.supabase.com)
2. Salin connection string dan API keys
3. Jalankan migrasi: `npx prisma migrate deploy`
4. (Opsional) Seed data awal kategori

---

## 📄 Lisensi

MIT License — lihat file [LICENSE](LICENSE) untuk detail.

---

<p align="center">
  Dibuat dengan ❤️ untuk pelaku usaha kuliner Indonesia
</p>
