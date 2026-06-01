# Project Structure

```
.
├── public/                        Static assets
│   ├── icons/                     PWA icons
│   ├── manifest.json              PWA manifest
│   └── favicon.ico
├── scripts/
│   └── seed.ts                    Database seeder (npm run seed)
├── src/
│   ├── actions/                   Server Actions
│   │   ├── admin.ts               Users, settings, categories
│   │   ├── auth.ts                Login, password reset
│   │   ├── customers.ts           Customer CRUD
│   │   ├── inventory.ts           Product CRUD, stock adjustments
│   │   ├── notifications.ts       Notification CRUD
│   │   ├── reports.ts             Dashboard, sales, inventory, profit reports
│   │   ├── returns.ts             Return/refund handling
│   │   ├── sales.ts               Sale creation (with Mongoose transactions)
│   │   ├── stock.ts               Stock entry creation
│   │   └── suppliers.ts           Supplier CRUD
│   ├── app/
│   │   ├── (app)/                 Authenticated app (AppShell layout)
│   │   │   ├── dashboard/         KPIs, sales trend, top products
│   │   │   ├── inventory/         Product list, new, edit, detail, history, import
│   │   │   ├── stock-entries/     Stock-in list and form
│   │   │   ├── categories/        Category management
│   │   │   ├── suppliers/         Supplier list, new, edit
│   │   │   ├── customers/         Customer list, new, edit, detail
│   │   │   ├── pos/               Point of Sale
│   │   │   ├── sales/             Sale list, detail
│   │   │   ├── returns/           Returns list
│   │   │   ├── reports/           Sales / Inventory / Profit reports
│   │   │   ├── notifications/     Notification center
│   │   │   ├── admin/             Users, settings, activity
│   │   │   ├── profile/           Edit own profile
│   │   │   └── layout.tsx         Auth + sidebar shell
│   │   ├── api/                   Route handlers
│   │   │   ├── auth/[...nextauth]/  NextAuth
│   │   │   ├── receipts/[publicId]/pdf/  PDF receipt download
│   │   │   ├── inventory/import/  CSV import
│   │   │   ├── inventory/export/  Excel export
│   │   │   └── reports/{sales,inventory}/  PDF/Excel/CSV exports
│   │   ├── login/                 Sign in
│   │   ├── forgot-password/       Request reset link
│   │   ├── reset-password/        Set new password
│   │   ├── unauthorized/          403 page
│   │   ├── receipt/[publicId]/    Public receipt view
│   │   ├── robots.ts
│   │   ├── sitemap.ts
│   │   ├── layout.tsx             Root layout (theme, providers, fonts)
│   │   ├── page.tsx               Redirects to /dashboard or /login
│   │   ├── globals.css
│   │   └── providers.tsx
│   ├── components/
│   │   ├── admin/                 Settings form
│   │   ├── auth/                  Login, forgot, reset forms
│   │   ├── customers/             Form + actions
│   │   ├── dashboard/             Charts
│   │   ├── inventory/             Form, actions, stock form, category dialog
│   │   ├── layout/                AppShell, Header, Sidebar, PageHeader
│   │   ├── notifications/         Mark-all-read
│   │   ├── pos/                   POS client
│   │   ├── profile/               Profile form
│   │   ├── receipt/               Receipt actions
│   │   ├── sales/                 Sale actions
│   │   ├── suppliers/             Form + actions
│   │   └── ui/                    Shadcn primitives
│   ├── lib/
│   │   ├── activity.ts            Activity log helper
│   │   ├── auth.ts                NextAuth options
│   │   ├── constants.ts           App config, roles, permissions
│   │   ├── db.ts                  Mongoose connection
│   │   ├── mail.ts                Mailjet client + templates
│   │   ├── notifications.ts       Notification helper
│   │   ├── pdf.ts                 jsPDF generators
│   │   ├── qr.ts                  QR code helper
│   │   ├── rate-limit.ts          In-memory rate limiter
│   │   ├── session.ts             requireAuth / requireRole / requirePermission
│   │   ├── utils.ts               cn, formatCurrency, etc.
│   │   └── validations.ts         Zod schemas
│   ├── middleware.ts              Route protection
│   └── models/                    Mongoose models
├── docs/                          Documentation
├── .env.example
├── next.config.ts
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Data flow

- **Server Actions** are the primary mutation surface. They live in `src/actions/` and are invoked from client components.
- **Route handlers** (`src/app/api/`) are used for binary downloads (PDF/Excel/CSV) and CSV import.
- **Server Components** read directly from the database using the same `connectDB()` helper.
- **Auth** is enforced at three layers: middleware (route-level), `requireAuth/Role/Permission` (server-side), and conditional UI rendering.

## Stock movement audit trail

Every stock change writes an `InventoryTransaction` with the actor, type, before/after quantity, and reference. This is enforced inside Mongoose transactions in `createSale`, `createStockEntry`, and `refundSale`.
