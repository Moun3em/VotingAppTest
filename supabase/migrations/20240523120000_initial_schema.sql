-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (Mock for now, normally managed by Auth provider)
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  username text unique not null,
  avatar_url text
);

-- Topics table
create table public.topics (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text, 
  author_id uuid references public.users(id) on delete cascade not null,
  net_score integer default 0 not null,
  comment_count integer default 0 not null,
  created_at timestamptz default now() not null
);

-- Comments table
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid references public.topics(id) on delete cascade not null,
  author_id uuid references public.users(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  net_score integer default 0 not null,
  depth integer default 0 not null,
  created_at timestamptz default now() not null,
  check (depth <= 5) -- Enforce max depth constraint at DB level
);

-- Interactions table (Polymorphic: targets topic or comment)
create type interaction_type as enum ('VOTE_UP', 'VOTE_DOWN', 'HEART');
create type target_type as enum ('TOPIC', 'COMMENT');

create table public.interactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  target_id uuid not null,
  target_type target_type not null,
  interaction_type interaction_type not null,
  created_at timestamptz default now() not null,
  unique (user_id, target_id, target_type) -- Ensure one interaction per target per user
);

-- RLS Policies
alter table public.topics enable row level security;
alter table public.comments enable row level security;
alter table public.interactions enable row level security;

-- Topics Policies
create policy "Topics are viewable by everyone" 
  on public.topics for select 
  using (true);

create policy "Users can create topics" 
  on public.topics for insert 
  with check (auth.uid() = author_id);

-- Comments Policies
create policy "Comments are viewable by everyone" 
  on public.comments for select 
  using (true);

create policy "Users can create comments" 
  on public.comments for insert 
  with check (auth.uid() = author_id);

-- Interactions Policies
create policy "Users can see all interactions" 
  on public.interactions for select 
  using (true);

create policy "Users can vote" 
  on public.interactions for insert 
  with check (auth.uid() = user_id);

create policy "Users can start their own interactions"
  on public.interactions for update
  using (auth.uid() = user_id);

-- Atomic Score Functions
create or replace function update_topic_score(topic_id uuid, score_delta int)
returns void as $$
begin
  update public.topics
  set net_score = net_score + score_delta
  where id = topic_id;
end;
$$ language plpgsql security definer;

create or replace function update_comment_score(comment_id uuid, score_delta int)
returns void as $$
begin
  update public.comments
  set net_score = net_score + score_delta
  where id = comment_id;
end;
$$ language plpgsql security definer;
