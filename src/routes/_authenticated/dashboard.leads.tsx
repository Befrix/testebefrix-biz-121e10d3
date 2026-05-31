import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Users, LayoutGrid, List, Building2, Mail, CalendarCheck, Sparkles } from "lucide-react";
import { PageHeader, SectionCard, StatusPill, EmptyState } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkspaceData, type Lead } from "@/hooks/use-workspace-data";
import { PIPELINE_STAGES, formatNumber } from "@/lib/dashboard";
import { cn } from "@/lib/utils";
import { MeetingFeedbackDialog } from "@/components/dashboard/meeting-feedback-dialog";
import { scoreLeadsWithAI } from "@/lib/lead-scoring.functions";

export const Route = createFileRoute("/_authenticated/dashboard/leads")({
  component: LeadsPage,
});

function LeadsPage() {
  const { data, isLoading } = useWorkspaceData();
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [query, setQuery] = useState("");
  const [feedbackLeadId, setFeedbackLeadId] = useState<string | null>(null);

  const leads = useMemo(() => {
    const all = data?.leads ?? [];
    if (!query) return all;
    const q = query.toLowerCase();
    return all.filter(
      (l) =>
        l.full_name?.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.segment?.toLowerCase().includes(q)
    );
  }, [data, query]);

  const qc = useQueryClient();
  const score = useServerFn(scoreLeadsWithAI);
  const scoreMut = useMutation({
    mutationFn: () => score({ data: { limit: 20 } }),
    onSuccess: (r) => {
      toast.success(`IA atualizou ${r.scored} leads`);
      qc.invalidateQueries({ queryKey: ["workspace-data"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro na IA"),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Leads"
        description="Pipeline SDR e base de prospecção."
        icon={Users}
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={scoreMut.isPending}
              onClick={() => scoreMut.mutate()}
            >
              <Sparkles className="h-4 w-4 text-accent" />
              {scoreMut.isPending ? "Pontuando…" : "Score com IA"}
            </Button>
            <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/40 p-1">
              <Button
                variant={view === "pipeline" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("pipeline")}
              >
                <LayoutGrid className="h-4 w-4" /> Pipeline
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" /> Lista
              </Button>
            </div>
          </div>
        }
      />

      <Input
        placeholder="Buscar por nome, empresa, e-mail ou segmento…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />

      {isLoading ? (
        <div className="grid place-items-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum lead ainda"
          description="Importe leads via Uploads ou capture através das suas campanhas outbound."
        />
      ) : view === "pipeline" ? (
        <PipelineBoard leads={leads} onFeedback={setFeedbackLeadId} />
      ) : (
        <LeadsTable leads={leads} onFeedback={setFeedbackLeadId} />
      )}

      <MeetingFeedbackDialog
        open={!!feedbackLeadId}
        onOpenChange={(v) => !v && setFeedbackLeadId(null)}
        leadId={feedbackLeadId}
      />
    </div>
  );
}

function PipelineBoard({ leads, onFeedback }: { leads: Lead[]; onFeedback: (id: string) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const stageLeads = leads.filter((l) => l.status === stage.leadStatus);
        return (
          <div key={stage.key} className="w-72 shrink-0">
            <div className="mb-3 flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
              <span className="text-sm font-medium">{stage.label}</span>
              <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">
                {formatNumber(stageLeads.length)}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {stageLeads.map((lead) => (
                <div key={lead.id} className="rounded-xl glass p-3 transition-shadow hover:shadow-glow-soft">
                  <p className="truncate text-sm font-medium">{lead.full_name ?? "Sem nome"}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" /> {lead.company ?? "—"}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    {lead.segment && <StatusPill label={lead.segment} tone="primary" />}
                    <span className="text-2xs text-muted-foreground">score {lead.score}</span>
                  </div>
                  {(stage.key === "meeting" || stage.key === "proposal") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 w-full justify-center text-xs"
                      onClick={() => onFeedback(lead.id)}
                    >
                      <CalendarCheck className="h-3.5 w-3.5" /> Feedback
                    </Button>
                  )}
                </div>
              ))}
              {stageLeads.length === 0 && (
                <div className="rounded-xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                  Vazio
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeadsTable({ leads, onFeedback }: { leads: Lead[]; onFeedback: (id: string) => void }) {
  return (
    <SectionCard className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const stage = PIPELINE_STAGES.find((s) => s.leadStatus === lead.status);
              return (
                <TableRow key={lead.id}>
                  <TableCell>
                    <p className="font-medium">{lead.full_name ?? "Sem nome"}</p>
                    {lead.email && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {lead.email}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{lead.company ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.job_title ?? "—"}</TableCell>
                  <TableCell>{lead.segment ? <StatusPill label={lead.segment} tone="primary" /> : "—"}</TableCell>
                  <TableCell>
                    <StatusPill label={stage?.label ?? lead.status} tone="info" />
                  </TableCell>
                  <TableCell className={cn("text-right font-mono text-sm", lead.score > 70 && "text-success")}>
                    {lead.score}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => onFeedback(lead.id)}>
                      <CalendarCheck className="h-3.5 w-3.5" /> Feedback
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
}
