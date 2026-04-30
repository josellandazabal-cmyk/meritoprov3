-- ============================================================
-- MéritoPro V4 · Migración 0001 — corpus_legal con Voyage (1024 dim)
-- Ejecutar en el SQL Editor de Supabase Dashboard.
-- Idempotente: puede correrse múltiples veces sin efectos destructivos.
-- No dispara la advertencia "destructive operations" de Supabase.
-- ============================================================

-- 1. Extensiones necesarias
create extension if not exists vector;
create extension if not exists unaccent;

-- 2. Tabla corpus_legal
create table if not exists public.corpus_legal (
  id          bigserial primary key,
  categoria   text not null,           -- carpeta lógica: '02_regimen_disciplinario'
  documento   text not null,           -- nombre del PDF fuente
  norma       text not null,           -- 'Ley 1952 de 2019'
  articulo    text,                    -- 'Art. 38'
  numeral     text,                    -- 'Numeral 4' (opcional)
  contenido   text not null,           -- chunk en texto plano
  tokens      int  not null,           -- tokens estimados del chunk
  pagina_pdf  int,                     -- página de origen
  hash        text not null unique,    -- SHA-1 del contenido (anti-duplicados)
  embedding   vector(1024) not null,   -- voyage-3-large (Voyage AI)
  created_at  timestamptz not null default now()
);

-- 3. Índices
create index if not exists corpus_legal_embedding_idx
  on public.corpus_legal
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index if not exists corpus_legal_categoria_idx on public.corpus_legal(categoria);
create index if not exists corpus_legal_norma_idx     on public.corpus_legal(norma);

-- 4. RLS — solo service_role puede escribir; lectura permitida a anon
alter table public.corpus_legal enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'corpus_legal'
      and policyname = 'corpus_legal lectura pública'
  ) then
    create policy "corpus_legal lectura pública"
      on public.corpus_legal
      for select
      to anon, authenticated
      using (true);
  end if;
end$$;

-- Sin policy de INSERT/UPDATE/DELETE → solo service_role (bypass RLS) puede escribir.

-- 5. RPC match_corpus_legal — usado por src/lib/rag/corpus.ts
create or replace function public.match_corpus_legal(
  query_embedding vector(1024),
  match_threshold float default 0.72,
  match_count     int   default 6
)
returns table (
  documento text,
  norma     text,
  articulo  text,
  numeral   text,
  contenido text,
  similitud float
)
language sql stable as $$
  select
    documento,
    norma,
    articulo,
    numeral,
    contenido,
    1 - (embedding <=> query_embedding) as similitud
  from public.corpus_legal
  where 1 - (embedding <=> query_embedding) >= match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- 6. Permiso explícito para anon (el cliente Supabase server corre con anon)
grant execute on function public.match_corpus_legal(vector, float, int) to anon, authenticated;

-- ============================================================
-- Verificación rápida tras correr la migración:
--   select count(*) from public.corpus_legal;   → 0 (vacía, lista para ingesta)
--   \df match_corpus_legal                       → firma con vector(1024)
-- ============================================================
