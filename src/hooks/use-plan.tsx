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
    niches: number | null; // null = ilimitado
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
  has: (flag: keyof PlanFeatures["flags"]) => boolean;
  channel: (key: keyof PlanFeatures["channels"]) => boolean;
  fieldVisible: (field: string) => boolean;
  premiumUnlocked: (key: string) => boolean;
  limit: (key: keyof PlanFeatures["limits"]) => number | null;
};

export function usePlan(): PlanContext {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["current-plan", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status, plan:planos(id, tier, name, monthly_price_cents, features)")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const plan = (data?.plan as Plan | null) ?? null;
  const tier: PlanTier = (plan?.tier as PlanTier) ?? "starter";
  const features = plan?.features;

  return {
    plan,
    tier,
    status: data?.status ?? null,
    loading: isLoading,
    has: (flag) => Boolean(features?.flags?.[flag]),
    channel: (key) => Boolean(features?.channels?.[key]),
    fieldVisible: (field) => features?.lead_visible_fields?.includes(field) ?? false,
    premiumUnlocked: (key) => Boolean(features?.lead_premium_unlocked?.[key]),
    limit: (key) => features?.limits?.[key] ?? null,
  };
}
