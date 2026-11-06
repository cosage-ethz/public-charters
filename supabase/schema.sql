-- Public Charters / Charter Kit: database schema for Supabase (Postgres 15+).
-- Run once in the Supabase SQL editor of a new project, then run seed.sql.
-- Follows DATA_MODEL.md. Raw contributions are written by members through
-- the browser (guarded by row-level security); derived tables are written
-- only by pipeline jobs that use the service-role key.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Structure
-- ---------------------------------------------------------------------------

create table public.space (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null check (slug ~ '^[a-z0-9-]{2,60}$'),
  name            text not null,
  access          text not null default 'invite' check (access in ('open', 'invite')),
  parent_space_id uuid references public.space(id),
  -- Process settings per space, for example
  -- {"panel_size": 12, "quotas": {"role": {"nurse": 0.4}}, "points_budget": 100}
  settings        jsonb not null default '{}'::jsonb,
  created_by      uuid references auth.users(id) default auth.uid(),
  created_at      timestamptz not null default now()
);

create table public.membership (
  space_id  uuid not null references public.space(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      text not null check (role in ('member', 'panel', 'admin')),
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id, role)
);

create table public.invitation (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.space(id) on delete cascade,
  token       text unique not null default encode(gen_random_bytes(18), 'hex'),
  role        text not null default 'member' check (role in ('member', 'admin')),
  max_uses    int  not null default 1 check (max_uses > 0),
  uses        int  not null default 0,
  expires_at  timestamptz not null default now() + interval '14 days',
  note        text,
  created_by  uuid references auth.users(id) default auth.uid(),
  created_at  timestamptz not null default now()
);

create table public.charter_version (
  id                uuid primary key default gen_random_uuid(),
  space_id          uuid not null references public.space(id) on delete cascade,
  label             text not null,
  parent_version_id uuid references public.charter_version(id),
  status            text not null default 'draft' check (status in ('draft', 'published')),
  created_at        timestamptz not null default now(),
  published_at      timestamptz
);

create table public.clause (
  id                 uuid primary key default gen_random_uuid(),
  charter_version_id uuid not null references public.charter_version(id) on delete cascade,
  article            int  not null,
  article_title      text not null,
  number             text not null,          -- for example '4.3'
  text               text not null,
  position           int  not null default 0,
  unique (charter_version_id, number)
);

-- ---------------------------------------------------------------------------
-- Contributions (raw input)
-- ---------------------------------------------------------------------------

create table public.proposal (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references public.space(id) on delete cascade,
  clause_id  uuid not null references public.clause(id) on delete cascade,
  author_id  uuid not null references auth.users(id) default auth.uid(),
  op         text not null check (op in ('replace', 'insert', 'delete')),
  -- {"quote": "must be refused", "start": 17, "end": 32}; for an insert, start = end
  anchor     jsonb not null,
  new_text   text not null default '',
  rationale  text not null default '',
  created_at timestamptz not null default now(),
  check (op = 'delete' or length(new_text) > 0)
);

create table public.test_case (
  id                  uuid primary key default gen_random_uuid(),
  space_id            uuid not null references public.space(id) on delete cascade,
  proposal_id         uuid references public.proposal(id) on delete set null,
  clause_id           uuid references public.clause(id) on delete set null,
  author_id           uuid not null references auth.users(id) default auth.uid(),
  prompt              text not null,
  must                text not null default '',   -- what a good answer does
  must_not            text not null default '',   -- what a good answer avoids
  today               text not null default '',   -- how the current model tends to answer
  with_edit           text not null default '',   -- how it should answer with the edit
  origin              text not null default 'human' check (origin in ('human', 'llm')),
  status              text not null default 'draft' check (status in ('draft', 'confirmed', 'retired')),
  tier                text not null default 'normal' check (tier in ('must_pass', 'normal')),
  split               text check (split in ('train', 'heldout')),  -- set by the pipeline
  updated_at          timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  check (proposal_id is not null or clause_id is not null)
);

-- Every edit of a test case keeps the previous text here.
create table public.test_case_revision (
  id           uuid primary key default gen_random_uuid(),
  test_case_id uuid not null references public.test_case(id) on delete cascade,
  editor_id    uuid references auth.users(id),
  prompt       text not null,
  must         text not null,
  must_not     text not null,
  today        text not null,
  with_edit    text not null,
  status       text not null,
  created_at   timestamptz not null default now()
);

-- Generic input: votes, ratings, pairwise choices, priority points, ...
create table public.judgement (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.space(id) on delete cascade,
  user_id     uuid not null references auth.users(id) default auth.uid(),
  target_type text not null check (target_type in ('proposal', 'test_case', 'slate', 'clause', 'space')),
  target_id   uuid not null,
  -- 'rating' | 'vote' | 'points' | 'pairwise' | 'survey_pre' | 'survey_post' | 'consent' | ...
  -- Space-wide answers (surveys, priority points) use target_type 'space' and target_id = space id.
  kind        text not null,
  value       jsonb not null,
  created_at  timestamptz not null default now(),
  unique (user_id, target_type, target_id, kind)
);

-- Optional, access-restricted. Read only by its owner and by pipeline jobs.
create table public.profile (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  demographics jsonb not null default '{}'::jsonb,
  consent      boolean not null default false,
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Derived (written by pipeline jobs with the service-role key)
-- ---------------------------------------------------------------------------

create table public.aggregation_run (
  id             uuid primary key default gen_random_uuid(),
  space_id       uuid not null references public.space(id) on delete cascade,
  method         text not null,      -- 'bridging' | 'majority' | 'gsc_slates' | ...
  method_version text not null,
  params         jsonb not null default '{}'::jsonb,
  scope          jsonb not null default '{}'::jsonb,
  input_ids      uuid[] not null default '{}',   -- explicit snapshot of contribution ids
  created_at     timestamptz not null default now()
);

-- "group" is a reserved word in SQL, hence cohort.
create table public.cohort (
  id       uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.space(id) on delete cascade,
  run_id   uuid references public.aggregation_run(id) on delete cascade,
  kind     text not null check (kind in ('declared', 'emergent')),
  label    text not null,
  size     int  not null default 0
);

create table public.cohort_member (
  cohort_id uuid not null references public.cohort(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  weight    double precision not null default 1,
  primary key (cohort_id, user_id)
);

create table public.score (
  run_id      uuid not null references public.aggregation_run(id) on delete cascade,
  target_type text not null,
  target_id   uuid not null,
  cohort_id   uuid references public.cohort(id) on delete cascade,
  value       double precision,
  status      text check (status in ('endorsed', 'contested', 'weak')),
  detail      jsonb not null default '{}'::jsonb
);
create unique index score_unique on public.score
  (run_id, target_type, target_id, coalesce(cohort_id, '00000000-0000-0000-0000-000000000000'));

create table public.sortition_draw (
  id            uuid primary key default gen_random_uuid(),
  space_id      uuid not null references public.space(id) on delete cascade,
  seed          text not null,            -- published so anyone can rerun the draw
  panel_size    int  not null,
  quotas        jsonb not null default '{}'::jsonb,
  pool          uuid[] not null,          -- eligible members at draw time
  selected      uuid[] not null,
  inclusion_probability jsonb not null default '{}'::jsonb,  -- user_id -> probability
  created_at    timestamptz not null default now()
);

create table public.decision (
  id         uuid primary key default gen_random_uuid(),
  run_id     uuid references public.aggregation_run(id) on delete set null,
  space_id   uuid not null references public.space(id) on delete cascade,
  target_type text not null,
  target_id  uuid not null,
  outcome    text not null check (outcome in ('ratified', 'rejected', 'deferred')),
  decided_by text not null check (decided_by in ('panel', 'open_track', 'admin')),
  created_at timestamptz not null default now()
);

create table public.model (
  id         uuid primary key default gen_random_uuid(),
  space_id   uuid not null references public.space(id) on delete cascade,
  name       text not null,           -- 'swiss-ai/Apertus-v1.1-1.5B-Instruct'
  checkpoint text,                    -- base model, or path of a fine-tuned adapter
  charter_version_id uuid references public.charter_version(id),
  created_at timestamptz not null default now()
);

create table public.eval_result (
  model_id     uuid not null references public.model(id) on delete cascade,
  test_case_id uuid not null references public.test_case(id) on delete cascade,
  answer       text not null,
  verdict      text not null check (verdict in ('pass', 'fail', 'unclear')),
  grader       text not null,          -- 'llm:<model>' or 'human:<user id>'
  created_at   timestamptz not null default now(),
  primary key (model_id, test_case_id)
);

-- ---------------------------------------------------------------------------
-- Helper functions (security definer so policies can call them without recursion)
-- ---------------------------------------------------------------------------

create or replace function public.is_member(sp uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from membership where space_id = sp and user_id = auth.uid());
$$;

create or replace function public.is_admin(sp uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from membership where space_id = sp and user_id = auth.uid() and role = 'admin');
$$;

create or replace function public.can_view(sp uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from space where id = sp and access = 'open') or public.is_member(sp);
$$;

create or replace function public.version_space(v uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select space_id from charter_version where id = v;
$$;

create or replace function public.clause_space(c uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select cv.space_id from clause cl join charter_version cv on cv.id = cl.charter_version_id where cl.id = c;
$$;

-- The creator of a space becomes its admin and a member.
create or replace function public.on_space_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into membership (space_id, user_id, role) values
      (new.id, new.created_by, 'admin'), (new.id, new.created_by, 'member')
    on conflict do nothing;
  end if;
  return new;
end $$;
create trigger space_created after insert on public.space
  for each row execute function public.on_space_created();

-- Join through an invitation link. Returns the space slug.
create or replace function public.accept_invitation(invite_token text) returns text
language plpgsql security definer set search_path = public as $$
declare inv invitation%rowtype; sp_slug text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into inv from invitation where token = invite_token for update;
  if not found then raise exception 'This invitation does not exist'; end if;
  if inv.expires_at < now() then raise exception 'This invitation has expired'; end if;
  if not exists (select 1 from membership where space_id = inv.space_id and user_id = auth.uid()) then
    if inv.uses >= inv.max_uses then raise exception 'This invitation has already been used'; end if;
    insert into membership (space_id, user_id, role) values (inv.space_id, auth.uid(), 'member')
      on conflict do nothing;
    if inv.role = 'admin' then
      insert into membership (space_id, user_id, role) values (inv.space_id, auth.uid(), 'admin')
        on conflict do nothing;
    end if;
    update invitation set uses = uses + 1 where id = inv.id;
  end if;
  select slug into sp_slug from space where id = inv.space_id;
  return sp_slug;
end $$;

-- Join an open space without an invitation.
create or replace function public.join_open_space(sp uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if not exists (select 1 from space where id = sp and access = 'open') then
    raise exception 'This space is invitation-only';
  end if;
  insert into membership (space_id, user_id, role) values (sp, auth.uid(), 'member') on conflict do nothing;
end $$;

-- Admins create invitation links.
create or replace function public.create_invitation(sp uuid, n_uses int default 1, days int default 14,
  invite_role text default 'member', invite_note text default null) returns text
language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if not public.is_admin(sp) then raise exception 'Only admins can invite'; end if;
  insert into invitation (space_id, role, max_uses, expires_at, note, created_by)
    values (sp, invite_role, n_uses, now() + make_interval(days => days), invite_note, auth.uid())
    returning token into t;
  return t;
end $$;

-- Keep the history of test cases and stamp edits.
create or replace function public.on_test_case_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into test_case_revision (test_case_id, editor_id, prompt, must, must_not, today, with_edit, status)
    values (old.id, auth.uid(), old.prompt, old.must, old.must_not, old.today, old.with_edit, old.status);
  new.updated_at = now();
  -- Members may not move a case between training and evaluation, or reassign it.
  if auth.role() <> 'service_role' then
    new.split = old.split; new.author_id = old.author_id; new.space_id = old.space_id;
    new.origin = old.origin;
  end if;
  return new;
end $$;
create trigger test_case_updated before update on public.test_case
  for each row execute function public.on_test_case_update();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.space              enable row level security;
alter table public.membership         enable row level security;
alter table public.invitation         enable row level security;
alter table public.charter_version    enable row level security;
alter table public.clause             enable row level security;
alter table public.proposal           enable row level security;
alter table public.test_case          enable row level security;
alter table public.test_case_revision enable row level security;
alter table public.judgement          enable row level security;
alter table public.profile            enable row level security;
alter table public.aggregation_run    enable row level security;
alter table public.cohort             enable row level security;
alter table public.cohort_member      enable row level security;
alter table public.score              enable row level security;
alter table public.sortition_draw     enable row level security;
alter table public.decision           enable row level security;
alter table public.model              enable row level security;
alter table public.eval_result        enable row level security;

-- Spaces: open ones are public; invite-only ones are visible to members.
create policy space_read   on public.space for select using (access = 'open' or public.is_member(id));
create policy space_create on public.space for insert to authenticated with check (created_by = auth.uid());
create policy space_admin  on public.space for update using (public.is_admin(id));

-- Members see who else is in their space; joining goes through the functions above.
create policy membership_read  on public.membership for select using (public.is_member(space_id));
create policy membership_admin on public.membership for all using (public.is_admin(space_id))
  with check (public.is_admin(space_id));

create policy invitation_admin on public.invitation for all using (public.is_admin(space_id))
  with check (public.is_admin(space_id));

-- Charter text: readable wherever the space is; written by admins.
create policy version_read  on public.charter_version for select using (public.can_view(space_id));
create policy version_admin on public.charter_version for all using (public.is_admin(space_id))
  with check (public.is_admin(space_id));
create policy clause_read   on public.clause for select using (public.can_view(public.version_space(charter_version_id)));
create policy clause_admin  on public.clause for all using (public.is_admin(public.version_space(charter_version_id)))
  with check (public.is_admin(public.version_space(charter_version_id)));

-- Open track: every member proposes and edits test cases.
create policy proposal_read   on public.proposal for select using (public.can_view(space_id));
create policy proposal_insert on public.proposal for insert to authenticated
  with check (public.is_member(space_id) and author_id = auth.uid()
              and public.clause_space(clause_id) = space_id);
create policy proposal_own    on public.proposal for update using (author_id = auth.uid());
create policy proposal_delete on public.proposal for delete using (author_id = auth.uid() or public.is_admin(space_id));

create policy test_case_read   on public.test_case for select using (public.can_view(space_id));
create policy test_case_insert on public.test_case for insert to authenticated
  with check (public.is_member(space_id) and author_id = auth.uid() and origin = 'human');
-- Like a wiki: any member may improve any test case; history is kept by the trigger.
create policy test_case_edit   on public.test_case for update using (public.is_member(space_id))
  with check (public.is_member(space_id));

create policy revision_read on public.test_case_revision for select
  using (exists (select 1 from public.test_case t where t.id = test_case_id and public.can_view(t.space_id)));

-- Judgements are private to their author, so people are not swayed by running tallies.
-- Pipeline jobs read all of them with the service-role key.
create policy judgement_own on public.judgement for all using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.is_member(space_id));

create policy profile_own on public.profile for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Derived results are public within the space; no write policies, so only the service role writes.
create policy run_read      on public.aggregation_run for select using (public.can_view(space_id));
create policy cohort_read   on public.cohort          for select using (public.can_view(space_id));
create policy cmember_read  on public.cohort_member   for select using (user_id = auth.uid());
create policy score_read    on public.score           for select
  using (exists (select 1 from public.aggregation_run r where r.id = run_id and public.can_view(r.space_id)));
create policy draw_read     on public.sortition_draw  for select using (public.can_view(space_id));
create policy decision_read on public.decision        for select using (public.can_view(space_id));
create policy model_read    on public.model           for select using (public.can_view(space_id));
create policy eval_read     on public.eval_result     for select
  using (exists (select 1 from public.model m where m.id = model_id and public.can_view(m.space_id)));

grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.join_open_space(uuid) to authenticated;
grant execute on function public.create_invitation(uuid, int, int, text, text) to authenticated;
