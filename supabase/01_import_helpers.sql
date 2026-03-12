-- Family Dues Tracker - Import helper SQL

create table if not exists public.staging_contributions (
  member_name text,
  amount numeric(12,2),
  date_paid date,
  month int,
  year int,
  payment_method text,
  remarks text,
  sheet text
);

-- After importing staging_contributions, run:
insert into public.contributions(member_id, amount, date_paid, month, year, payment_method, remarks)
select m.id, s.amount, s.date_paid, s.month, s.year, s.payment_method, s.remarks
from public.staging_contributions s
join public.members m on m.member_name = s.member_name;

-- Optional cleanup:
-- truncate table public.staging_contributions;
