-- EA VORTEX affiliate program: R200 commission per paid R600 bot sale.
-- Manual approval: an admin marks a referral "paid" after receiving the R600.
-- Minimum payout is R400 (40000 cents), enforced in admin_record_payout().
-- Run this whole script once in the SQL editor.

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  code text not null unique,
  full_name text not null default '',
  bank_name text not null default '',
  account_holder text not null default '',
  account_number text not null default '',
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_referrals (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  referred_label text not null default '',
  status text not null default 'signed_up' check (status in ('signed_up', 'paid', 'rejected')),
  commission_cents integer not null default 20000 check (commission_cents >= 0),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists affiliate_referrals_affiliate_idx on public.affiliate_referrals (affiliate_id);

create table if not exists public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  reference text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists affiliate_payouts_affiliate_idx on public.affiliate_payouts (affiliate_id);

alter table public.affiliates enable row level security;
alter table public.affiliate_referrals enable row level security;
alter table public.affiliate_payouts enable row level security;

-- Read-only access from the app: owners see their own rows, admins see all.
-- All writes go through the security-definer functions below.
drop policy if exists affiliates_select on public.affiliates;
create policy affiliates_select on public.affiliates for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists affiliate_referrals_select on public.affiliate_referrals;
create policy affiliate_referrals_select on public.affiliate_referrals for select to authenticated
  using (
    exists (select 1 from public.affiliates a where a.id = affiliate_id and a.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

drop policy if exists affiliate_payouts_select on public.affiliate_payouts;
create policy affiliate_payouts_select on public.affiliate_payouts for select to authenticated
  using (
    exists (select 1 from public.affiliates a where a.id = affiliate_id and a.user_id = auth.uid())
    or public.has_role(auth.uid(), 'admin')
  );

-- Balance owed = commissions on paid referrals minus payouts already recorded.
create or replace function public.affiliate_balance_cents(p_affiliate_id uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select sum(commission_cents) from public.affiliate_referrals
                    where affiliate_id = p_affiliate_id and status = 'paid'), 0)
       - coalesce((select sum(amount_cents) from public.affiliate_payouts
                    where affiliate_id = p_affiliate_id), 0);
$$;

-- Become an affiliate (creates a unique code). Safe to call twice.
create or replace function public.join_affiliate(p_full_name text)
returns public.affiliates
language plpgsql security definer set search_path = public as $$
declare
  rec public.affiliates;
  new_code text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into rec from public.affiliates where user_id = auth.uid();
  if found then return rec; end if;
  loop
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (select 1 from public.affiliates where code = new_code);
  end loop;
  insert into public.affiliates (user_id, code, full_name)
  values (auth.uid(), new_code, left(coalesce(trim(p_full_name), ''), 80))
  returning * into rec;
  return rec;
end;
$$;

create or replace function public.update_affiliate_payout(
  p_full_name text, p_bank_name text, p_account_holder text, p_account_number text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  update public.affiliates set
    full_name = left(coalesce(trim(p_full_name), ''), 80),
    bank_name = left(coalesce(trim(p_bank_name), ''), 80),
    account_holder = left(coalesce(trim(p_account_holder), ''), 80),
    account_number = left(coalesce(trim(p_account_number), ''), 40)
  where user_id = auth.uid();
  if not found then raise exception 'Join the affiliate program first'; end if;
end;
$$;

-- Called once after sign-up with the code from the referral link.
-- Returns: ok | invalid | self | exists | too_old
create or replace function public.claim_referral(p_code text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  aff public.affiliates;
  created timestamptz;
  label text;
begin
  if auth.uid() is null then return 'invalid'; end if;
  select * into aff from public.affiliates
    where code = upper(trim(p_code)) and status = 'active';
  if not found then return 'invalid'; end if;
  if aff.user_id = auth.uid() then return 'self'; end if;
  if exists (select 1 from public.affiliate_referrals where referred_user_id = auth.uid()) then
    return 'exists';
  end if;
  select created_at into created from auth.users where id = auth.uid();
  if created is null or created < now() - interval '7 days' then return 'too_old'; end if;
  select left(coalesce(nullif(trim(display_name), ''), split_part(email, '@', 1)), 2) || '***'
    into label from public.profiles where id = auth.uid();
  insert into public.affiliate_referrals (affiliate_id, referred_user_id, referred_label)
  values (aff.id, auth.uid(), coalesce(label, '***'))
  on conflict (referred_user_id) do nothing;
  return 'ok';
end;
$$;

-- Totals for the signed-in affiliate's portal.
create or replace function public.my_affiliate_summary()
returns json
language plpgsql stable security definer set search_path = public as $$
declare
  aff public.affiliates;
  signed integer; paid integer; rejected integer;
  earned integer; paid_out integer;
begin
  select * into aff from public.affiliates where user_id = auth.uid();
  if not found then return null; end if;
  select count(*) filter (where status = 'signed_up'),
         count(*) filter (where status = 'paid'),
         count(*) filter (where status = 'rejected'),
         coalesce(sum(commission_cents) filter (where status = 'paid'), 0)
    into signed, paid, rejected, earned
  from public.affiliate_referrals where affiliate_id = aff.id;
  select coalesce(sum(amount_cents), 0) into paid_out
    from public.affiliate_payouts where affiliate_id = aff.id;
  return json_build_object(
    'signed_up', signed, 'paid', paid, 'rejected', rejected,
    'pending_cents', signed * 20000,
    'earned_cents', earned,
    'paid_out_cents', paid_out,
    'balance_cents', earned - paid_out,
    'min_payout_cents', 40000
  );
end;
$$;

-- ---------- Admin-only functions ----------

create or replace function public.admin_affiliate_overview()
returns table (
  id uuid, code text, full_name text, email text, status text,
  bank_name text, account_holder text, account_number text,
  referrals_total bigint, referrals_paid bigint,
  earned_cents bigint, paid_out_cents bigint, balance_cents bigint,
  created_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admins only'; end if;
  return query
  select a.id, a.code, a.full_name, u.email::text, a.status,
         a.bank_name, a.account_holder, a.account_number,
         (select count(*) from public.affiliate_referrals r where r.affiliate_id = a.id),
         (select count(*) from public.affiliate_referrals r where r.affiliate_id = a.id and r.status = 'paid'),
         coalesce((select sum(r.commission_cents) from public.affiliate_referrals r
                    where r.affiliate_id = a.id and r.status = 'paid'), 0)::bigint,
         coalesce((select sum(p.amount_cents) from public.affiliate_payouts p
                    where p.affiliate_id = a.id), 0)::bigint,
         public.affiliate_balance_cents(a.id)::bigint,
         a.created_at
  from public.affiliates a
  join auth.users u on u.id = a.user_id
  order by a.created_at desc;
end;
$$;

create or replace function public.admin_affiliate_referrals()
returns table (
  id uuid, affiliate_name text, affiliate_code text, referred_email text,
  status text, commission_cents integer, created_at timestamptz, paid_at timestamptz
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admins only'; end if;
  return query
  select r.id, a.full_name, a.code, u.email::text, r.status, r.commission_cents, r.created_at, r.paid_at
  from public.affiliate_referrals r
  join public.affiliates a on a.id = r.affiliate_id
  join auth.users u on u.id = r.referred_user_id
  order by (r.status = 'signed_up') desc, r.created_at desc
  limit 300;
end;
$$;

-- Mark a referral paid (R600 received), rejected, or move it back to signed_up.
create or replace function public.admin_set_referral_status(p_referral_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  r public.affiliate_referrals;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admins only'; end if;
  if p_status not in ('signed_up', 'paid', 'rejected') then raise exception 'Bad status'; end if;
  select * into r from public.affiliate_referrals where id = p_referral_id for update;
  if not found then raise exception 'Referral not found'; end if;
  if r.status = 'paid' and p_status <> 'paid'
     and public.affiliate_balance_cents(r.affiliate_id) - r.commission_cents < 0 then
    raise exception 'This commission was already paid out, so it cannot be reversed';
  end if;
  update public.affiliate_referrals
     set status = p_status,
         paid_at = case when p_status = 'paid' then now() else null end
   where id = p_referral_id;
end;
$$;

-- Record an EFT payout. Enforces the R400 minimum and that it does not exceed the balance.
create or replace function public.admin_record_payout(p_affiliate_id uuid, p_amount_cents integer, p_reference text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  bal integer;
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admins only'; end if;
  perform 1 from public.affiliates where id = p_affiliate_id for update;
  if not found then raise exception 'Affiliate not found'; end if;
  bal := public.affiliate_balance_cents(p_affiliate_id);
  if p_amount_cents < 40000 then raise exception 'Minimum payout is R400'; end if;
  if p_amount_cents > bal then raise exception 'Amount is more than the balance owed'; end if;
  insert into public.affiliate_payouts (affiliate_id, amount_cents, reference)
  values (p_affiliate_id, p_amount_cents, left(coalesce(trim(p_reference), ''), 120));
end;
$$;

create or replace function public.admin_set_affiliate_status(p_affiliate_id uuid, p_status text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(), 'admin') then raise exception 'Admins only'; end if;
  if p_status not in ('active', 'suspended') then raise exception 'Bad status'; end if;
  update public.affiliates set status = p_status where id = p_affiliate_id;
end;
$$;

-- Only signed-in users may call these (each one also checks who is calling).
revoke all on function public.affiliate_balance_cents(uuid) from public, anon, authenticated;
revoke all on function public.join_affiliate(text) from public, anon;
revoke all on function public.update_affiliate_payout(text, text, text, text) from public, anon;
revoke all on function public.claim_referral(text) from public, anon;
revoke all on function public.my_affiliate_summary() from public, anon;
revoke all on function public.admin_affiliate_overview() from public, anon;
revoke all on function public.admin_affiliate_referrals() from public, anon;
revoke all on function public.admin_set_referral_status(uuid, text) from public, anon;
revoke all on function public.admin_record_payout(uuid, integer, text) from public, anon;
revoke all on function public.admin_set_affiliate_status(uuid, text) from public, anon;

grant execute on function public.join_affiliate(text) to authenticated;
grant execute on function public.update_affiliate_payout(text, text, text, text) to authenticated;
grant execute on function public.claim_referral(text) to authenticated;
grant execute on function public.my_affiliate_summary() to authenticated;
grant execute on function public.admin_affiliate_overview() to authenticated;
grant execute on function public.admin_affiliate_referrals() to authenticated;
grant execute on function public.admin_set_referral_status(uuid, text) to authenticated;
grant execute on function public.admin_record_payout(uuid, integer, text) to authenticated;
grant execute on function public.admin_set_affiliate_status(uuid, text) to authenticated;
