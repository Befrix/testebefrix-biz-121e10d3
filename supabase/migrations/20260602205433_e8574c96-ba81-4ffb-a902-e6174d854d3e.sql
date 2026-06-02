-- Fix privilege escalation: prevent users from changing their own tenant_id or id
DROP POLICY IF EXISTS "user updates own profile" ON public.profiles;
CREATE POLICY "user updates own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND tenant_id = public.current_tenant_id());

-- Restrict audit_logs updates to owner/admin only (audit integrity)
DROP POLICY IF EXISTS "tenant update audit_logs" ON public.audit_logs;
CREATE POLICY "tenant update audit_logs"
ON public.audit_logs
FOR UPDATE
TO authenticated
USING (
  (tenant_id = public.current_tenant_id())
  AND public.has_any_role(auth.uid(), ARRAY['owner'::app_role, 'admin'::app_role])
);