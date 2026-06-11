import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type PlanTier = "starter" | "pro" | "enterprise";

export type PlanFeatures = {
  badge: string | null;
  tagline: string;
  limits: {
    leads_per_month: number | null;
    users: number | null;
    niches: number | null;
    daily_contacts: number | null;
  };
  features: string[];
  channels: {
    email: boolean;
    whatsapp: boolean;
    whatsapp_automation: boolean;
    sequences_omnichannel: boolean;
  };
  lead_visible_fields: string[];
  lead_premium_unlocked: Record<string, boolean>;
  flags: Record<string, boolean>;
  cta_upgrade: string | null;
};

export type Plan = {
  id: string;
  tier: PlanTier;
  name: string;
  monthly_price_cents: number;
  features: PlanFeatures;
};

export type PlanContext = {
  plan: Plan | null;
  tier: PlanTier;
  status: string | null;
  loading: boolean;
  isAdmin: boolean;
  has: (flag: keyof PlanFeatures["flags"]) => boolean;
  channel: (key: keyof PlanFeatures["channels"]) => boolean;
  fieldVisible: (field: string) => boolean;
  premiumUnlocked: (key: string) => boolean;
  limit: (key: keyof PlanFeatures["limits"]) => number | null;
};

export function usePlan(): PlanContext {
  const { user } = useAuth();

  // Busca o tenant_id e se é admin via profile
  const { data: profile } = useQuery({
    queryKey: ["profile-tenant", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("tenant_id, email")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const isAdmin = profile?.email === "contato@befrix.biz";

  const { data, isLoading } = useQuery({
    queryKey: ["current-plan", profile?.tenant_id],
    enabled: !!profile?.tenant_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, plan:planos(id, tier, name, monthly_price_cents, features)")
        .eq("tenant_id", profile!.tenant_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Admin sempre tem acesso total independente de plano
  const plan = (data?.plan as Plan | null) ?? null;
  const tier: PlanTier = isAdmin ? "enterprise" : ((plan?.tier as PlanTier) ?? "starter");
  const features = plan?.features;

  return {
    plan,
    tier,
    status: data?.status ?? null,
    loading: isLoading,
    isAdmin,
    has: (flag) => isAdmin || Boolean(features?.flags?.[flag]),
    channel: (key) => isAdmin || Boolean(features?.channels?.[key]),
    fieldVisible: (field) => isAdmin || (features?.lead_visible_fields?.includes(field) ?? false),
    premiumUnlocked: (key) => isAdmin || Boolean(features?.lead_premium_unlocked?.[key]),
    limit: (key) => isAdmin ? null : (features?.limits?.[key] ?? null),
  };
}
