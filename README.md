
# Family Dues Tracker

A secure, modern web app for family members to **view their contributions** (by month/year/total) and for admins to manage approvals and contributions.

## Key Features
- Self-registration (members sign up)
- Admin approval to securely link accounts to contribution records
- Members can only see their own contributions (database-enforced Row Level Security)
- Admin dashboard: approve members, add contributions
- Realtime updates: dashboards refresh automatically when contributions are added/edited

## Tech Stack
- Next.js (App Router) + TypeScript
- TailwindCSS
- Supabase (Auth + Postgres + RLS + Realtime)

---

## Step-by-step Deployment (Zero cost)

### A) Supabase (backend)
1. Create a Supabase project.
2. Go to **SQL Editor** and run `supabase/00_schema.sql`.
   - This includes the admin allowlist: `mcphyltetteh@gmail.com`.
3. Run `supabase/01_import_helpers.sql`.

### B) Import your initial Excel data
We included cleaned CSV files in `data/`:
- `data/members_import.csv`
- `data/contributions_import.csv`

**Import Members**
1. Supabase → Table Editor → `members` → **Import data** → upload `members_import.csv`.

**Import Contributions**
1. Supabase → Table Editor → `staging_contributions` → **Import data** → upload `contributions_import.csv`.
2. Run this in SQL Editor:

```sql
insert into public.contributions(member_id, amount, date_paid, month, year, payment_method, remarks)
select m.id, s.amount, s.date_paid, s.month, s.year, s.payment_method, s.remarks
from public.staging_contributions s
join public.members m on m.member_name = s.member_name;
```

3. Optional cleanup:

```sql
truncate table public.staging_contributions;
```

### C) Next.js (frontend)
1. Copy `.env.example` to `.env.local` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

2. Install and run locally:

```bash
npm install
npm run dev
```

3. Deploy to Vercel:
- Push this project to GitHub.
- Vercel → New Project → Import repo.
- Add the same env vars in Vercel.
- Deploy.

---

## How Admin Approval Works
- Members sign up on `/register`.
- The app inserts a record into `link_requests` (pending).
- Admin visits `/admin`, links the request to the correct `members` record, and approves.
- After approval, the member can see their contributions.

