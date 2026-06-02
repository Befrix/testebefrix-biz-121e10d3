
-- 1) Rename enum value business -> pro (Postgres allows this in-transaction)
ALTER TYPE plan_tier RENAME VALUE 'business' TO 'pro';

-- 2) Wipe existing plans (subscriptions reference plan_id; reassign first)
-- Capture old plan ids to remap
DO $$
DECLARE
  v_old_id uuid;
BEGIN
  -- Drop subs FK constraint temporarily? subscriptions.plan_id has no FK in schema, safe to update.
  NULL;
END $$;

DELETE FROM public.planos;

-- 3) Insert the 3 official plans with full feature gating payload
INSERT INTO public.planos (tier, name, monthly_price_cents, features) VALUES
('starter', 'Starter', 300000, jsonb_build_object(
  'badge', null,
  'tagline', 'Ideal para empresas iniciando outbound estruturado.',
  'limits', jsonb_build_object(
    'leads_per_month', 300,
    'users', 1,
    'niches', 1
  ),
  'features', jsonb_build_array(
    'Email Outbound',
    'Enriquecimento IA',
    'Validação de Emails',
    'SDR Automation Básica',
    'Campanhas Limitadas',
    'Dashboard Básico',
    'Suporte WhatsApp'
  ),
  'channels', jsonb_build_object(
    'email', true,
    'whatsapp', false,
    'whatsapp_automation', false,
    'sequences_omnichannel', false
  ),
  'lead_visible_fields', jsonb_build_array(
    'full_name','company','job_title','segment','source','related_event','ai_score','pipeline_status','sdr_owner','created_at','last_interaction'
  ),
  'lead_premium_unlocked', jsonb_build_object(
    'email', false,
    'phone', false,
    'linkedin', false,
    'full_enrichment', false
  ),
  'flags', jsonb_build_object(
    'campaigns_unlimited', false,
    'crm_integration', false,
    'advanced_analytics', false,
    'event_upload', false,
    'auto_followup', false,
    'lead_timeline', false,
    'kanban', false,
    'smart_search', false,
    'advanced_filters', false,
    'ai_predictive_enterprise', false,
    'api_exclusive', false,
    'multiempresa', false,
    'heatmaps', false,
    'ai_personalizada', false,
    'integrations_premium', false,
    'dedicated_manager', false,
    'sla_priority', false,
    'advanced_reports', false,
    'predictive_intelligence', false,
    'ai_insights', false,
    'behavioral_score', false,
    'conversion_forecast', false
  ),
  'cta_upgrade', 'Escale para PRO e desbloqueie WhatsApp Automation.'
)),
('pro', 'Pro', 350000, jsonb_build_object(
  'badge', 'Mais Popular',
  'tagline', 'Para times escalando outbound multicanal com IA.',
  'limits', jsonb_build_object(
    'leads_per_month', 1500,
    'users', 2,
    'niches', 3
  ),
  'features', jsonb_build_array(
    'Email Outbound',
    'WhatsApp Outbound',
    'Sequências Multicanal',
    'Campanhas Ilimitadas',
    'Automações SDR',
    'Integração CRM',
    'Analytics Avançado',
    'Upload Eventos',
    'Follow-up Automatizado',
    'Timeline Completa do Lead',
    'Kanban',
    'Busca Inteligente',
    'Filtros Avançados'
  ),
  'channels', jsonb_build_object(
    'email', true,
    'whatsapp', true,
    'whatsapp_automation', true,
    'sequences_omnichannel', true
  ),
  'lead_visible_fields', jsonb_build_array(
    'full_name','company','job_title','segment','source','related_event','ai_score','pipeline_status','sdr_owner','created_at','last_interaction','email','phone','linkedin'
  ),
  'lead_premium_unlocked', jsonb_build_object(
    'email', true,
    'phone', true,
    'linkedin', true,
    'full_enrichment', true
  ),
  'flags', jsonb_build_object(
    'campaigns_unlimited', true,
    'crm_integration', true,
    'advanced_analytics', true,
    'event_upload', true,
    'auto_followup', true,
    'lead_timeline', true,
    'kanban', true,
    'smart_search', true,
    'advanced_filters', true,
    'ai_predictive_enterprise', false,
    'api_exclusive', false,
    'multiempresa', false,
    'heatmaps', false,
    'ai_personalizada', false,
    'integrations_premium', false,
    'dedicated_manager', false,
    'sla_priority', false,
    'advanced_reports', false,
    'predictive_intelligence', false,
    'ai_insights', false,
    'behavioral_score', false,
    'conversion_forecast', false
  ),
  'cta_upgrade', 'Escale para Enterprise e desbloqueie IA avançada.'
)),
('enterprise', 'Enterprise', 500000, jsonb_build_object(
  'badge', null,
  'tagline', 'Operações de receita com IA personalizada e SLA dedicado.',
  'limits', jsonb_build_object(
    'leads_per_month', 2500,
    'users', 4,
    'niches', null
  ),
  'features', jsonb_build_array(
    'Email Outbound',
    'WhatsApp Outbound',
    'IA Personalizada',
    'Automações Ilimitadas',
    'Integrações Premium',
    'Multiempresa',
    'API Exclusiva',
    'Gerente Dedicado',
    'SLA Prioritário',
    'Relatórios Avançados',
    'Inteligência Preditiva',
    'Analytics Avançado'
  ),
  'channels', jsonb_build_object(
    'email', true,
    'whatsapp', true,
    'whatsapp_automation', true,
    'sequences_omnichannel', true
  ),
  'lead_visible_fields', jsonb_build_array(
    'full_name','company','job_title','segment','source','related_event','ai_score','pipeline_status','sdr_owner','created_at','last_interaction','email','phone','linkedin','behavioral_score','conversion_forecast'
  ),
  'lead_premium_unlocked', jsonb_build_object(
    'email', true,
    'phone', true,
    'linkedin', true,
    'full_enrichment', true,
    'ai_insights', true,
    'behavioral_score', true,
    'conversion_forecast', true,
    'heatmaps', true
  ),
  'flags', jsonb_build_object(
    'campaigns_unlimited', true,
    'crm_integration', true,
    'advanced_analytics', true,
    'event_upload', true,
    'auto_followup', true,
    'lead_timeline', true,
    'kanban', true,
    'smart_search', true,
    'advanced_filters', true,
    'ai_predictive_enterprise', true,
    'api_exclusive', true,
    'multiempresa', true,
    'heatmaps', true,
    'ai_personalizada', true,
    'integrations_premium', true,
    'dedicated_manager', true,
    'sla_priority', true,
    'advanced_reports', true,
    'predictive_intelligence', true,
    'ai_insights', true,
    'behavioral_score', true,
    'conversion_forecast', true
  ),
  'cta_upgrade', null
));

-- 4) Repoint any existing subscriptions to the new starter plan if they were orphaned
UPDATE public.subscriptions s
SET plan_id = (SELECT id FROM public.planos WHERE tier = 'starter' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.planos p WHERE p.id = s.plan_id);
