import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Workflow, Zap, CalendarCheck, AlertTriangle, Sparkles, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionCard, EmptyState, StatusPill } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  AUTOMATION_PRESETS,
  activateAutomation,
  toggleAutomation,
  deleteAutomation,
  type AutomationPresetKey,
} from "@/lib/automations.functions";

export const Route = createFileRoute("/_authenticated/dashboard/automacoes")({
  component: AutomacoesPage,
});

const PRESET_ICON = {
  "calendar-check": CalendarCheck,
  alert: AlertTriangle,
  sparkles: Sparkles,
  reply: Reply,
  zap: Zap,
} as const;

function AutomacoesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const activate = useServerFn(activateAutomation);
  const toggle = useServerFn(toggleAutomation);
  const remove = useServerFn(deleteAutomation);

  const { data, isLoading } = useQuery({
    queryKey: ["automacoes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("automacoes")
        .select("id, name, enabled, trigger, actions, created_at")
        .order("created_at", { ascending: false });
      return (data ?? []) as Array<{
        id: string;
        name: string;
        enabled: boolean;
        trigger: { event?: string } | null;
        actions: Array<{ type?: string }> | null;
      }>;
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["automacoes"] });

  const activateMut = useMutation({
    mutationFn: (key: AutomationPresetKey) => activate({ data: { key } }),
    onSuccess: (_, key) => {
      toast.success(`Automação ativada: ${AUTOMATION_PRESETS.find((p) => p.key === key)?.name}`);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao ativar"),
  });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; enabled: boolean }) => toggle({ data: v }),
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Automação removida");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Automações"
        description="Engine SDR com IA · triggers, ações multicanal e revenue feedback."
        icon={Workflow}
      />

      <SectionCard title="Templates inteligentes" action={<Sparkles className="h-5 w-5 text-accent" />}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {AUTOMATION_PRESETS.map((p) => {
            const Icon = PRESET_ICON[p.icon];
            const installed = data?.some((a) => a.name === p.name);
            return (
              <div key={p.key} className="rounded-xl border border-border bg-secondary/30 p-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                    <Icon className="h-4.5 w-4.5 text-primary-glow" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{p.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={installed ? "outline" : "secondary"}
                  className="mt-3 w-full"
                  disabled={installed || activateMut.isPending}
                  onClick={() => activateMut.mutate(p.key)}
                >
                  {installed ? "Já ativa" : activateMut.isPending ? "Ativando…" : "Ativar"}
                </Button>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {isLoading ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Workflow} title="Nenhuma automação ativa" description="Ative um template acima em 1 clique." />
      ) : (
        <SectionCard title="Suas automações" action={<StatusPill label={`${data.filter((a) => a.enabled).length} ativas`} tone="success" />}>
          <div className="space-y-2">
            {data.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    Trigger: <span className="font-mono">{a.trigger?.event ?? "—"}</span> ·{" "}
                    {a.actions?.length ?? 0} ações
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={a.enabled}
                    onCheckedChange={(v) => toggleMut.mutate({ id: a.id, enabled: v })}
                  />
                  <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(a.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
