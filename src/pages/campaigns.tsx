import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";                          // ← ADD
import { Loader2, Megaphone, Plus } from "lucide-react";
import { PageHeader, SectionCard, StatusPill, EmptyState } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { formatNumber } from "@/lib/dashboard";
import { NovaCampanhaDialog } from "@/components/dashboard/nova-campanha-dialog"; // ← ADD

export const Route = createFileRoute("/_authenticated/dashboard/campanhas")({
  component: CampanhasPage,
});

const STATUS_TONE: Record<string, string> = {
  active: "success",
  running: "success",
  draft: "muted",
  paused: "warning",
  completed: "info",
};

function CampanhasPage() {
  const { data, isLoading } = useWorkspaceData();
  const [dialogOpen, setDialogOpen] = useState(false);    // ← ADD

  const campanhas = (data?.campanhas ?? []) as Array<{
    id: string;
    name: string;
    channel: string;
    status: string;
    created_at: string;
  }>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Campanhas"
        description="Orquestre disparos outbound por canal."
        icon={Megaphone}
        action={
          <Button
            onClick={() => setDialogOpen(true)}           // ← ADD
            className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary"
          >
            <Plus className="h-4 w-4" /> Nova campanha
          </Button>
        }
      />

      {/* ← ADD */}
      <NovaCampanhaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      {isLoading ? (
        <div className="grid place-items-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : campanhas.length === 0 ? (
        <EmptyState icon={Megaphone} title="Nenhuma campanha" description="Crie sua primeira campanha outbound para começar a prospectar." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campanhas.map((c) => {
            const sent = (data?.outreach ?? []).filter((o) => o.direction === "outbound" && o.channel === c.channel).length;
            const replies = (data?.outreach ?? []).filter((o) => o.direction === "inbound" && o.channel === c.channel).length;
            return (
              <SectionCard key={c.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">{c.channel}</p>
                  </div>
                  <StatusPill label={c.status} tone={STATUS_TONE[c.status] ?? "muted"} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/40 p-3">
                    <p className="text-2xs uppercase tracking-widest text-muted-foreground">Enviados</p>
                    <p className="mt-1 text-lg font-semibold">{formatNumber(sent)}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-3">
                    <p className="text-2xs uppercase tracking-widest text-muted-foreground">Respostas</p>
                    <p className="mt-1 text-lg font-semibold">{formatNumber(replies)}</p>
                  </div>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
