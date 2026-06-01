# Deployment Guide — SpeedWay Anointed Enterprise

This guide covers deploying the app to **Vercel** with a **MongoDB Atlas** database and **Mailjet** for email.

## 1. MongoDB Atlas (Database)

1. Create a free account at <https://www.mongodb.com/cloud/atlas>.
2. **Create a cluster** (M0 free tier is fine for development/small stores).
3. Under **Database Access**, create a user with `readWrite` permissions on the `speedway` database.
4. Under **Network Access**, add `0.0.0.0/0` (Vercel uses dynamic IPs).
5. Click **Connect → Drivers**, copy the connection string. It looks like:
   ```
   mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/speedway?retryWrites=true&w=majority
   ```

## 2. Mailjet (Email — optional but recommended)

1. Sign up at <https://www.mailjet.com/>.
2. Verify your sender email (`speedwayanointedent@gmail.com`) or a custom domain.
3. Get your **API Key** and **Secret Key** from **Account Settings → API Keys**.
4. Free tier: 6,000 emails/month.

## 3. Vercel (Hosting)

### One-time setup

1. Push the repo to GitHub.
2. Sign in to <https://vercel.com/> with GitHub.
3. Click **Add New Project → Import** your repo.
4. Configure:
   - **Framework Preset:** Next.js (auto-detected)
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`
   - **Output Directory:** leave default
5. Add environment variables (see table below).
6. Click **Deploy**.

### Environment variables

Set these in **Vercel → Project → Settings → Environment Variables**:

| Key                     | Value                                                                |
| ----------------------- | -------------------------------------------------------------------- |
| `MONGODB_URI`           | Your Atlas connection string                                         |
| `NEXTAUTH_URL`          | `https://your-app.vercel.app`                                        |
| `NEXTAUTH_SECRET`       | 32+ char random string (`openssl rand -base64 32`)                   |
| `MAILJET_API_KEY`       | Mailjet API key                                                      |
| `MAILJET_SECRET_KEY`    | Mailjet secret key                                                   |
| `MAILJET_FROM_EMAIL`    | `speedwayanointedent@gmail.com` (verified sender)                    |
| `MAILJET_FROM_NAME`     | `SpeedWay Anointed Enterprise`                                       |
| `NEXT_PUBLIC_APP_URL`   | `https://your-app.vercel.app`                                        |

## 4. Seed the production database

After your first successful deploy, populate the production database:

### Option A — Run locally against production DB

Temporarily set `MONGODB_URI` in your local `.env.local` to the production connection string, then:

```bash
npm run seed
```

> ⚠️ This wipes the database first. Only run on a fresh database.

### Option B — Vercel build command

You can add a custom build script that runs the seed, but this isn't recommended for production (the seed wipes data). For an initial bootstrap:

1. In Vercel **Settings → Build & Development Settings**, change **Build Command** to:
   ```
   npm run seed && npm run build
   ```
2. Deploy. **Revert the build command** to just `npm run build` after the first successful deploy.

## 5. Custom Domain (optional)

1. In Vercel **Settings → Domains**, add your domain.
2. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://yourdomain.com`.
3. Re-deploy.

## 6. PWA Icons

The app expects these icon files in `/public/icons/`:

- `icon-192x192.png`
- `icon-512x512.png`
- `icon-512x512-maskable.png`
- `favicon.ico`

Generate them with <https://realfavicongenerator.net/>.

## 7. Cron / Background Jobs (future)

For low-stock daily emails and daily report emails, deploy a separate Vercel cron or use a third-party scheduler to hit:

- `POST /api/cron/daily-report` (auth-protected)
- `POST /api/cron/low-stock-alert`

These endpoints are not yet implemented; add them as you scale.

## 8. Monitoring

- **Vercel Analytics** — enable in the project settings
- **MongoDB Atlas Alerts** — set up CPU, connection, and storage alerts
- **Mailjet Stats** — monitor bounce/spam rates

## 9. Backups

Enable **Continuous Cloud Backups** on MongoDB Atlas (paid feature) or take manual snapshots weekly:

- Atlas → Cluster → … → **Take Snapshot**

## 10. Troubleshooting

- **"Mongoose connection timeout"** — check Atlas IP whitelist, connection string format
- **"Invalid NEXTAUTH_SECRET"** — must be at least 32 characters
- **Emails not sending** — verify Mailjet sender, check `MAILJET_API_KEY` and `MAILJET_SECRET_KEY`
- **Build fails with TypeScript errors** — run `npm run typecheck` locally
- **Middleware redirect loop** — verify `NEXTAUTH_URL` matches the deployment URL exactly
