create table if not exists public.page_stats (
  id text primary key,
  views bigint not null default 0 check (views >= 0),
  likes bigint not null default 0 check (likes >= 0),
  link_clicks bigint not null default 0 check (link_clicks >= 0)
);

insert into public.page_stats (id) values ('profile')
on conflict (id) do nothing;

alter table public.page_stats enable row level security;

drop policy if exists "Public stats are readable" on public.page_stats;
create policy "Public stats are readable"
on public.page_stats for select
to anon, authenticated
using (id = 'profile');

create or replace function public.increment_stat(stat_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.page_stats;
begin
  if stat_name not in ('views', 'likes', 'link_clicks') then
    raise exception 'Invalid stat';
  end if;

  update public.page_stats
  set
    views = views + (stat_name = 'views')::int,
    likes = likes + (stat_name = 'likes')::int,
    link_clicks = link_clicks + (stat_name = 'link_clicks')::int
  where id = 'profile'
  returning * into result;

  return to_jsonb(result);
end;
$$;

revoke all on function public.increment_stat(text) from public;
grant execute on function public.increment_stat(text) to anon, authenticated;
grant select on public.page_stats to anon, authenticated;
