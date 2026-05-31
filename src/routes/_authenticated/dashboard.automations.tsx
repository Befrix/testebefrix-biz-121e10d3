import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Workflow as WorkflowIcon,
  Plus,
  Play,
  Pause,
  Trash2,
  Save,
  Zap,
  Mail,
  MessageSquare,
  Linkedin,
  CheckCircle2,
  Move3d,
  Tag,
  Webhook,
  PanelTop,
  Calendar,
  Clock,
  Sparkles,
  GitBranch,
  Activity,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  X,
  type LucideIcon,
} from "lucide-react";
import { PageHeader, SectionCard, StatusPill, EmptyState } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  listWorkflows,
  saveWorkflow,
  deleteWorkflow,
  toggleWorkflow,
  recentWorkflowExecutions,
  WORKFLOW_TRIGGERS,
  WORKFLOW_ACTIONS,
  type WorkflowDefinition,
} from "@/lib/workflows.functions";

export const Route = createFileRoute("/_authenticated/dashboard/automations")({
  component: AutomationsBuilderPage,
});

// ---------- Types ----------
type Step = {
  id: string;
  kind: "action" | "delay" | "ai" | "branch";
  type: string;
  label: string;
  config: Record<string, unknown>;
  yes?: Step[];
  no?: Step[];
};

type WorkflowRow = {
  id: string;
  name: string;
  definition: Record<string, unknown>;
  created_at: string;
};

type LocalDef = {
  enabled: boolean;
  trigger: { event: string; label: string; config?: Record<string, unknown> };
  steps: Step[];
};


const ACTION_ICONS: Record<string, LucideIcon> = {
  mail: Mail,
  message: MessageSquare,
  linkedin: Linkedin,
  check: CheckCircle2,
  move: Move3d,
  tag: Tag,
  webhook: Webhook,
  popup: PanelTop,
  calendar: Calendar,
  clock: Clock,
  sparkles: Sparkles,
  branch: GitBranch,
};

const KIND_TONE: Record<Step["kind"], string> = {
  action: "from-primary/30 to-primary/5 border-primary/30 text-primary-glow",
  delay: "from-warning/30 to-warning/5 border-warning/30 text-warning",
  ai: "from-accent/30 to-accent/5 border-accent/30 text-accent",
  branch: "from-info/30 to-info/5 border-info/30 text-info",
};

const uid = () => Math.random().toString(36).slice(2, 10);

function emptyDefinition(): LocalDef {
  return {
    enabled: false,
    trigger: { event: "lead.created", label: "Novo lead" },
    steps: [],
  };
}

function normalize(def: unknown): LocalDef {
  const d = (def as Partial<LocalDef>) ?? {};
  return {
    enabled: Boolean(d.enabled),
    trigger: d.trigger ?? { event: "lead.created", label: "Novo lead" },
    steps: Array.isArray(d.steps) ? (d.steps as Step[]) : [],
  };
}


// ---------- Step helpers (immutable updates) ----------
function insertStep(steps: Step[], step: Step): Step[] {
  return [...steps, step];
}
function removeStep(steps: Step[], id: string): Step[] {
  return steps
    .filter((s) => s.id !== id)
    .map((s) =>
      s.kind === "branch"
        ? { ...s, yes: removeStep(s.yes ?? [], id), no: removeStep(s.no ?? [], id) }
        : s
    );
}

function addToBranch(steps: Step[], branchId: string, side: "yes" | "no", step: Step): Step[] {
  return steps.map((s) => {
    if (s.id === branchId && s.kind === "branch") {
      const arr = (s[side] ?? []) as Step[];
      return { ...s, [side]: [...arr, step] };
    }
    if (s.kind === "branch") {
      return { ...s, yes: addToBranch(s.yes ?? [], branchId, side, step), no: addToBranch(s.no ?? [], branchId, side, step) };
    }
    return s;
  });
}

function createStep(def: (typeof WORKFLOW_ACTIONS)[number]): Step {
  const base: Step = {
    id: uid(),
    kind: def.kind as Step["kind"],
    type: def.type,
    label: def.label,
    config: {},
  };
  if (def.kind === "branch") {
    base.yes = [];
    base.no = [];
  }
  if (def.type === "wait_days") base.config = { days: 1 };
  return base;
}

// ---------- Component ----------
function AutomationsBuilderPage() {
  const qc = useQueryClient();
  const list = useServerFn(listWorkflows);
  const save = useServerFn(saveWorkflow);
  const del = useServerFn(deleteWorkflow);
  const toggle = useServerFn(toggleWorkflow);
  const recent = useServerFn(recentWorkflowExecutions);

  const { data, isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: () => list({ data: {} as never }),
  });
  const { data: execs } = useQuery({
    queryKey: ["workflow-execs"],
    queryFn: () => recent({ data: {} as never }),
    refetchInterval: 30_000,
  });

  const workflows = (data?.workflows ?? []) as WorkflowRow[];
  const stats = data?.stats ?? {};

  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("Nova automação");
  const [def, setDef] = useState<LocalDef>(emptyDefinition);
  const [dirty, setDirty] = useState(false);

  // hydrate first workflow
  useEffect(() => {
    if (!activeId && workflows.length > 0) loadWorkflow(workflows[0]);
  }, [workflows.length]); // eslint-disable-line

  function loadWorkflow(w: WorkflowRow) {
    setActiveId(w.id);
    setName(w.name);
    setDef(normalize(w.definition));
    setDirty(false);
  }
  function startNew() {
    setActiveId(null);
    setName("Nova automação");
    setDef(emptyDefinition());
    setDirty(true);
  }

  function patchDef(updater: (d: LocalDef) => LocalDef) {
    setDef((d) => updater(d));
    setDirty(true);
  }


  const saveMut = useMutation({
    mutationFn: () => save({ data: { id: activeId ?? undefined, name, definition: def as unknown as WorkflowDefinition } }),
    onSuccess: (row: { id: string } | unknown) => {
      const r = row as { id: string };
      setActiveId(r.id);
      setDirty(false);
      toast.success("Workflow salvo");
      qc.invalidateQueries({ queryKey: ["workflows"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; enabled: boolean }) => toggle({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workflows"] }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Workflow removido");
      startNew();
      qc.invalidateQueries({ queryKey: ["workflows"] });
    },
  });

  // Add step to root or to a specific branch
  const [focusBranch, setFocusBranch] = useState<{ id: string; side: "yes" | "no" } | null>(null);
  function appendAction(action: (typeof WORKFLOW_ACTIONS)[number]) {
    const step = createStep(action);
    patchDef((d) => {
      if (focusBranch) return { ...d, steps: addToBranch(d.steps, focusBranch.id, focusBranch.side, step) };
      return { ...d, steps: insertStep(d.steps, step) };
    });
  }
  function removeStepById(id: string) {
    patchDef((d) => ({ ...d, steps: removeStep(d.steps, id) }));
  }

  const totals = useMemo(() => {
    const allRuns = Object.values(stats).reduce((a, s) => a + s.runs, 0);
    const allOk = Object.values(stats).reduce((a, s) => a + s.ok, 0);
    const successRate = allRuns > 0 ? (allOk / allRuns) * 100 : 0;
    return { allRuns, successRate, active: workflows.filter((w) => (w.definition as { enabled?: boolean })?.enabled).length };
  }, [stats, workflows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workflow Builder"
        description="Engine visual de automação SDR · triggers, ações, IA, branching, analytics."
        icon={WorkflowIcon}
        action={
          <>
            <Button variant="outline" size="sm" onClick={startNew}>
              <Plus className="h-4 w-4" /> Novo
            </Button>
            <Button
              size="sm"
              disabled={!dirty || saveMut.isPending}
              onClick={() => saveMut.mutate()}
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary"
            >
              <Save className="h-4 w-4" /> {saveMut.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </>
        }
      />

      {/* Hero stats */}
      <div className="grid gap-3 md:grid-cols-3">
        <HeroStat icon={Activity} label="Workflows ativos" value={String(totals.active)} hint={`${workflows.length} totais`} />
        <HeroStat icon={Play} label="Execuções (recentes)" value={String(totals.allRuns)} hint="últimos 500 logs" />
        <HeroStat icon={TrendingUp} label="Taxa de sucesso" value={`${totals.successRate.toFixed(1)}%`} hint="todas as ações" positive={totals.successRate >= 80} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        {/* Left: workflow list */}
        <SectionCard title="Workflows" className="h-fit">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : workflows.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum workflow ainda. Crie o primeiro →</p>
          ) : (
            <div className="space-y-1.5">
              {workflows.map((w) => {
                const enabled = Boolean((w.definition as { enabled?: boolean })?.enabled);
                const s = stats[w.id] ?? { runs: 0, ok: 0, errors: 0, lastRun: null };
                const isActive = w.id === activeId;
                return (
                  <button
                    key={w.id}
                    onClick={() => loadWorkflow(w)}
                    className={cn(
                      "group w-full rounded-lg border px-3 py-2.5 text-left transition-all",
                      isActive
                        ? "border-primary/40 bg-gradient-to-br from-primary/10 to-accent/5"
                        : "border-border bg-secondary/30 hover:border-border-strong"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{w.name}</span>
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          enabled ? "bg-success shadow-[0_0_8px_currentColor]" : "bg-muted-foreground/40"
                        )}
                      />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-2xs text-muted-foreground">
                      <span>{s.runs} runs</span>
                      <span className={s.errors > 0 ? "text-destructive" : ""}>
                        {s.errors} erros
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Center: canvas */}
        <div className="rounded-2xl glass relative overflow-hidden">
          {/* Mesh background */}
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_25%_15%,hsl(var(--primary)/0.2),transparent_45%),radial-gradient(circle_at_75%_85%,hsl(var(--accent)/0.18),transparent_45%)]" />
          <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(hsl(var(--border)/0.4)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.4)_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.15]" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setDirty(true);
              }}
              className="h-9 max-w-sm border-transparent bg-transparent text-base font-semibold focus-visible:bg-secondary/40"
            />
            <div className="flex items-center gap-3">
              {activeId && (
                <>
                  <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/40 px-3 py-1.5">
                    <span className="text-2xs uppercase tracking-wider text-muted-foreground">Status</span>
                    <Switch
                      checked={def.enabled}
                      onCheckedChange={(v) => {
                        patchDef((d) => ({ ...d, enabled: v }));
                        toggleMut.mutate({ id: activeId, enabled: v });
                      }}
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate(activeId)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="relative z-10 max-h-[70vh] overflow-y-auto px-6 py-8">
            {/* Trigger node */}
            <TriggerNode
              event={def.trigger.event}
              onChange={(event) => {
                const found = WORKFLOW_TRIGGERS.find((t) => t.event === event);
                patchDef((d) => ({ ...d, trigger: { event, label: found?.label ?? event } }));
              }}
            />

            <Connector />

            {/* Steps */}
            <StepList
              steps={def.steps}
              onRemove={removeStepById}
              focusBranch={focusBranch}
              onFocusBranch={setFocusBranch}
            />

            {/* Empty state */}
            {def.steps.length === 0 && (
              <div className="mx-auto mt-2 max-w-md rounded-xl border border-dashed border-border bg-secondary/20 p-6 text-center">
                <Sparkles className="mx-auto h-5 w-5 text-accent" />
                <p className="mt-2 text-sm font-medium">Adicione sua primeira ação</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Clique numa ação no painel ao lado →
                </p>
              </div>
            )}

            {focusBranch && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky bottom-0 left-0 mt-6 flex items-center justify-between rounded-xl border border-info/30 bg-info/10 px-4 py-2 backdrop-blur-xl"
              >
                <span className="text-xs">
                  Inserindo no branch <strong className="text-info">{focusBranch.side === "yes" ? "Sim" : "Não"}</strong>
                </span>
                <Button size="sm" variant="ghost" onClick={() => setFocusBranch(null)}>
                  <X className="h-3.5 w-3.5" /> Sair
                </Button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right: palette + execution */}
        <div className="space-y-4">
          <SectionCard title="Triggers">
            <div className="space-y-1.5">
              {WORKFLOW_TRIGGERS.map((t) => {
                const active = def.trigger.event === t.event;
                return (
                  <button
                    key={t.event}
                    onClick={() =>
                      patchDef((d) => ({ ...d, trigger: { event: t.event, label: t.label } }))
                    }
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-left text-xs transition-all",
                      active
                        ? "border-primary/40 bg-primary/10 text-primary-glow"
                        : "border-border bg-secondary/30 hover:border-border-strong hover:bg-secondary/50"
                    )}
                  >
                    <span className="block font-medium">{t.label}</span>
                    <span className="block text-2xs text-muted-foreground">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Ações" description="Clique para adicionar ao workflow">
            <div className="space-y-1">
              {(["action", "delay", "ai", "branch"] as const).map((kind) => (
                <div key={kind}>
                  <p className="px-1 pb-1 pt-2 text-2xs uppercase tracking-widest text-muted-foreground">
                    {kind === "action" ? "Canais" : kind === "delay" ? "Tempo" : kind === "ai" ? "Inteligência" : "Branching"}
                  </p>
                  {WORKFLOW_ACTIONS.filter((a) => a.kind === kind).map((a) => {
                    const Icon = ACTION_ICONS[a.icon] ?? Zap;
                    return (
                      <button
                        key={a.type}
                        onClick={() => appendAction(a)}
                        className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-secondary/50"
                      >
                        <Icon className={cn("h-3.5 w-3.5 shrink-0", kind === "ai" ? "text-accent" : kind === "branch" ? "text-info" : kind === "delay" ? "text-warning" : "text-primary-glow")} />
                        <span className="flex-1 truncate">{a.label}</span>
                        <Plus className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Execuções recentes" action={<Activity className="h-4 w-4 text-accent" />}>
            {execs?.items && execs.items.length > 0 ? (
              <div className="space-y-1.5">
                {execs.items.slice(0, 8).map((log) => {
                  const meta = (log.metadata as { event?: string; executed?: Array<{ results?: Array<{ ok: boolean }> }> }) ?? {};
                  const ok = (meta.executed ?? []).every((e) => (e.results ?? []).every((r) => r.ok));
                  return (
                    <div key={log.id} className="flex items-center gap-2 rounded-md bg-secondary/30 px-2 py-1.5 text-2xs">
                      <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-success" : "bg-destructive")} />
                      <span className="flex-1 truncate font-mono text-muted-foreground">{meta.event ?? "—"}</span>
                      <span className="text-muted-foreground">{new Date(log.created_at as string).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-2xs text-muted-foreground">Aguardando primeiras execuções.</p>
            )}
          </SectionCard>
        </div>
      </div>

      {workflows.length === 0 && !isLoading && (
        <EmptyState
          icon={WorkflowIcon}
          title="Sem workflows"
          description="Use o builder acima para criar seu primeiro fluxo SDR."
        />
      )}
    </div>
  );
}

// ---------- Subcomponents ----------
function HeroStat({
  icon: Icon,
  label,
  value,
  hint,
  positive,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  positive?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl glass p-5"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className={cn("h-4 w-4", positive === false ? "text-destructive" : "text-primary-glow")} />
      </div>
      <p className="relative mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="relative mt-0.5 text-2xs text-muted-foreground">{hint}</p>}
    </motion.div>
  );
}

function TriggerNode({ event, onChange }: { event: string; onChange: (e: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto w-full max-w-md rounded-2xl border border-success/40 bg-gradient-to-br from-success/15 to-success/5 p-4 shadow-[0_0_40px_-12px_hsl(var(--success)/0.4)] backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-success/20">
          <Zap className="h-4.5 w-4.5 text-success" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-2xs uppercase tracking-widest text-success">Trigger</p>
          <Select value={event} onValueChange={onChange}>
            <SelectTrigger className="mt-0.5 h-7 border-0 bg-transparent p-0 text-sm font-semibold focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORKFLOW_TRIGGERS.map((t) => (
                <SelectItem key={t.event} value={t.event}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </motion.div>
  );
}

function Connector() {
  return (
    <div className="mx-auto my-1 flex justify-center">
      <div className="h-8 w-px bg-gradient-to-b from-border via-border to-transparent" />
    </div>
  );
}

function StepList({
  steps,
  onRemove,
  focusBranch,
  onFocusBranch,
}: {
  steps: Step[];
  onRemove: (id: string) => void;
  focusBranch: { id: string; side: "yes" | "no" } | null;
  onFocusBranch: (f: { id: string; side: "yes" | "no" } | null) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <AnimatePresence initial={false}>
        {steps.map((s, idx) => (
          <motion.div
            key={s.id}
            layout
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-md"
          >
            <StepNode step={s} onRemove={onRemove} focusBranch={focusBranch} onFocusBranch={onFocusBranch} />
            {idx < steps.length - 1 && <Connector />}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function StepNode({
  step,
  onRemove,
  focusBranch,
  onFocusBranch,
}: {
  step: Step;
  onRemove: (id: string) => void;
  focusBranch: { id: string; side: "yes" | "no" } | null;
  onFocusBranch: (f: { id: string; side: "yes" | "no" } | null) => void;
}) {
  const def = WORKFLOW_ACTIONS.find((a) => a.type === step.type);
  const Icon = ACTION_ICONS[def?.icon ?? "sparkles"] ?? Sparkles;

  if (step.kind === "branch") {
    return (
      <div
        className={cn(
          "rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-xl",
          KIND_TONE.branch
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="text-sm font-semibold">{step.label}</span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(step.id)}>
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(["yes", "no"] as const).map((side) => {
            const isFocus = focusBranch?.id === step.id && focusBranch?.side === side;
            const children = (step[side] ?? []) as Step[];
            return (
              <div key={side} className="rounded-xl border border-border-subtle bg-background/40 p-2">
                <button
                  onClick={() => onFocusBranch(isFocus ? null : { id: step.id, side })}
                  className={cn(
                    "mb-2 flex w-full items-center justify-between rounded-md px-2 py-1 text-2xs font-semibold uppercase tracking-widest transition-colors",
                    side === "yes" ? "text-success" : "text-destructive",
                    isFocus && "bg-secondary/60"
                  )}
                >
                  <span>{side === "yes" ? "✓ Sim" : "✗ Não"}</span>
                  <ChevronRight className={cn("h-3 w-3 transition-transform", isFocus && "rotate-90")} />
                </button>
                {children.length === 0 ? (
                  <p className="px-2 py-3 text-center text-2xs text-muted-foreground">
                    {isFocus ? "Adicionar ações →" : "Vazio"}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {children.map((c) => {
                      const cdef = WORKFLOW_ACTIONS.find((a) => a.type === c.type);
                      const CIcon = ACTION_ICONS[cdef?.icon ?? "sparkles"] ?? Sparkles;
                      return (
                        <div
                          key={c.id}
                          className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2 py-1.5 text-2xs"
                        >
                          <CIcon className="h-3 w-3 text-primary-glow" />
                          <span className="flex-1 truncate">{c.label}</span>
                          <button
                            onClick={() => onRemove(c.id)}
                            className="opacity-50 hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-2xl border bg-gradient-to-br p-4 backdrop-blur-xl transition-all hover:shadow-glow-primary",
        KIND_TONE[step.kind]
      )}
    >
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-background/40">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xs uppercase tracking-widest opacity-70">
          {step.kind === "ai" ? "IA" : step.kind === "delay" ? "Delay" : "Ação"}
        </p>
        <p className="truncate text-sm font-semibold text-foreground">{step.label}</p>
        {step.type === "wait_days" && (
          <p className="mt-0.5 text-2xs text-muted-foreground">
            {(step.config.days as number) ?? 1} dia(s)
          </p>
        )}
      </div>
      <StatusPill label={step.type} tone={step.kind === "ai" ? "primary" : "muted"} />
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(step.id)}>
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}

// Suppress unused import warning for AlertCircle (kept for future use)
void AlertCircle;
