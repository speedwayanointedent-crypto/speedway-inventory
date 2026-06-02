# AGENTS.md

> Notes for AI coding agents (and human contributors) working in the **SpeedWay Anointed Enterprise** codebase. Read this before making non-trivial changes.

## Quick reference

- **Stack:** Next.js 16 (App Router, RSC, Server Actions, Turbopack), TypeScript 5, MongoDB + Mongoose 8, NextAuth 4, Tailwind 3, Shadcn UI, Recharts, ExcelJS, PapaParse, jsPDF, Zod.
- **App name:** `SpeedWay Anointed Enterprise` — wholesale spare-parts POS in Accra, Ghana.
- **Currency:** GHS (`GH₵` symbol).
- **Run:** `npm run dev` (port 3000), `npm run build` to verify production readiness, `npm run typecheck` and `npm run lint` to gate changes.

## Project layout

```
src/
  actions/         ← one file per resource, all "use server"; inline permission gates
  app/
    (app)/         ← protected app routes (uses shared AppShell, requires auth)
    (auth)/        ← public auth pages (login, signup, reset-password)
    api/           ← REST endpoints (export, report downloads, csv import)
  components/
    layout/        ← AppShell, Sidebar, BottomNav, PageHeader, FilterSelect, SearchInput, Pagination
    inventory/     ← stock-entry-form, product-form, supplier-return-form, etc.
    dashboard/     ← SalesTrendChart (recharts, "use client")
    reports/       ← server-component-friendly chart wrappers
    ui/            ← Shadcn primitives
  lib/             ← db, session, auth, constants, validations, utils, notifications, activity, mail, pdf
  models/          ← Mongoose schemas (barrel re-exported via models/index.ts)
```

## Conventions

### Server Actions
- File starts with `"use server"`.
- First line of mutating action: `const user = await requirePermission(PERMISSIONS.X);`
- First line of read: `const user = await requireAuth();` (or `requirePermission(...)` if gated).
- Wrap any multi-document writes in `mongoose.startSession()` + `session.withTransaction(...)`.
- Always call `revalidatePath()` for affected pages before returning.
- Return shape: `{ success: boolean, error?: string, id?: string, ... }` — never throw to the client.
- After a successful mutation, call `await logActivity(user, {...})` and (for user-visible events) `await createNotification({...})`.

### Permission constants
All in `src/lib/constants.ts` (`PERMISSIONS`, `NOTIFICATION_TYPES`, etc.). Add new permissions to the enum AND to `ROLE_PERMISSIONS` for both ADMIN and STAFF as appropriate. When the model schema for `Notification.type` references enum strings, also add them to `src/models/Notification.ts`.

### Validation
- All input validated with Zod in `src/lib/validations.ts`.
- Schemas should be `z.coerce.number()` for form numeric inputs.
- Use `.default("X")` so missing optional fields have safe values.

### UI / components
- Use `cn()` from `@/lib/utils` for className merging.
- Prefer Shadcn primitives from `@/components/ui/*`.
- Use `lucide-react` for icons; **never** use emojis unless explicitly requested.
- PageHeader takes a `title`, optional `description` and `children` (action buttons). **Title/description can be ReactNode** to support badges / links.
- Tables: prefer `<Table>` from `@/components/ui/table` with `TableHeader`/`TableBody` etc.
- Charts: recharts only in `"use client"` components. Server pages must wrap charts in a client component (see `src/components/dashboard/sales-trend-chart.tsx` or `src/components/reports/stock-intake-chart.tsx`).
- Use the existing StatCard pattern from `dashboard/page.tsx` (or `StatTile` from inventory page) for KPI tiles.

### Responsive / mobile
- Designed mobile-first. Use Tailwind's `sm:`, `md:`, `lg:` prefixes.
- Use `flex-wrap` on action rows; stack filters with `flex-col sm:flex-row`.
- Hide secondary buttons on small screens with `hidden sm:inline-flex` and expose them via kebab menu or compact icons.
- Tables: use the `hidden md:block` (desktop table) + `md:hidden divide-y` (mobile cards) pattern.
- Bottom nav is in `src/components/layout/bottom-nav.tsx` for primary mobile navigation.

### Numbering conventions
- Sale: `SW-YYYYMMDD-XXXX`
- Stock intake: `STK-YYYYMMDD-XXXX`
- Supplier return: `SRT-YYYYMMDD-XXXX`
- Return: `RET-{timestamp}` (existing)
- Generator helpers in `src/lib/utils.ts`: `generateSaleNumber`, `generateStockReferenceNumber`, `generateSupplierReturnReferenceNumber`, `generateProductCode`, `generateSKU`.

### Routes / navigation
- Sidebar groups live in `src/components/layout/sidebar.tsx` (single NAV constant).
- New sidebar item: add to appropriate group, set `permission: PERMISSIONS.X` and/or `adminOnly: true`.
- Reports hub at `src/app/(app)/reports/page.tsx` (REPORTS array) — new reports go here.

## Critical: MongoDB transactions

**`session.withTransaction(...)` requires a replica set.** This is non-negotiable for Mongoose 8.

- ✅ **Works on MongoDB Atlas (any tier, M0+):** Atlas clusters are replica sets even on the free M0 tier.
- ❌ **Does NOT work on a local standalone `mongod`:** transactions will throw `IllegalOperation` or `Transaction numbers are only allowed on a replica set member or mongos`.
- ✅ **For local dev with Docker:** use the official image with `--replSet rs0` and run `rs.initiate()`.
  ```bash
  docker run -d --name mongo -p 27017:27017 mongo:7 --replSet rs0
  docker exec mongo mongosh --eval 'rs.initiate()'
  ```
  Then point your `MONGODB_URI` at `mongodb://localhost:27017/speedway?replicaSet=rs0`.
- ✅ **For Vercel + Atlas:** no extra config — Atlas handles it.

If you ever see `Transaction numbers are only allowed on a replica set member or mongos` in the logs, the connection string is hitting a standalone instance. Fix the cluster first; do NOT add try/catch fallbacks that hide this error.

Affected actions (any code path that calls `mongoose.startSession()`):
- `src/actions/stock.ts` — `createStockEntry`, `updateStockEntry`, `cancelStockEntry`, `recordSupplierPayment`, `bulkCreateStockEntry`
- `src/actions/supplier-returns.ts` — `createSupplierReturn`, `updateSupplierReturn`, `cancelSupplierReturn`
- `src/actions/returns.ts` — `createReturn`
- `src/actions/sales.ts` — `createSale`

## Things to NEVER do

- **Don't** use emojis in code or commit messages.
- **Don't** import server-only code (Mongoose, fs, secrets) into client components. All `actions/*` files start with `"use server"` and must stay server-only.
- **Don't** skip `revalidatePath` after a mutation — the page will be stale.
- **Don't** add `try { ... } catch { ... }` around transactions to "fall back" — see replica set note above.
- **Don't** introduce a new permission without updating `ROLE_PERMISSIONS` for both roles and `Notification.model` enum if it's a new notification type.
- **Don't** write to the DB without a permission check.
- **Don't** store secrets in code or commit them.

## Testing the build before commit

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm run build       # full Next.js production build
```

A green build across all three is the bar for "production ready". A pre-existing lint error in `src/app/global-error.tsx` and pre-existing warnings in some files are out of scope; **don't** introduce new ones.

## Key business rules

- **Stock intake** (stock-entries): multi-product; on insert, increase `Product.quantity`, write `InventoryTransaction` (`type: STOCK_IN`), update `Supplier.totalPurchases/Paid/Due`. Cancellation reverses these atomically.
- **Sales** (POS): on completion, decrease `Product.quantity`, write `InventoryTransaction` (`type: SALE`), update `Customer.totalSpending`.
- **Sale returns** (returns): optional `restoreInventory` puts stock back and writes `InventoryTransaction` (`type: RETURN`).
- **Supplier returns** (supplier-returns): per-line `restockable` controls whether the qty is removed from `Product.quantity`; non-restockable items stay in inventory (recorded as `DAMAGED`). Cancellation restores the qty for restockable items.
- **Reorder level**: a product is "low stock" when `quantity > 0 && quantity <= reorderLevel`. `quantity <= 0` is "out of stock". The `reorderLevel` field defaults to 10 but is configurable per product.

## Where to look first for a new feature

1. **Permission** — `src/lib/constants.ts` `PERMISSIONS` (add if needed)
2. **Model** — `src/models/X.ts` + `src/models/index.ts` (re-export)
3. **Validation** — `src/lib/validations.ts` Zod schema + type export
4. **Action** — `src/actions/X.ts` (start with the right `requirePermission`)
5. **Pages** — `src/app/(app)/X/` (list, new, [id], edit) following stock-entries as template
6. **UI** — `src/components/X/` (form components, "use client")
7. **Reports** — `src/app/(app)/reports/X/page.tsx` + `src/app/api/reports/X/route.ts`
8. **Sidebar / Reports hub** — `src/components/layout/sidebar.tsx`, `src/app/(app)/reports/page.tsx`
9. **Dashboard widget (optional)** — `src/app/(app)/dashboard/page.tsx` + `src/actions/reports.ts` `getDashboardMetrics`
