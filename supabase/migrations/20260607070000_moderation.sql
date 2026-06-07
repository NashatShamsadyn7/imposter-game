-- ═══════════════════════════════════════════════════════════
--  بەڕێوەبردنی ڕاپۆرتەکان (Moderation) — تەنها بەڕێوەبەر
--  بەڕێوەبەر دەتوانێت ڕاپۆرتە کۆکراوەکان ببینێت و یاریزان «حظر» بکات.
--
--  جێبەجێکردن: supabase db push  یان لە SQL Editor ـدا ڕایبکێشە.
-- ═══════════════════════════════════════════════════════════

-- ───── ئاڵای حظر لەسەر پرۆفایل ─────
alter table public.profiles add column if not exists banned boolean not null default false;

-- ───── لیستی ڕاپۆرتە کۆکراوەکان (بەپێی یاریزانی ڕاپۆرتکراو) ─────
create or replace function public.admin_reports()
returns table (
  reported_id uuid, display_name text, avatar_url text,
  cnt bigint, last_at timestamptz, banned boolean
) as $$
  select r.reported_id,
         coalesce(p.display_name, '—') as display_name,
         p.avatar_url,
         count(*)::bigint as cnt,
         max(r.created_at) as last_at,
         coalesce(p.banned, false) as banned
  from public.reports r
  left join public.profiles p on p.id = r.reported_id
  where public.am_i_admin()
  group by r.reported_id, p.display_name, p.avatar_url, p.banned
  order by count(*) desc, max(r.created_at) desc;
$$ language sql security definer stable;

grant execute on function public.admin_reports() to authenticated;

-- ───── حظر/لابردنی حظری یاریزان ─────
create or replace function public.admin_set_ban(p_user uuid, p_banned boolean)
returns void as $$
begin
  if not public.am_i_admin() then raise exception 'تەنها بەڕێوەبەر'; end if;
  update public.profiles set banned = p_banned where id = p_user;
end;
$$ language plpgsql security definer;

grant execute on function public.admin_set_ban(uuid, boolean) to authenticated;
