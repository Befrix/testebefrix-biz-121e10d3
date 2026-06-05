
DROP POLICY IF EXISTS "tenant insert audit_logs" ON public.audit_logs;
CREATE POLICY "tenant insert audit_logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.has_any_role(auth.uid(), ARRAY['owner'::app_role, 'admin'::app_role]));

DROP POLICY IF EXISTS "tenant update workflow_runs" ON public.workflow_runs;
CREATE POLICY "tenant update workflow_runs" ON public.workflow_runs
  FOR UPDATE TO authenticated
  USING (tenant_id = public.current_tenant_id() AND public.has_any_role(auth.uid(), ARRAY['owner'::app_role, 'admin'::app_role, 'manager'::app_role]))
  WITH CHECK (tenant_id = public.current_tenant_id() AND public.has_any_role(auth.uid(), ARRAY['owner'::app_role, 'admin'::app_role, 'manager'::app_role]));
