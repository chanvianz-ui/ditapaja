-- Team invitation support. Invitations are created through a server route using Supabase Admin API.
alter table public.business_team_members
  add column if not exists member_email text;

drop policy if exists "Owners manage their team" on public.business_team_members;
create policy "Owners read their team" on public.business_team_members
  for select to authenticated using (owner_user_id = auth.uid());

-- No direct client writes: invitation and membership changes must go through trusted server routes.
revoke insert, update, delete on public.business_team_members from authenticated;
