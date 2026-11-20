-- Tutor referral commission: make the running balance safe to change.
--
-- users.commission_balance was updated read-modify-write from three places
-- (Stripe webhook, referral bounty, admin payouts). Two of them running at
-- once -- a renewal webhook landing while an admin marks a payout -- lost one
-- of the writes, and the admin payout reset the balance to 0, wiping any
-- commission earned between loading the page and clicking. Every change now
-- goes through one atomic increment.
--
-- It is also the number an admin pays out by hand, so a signed-in tutor must
-- not be able to write it through the API.

create or replace function public.adjust_commission_balance(p_user_id uuid, p_delta numeric)
returns numeric
language sql
security definer
set search_path = public
as $$
  update public.users
  set commission_balance = round(coalesce(commission_balance, 0) + p_delta, 2)
  where id = p_user_id
  returning commission_balance;
$$;

revoke all on function public.adjust_commission_balance(uuid, numeric) from public, anon, authenticated;

-- Same shape as guard_affiliate_attribution (20261014_affiliates.sql): an API
-- caller's write to the column is dropped, not rejected, so a profile save that
-- sends the whole row keeps working. The service role and direct SQL can write.
create or replace function public.guard_commission_balance()
returns trigger
language plpgsql
as $$
begin
  if auth.role() in ('authenticated', 'anon') then
    new.commission_balance := old.commission_balance;
  end if;
  return new;
end;
$$;

drop trigger if exists users_guard_commission_balance on public.users;
create trigger users_guard_commission_balance
  before update of commission_balance on public.users
  for each row execute function public.guard_commission_balance();

-- The webhook now checks for an existing row before paying commission on an
-- invoice period, so a Stripe retry cannot pay twice. This index keeps that
-- lookup cheap. (Not unique: older duplicate rows may already exist.)
create index if not exists commission_ledger_period_idx
  on public.commission_ledger (subscription_id, period_start)
  where kind = 'subscription_share';
