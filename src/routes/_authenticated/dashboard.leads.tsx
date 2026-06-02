import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Users, LayoutGrid, List, Building2, Mail, Phone, CalendarCheck, Sparkles, Lock } from "lucide-react";
import { PageHeader, SectionCard, StatusPill, EmptyState } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { LeadDetailDrawer } from "@/components/dashboard/lead-detail-drawer";
import { scoreLeadsWithAI } from "@/lib/lead-scoring.functions";
import { usePlan } from "@/hooks/use-plan";

export const Route = createFileRoute("/_authenticated/dashboard/leads")({
  component: LeadsPage,
});

function LeadsPage() {
  const { data, isLoading } = useWorkspaceData();
  const plan = usePlan();
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [query, setQuery] = useState("");
  const [feedbackLeadId, setFeedbackLeadId] = useState<string | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");

  const allLeads = data?.leads ?? [];

  const segments = useMemo(
    () => Array.from(new Set(allLeads.map((l) => l.segment).filter(Boolean))) as string[],
    [allLeads]
  );
  const eventSources = useMemo(() => {
    const set = new Set<string>();
    for (const l of allLeads) {
      const src = (l.metadata as Record<string, unknown> | null)?.source;
      if (typeof src === "string") set.add(src);
    }
    return Array.from(set);
  }, [allLeads]);

  const leads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allLeads.filter((l) => {
      if (segmentFilter !== "all" && l.segment !== segmentFilter) return false;
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (eventFilter !== "all") {
        const src = (l.metadata as Record<string, unknown> | null)?.source;
        if (src !== eventFilter) return false;
      }
      if (scoreFilter !== "all") {
        const s = l.score ?? 0;
        if (scoreFilter === "hot" && s < 70) return false;
        if (scoreFilter === "warm" && (s < 40 || s >= 70)) return false;
        if (scoreFilter === "cold" && s >= 40) return false;
      }
      if (q) {
        const hay = [l.full_name, l.company, l.email, l.segment, l.phone, l.job_title]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allLeads, query, segmentFilter, statusFilter, eventFilter, scoreFilter]);

  const qc = useQueryClient();
  const score = useServerFn(scoreLeadsWithAI);
  const aiAllowed = plan.has("ia_advanced") || plan.tier !== "starter";
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
              disabled={scoreMut.isPending || !aiAllowed}
              onClick={() => aiAllowed && scoreMut.mutate()}
              title={aiAllowed ? "" : "Disponível no plano Pro ou superior"}
            >
              {aiAllowed ? <Sparkles className="h-4 w-4 text-accent" /> : <Lock className="h-4 w-4" />}
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

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por nome, empresa, e-mail, cargo ou telefone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Segmento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos segmentos</SelectItem>
            {segments.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {PIPELINE_STAGES.map((s) => (
              <SelectItem key={s.key} value={s.leadStatus}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Origem/Evento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas origens</SelectItem>
            {eventSources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={scoreFilter} onValueChange={setScoreFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Score" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer score</SelectItem>
            <SelectItem value="hot">Hot (70+)</SelectItem>
            <SelectItem value="warm">Warm (40–69)</SelectItem>
            <SelectItem value="cold">Cold (&lt;40)</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {formatNumber(leads.length)} de {formatNumber(allLeads.length)} leads
        </span>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title={allLeads.length === 0 ? "Nenhum lead ainda" : "Nenhum lead corresponde aos filtros"}
          description={
            allLeads.length === 0
              ? "Importe leads via Uploads ou capture através das suas campanhas outbound."
              : "Ajuste os filtros para encontrar leads."
          }
        />
      ) : view === "pipeline" ? (
        <PipelineBoard leads={leads} onFeedback={setFeedbackLeadId} onOpen={setDetailLead} />
      ) : (
        <LeadsTable leads={leads} onFeedback={setFeedbackLeadId} onOpen={setDetailLead} />
      )}

      <MeetingFeedbackDialog
        open={!!feedbackLeadId}
        onOpenChange={(v) => !v && setFeedbackLeadId(null)}
        leadId={feedbackLeadId}
      />

      <LeadDetailDrawer
        lead={detailLead}
        open={!!detailLead}
        onOpenChange={(v) => !v && setDetailLead(null)}
      />
    </div>
  );
}

function PipelineBoard({
  leads,
  onFeedback,
  onOpen,
}: {
  leads: Lead[];
  onFeedback: (id: string) => void;
  onOpen: (lead: Lead) => void;
}) {
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
                <button
                  key={lead.id}
                  type="button"
                  onClick={() => onOpen(lead)}
                  className="rounded-xl glass p-3 text-left transition-shadow hover:shadow-glow-soft"
                >
                  <p className="truncate text-sm font-medium">{lead.full_name ?? "Sem nome"}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" /> {lead.company ?? "—"}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    {lead.segment && <StatusPill label={lead.segment} tone="primary" />}
                    <span className="text-2xs text-muted-foreground">score {lead.score}</span>
                  </div>
                  {(stage.key === "meeting" || stage.key === "proposal") && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); onFeedback(lead.id); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onFeedback(lead.id); } }}
                      className="mt-2 flex h-7 w-full cursor-pointer items-center justify-center gap-1 rounded-md text-xs hover:bg-accent/40"
                    >
                      <CalendarCheck className="h-3.5 w-3.5" /> Feedback
                    </span>
                  )}
                </button>
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

function LeadsTable({
  leads,
  onFeedback,
  onOpen,
}: {
  leads: Lead[];
  onFeedback: (id: string) => void;
  onOpen: (lead: Lead) => void;
}) {
  return (
    <SectionCard className="p-0">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Segmento</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-right">Score IA</TableHead>
              <TableHead>Pipeline</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const stage = PIPELINE_STAGES.find((s) => s.leadStatus === lead.status);
              const meta = (lead.metadata ?? {}) as Record<string, unknown>;
              const assigned = (meta.assigned_name as string | undefined) ?? "—";
              const source = (meta.source as string | undefined) ?? "manual";
              return (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer"
                  onClick={() => onOpen(lead)}
                >
                  <TableCell>
                    <p className="font-medium">{lead.full_name ?? "Sem nome"}</p>
                  </TableCell>
                  <TableCell className="text-sm">{lead.company ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.job_title ?? "—"}</TableCell>
                  <TableCell>{lead.segment ? <StatusPill label={lead.segment} tone="primary" /> : "—"}</TableCell>
                  <TableCell className="text-sm">
                    {lead.email ? (
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" /> {lead.email}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {lead.phone ? (
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground" /> {lead.phone}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className={cn("text-right font-mono text-sm", lead.score > 70 && "text-success")}>{lead.score}</TableCell>
                  <TableCell>
                    <StatusPill label={stage?.label ?? lead.status} tone="info" />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{assigned}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{source}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onFeedback(lead.id); }}>
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
