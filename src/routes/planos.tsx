import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GlowOrb } from "@/components/ui/glow-orb";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyBRL } from "@/lib/dashboard";
import type { Plan } from "@/hooks/use-plan";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos — BEFRIX" },
      { name: "description", content: "Starter, Pro e Enterprise: planos para escalar outbound multicanal com IA." },
    ],
  }),
  component: PlanosPage,
});

const TIER_ORDER = ["starter", "pro", "enterprise"] as const;

function PlanosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("planos")
        .select("id, tier, name, monthly_price_cents, features");
      if (error) throw error;
      return (data ?? []) as unknown as Plan[];
    },
  });

  const plans = (data ?? [])
    .slice()
    .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier));

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Navbar />
      <section className="relative pt-32 pb-20">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
        <GlowOrb className="-top-40 left-1/2 -translate-x-1/2" variant="primary" size="xl" />
        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <Badge variant="outline" className="glass mb-6 gap-1.5 border-border-glow px-3 py-1 text-xs">
            <Sparkles className="h-3 w-3 text-accent" /> Planos
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Escale na <span className="text-gradient-primary">velocidade que precisar</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground md:text-lg">
            Planos transparentes em reais. Sem fidelidade. Cancele quando quiser.
          </p>

          {isLoading ? (
            <div className="grid place-items-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
              {plans.map((p, i) => {
                const highlight = p.tier === "pro";
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                      "relative rounded-2xl p-8 text-left transition-all",
                      highlight
                        ? "glass-strong border-2 border-primary/60 shadow-glow-primary"
                        : "glass border border-border hover:border-border-glow",
                    )}
                  >
                    {p.features.badge && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
                        {p.features.badge}
                      </Badge>
                    )}
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{p.features.tagline}</p>
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-semibold tracking-tight">{formatCurrencyBRL(p.monthly_price_cents)}</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-secondary/40 p-3 text-xs">
                      <div><p className="font-medium">{p.features.limits.leads_per_month ?? "∞"}</p><p className="text-muted-foreground">leads/mês</p></div>
                      <div><p className="font-medium">{p.features.limits.users ?? "∞"}</p><p className="text-muted-foreground">usuários</p></div>
                      <div><p className="font-medium">{p.features.limits.niches ?? "∞"}</p><p className="text-muted-foreground">nichos</p></div>
                    </div>

                    <Button
                      asChild
                      className={cn(
                        "mt-6 w-full",
                        highlight ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary hover:opacity-90" : "",
                      )}
                      variant={highlight ? "default" : "outline"}
                    >
                      <Link to="/register">{p.tier === "enterprise" ? "Falar com vendas" : "Começar agora"}</Link>
                    </Button>

                    <ul className="mt-8 space-y-3">
                      {p.features.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>

                    {p.features.cta_upgrade && (
                      <p className="mt-6 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                        {p.features.cta_upgrade}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
