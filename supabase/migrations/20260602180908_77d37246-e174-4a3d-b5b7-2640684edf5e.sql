
-- 1. Fix cross-tenant privilege escalation: scope role checks to current tenant
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = ANY(_roles)
      AND tenant_id = public.current_tenant_id()
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND tenant_id = public.current_tenant_id()
  )
$$;

-- 2. Set immutable search_path on remaining trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END
$$;

-- 3. Revoke EXECUTE on SECURITY DEFINER helpers from anon and public
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_tenant_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(uuid, app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO authenticated;

-- 4. Prevent users from self-inserting/updating subscription rows
--    Subscriptions should be written only by server-side billing logic (service_role).
DROP POLICY IF EXISTS "tenant insert subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "tenant update subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "tenant delete subscriptions" ON public.subscriptions;
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions FROM authenticated;

-- Similarly lock down invoices writes
DROP POLICY IF EXISTS "tenant insert invoices" ON public.invoices;
DROP POLICY IF EXISTS "tenant update invoices" ON public.invoices;
DROP POLICY IF EXISTS "tenant delete invoices" ON public.invoices;
REVOKE INSERT, UPDATE, DELETE ON public.invoices FROM authenticated;
