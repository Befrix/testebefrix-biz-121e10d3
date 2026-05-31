CREATE TABLE public.meeting_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  lead_id uuid,
  meeting_id uuid,
  meeting_status text NOT NULL DEFAULT 'scheduled',
  deal_status text,
  deal_value_cents integer,
  notes text,
  feedback_date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_feedback TO authenticated;
GRANT ALL ON public.meeting_feedback TO service_role;

ALTER TABLE public.meeting_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant read meeting_feedback"
ON public.meeting_feedback FOR SELECT TO authenticated
USING (tenant_id = current_tenant_id());

CREATE POLICY "tenant insert meeting_feedback"
ON public.meeting_feedback FOR INSERT TO authenticated
WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "tenant update meeting_feedback"
ON public.meeting_feedback FOR UPDATE TO authenticated
USING ((tenant_id = current_tenant_id()) AND has_any_role(auth.uid(), ARRAY['owner'::app_role, 'admin'::app_role, 'manager'::app_role, 'sdr'::app_role]));

CREATE POLICY "tenant delete meeting_feedback"
ON public.meeting_feedback FOR DELETE TO authenticated
USING ((tenant_id = current_tenant_id()) AND has_any_role(auth.uid(), ARRAY['owner'::app_role, 'admin'::app_role]));

CREATE TRIGGER set_meeting_feedback_updated_at
BEFORE UPDATE ON public.meeting_feedback
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_meeting_feedback_tenant ON public.meeting_feedback(tenant_id);
CREATE INDEX idx_meeting_feedback_lead ON public.meeting_feedback(lead_id);