// Platform admin (super admin) server functions.
// All functions require the caller to have the `platform_admin` role.
// Cross-tenant data access is performed via the admin client (RLS bypassed)
// only after the platform-admin check passes.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensurePlatformAdmin(
  supabase: Awaited<ReturnType<typeof getCtx>>["supabase"],
  userId: string,
) {
  const { data, error } = await supabase.rpc("is_platform_admin", { _user_id: userId });
  if (error) throw new Error(`Falha ao validar permissão: ${error.message}`);
  if (!data) throw new Error("Forbidden: platform admin required");
}

// helper just for typing
async function getCtx() {
  return { supabase: null as any };
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// ---------- AMBIENT CHECK ----------
export const checkPlatformAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.rpc("is_platform_admin", { _user_id: userId });
    if (error) throw new Error(error.message);
    return { isPlatformAdmin: !!data };
  });

// ---------- DASHBOARD ----------
export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensurePlatformAdmin(context.supabase, context.userId);
    const sb = await admin();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [tenants, leads, eventos, runs, activeProfiles, invoicesMonth, activeSubs] = await Promise.all([
      sb.from("tenants").select("id", { count: "exact", head: true }),
      sb.from("leads").select("id", { count: "exact", head: true }),
      sb.from("eventos_uploads").select("id", { count: "exact", head: true }),
      sb.from("workflow_runs").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
      sb.from("profiles").select("id", { count: "exact", head: true }).gte("updated_at", dayAgo),
      sb.from("invoices").select("amount_cents").eq("status", "paid").gte("paid_at", monthStart),
      sb.from("subscriptions").select("id, plan_id, planos:plan_id(monthly_price_cents)").eq("status", "active"),
    ]);

    const monthlyRevenueCents = (invoicesMonth.data || []).reduce((s, r: any) => s + (r.amount_cents || 0), 0);
    const mrrCents = (activeSubs.data || []).reduce(
      (s: number, r: any) => s + (r?.planos?.monthly_price_cents || 0),
      0,
    );

    return {
      totalClientes: tenants.count || 0,
      monthlyRevenueCents,
      mrrCents,
      totalLeads: leads.count || 0,
      totalEventos: eventos.count || 0,
      usuariosAtivos: activeProfiles.count || 0,
      execucoesN8N: runs.count || 0,
    };
  });

// ---------- CLIENTES ----------
export const listClientes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensurePlatformAdmin(context.supabase, context.userId);
    const sb = await admin();

    const { data: tenants, error } = await sb
      .from("tenants")
      .select("id, name, slug, plan, onboarding_completed, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = (tenants || []).map((t) => t.id);
    if (ids.length === 0) return { clientes: [] };

    const [{ data: subs }, { data: empresas }, { data: roles }, { data: leadCounts }, { data: planos }] =
      await Promise.all([
        sb.from("subscriptions").select("tenant_id, status, plan_id, current_period_end").in("tenant_id", ids),
        sb.from("empresas").select("tenant_id, company_name, company_website").in("tenant_id", ids),
        sb.from("user_roles").select("tenant_id, user_id").in("tenant_id", ids),
      sb.from("leads").select("tenant_id").in("tenant_id", ids).then((r) => ({ data: r.data || [] })),
        sb.from("planos").select("id, name, tier, monthly_price_cents, features"),
      ]);

    const planosById = new Map((planos || []).map((p) => [p.id, p]));
    const leadByTenant = new Map<string, number>();
    for (const r of leadCounts || []) {
      leadByTenant.set(r.tenant_id, (leadByTenant.get(r.tenant_id) || 0) + 1);
    }
    const usersByTenant = new Map<string, number>();
    for (const r of roles || []) {
      usersByTenant.set(r.tenant_id, (usersByTenant.get(r.tenant_id) || 0) + 1);
    }
    const subByTenant = new Map((subs || []).map((s) => [s.tenant_id, s]));
    const empByTenant = new Map((empresas || []).map((e) => [e.tenant_id, e]));

    const clientes = (tenants || []).map((t) => {
      const sub = subByTenant.get(t.id);
      const plano = sub ? planosById.get(sub.plan_id) : null;
      const limit = (plano?.features as any)?.limits?.leads ?? null;
      return {
        tenant_id: t.id,
        empresa: empByTenant.get(t.id)?.company_name || t.name,
        website: empByTenant.get(t.id)?.company_website || null,
        plano: plano?.name || t.plan,
        tier: plano?.tier || t.plan,
        status: sub?.status || "trialing",
        period_end: sub?.current_period_end || null,
        usuarios: usersByTenant.get(t.id) || 0,
        leads_consumidos: leadByTenant.get(t.id) || 0,
        limite_leads: limit,
        criado_em: t.created_at,
      };
    });

    return { clientes };
  });

// ---------- USUARIOS ----------
export const listUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensurePlatformAdmin(context.supabase, context.userId);
    const sb = await admin();

    const [{ data: profiles }, { data: roles }, { data: tenants }] = await Promise.all([
      sb.from("profiles").select("id, full_name, email, phone, job_title, tenant_id, created_at, updated_at"),
      sb.from("user_roles").select("user_id, tenant_id, role"),
      sb.from("tenants").select("id, name"),
    ]);

    const tenantName = new Map<string, string>((tenants || []).map((t) => [t.id, t.name]));
    const rolesByUser = new Map<string, string[]>();
    for (const r of roles || []) {
      const arr = rolesByUser.get(r.user_id) || [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }

    const usuarios = (profiles || []).map((p) => ({
      id: p.id,
      nome: p.full_name,
      email: p.email,
      cargo: p.job_title,
      empresa: (p.tenant_id ? tenantName.get(p.tenant_id) : "") || "—",
      tenant_id: p.tenant_id,
      roles: rolesByUser.get(p.id) || [],
      criado_em: p.created_at,
      ultimo_acesso: p.updated_at,
    }));

    return { usuarios };
  });

export const togglePlatformAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ user_id: z.string().uuid(), grant: z.boolean() }).parse(i))
  .handler(async ({ context, data }) => {
    await ensurePlatformAdmin(context.supabase, context.userId);
    const sb = await admin();
    if (data.grant) {
      const { data: prof } = await sb.from("profiles").select("tenant_id").eq("id", data.user_id).single();
      const { error } = await sb
        .from("user_roles")
        .insert({ user_id: data.user_id, tenant_id: prof?.tenant_id as string, role: "platform_admin" as any });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      const { error } = await sb
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", "platform_admin" as any);
      if (error) throw new Error(error.message);
    }
    await sb.from("audit_logs").insert({
      tenant_id: null as any,
      user_id: context.userId,
      action: data.grant ? "platform_admin.grant" : "platform_admin.revoke",
      entity: "user",
      entity_id: data.user_id,
      metadata: {},
    });
    return { ok: true };
  });

// ---------- PLANOS ----------
export const listPlanos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensurePlatformAdmin(context.supabase, context.userId);
    const sb = await admin();
    const { data, error } = await sb.from("planos").select("*").order("monthly_price_cents");
    if (error) throw new Error(error.message);
    return { planos: data || [] };
  });

const PlanUpdate = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80).optional(),
  monthly_price_cents: z.number().int().min(0).optional(),
  features: z.record(z.string(), z.unknown()).optional(),
});

export const updatePlano = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => PlanUpdate.parse(i))
  .handler(async ({ context, data }) => {
    await ensurePlatformAdmin(context.supabase, context.userId);
    const sb = await admin();
    const { id, ...patch } = data;
    const { error } = await sb.from("planos").update(patch as any).eq("id", id);
    if (error) throw new Error(error.message);
    await sb.from("audit_logs").insert({
      tenant_id: null as any,
      user_id: context.userId,
      action: "plano.update",
      entity: "plano",
      entity_id: id,
      metadata: patch as any,
    });
    return { ok: true };
  });

// ---------- PAGAMENTOS ----------
export const listPagamentos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensurePlatformAdmin(context.supabase, context.userId);
    const sb = await admin();
    const [{ data: subs }, { data: invoices }, { data: tenants }, { data: planos }] = await Promise.all([
      sb.from("subscriptions").select("*").order("created_at", { ascending: false }),
      sb.from("invoices").select("*").order("created_at", { ascending: false }).limit(200),
      sb.from("tenants").select("id, name"),
      sb.from("planos").select("id, name, monthly_price_cents"),
    ]);
    const tn = new Map((tenants || []).map((t) => [t.id, t.name]));
    const pn = new Map((planos || []).map((p) => [p.id, p]));
    return {
      assinaturas: (subs || []).map((s) => ({
        ...s,
        empresa: tn.get(s.tenant_id) || "—",
        plano: pn.get(s.plan_id)?.name || "—",
        preco_cents: pn.get(s.plan_id)?.monthly_price_cents || 0,
      })),
      faturas: (invoices || []).map((i) => ({ ...i, empresa: tn.get(i.tenant_id) || "—" })),
    };
  });

// ---------- CANCELAMENTOS ----------
export const listCancelamentos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensurePlatformAdmin(context.supabase, context.userId);
    const sb = await admin();
    const [{ data: audit }, { data: tenants }] = await Promise.all([
      sb
        .from("audit_logs")
        .select("*")
        .eq("action", "subscription.cancel_requested")
        .order("created_at", { ascending: false })
        .limit(300),
      sb.from("tenants").select("id, name"),
    ]);
    const tn = new Map((tenants || []).map((t) => [t.id, t.name]));
    return {
      cancelamentos: (audit || []).map((a: any) => ({
        id: a.id,
        empresa: tn.get(a.tenant_id || "") || "—",
        created_at: a.created_at,
        reason: a.metadata?.reason ?? "—",
        reason_detail: a.metadata?.reason_detail ?? null,
        improvement_suggestion: a.metadata?.improvement_suggestion ?? null,
        from_plan_name: a.metadata?.from_plan_name ?? null,
      })),
    };
  });

// ---------- EVENTOS ----------
export const listEventosPlatform = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensurePlatformAdmin(context.supabase, context.userId);
    const sb = await admin();
    const [{ data: uploads }, { data: tenants }] = await Promise.all([
      sb.from("eventos_uploads").select("*").order("created_at", { ascending: false }).limit(200),
      sb.from("tenants").select("id, name"),
    ]);
    const tn = new Map((tenants || []).map((t) => [t.id, t.name]));
    return { uploads: (uploads || []).map((u) => ({ ...u, empresa: tn.get(u.tenant_id) || "—" })) };
  });

// ---------- LOGS ----------
export const listLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ category: z.string().optional() }).parse(i || {}))
  .handler(async ({ context, data }) => {
    await ensurePlatformAdmin(context.supabase, context.userId);
    const sb = await admin();

    const [{ data: audit }, { data: runs }, { data: tenants }] = await Promise.all([
      sb.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300),
      sb.from("workflow_runs").select("*").order("created_at", { ascending: false }).limit(200),
      sb.from("tenants").select("id, name"),
    ]);
    const tn = new Map((tenants || []).map((t) => [t.id, t.name]));

    const auditMapped = (audit || []).map((a) => ({
      id: a.id,
      category: a.action?.startsWith("plano") ? "plano" : a.action?.includes("login") ? "login" : a.action?.includes("upload") ? "upload" : "admin",
      action: a.action,
      entity: a.entity,
      empresa: tn.get(a.tenant_id || "") || "—",
      created_at: a.created_at,
      metadata: a.metadata,
    }));
    const runsMapped = (runs || []).map((r) => ({
      id: r.id,
      category: "n8n",
      action: `workflow.${r.status}`,
      entity: r.workflow_name || r.workflow_id,
      empresa: tn.get(r.tenant_id) || "—",
      created_at: r.created_at,
      metadata: { trigger: r.trigger_source, error: r.error, n8n_id: r.n8n_execution_id },
    }));

    const all = [...auditMapped, ...runsMapped].sort((a, b) =>
      String(b.created_at).localeCompare(String(a.created_at)),
    );
    const filtered = data.category ? all.filter((l) => l.category === data.category) : all;
    return { logs: filtered.slice(0, 400) };
  });

// ---------- CONFIGURACOES ----------
export const listPlatformSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensurePlatformAdmin(context.supabase, context.userId);
    const sb = await admin();
    const { data, error } = await sb.from("platform_settings").select("*").order("key");
    if (error) throw new Error(error.message);
    return { settings: data || [] };
  });

export const updatePlatformSetting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({
      key: z.string().min(1).max(100),
      value: z.record(z.string(), z.unknown()),
    }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await ensurePlatformAdmin(context.supabase, context.userId);
    const sb = await admin();
    const { error } = await sb
      .from("platform_settings")
      .upsert({ key: data.key, value: data.value as any, updated_at: new Date().toISOString(), updated_by: context.userId });
    if (error) throw new Error(error.message);
    await sb.from("audit_logs").insert({
      tenant_id: null as any,
      user_id: context.userId,
      action: "platform_settings.update",
      entity: "platform_settings",
      metadata: { key: data.key } as any,
    });
    return { ok: true };
  });

// ---------- LEGAL DOCUMENT CONSENTS ----------
export const listLegalConsents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ document_id: z.string().optional() }).parse(i || {}))
  .handler(async ({ context, data }) => {
    await ensurePlatformAdmin(context.supabase, context.userId);
    const sb = await admin();
    const { data: rows, error } = await sb
      .from("audit_logs")
      .select("id, tenant_id, user_id, created_at, metadata")
      .eq("action", "document_accepted")
      .eq("entity", "legal_document")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const tenantIds = Array.from(new Set((rows || []).map((r) => r.tenant_id).filter(Boolean))) as string[];
    const userIds = Array.from(new Set((rows || []).map((r) => r.user_id).filter(Boolean))) as string[];
    const [{ data: tenants }, { data: profiles }] = await Promise.all([
      tenantIds.length ? sb.from("tenants").select("id, name").in("id", tenantIds) : Promise.resolve({ data: [] as any[] }),
      userIds.length ? sb.from("profiles").select("id, full_name, email").in("id", userIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const tn = new Map((tenants || []).map((t: any) => [t.id, t.name]));
    const pn = new Map((profiles || []).map((p: any) => [p.id, p]));

    const consents = (rows || [])
      .map((r) => {
        const meta = (r.metadata as any) || {};
        if (data.document_id && meta.document_id !== data.document_id) return null;
        const prof = pn.get(r.user_id || "") as any;
        return {
          id: r.id,
          tenant: tn.get(r.tenant_id || "") || "—",
          user_name: prof?.full_name || "—",
          user_email: prof?.email || "—",
          document_id: meta.document_id || "—",
          document_title: meta.document_title || "—",
          version: meta.version || "—",
          status: meta.status || "accepted",
          source: meta.source || "—",
          created_at: r.created_at,
        };
      })
      .filter(Boolean);
    return { consents };
  });