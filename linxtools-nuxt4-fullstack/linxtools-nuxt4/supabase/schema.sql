-- Execute no SQL Editor do projeto Supabase antes de ativar DATA_PROVIDER=supabase.
-- Todas as operações passam pelo servidor Node com a service_role (nunca pelo navegador).
CREATE TABLE IF NOT EXISTS public.tools (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL,
  icon text NOT NULL DEFAULT 'sparkles',
  accent text NOT NULL DEFAULT 'purple',
  status text NOT NULL DEFAULT 'ready',
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS public.releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  version text,
  published_at date NOT NULL DEFAULT current_date,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tool_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 800),
  role text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_ideas ENABLE ROW LEVEL SECURITY;

-- Sem policies públicas: a service_role do BACKEND é quem acessa.
-- Mais tarde, adicione autenticação e policies específicas se necessário.
CREATE INDEX IF NOT EXISTS idx_tools_order ON public.tools(sort_order);
CREATE INDEX IF NOT EXISTS idx_release_date ON public.releases(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_created ON public.tool_ideas(created_at DESC);

-- Portal da Operação / versão 1.2 — modelo de dados para migração futura.
-- A autenticação local usa hashes scrypt no backend. Ao migrar para Supabase Auth,
-- substitua a tabela app_users e o gerenciamento de sessões conforme o novo fluxo.
CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK(role IN ('admin','lideranca','analista')),
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.app_sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_exp ON public.app_sessions(expires_at);

CREATE TABLE IF NOT EXISTS public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'Geral',
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
  pinned boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 1,
  requires_ack boolean NOT NULL DEFAULT false,
  author_id uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT '',
  published_at timestamptz,
  expires_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notices_publication ON public.notices(status, archived_at, published_at DESC);
CREATE TABLE IF NOT EXISTS public.notice_acknowledgements (
  notice_id uuid NOT NULL REFERENCES public.notices(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.app_users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(notice_id,user_id)
);
CREATE TABLE IF NOT EXISTS public.videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Treinamento',
  provider text NOT NULL CHECK(provider IN ('youtube','vimeo')),
  provider_id text NOT NULL,
  external_url text NOT NULL,
  embed_url text NOT NULL,
  author_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published'));
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notice_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy pública. Só o backend, através da chave service_role.

-- V1.3 — Portal de gestão, perfis ativos e publicações configuráveis.
-- Executar as alterações mesmo se o schema da V1.2 já tiver sido aplicado.
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS permissions text[] NOT NULL DEFAULT ARRAY[]::text[];
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS updated_at timestamptz;
-- Mantém as permissões de liderança cadastradas na V1.2 que ainda não tinham o campo.
UPDATE public.app_users SET permissions=ARRAY['notices','videos']::text[]
WHERE role='lideranca' AND cardinality(permissions)=0;
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.releases ADD COLUMN IF NOT EXISTS updated_at timestamptz;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='release_status_valid' AND conrelid='public.releases'::regclass) THEN ALTER TABLE public.releases ADD CONSTRAINT release_status_valid CHECK (status IN ('draft','published')); END IF; END $$;
CREATE TABLE IF NOT EXISTS public.portal_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title text NOT NULL,
 description text NOT NULL DEFAULT '',
 category text NOT NULL DEFAULT 'Geral',
 url text NOT NULL,
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_links ADD COLUMN IF NOT EXISTS display_order integer;
WITH ranked_links AS (
 SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC, id ASC) AS position
 FROM public.portal_links
)
UPDATE public.portal_links AS link
SET display_order = ranked_links.position::integer
FROM ranked_links
WHERE link.id = ranked_links.id AND link.display_order IS NULL;
ALTER TABLE public.portal_links ALTER COLUMN display_order SET DEFAULT 1;
ALTER TABLE public.portal_links ALTER COLUMN display_order SET NOT NULL;
CREATE TABLE IF NOT EXISTS public.portal_settings (
 id text PRIMARY KEY DEFAULT 'main',
 hero_title text NOT NULL DEFAULT 'Mais conexão. Mais soluções.',
 hero_description text NOT NULL DEFAULT 'Comunicados, ferramentas e aprendizado em uma única central.',
 banner_text text NOT NULL DEFAULT '',
 banner_enabled boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.portal_settings ADD COLUMN IF NOT EXISTS profile_permissions jsonb NOT NULL DEFAULT '{"admin":["notices","videos","releases","links"],"lideranca":["notices","videos"],"analista":[]}'::jsonb;
ALTER TABLE public.portal_settings ADD COLUMN IF NOT EXISTS notice_options jsonb NOT NULL DEFAULT '{"categories":[{"id":"Geral","label":"Geral"},{"id":"Procedimento","label":"Procedimento"},{"id":"Treinamento","label":"Treinamento"},{"id":"Urgente","label":"Urgente"}],"priorities":[{"id":"normal","label":"Normal"},{"id":"important","label":"Importante"},{"id":"critical","label":"Crítica"}]}'::jsonb;
-- Opções customizadas são validadas pelo servidor e persistidas em portal_settings.
ALTER TABLE public.notices ALTER COLUMN category DROP DEFAULT;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='notices_category_check' AND conrelid='public.notices'::regclass) THEN
    ALTER TABLE public.notices DROP CONSTRAINT notices_category_check;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname='notices_priority_check' AND conrelid='public.notices'::regclass) THEN
    ALTER TABLE public.notices DROP CONSTRAINT notices_priority_check;
  END IF;
END $$;
ALTER TABLE public.portal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_settings ENABLE ROW LEVEL SECURITY;
-- Somente a chave service_role no servidor pode acessar estas tabelas.

-- V1.4 — ordenação manual persistente de comunicados.
ALTER TABLE public.notices ADD COLUMN IF NOT EXISTS display_order integer;
WITH ranked_notices AS (
  SELECT id, ROW_NUMBER() OVER (
    ORDER BY pinned DESC, COALESCE(published_at, created_at) DESC, id ASC
  ) AS position
  FROM public.notices
)
UPDATE public.notices AS notice
SET display_order = ranked_notices.position::integer
FROM ranked_notices
WHERE notice.id = ranked_notices.id AND notice.display_order IS NULL;
ALTER TABLE public.notices ALTER COLUMN display_order SET DEFAULT 1;
ALTER TABLE public.notices ALTER COLUMN display_order SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notices_display_order
  ON public.notices(display_order ASC, id ASC);

CREATE OR REPLACE FUNCTION public.reorder_notices(p_notice_ids uuid[])
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  LOCK TABLE public.notices IN SHARE ROW EXCLUSIVE MODE;

  IF p_notice_ids IS NULL
    OR cardinality(p_notice_ids) <> (SELECT count(*) FROM public.notices)
    OR cardinality(p_notice_ids) <> (
      SELECT count(DISTINCT requested.notice_id)
      FROM unnest(p_notice_ids) AS requested(notice_id)
    )
    OR EXISTS (
      SELECT 1
      FROM unnest(p_notice_ids) AS requested(notice_id)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.notices AS notice WHERE notice.id = requested.notice_id
      )
    )
  THEN
    RAISE EXCEPTION 'A lista de comunicados não corresponde aos registros atuais.';
  END IF;

  UPDATE public.notices AS notice
  SET display_order = requested.position::integer, updated_at = now()
  FROM unnest(p_notice_ids) WITH ORDINALITY AS requested(notice_id, position)
  WHERE notice.id = requested.notice_id;

  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.reorder_notices(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_notices(uuid[]) TO service_role;

CREATE OR REPLACE FUNCTION public.reorder_portal_links(p_link_ids uuid[])
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  LOCK TABLE public.portal_links IN SHARE ROW EXCLUSIVE MODE;

  IF p_link_ids IS NULL
    OR cardinality(p_link_ids) <> (SELECT count(*) FROM public.portal_links)
    OR cardinality(p_link_ids) <> (
      SELECT count(DISTINCT requested.link_id)
      FROM unnest(p_link_ids) AS requested(link_id)
    )
    OR EXISTS (
      SELECT 1
      FROM unnest(p_link_ids) AS requested(link_id)
      WHERE NOT EXISTS (
        SELECT 1 FROM public.portal_links AS link WHERE link.id = requested.link_id
      )
    )
  THEN
    RAISE EXCEPTION 'A lista de links não corresponde aos registros atuais.';
  END IF;

  UPDATE public.portal_links AS link
  SET display_order = requested.position::integer, updated_at = now()
  FROM unnest(p_link_ids) WITH ORDINALITY AS requested(link_id, position)
  WHERE link.id = requested.link_id;

  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.reorder_portal_links(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reorder_portal_links(uuid[]) TO service_role;
