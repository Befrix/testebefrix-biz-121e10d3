import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CreditCard } from "lucide-react";
import { PageHeader, SectionCard, StatCard, StatusPill } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyBRL } from "@/lib/dashboard";

export const Route = createFileRoute("/_authenticated/dashboard/billing")({
  component: BillingPage,
});

function BillingPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["billing", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [sub, inv] = await Promise.all([
        supabase.from("subscriptions").select("status, current_period_end, planos(name, monthly_price_cents)").limit(1).maybeSingle(),
        supabase.from("invoices").select("*").order("created_at", { ascending: false }),
      ]);
      return { subscription: sub.data, invoices: (inv.data ?? []) as Array<{ id: string; amount_cents: number; status: string; created_at: string }> };
    },
  });

  if (isLoading) return <div className="grid place-items-center py-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const sub = data?.subscription as { status?: string; current_period_end?: string; planos?: { name?: string; monthly_price_cents?: number } } | null | undefined;

  return (
    <div className="space-y-8">
      <PageHeader title="Billing" description="Assinatura, faturas e uso." icon={CreditCard}
        action={<Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary">Gerenciar plano</Button>} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard index={0} label="Plano" value={sub?.planos?.name ?? "Starter"} hint={sub?.status ? `status: ${sub.status}` : undefined} />
        <StatCard index={1} label="Mensalidade" value={formatCurrencyBRL(sub?.planos?.monthly_price_cents ?? 0)} />
        <StatCard index={2} label="Renovação" value={sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("pt-BR") : "—"} />
      </div>
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
