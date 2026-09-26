create extension if not exists pgcrypto;
create extension if not exists vector;

create type public.publication_status as enum ('discovered', 'enriching', 'needs_review', 'published', 'rejected');
create type public.content_kind as enum ('news', 'insight', 'social');

create table public.papers (
  id uuid primary key default gen_random_uuid(),
  arxiv_id text unique,
  semantic_scholar_id text unique,
  slug text not null unique,
  title text not null,
  normalized_title text not null,
  abstract text,
  plain_english_summary text,
  why_it_matters text,
  contributions jsonb not null default '[]',
  limitations jsonb not null default '[]',
  authors_json jsonb not null default '[]',
  institutions_json jsonb not null default '[]',
  categories text[] not null default '{}',
  topics text[] not null default '{}',
  tags text[] not null default '{}',
  modalities text[] not null default '{}',
  embodiments text[] not null default '{}',
  datasets text[] not null default '{}',
  architecture text,
  task text,
  arxiv_url text,
  pdf_url text,
  open_access_pdf_url text,
  github_url text,
  github_stars integer,
  github_license text,
  github_updated_at timestamptz,
  citation_count integer,
  influential_citation_count integer,
  reference_count integer,
  relevance_score real not null default 0,
  relevance_terms text[] not null default '{}',
  status public.publication_status not null default 'discovered',
  published_at timestamptz,
  source_updated_at timestamptz,
  reviewed_at timestamptz,
  source_payload jsonb,
  search_document tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(abstract, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(plain_english_summary, '')), 'B')
  ) stored,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index papers_status_published_idx on public.papers(status, published_at desc);
create index papers_search_idx on public.papers using gin(search_document);
create index papers_relevance_idx on public.papers(relevance_score desc);
create index papers_embedding_idx on public.papers using hnsw (embedding vector_cosine_ops);

create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  source_external_id text not null unique,
  content_type public.content_kind not null,
  source_name text not null,
  title text not null,
  summary text,
  canonical_url text not null,
  image_url text,
  published_at timestamptz,
  relevance_score real not null default 0,
  status public.publication_status not null default 'needs_review',
  source_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.paper_relationships (
  id uuid primary key default gen_random_uuid(),
  source_paper_id uuid not null references public.papers(id) on delete cascade,
  target_paper_id uuid not null references public.papers(id) on delete cascade,
  relationship text not null check (relationship in ('builds_on','similar','same_dataset','better_benchmark','cites')),
  confidence real,
  created_at timestamptz not null default now(),
  unique(source_paper_id, target_paper_id, relationship)
);

create table public.ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null check (status in ('running','completed','completed_with_errors','failed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  stats jsonb not null default '{}',
  error_message text
);

create table public.editorial_reviews (
  id uuid primary key default gen_random_uuid(),
  paper_id uuid not null references public.papers(id) on delete cascade,
  reviewer_id uuid references auth.users(id) on delete set null,
  decision public.publication_status not null,
  notes text,
  changes jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.saved_papers (
  user_id uuid not null references auth.users(id) on delete cascade,
  paper_id uuid not null references public.papers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, paper_id)
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('reader','editor','admin')) default 'reader'
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger papers_touch before update on public.papers for each row execute function public.touch_updated_at();
create trigger content_items_touch before update on public.content_items for each row execute function public.touch_updated_at();

alter table public.papers enable row level security;
alter table public.content_items enable row level security;
alter table public.paper_relationships enable row level security;
alter table public.ingestion_runs enable row level security;
alter table public.editorial_reviews enable row level security;
alter table public.saved_papers enable row level security;
alter table public.user_roles enable row level security;

create policy "Published papers are public" on public.papers for select using (status = 'published');
create policy "Published content is public" on public.content_items for select using (status = 'published');
create policy "Published relationships are public" on public.paper_relationships for select using (
  exists(select 1 from public.papers p where p.id = source_paper_id and p.status = 'published')
);
create policy "Users manage their saved papers" on public.saved_papers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can read their role" on public.user_roles for select using (auth.uid() = user_id);

grant select on public.papers, public.content_items, public.paper_relationships to anon, authenticated;
grant all on public.saved_papers to authenticated;

comment on table public.papers is 'Canonical research records. Automated ingestion writes needs_review; editors publish.';
comment on column public.papers.source_payload is 'Original provider response retained for provenance and debugging.';
