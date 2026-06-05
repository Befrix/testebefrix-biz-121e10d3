
-- Empresa: campos fiscais e de porte
ALTER TABLE public.empresas
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS nome_fantasia text,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS faturamento_anual text;

CREATE UNIQUE INDEX IF NOT EXISTS empresas_cnpj_unique
  ON public.empresas (cnpj) WHERE cnpj IS NOT NULL;

-- Estratégia: objetivos e ticket médio (separado de average_ticket do ICP)
ALTER TABLE public.client_strategy_profiles
  ADD COLUMN IF NOT EXISTS objetivos text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS ticket_medio text;
