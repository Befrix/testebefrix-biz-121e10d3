
INSERT INTO public.planos (tier, name, monthly_price_cents, features) VALUES
('starter', 'Starter', 300000, jsonb_build_object(
  'leads_per_month', 300, 'users', 1, 'niches', 1,
  'channels', jsonb_build_array('email'),
  'premium_data', jsonb_build_array(),
  'features', jsonb_build_array('email_outbound','enrichment','email_validation','sdr_basic','dashboard_basic','whatsapp_support')
)),
('business', 'Pro', 350000, jsonb_build_object(
  'leads_per_month', 1500, 'users', 2, 'niches', 3, 'badge', 'Mais Popular',
  'channels', jsonb_build_array('email','whatsapp','linkedin'),
  'premium_data', jsonb_build_array('email','phone','linkedin'),
  'features', jsonb_build_array('multichannel_sequences','unlimited_campaigns','sdr_automation','crm_integration','advanced_analytics','event_upload','followup_auto','lead_timeline','kanban','advanced_filters','smart_search')
)),
('enterprise', 'Enterprise', 500000, jsonb_build_object(
  'leads_per_month', 2500, 'users', 4, 'niches', -1,
  'channels', jsonb_build_array('email','whatsapp','linkedin','omnichannel_ai'),
  'premium_data', jsonb_build_array('email','phone','linkedin','full_enrichment','ai_insights','behavior_score','conversion_prediction','heatmaps'),
  'features', jsonb_build_array('omnichannel_ai','custom_ai','unlimited_automations','premium_integrations','multi_company','exclusive_api','dedicated_manager','priority_sla','advanced_reports','predictive_intelligence')
))
ON CONFLICT (tier) DO UPDATE SET name = EXCLUDED.name, monthly_price_cents = EXCLUDED.monthly_price_cents, features = EXCLUDED.features;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
