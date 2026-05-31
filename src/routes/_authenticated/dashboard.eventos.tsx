import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CalendarDays } from "lucide-react";
import { PageHeader, SectionCard, EmptyState, StatusPill } from "@/components/dashboard/primitives";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/eventos")({
  component: EventosPage,
});

function EventosPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["eventos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("leads_eventos").select("*").order("occurred_at", { ascending: false }).limit(100);
      return (data ?? []) as Array<{ id: string; event_type: string; occurred_at: string }>;
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Eventos" description="Sinais de intenção e performance de eventos." icon={CalendarDays} />
      {isLoading ? (
        <div className="grid place-items-center py-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nenhum evento" description="Eventos de leads (aberturas, cliques, respostas) aparecerão aqui." />
      ) : (
        <SectionCard title="Linha do tempo">
          <div className="space-y-2">
            {data.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-2.5">
                <StatusPill label={e.event_type} tone="primary" />
                <span className="text-xs text-muted-foreground">{new Date(e.occurred_at).toLocaleString("pt-BR")}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
