import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CreditCard, Check, X, Sparkles } from "lucide-react";
import { PageHeader, SectionCard, StatCard, StatusPill } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyBRL } from "@/lib/dashboard";
import { usePlan, type Plan } from "@/hooks/use-plan";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/billing")({
  component: BillingPage,
});

const TIER_ORDER = ["starter", "pro", "enterprise"] as const;

function BillingPage() {
  const { user } = useAuth();
  const current = usePlan();

  const { data, isLoading } = useQuery({
    queryKey: ["billing", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [sub, inv, plans] = await Promise.all([
        supabase.from("subscriptions").select("status, current_period_end").order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("invoices").select("*").order("created_at", { ascending: false }),
        supabase.from("planos").select("id, tier, name, monthly_price_cents, features"),
      ]);
      return {
        subscription: sub.data,
        invoices: (inv.data ?? []) as Array<{ id: string; amount_cents: number; status: string; created_at: string }>,
        plans: ((plans.data ?? []) as unknown as Plan[]).slice().sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)),
      };
    },
  });

  if (isLoading || current.loading) {
    return <div className="grid place-items-center py-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const currentPlan = current.plan;

  return (
    <div className="space-y-8">
      <PageHeader title="Billing" description="Assinatura, plano atual e faturas." icon={CreditCard}
        action={<Button asChild variant="outline"><Link to="/planos">Ver planos públicos</Link></Button>} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard index={0} label="Plano atual" value={currentPlan?.name ?? "—"} hint={data?.subscription?.status ? `status: ${data.subscription.status}` : undefined} />
        <StatCard index={1} label="Mensalidade" value={formatCurrencyBRL(currentPlan?.monthly_price_cents ?? 0)} />
        <StatCard index={2} label="Renovação" value={data?.subscription?.current_period_end ? new Date(data.subscription.current_period_end).toLocaleDateString("pt-BR") : "—"} />
      </div>

      <SectionCard title="Planos disponíveis" description="Faça upgrade ou downgrade a qualquer momento.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {data?.plans.map((p) => {
            const isCurrent = currentPlan?.id === p.id;
            return (
              <div key={p.id} className={cn(
                "relative rounded-2xl border p-6",
                isCurrent ? "border-primary/60 bg-primary/5 shadow-glow-primary" : "border-border bg-secondary/30",
              )}>
                {p.features.badge && (
                  <Badge className="absolute -top-3 left-6 bg-gradient-to-r from-primary to-accent text-primary-foreground">
                    <Sparkles className="mr-1 h-3 w-3" />{p.features.badge}
                  </Badge>
                )}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">{p.name}</h3>
                  {isCurrent && <StatusPill label="Atual" tone="success" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.features.tagline}</p>
                <p className="mt-3 text-2xl font-semibold">{formatCurrencyBRL(p.monthly_price_cents)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <ul className="mt-4 space-y-1.5 text-xs">
                  <li className="flex justify-between"><span className="text-muted-foreground">Leads/mês</span><span className="font-medium">{p.features.limits.leads_per_month ?? "Ilimitado"}</span></li>
                  <li className="flex justify-between"><span className="text-muted-foreground">Usuários</span><span className="font-medium">{p.features.limits.users ?? "Ilimitado"}</span></li>
                  <li className="flex justify-between"><span className="text-muted-foreground">Nichos</span><span className="font-medium">{p.features.limits.niches ?? "Ilimitado"}</span></li>
                </ul>
                <ul className="mt-4 space-y-1.5 text-xs">
                  {p.features.features.slice(0, 6).map((f) => (
                    <li key={f} className="flex items-start gap-1.5"><Check className="mt-0.5 h-3 w-3 shrink-0 text-success" /><span className="text-muted-foreground">{f}</span></li>
                  ))}
                </ul>
                <ChannelRow label="WhatsApp Automation" enabled={p.features.channels.whatsapp_automation} />
                <ChannelRow label="Sequências Omnichannel IA" enabled={p.features.channels.sequences_omnichannel} />
                <Button disabled={isCurrent} className="mt-4 w-full" variant={isCurrent ? "outline" : "default"}>
                  {isCurrent ? "Plano atual" : "Solicitar mudança"}
                </Button>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Faturas">
        {(data?.invoices ?? []).length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma fatura ainda.</p>
        ) : (
          <div className="space-y-2">
            {data!.invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{formatCurrencyBRL(inv.amount_cents)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(inv.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <StatusPill label={inv.status} tone={inv.status === "paid" ? "success" : inv.status === "open" ? "warning" : "muted"} />
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function ChannelRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="mt-2 flex items-center gap-1.5 text-xs">
      {enabled ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-muted-foreground" />}
      <span className={enabled ? "" : "text-muted-foreground line-through"}>{label}</span>
    </div>
  );
}
