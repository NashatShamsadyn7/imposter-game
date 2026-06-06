-- ═══════════════════════════════════════════════════════════
--  Cosmetics economy — دراو (coins) + کۆمەتیکی کڕدراو + بەرکراوەکان
--  ئەمە ئەو ستوون و فەنکشنانە دروست دەکات کە EconomyContext پێیان
--  هاوکات دەبێت. بەبێ مەترسی (additive) — دەتوانرێت دووبارە بکرێتەوە.
--  جێبەجێکردن: لە Supabase → SQL Editor ئەم فایلە بلکێنە و Run بکە.
-- ═══════════════════════════════════════════════════════════

-- ───── ستوونەکان لەسەر profiles ─────
alter table public.profiles add column if not exists coins integer not null default 0;
alter table public.profiles add column if not exists owned_cosmetics text[] not null default '{}';
alter table public.profiles add column if not exists equipped_cosmetics jsonb not null default '{}'::jsonb;

-- ───── زیادکردنی دراو بۆ خۆم (atomic) ─────
create or replace function public.add_coins(amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
begin
  if amount is null or amount <= 0 then
    select coins into new_balance from profiles where id = auth.uid();
    return coalesce(new_balance, 0);
  end if;
  update profiles
     set coins = coins + amount
   where id = auth.uid()
   returning coins into new_balance;
  return coalesce(new_balance, 0);
end;
$$;

-- ───── کڕینی کۆمەتیک (atomic): پشکنینی باڵانس + لابردن + زیادکردن ─────
create or replace function public.purchase_cosmetic(cosmetic_id text, price integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cur integer;
  cur_owned text[];
begin
  select coins, owned_cosmetics
    into cur, cur_owned
    from profiles
   where id = auth.uid()
   for update;

  if cur is null then
    return jsonb_build_object('ok', false, 'reason', 'no_profile');
  end if;
  if cur_owned @> array[cosmetic_id] then
    return jsonb_build_object('ok', false, 'reason', 'owned', 'coins', cur, 'owned', to_jsonb(cur_owned));
  end if;
  if cur < price then
    return jsonb_build_object('ok', false, 'reason', 'insufficient', 'coins', cur);
  end if;

  update profiles
     set coins = coins - price,
         owned_cosmetics = array_append(owned_cosmetics, cosmetic_id)
   where id = auth.uid()
   returning coins, owned_cosmetics into cur, cur_owned;

  return jsonb_build_object('ok', true, 'coins', cur, 'owned', to_jsonb(cur_owned));
end;
$$;

-- ───── بەرکردنی کۆمەتیک (equip) ─────
create or replace function public.set_equipped(equipped jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles
     set equipped_cosmetics = coalesce(equipped, '{}'::jsonb)
   where id = auth.uid();
end;
$$;

-- ───── گواستنەوەی داتای ناوخۆیی (localStorage) بۆ سێرڤەر — یەکجارە ─────
-- تەنها کاتێک کارگەری دەکات کە owned ـی db بەتاڵ بێت (بۆ ئەوەی داتای
-- مەوجود نەسڕێتەوە). coins ـی گەورەتر دەپارێزرێت.
create or replace function public.restore_economy(p_coins integer, p_owned text[], p_equipped jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cur_coins integer;
  cur_owned text[];
  cur_equipped jsonb;
begin
  select coins, owned_cosmetics into cur_coins, cur_owned
    from profiles where id = auth.uid() for update;
  if cur_owned is null then
    return jsonb_build_object('ok', false, 'reason', 'no_profile');
  end if;
  -- db پێشتر داتای هەیە → دەستی لێ مەدە
  if array_length(cur_owned, 1) is not null and array_length(cur_owned, 1) > 0 then
    return jsonb_build_object('ok', false, 'reason', 'has_data',
      'coins', cur_coins, 'owned', to_jsonb(cur_owned));
  end if;
  update profiles
     set owned_cosmetics = coalesce(p_owned, '{}'),
         equipped_cosmetics = coalesce(p_equipped, '{}'::jsonb),
         coins = greatest(coalesce(coins, 0), coalesce(p_coins, 0))
   where id = auth.uid()
   returning coins, owned_cosmetics, equipped_cosmetics
        into cur_coins, cur_owned, cur_equipped;
  return jsonb_build_object('ok', true, 'coins', cur_coins,
    'owned', to_jsonb(cur_owned), 'equipped', cur_equipped);
end;
$$;

-- ───── ڕێگەپێدان بۆ بەکارهێنەرە چوونەژوورەوەکان ─────
grant execute on function public.add_coins(integer) to authenticated;
grant execute on function public.purchase_cosmetic(text, integer) to authenticated;
grant execute on function public.set_equipped(jsonb) to authenticated;
grant execute on function public.restore_economy(integer, text[], jsonb) to authenticated;
