
-- Add platform_admin role (super admin, cross-tenant)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'platform_admin';

-- Function to check platform admin (ignores tenant scope). Uses ::text to avoid enum lookup binding.
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role::text = 'platform_admin'
  )
$$;

-- Cross-tenant SELECT policies for platform admins
CREATE POLICY "platform admin read tenants" ON public.tenants
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin update tenants" ON public.tenants
  FOR UPDATE TO authenticated USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "platform admin read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin read user_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin insert user_roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin update user_roles" ON public.user_roles
  FOR UPDATE TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin delete user_roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "platform admin read subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin insert subscriptions" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin update subscriptions" ON public.subscriptions
  FOR UPDATE TO authenticated USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "platform admin read invoices" ON public.invoices
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin insert invoices" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin update invoices" ON public.invoices
  FOR UPDATE TO authenticated USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "platform admin read leads" ON public.leads
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin read empresas" ON public.empresas
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin read audit_logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin read eventos_uploads" ON public.eventos_uploads
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin read financeiro" ON public.financeiro
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin read integrations" ON public.integrations
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

-- Allow platform admin to manage planos
CREATE POLICY "platform admin insert planos" ON public.planos
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin update planos" ON public.planos
  FOR UPDATE TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin delete planos" ON public.planos
  FOR DELETE TO authenticated USING (public.is_platform_admin(auth.uid()));

-- Global platform settings (key-value config). Only platform admins access it.
CREATE TABLE public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform admin read platform_settings" ON public.platform_settings
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin insert platform_settings" ON public.platform_settings
  FOR INSERT TO authenticated WITH CHECK (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin update platform_settings" ON public.platform_settings
  FOR UPDATE TO authenticated USING (public.is_platform_admin(auth.uid()));
CREATE POLICY "platform admin delete platform_settings" ON public.platform_settings
  FOR DELETE TO authenticated USING (public.is_platform_admin(auth.uid()));

-- N8N workflow execution log
CREATE TABLE public.workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  workflow_id uuid,
  workflow_name text,
  trigger_source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'running',
  n8n_execution_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_runs TO authenticated;
GRANT ALL ON public.workflow_runs TO service_role;

ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant read workflow_runs" ON public.workflow_runs
  FOR SELECT TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant insert workflow_runs" ON public.workflow_runs
  FOR INSERT TO authenticated WITH CHECK (tenant_id = public.current_tenant_id());
CREATE POLICY "tenant update workflow_runs" ON public.workflow_runs
  FOR UPDATE TO authenticated USING (tenant_id = public.current_tenant_id());
CREATE POLICY "platform admin read all workflow_runs" ON public.workflow_runs
  FOR SELECT TO authenticated USING (public.is_platform_admin(auth.uid()));

CREATE INDEX idx_workflow_runs_tenant ON public.workflow_runs(tenant_id, created_at DESC);
CREATE INDEX idx_workflow_runs_status ON public.workflow_runs(status);

-- Seed default platform settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('n8n', '{"base_url":"","api_key_secret":"N8N_API_KEY"}'::jsonb, 'Configuração da instância N8N'),
  ('global_limits', '{"max_leads_per_upload":10000,"max_concurrent_workflows":50}'::jsonb, 'Limites globais da plataforma'),
  ('platform_features', '{"events_enabled":true,"whatsapp_enabled":true,"ai_enrichment":true}'::jsonb, 'Recursos habilitados na plataforma')
ON CONFLICT (key) DO NOTHING;
