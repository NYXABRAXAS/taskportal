# API Task Management Portal

A Jira/ClickUp/Monday-style task portal for tracking API delivery status —
**Google Sheets is the database.** No PostgreSQL, MySQL, MongoDB, Firebase, or
Supabase involved. The backend reads and writes directly to your Google Sheet
through the Google Sheets API using a service account.

## How it works

- Your existing spreadsheet tab (**"Api list"**) is the single source of truth
  for every API task — same columns, same order, nothing renamed, plus an
  appended **Assigned Date** column the app maintains automatically.
- A **Users** tab (auto-created by the setup script) holds login credentials,
  roles (`Admin` / `Developer`), and each person's email address (used for
  notification emails — see below).
- An **ActivityLog** tab (auto-created) records every field-level change and
  every assignment/reassignment/due-date/completion notification — this is
  what powers the in-app notification bell.
- An **EmailAuditLog** tab (auto-created) records every email attempt: who,
  what action, which address, and whether it sent or failed.
- The **Pivot Table** tab is left untouched.

Each API moves through 4 stages (API Development → Deployment → Mobile
Integration → Web Integration), each with its own assignee. Stage 1 gates the
rest; once it's Completed, the other 3 open in parallel. Admins see and edit
everything; developers see every task they've ever been assigned to (for
history/filtering) but can only edit the stage(s) currently active for them.

## Project structure

```
server/   Node.js + Express API (Google Sheets API, JWT auth, no DB)
client/   React 19 + Vite + TypeScript + Tailwind frontend
```

## Prerequisites

1. A Google Cloud service account with the **Google Sheets API** enabled.
2. The target spreadsheet **shared with the service account's email as
   Editor** (Viewer is not enough — writes will fail with a permission
   error).
3. Node.js 18+.

## Server setup

```bash
cd server
npm install
cp .env.example .env   # fill in your service account + sheet details
npm run setup           # creates "Users" + "ActivityLog" + "EmailAuditLog" tabs, seeds admin/admin123
npm run dev              # http://localhost:5000
```

`npm run setup` is idempotent — safe to re-run. It seeds one admin account
(`admin` / `admin123`) if the Users tab is empty. **Change that password
immediately** via the Users page after your first login, or reset it from the
Users sheet directly.

To add developer accounts, either use the app's Users page (as Admin) or add
rows to the Users tab directly:

| Username | Password | Role | Full Name | Email | Status |
|---|---|---|---|---|---|
| mayank | ****** | Developer | Mayank | | Active |

The `Full Name` value must match the developer's name as it appears in the
`Api's` column of the Api list tab (case-insensitive) — that's how tasks are
scoped to a logged-in developer.

## Client setup

```bash
cd client
npm install
cp .env.example .env    # leave VITE_API_BASE_URL blank for local dev
npm run dev              # http://localhost:5173
```

In local dev, Vite's dev-server proxy forwards `/api` and `/uploads` to
`http://localhost:5000` — no CORS setup needed.

## Deployment

### Backend → Render

- Push this repo to GitHub, create a new **Web Service** on Render pointed at
  the `server/` directory (or use the included `server/render.yaml` as a
  Blueprint).
- Set the environment variables from `server/.env.example` in the Render
  dashboard (`GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`,
  `JWT_SECRET`, `CLIENT_ORIGIN` = your Vercel URL, `SMTP_*` for email, etc).
- `GOOGLE_PRIVATE_KEY` must keep its `\n` escapes — paste it exactly as it
  appears in the downloaded service-account JSON's `private_key` field.
- Note: file uploads are written to local disk (`server/uploads`) and Render's
  free-tier filesystem is ephemeral — uploaded attachments will not survive a
  redeploy. For persistent attachments, swap the storage in
  `server/src/routes/attachments.js` for an object store (e.g. Cloudinary, S3).

### Frontend → Vercel

- Import this repo, set the project root to `client/`.
- Set `VITE_API_BASE_URL` to your Render backend's URL (e.g.
  `https://api-task-portal-server.onrender.com`).
- The included `client/vercel.json` handles SPA routing rewrites.

### Docker (optional, local full-stack)

```bash
docker compose up --build
```

Runs the API on `:5000` and the built frontend behind nginx on `:8080`.

## Roles & permissions

**Admin** — create/delete users, reset passwords, assign/reassign APIs, edit
every column, delete/create tasks, import/export, view all dashboards and
reports.

**Developer** — see only their own tasks; update API/Deployment/Mobile/Web
status and dates, add remarks, upload a screenshot/document (max 20MB).
Cannot reassign, delete, or see other developers' tasks.

## Email notifications

The server sends email (via SMTP) and creates a matching in-app notification
whenever:

- a stage is assigned to someone for the first time
- a stage is reassigned (both the previous and new assignee are emailed)
- a stage's due date changes (the current assignee is emailed)
- a stage is marked Completed (every Admin is emailed)

Configure SMTP via `server/.env` (see `.env.example`): `SMTP_HOST`,
`SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_SECURE`, `SMTP_DOMAIN`, and
`PORTAL_URL` (used as the "log in here" link in emails). Leave `SMTP_HOST`
blank to disable email entirely — the app keeps working normally and just
logs "SMTP not configured" to the EmailAuditLog instead of sending.

Recipient addresses are **never hardcoded** — the app looks up each person's
email from the `Email` column of the Users tab at send time, matched against
the stage's assignee name. Keep that column up to date via the Users page (or
the sheet directly) and notification emails follow automatically.

A failed or skipped send is always logged to EmailAuditLog and never blocks,
delays, or fails the underlying task save — notifications are fired
fire-and-forget after the sheet write already succeeded.

## Notes on the sheet's data format

Dates in the sheet are plain strings (not real Google Sheets date values).
The API writes back using Sheets' `RAW` input mode deliberately — `USER_ENTERED`
would let Sheets reparse date-looking strings using the spreadsheet's locale
and silently transpose day/month on the next read. Keep writing dates as
`YYYY-MM-DD` (what the date pickers in this app send) to keep them
unambiguous.
