# MFMCF FUTA PRIESTS OF GOD GENERATION — Voting System

Next.js App Router conversion of the verify → vote → success flow.

## Stack
- **Frontend:** Next.js 14 (App Router, TS) — all pages under `app/`, no Next API routes
- **Backend:** a single Express app (`server/app.ts`), deployed as **one** Vercel
  serverless function (`api/index.ts`). `vercel.json` rewrites every
  `/api/*` request to that function; Express dispatches internally by
  `req.url`, same as it would on any plain Node host.
- **DB/ORM:** Prisma + Supabase Postgres
- **Auth:** Supabase Auth (email/password, `app_metadata` role: `admin` | `superadmin`)
- **Rate limiting:** Upstash Redis
- **Deploy:** Vercel — frontend and API build from the same repo/install

### Why one function instead of one-per-route
Everything backend-related lives under `server/`, and only `api/index.ts`
sits inside the `/api` directory. Vercel turns every file under `/api` into
its own function by default — keeping just one file there means one cold
start and one shared Express instance handling all routes, instead of 8
separate lambdas each re-importing Prisma/Supabase.

### A known gotcha if session cookies misbehave
`server/lib/supabase.ts` adapts `@supabase/ssr`'s cookie interface to
Express's `res.cookie`. `@supabase/ssr` hands cookie `maxAge` in **seconds**
(the Set-Cookie convention); Express expects **milliseconds**. The adapter
converts this, but if admin sessions ever expire suspiciously fast or don't
expire at all, this conversion is the first thing to check.

### Local setup
```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run seed
npm run dev            # Next dev server — note: Next's dev server does NOT
                        # run vercel.json rewrites, so in local dev hit the
                        # Express routes directly at the same /api/* paths;
                        # `vercel dev` (Vercel CLI) is the accurate way to
                        # test the rewrite + function setup locally.
```

### Deploy to Vercel
1. Push to GitHub, import the repo in Vercel.
2. Add the env vars below in Project Settings.
3. Vercel runs `prisma generate && next build` (the `build` script) first,
   then bundles `api/index.ts` — Prisma's generated client already exists
   in `node_modules/.prisma` by the time the function is packaged, since
   generate happens before the function build.
4. Run `npx prisma migrate deploy` once against production.

## Admin area
- `/admin/login` — email/password sign in only. There's no public sign-up —
  admin accounts are created by a **superadmin** from `/admin/manage`.
- Roles live in Supabase's `app_metadata` (`admin` or `superadmin`), which is
  only writable via the service-role key — a regular admin can't grant
  themselves superadmin by editing their own profile.
- `/admin/manage` (superadmin only) — invite new admins, promote/demote
  between `admin`/`superadmin`, deactivate (ban) or permanently delete an
  account. A superadmin can't demote, deactivate, or delete themselves from
  this screen, to avoid an accidental lockout.
- `/admin/workers` — roster table (search, unit filter, pagination), add a
  worker manually, or bulk-import a CSV with `name,unit` columns via
  `/api/admin/workers/bulk`.
- `middleware.ts` protects `/admin/*` pages (redirects to `/admin/login`
  without a session, redirects non-superadmins away from `/admin/manage`).
  API-level auth for `/api/admin/*` is enforced separately inside Express
  (`server/lib/auth.ts`), since those requests bypass Next entirely.

### Creating your first superadmin
There's no signup form, so bootstrap one from the command line:
```bash
npm run bootstrap:superadmin -- --name "Jane Doe" --email jane@example.com --password "at-least-8-chars"
```
Sign in at `/admin/login` with those credentials, then invite everyone else
from `/admin/manage`.

## How duplicate-vote prevention works
- On verify, `(name, unit)` is normalized and hashed into `identityHash`,
  which is the `Voter` table's unique key. Same person verifying twice just
  logs back into the same voter row instead of creating a duplicate.
- The `Vote` table has a `@@unique([voterId, categoryId])` constraint, so a
  second vote in the same category for the same voter is rejected at the DB
  level (`P2002` error caught in `/api/votes`) — you get atomicity for free
  instead of relying on client-side state.
- The voter's session cookie only lives 30 minutes, so a shared kiosk device
  naturally resets between people ("Cast Another Vote" just clears cookie by
  re-verifying).

## Next steps to harden for a real election
- Add an admin route (protected, e.g. via a simple password or NextAuth) to
  create categories/nominees and view live tallies.
- If you want to stop the *same person* voting from a different device, swap
  the identity model for something stronger (e.g. a per-member access code
  emailed via Resend) instead of self-declared name + unit.
- Add a results/aggregation API route once voting closes (`GROUP BY nomineeId`
  via Prisma `groupBy`).
