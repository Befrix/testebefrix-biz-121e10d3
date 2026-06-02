import { type ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlan, type PlanFeatures } from "@/hooks/use-plan";

type Props = {
  flag?: keyof PlanFeatures["flags"];
  channel?: keyof PlanFeatures["channels"];
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  description?: string;
};

/**
 * Renderiza children apenas se o plano do tenant libera a flag/canal.
 * Caso contrário, mostra um bloco de upgrade.
 */
export function FeatureGate({ flag, channel, children, fallback, title, description }: Props) {
  const plan = usePlan();
  if (plan.loading) return null;
  const allowed = (flag ? plan.has(flag) : true) && (channel ? plan.channel(channel) : true);
  if (allowed) return <>{children}</>;
  if (fallback !== undefined) return <>{fallback}</>;

  const cta = plan.plan?.features.cta_upgrade ?? "Faça upgrade do plano para liberar.";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-secondary/40 to-background p-8 text-center">
      <Badge variant="outline" className="mx-auto mb-3 gap-1.5 border-border-glow"><Sparkles className="h-3 w-3 text-accent" /> Recurso bloqueado</Badge>
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-secondary"><Lock className="h-5 w-5 text-muted-foreground" /></div>
      <h3 className="text-base font-semibold">{title ?? "Disponível em planos superiores"}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description ?? cta}</p>
      <Button asChild className="mt-4 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary">
        <Link to="/dashboard/billing">Ver planos</Link>
      </Button>
    </div>
  );
}
