import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ListOrdered, Plus, Mail, MessageCircle, Linkedin, Clock } from "lucide-react";
import { PageHeader, SectionCard, EmptyState } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/sequencias")({
  component: SequenciasPage,
});

const STEP_ICON: Record<string, typeof Mail> = { email: Mail, whatsapp: MessageCircle, linkedin: Linkedin, wait: Clock };

function SequenciasPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["sequencias", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("sequencias").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Array<{ id: string; name: string; steps: Array<{ channel?: string; type?: string; delay_days?: number; label?: string }> }>;
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sequências"
        description="Cadências multi-toque automatizadas."
        icon={ListOrdered}
        action={
          <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary">
            <Plus className="h-4 w-4" /> Nova sequência
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid place-items-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={ListOrdered} title="Nenhuma sequência" description="Monte cadências de e-mail, WhatsApp e LinkedIn com intervalos automáticos." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((seq) => (
            <SectionCard key={seq.id} title={seq.name}>
              <div className="flex flex-wrap items-center gap-2">
                {(seq.steps ?? []).map((step, i) => {
                  const Icon = STEP_ICON[step.channel ?? step.type ?? "email"] ?? Mail;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-1.5 text-xs">
                        <Icon className="h-3.5 w-3.5 text-primary-glow" />
                        {step.label ?? step.channel ?? `Passo ${i + 1}`}
                        {step.delay_days ? <span className="text-muted-foreground">+{step.delay_days}d</span> : null}
                      </div>
                      {i < (seq.steps?.length ?? 0) - 1 && <span className="text-muted-foreground">→</span>}
                    </div>
                  );
                })}
                {(seq.steps ?? []).length === 0 && <p className="text-sm text-muted-foreground">Sem passos configurados.</p>}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
