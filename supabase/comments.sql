-- Profile comments (guns.lol style): top-level notes, one level of replies,
-- and per-comment like counts. Run once in the Supabase SQL editor.
-- (If you already ran an earlier comments.sql, this replaces it cleanly.)
-- Moderation = delete rows here; there is no in-app delete.

create table if not exists public.comments (
  id bigint generated always as identity primary key,
  parent_id bigint null references public.comments (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 500),
  likes bigint not null default 0 check (likes >= 0),
  created_at timestamptz not null default now()
);

-- in case this runs over the earlier no-replies version
alter table public.comments add column if not exists parent_id bigint null references public.comments (id) on delete cascade;
alter table public.comments add column if not exists likes bigint not null default 0;

create index if not exists comments_created_at_idx
  on public.comments (created_at desc);
create index if not exists comments_parent_id_idx
  on public.comments (parent_id, created_at desc);

alter table public.comments enable row level security;

drop policy if exists "Comments are readable" on public.comments;
create policy "Comments are readable"
on public.comments for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can post" on public.comments;
create policy "Anyone can post"
on public.comments for insert
to anon, authenticated
with check (true);

create or replace function public.increment_comment_likes(comment_id bigint)
returns bigint
language plpgsql
-- Deliberately definer: clients may call this one atomic increment, but never
-- receive UPDATE permission on the table itself.
security definer
set search_path = ''
as $$
declare
  new_count bigint;
begin
  update public.comments
  set likes = likes + 1
  where id = comment_id
  returning likes into new_count;

  if new_count is null then
    raise exception 'Comment not found';
  end if;
  return new_count;
end;
$$;

revoke all on function public.increment_comment_likes(bigint) from public;
grant execute on function public.increment_comment_likes(bigint) to anon, authenticated;
revoke all on table public.comments from anon, authenticated;
grant select, insert on table public.comments to anon, authenticated;
grant usage, select on sequence public.comments_id_seq to anon, authenticated;
