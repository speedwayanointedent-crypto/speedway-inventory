# SpeedWay Anointed Enterprise

> **Wholesale spare parts inventory and POS management system** — production-ready Next.js 16 + MongoDB application tailored for SpeedWay Anointed Enterprise in Accra, Ghana.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green) ![License](https://img.shields.io/badge/License-Proprietary-red)

## ✨ Features

- **Inventory** — products, categories, stock entries, low-stock alerts, CSV import/export, vehicle compatibility, barcode/SKU
- **POS** — fast checkout, wholesale pricing, 4 payment methods, mixed payments, discount & tax, auto receipt
- **Sales & Returns** — full audit trail, refunds, partial refunds, sale cancellation, inventory restoration
- **Customers & Suppliers** — wholesale vs retail, lifetime spending, purchase history
- **Reports** — sales, inventory, profit & loss with PDF/Excel/CSV exports and date filters
- **Receipts** — printable thermal-style receipts with QR code, public link, PDF download, email support
- **Admin** — user management (ADMIN/STAFF), role-based permissions, system settings, activity log
- **Auth** — NextAuth credentials + JWT, password reset via email, rate limiting
- **Notifications** — low stock, out of stock, sale completed
- **PWA** — installable, manifest, icons
- **Dark mode** — full dark/light theme support
- **Mobile-first** — responsive design across phone, tablet, and desktop
- **SEO** — robots.txt, sitemap, OpenGraph metadata, PWA manifest

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router, Server Actions, RSC)
- **Language:** TypeScript 5
- **Database:** MongoDB Atlas + Mongoose 8
- **Auth:** NextAuth 4 (JWT)
- **UI:** Tailwind CSS 3, Shadcn UI (Radix), Lucide icons, Recharts
- **Email:** Mailjet (welcome, receipts, low-stock alerts, password reset)
- **PDF:** jsPDF + jspdf-autotable
- **QR:** qrcode
- **Excel:** ExcelJS
- **CSV:** PapaParse
- **Validation:** Zod
- **Charts:** Recharts
- **Theme:** next-themes

## 📋 Prerequisites

- Node.js 18.17+ (Node 20+ recommended)
- pnpm / npm / yarn
- MongoDB Atlas account (free tier works)
- Mailjet account (optional, but recommended for emails)

## 🚀 Quick Start

### 1. Clone & install

```bash
git clone <your-repo>
cd "SpeedWay Inventory Wholesale"
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in the values:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/speedway
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<openssl rand -base64 32>
MAILJET_API_KEY=...
MAILJET_SECRET_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### 3. Seed the database

```bash
npm run seed
```

This populates 2 users, 10 categories, 10 suppliers, 10 customers, 30 products, and ~120 sample sales.

### 4. Run

```bash
npm run dev
```

Open <http://localhost:3000>.

### Default Credentials

| Role  | Email                | Password    |
| ----- | -------------------- | ----------- |
| ADMIN | admin@speedway.com   | Admin@123456 |
| STAFF | staff@speedway.com   | Staff@123456 |

> Change these immediately after first sign-in (Admin → Users → edit).

## 📦 Scripts

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Start dev server (Turbopack)                 |
| `npm run build`      | Production build                             |
| `npm run start`      | Start production server                      |
| `npm run lint`       | Lint with ESLint                             |
| `npm run typecheck`  | TypeScript type-check                        |
| `npm run seed`       | Reset & seed the database                    |
| `npm run format`     | Prettier format                              |

## 🚢 Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for a step-by-step guide to deploying on Vercel + MongoDB Atlas.

Quick version:

1. **MongoDB Atlas:** Create a free M0 cluster, whitelist `0.0.0.0/0`, get connection string.
2. **Vercel:** Import the repo, set all `.env.local` values in the dashboard, deploy.
3. **Mailjet:** Verify your sender domain or use the sandbox.
4. **Seed:** Run `npm run seed` once locally (or via the Vercel build command) to populate the database.

## 🗂 Project Structure

See [docs/STRUCTURE.md](docs/STRUCTURE.md).

## 🔐 Roles & Permissions

| Permission           | ADMIN | STAFF |
| -------------------- | :---: | :---: |
| View inventory       | ✅    | ✅    |
| Create/Edit/Delete inventory | ✅ | ❌ |
| Create sales (POS)   | ✅    | ✅    |
| View reports         | ✅    | ✅    |
| Manage customers     | ✅    | ✅    |
| Manage suppliers     | ✅    | ❌    |
| Process returns/refunds | ✅ | ❌    |
| Manage users         | ✅    | ❌    |
| Manage settings      | ✅    | ❌    |
| View activity logs   | ✅    | ❌    |

## 📄 License

© SpeedWay Anointed Enterprise. All rights reserved.
