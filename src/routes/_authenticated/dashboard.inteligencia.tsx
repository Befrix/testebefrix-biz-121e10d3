import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2, BrainCircuit, Lightbulb, Sparkles, AlertTriangle, RefreshCw,
  TrendingUp, ShieldAlert, Target, Activity, Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader, SectionCard } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceData, type OutreachLog, type Feedback, type Lead } from "@/hooks/use-workspace-data";
import { generateCopilotInsights, type CopilotInsight } from "@/lib/copilot.functions";

export const Route = createFileRoute("/_authenticated/dashboard/inteligencia")({
  component: InteligenciaPage,
});

const META: Record<CopilotInsight["kind"], { icon: typeof Lightbulb; tone: string; bg: string; label: string }> = {
  insight:        { icon: Lightbulb,      tone: "text-info",         bg: "bg-info/10",        label: "Insight" },
  recommendation: { icon: Sparkles,       tone: "text-accent-glow",  bg: "bg-accent/10",      label: "Recomendação" },
  alert:          { icon: AlertTriangle,  tone: "text-warning",      bg: "bg-warning/10",     label: "Alerta" },
  opportunity:    { icon: TrendingUp,     tone: "text-success",      bg: "bg-success/10",     label: "Oportunidade" },
  risk:           { icon: ShieldAlert,    tone: "text-destructive",  bg: "bg-destructive/10", label: "Risco" },
};

const PRIORITY_TONE: Record<NonNullable<CopilotInsight["priority"]>, string> = {
  high: "border-destructive/40 text-destructive",
  medium: "border-warning/40 text-warning",
  low: "border-border text-muted-foreground",
};

const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function buildBreakdowns(leads: Lead[], outreach: OutreachLog[], feedback: Feedback[]) {
  // Channel breakdown
  const channelMap = new Map<string, { sent: number; replies: number }>();
  for (const o of outreach) {
    const c = o.channel || "outro";
    const e = channelMap.get(c) ?? { sent: 0, replies: 0 };
    if (o.direction === "outbound") e.sent++;
    else e.replies++;
    channelMap.set(c, e);
  }
  const channelBreakdown = [...channelMap.entries()].map(([channel, v]) => ({
    channel,
    sent: v.sent,
    replies: v.replies,
    replyRate: v.sent > 0 ? Number(((v.replies / v.sent) * 100).toFixed(1)) : 0,
  }));

  // Segment breakdown
  const segmentMap = new Map<string, { leads: number; won: number }>();
  const leadById = new Map(leads.map((l) => [l.id, l]));
  for (const l of leads) {
    const s = l.segment || "sem segmento";
    const e = segmentMap.get(s) ?? { leads: 0, won: 0 };
    e.leads++;
    segmentMap.set(s, e);
  }
  for (const f of feedback) {
    if (f.deal_status !== "won" || !f.lead_id) continue;
    const seg = leadById.get(f.lead_id)?.segment || "sem segmento";
    const e = segmentMap.get(seg) ?? { leads: 0, won: 0 };
    e.won++;
    segmentMap.set(seg, e);
  }
  const segmentBreakdown = [...segmentMap.entries()]
    .map(([segment, v]) => ({
      segment,
      leads: v.leads,
      won: v.won,
      winRate: v.leads > 0 ? Number(((v.won / v.leads) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 6);

  // Day-of-week breakdown
  const dayMap = new Map<number, { meetings: number; conversions: number }>();
  for (const f of feedback) {
    const d = new Date(f.feedback_date).getDay();
    const e = dayMap.get(d) ?? { meetings: 0, conversions: 0 };
    e.meetings++;
    if (f.deal_status === "won") e.conversions++;
    dayMap.set(d, e);
  }
  const dayOfWeekBreakdown = [...dayMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([d, v]) => ({ day: DAYS_PT[d], meetings: v.meetings, conversions: v.conversions }));

  return { channelBreakdown, segmentBreakdown, dayOfWeekBreakdown };
}

function InteligenciaPage() {
  const { data } = useWorkspaceData();
  const k = data?.kpis;
  const call = useServerFn(generateCopilotInsights);
  const qc = useQueryClient();

  const breakdowns = useMemo(() => {
    if (!data) return null;
    return buildBreakdowns(data.leads, data.outreach, data.feedback);
  }, [data]);

  const { data: copilot, isLoading, isFetching } = useQuery({
    queryKey: ["inteligencia", k?.leadsCaptured, k?.won, k?.replies],
    enabled: !!k && !!breakdowns,
    staleTime: 1000 * 60 * 30,
    queryFn: () =>
      call({
        data: {
          leadsCaptured: k!.leadsCaptured,
          emailsSent: k!.emailsSent,
          totalSent: k!.totalSent,
          replies: k!.replies,
          meetingsScheduled: k!.meetingsScheduled,
          meetingsCompleted: k!.meetingsCompleted,
          noShows: k!.noShows,
          won: k!.won,
          revenueBRL: k!.revenueCents / 100,
          spendBRL: k!.spendCents / 100,
          replyRate: Number(k!.replyRate.toFixed(1)),
          conversionRate: Number(k!.conversionRate.toFixed(1)),
          noShowRate: Number(k!.noShowRate.toFixed(1)),
          roi: Number(k!.roi.toFixed(1)),
          cac: Number((k!.cac / 100).toFixed(2)),
          channelBreakdown: breakdowns!.channelBreakdown,
          segmentBreakdown: breakdowns!.segmentBreakdown,
          dayOfWeekBreakdown: breakdowns!.dayOfWeekBreakdown,
          topSegments: breakdowns!.segmentBreakdown.slice(0, 5).map((s) => s.segment),
          activeCampaigns: (data?.campanhas ?? []).filter((c) => (c as { status?: string }).status === "active").length,
        },
      }),
  });

  const insights = copilot?.insights ?? [];
  const nextAction = copilot?.nextAction;
  const generatedAt = copilot?.generatedAt ? new Date(copilot.generatedAt) : null;

  const sortedInsights = [...insights].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 } as const;
    return (order[a.priority ?? "medium"]) - (order[b.priority ?? "medium"]);
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Copilot"
        description="A inteligência da BEFRIX analisa seus dados e mostra o que está funcionando, onde estão as oportunidades e onde corrigir a rota — em linguagem simples e acionável."
        icon={BrainCircuit}
        action={
          <div className="flex items-center gap-3">
            {generatedAt && (
              <span className="text-2xs text-muted-foreground">
                Atualizado {generatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <Button size="sm" variant="outline" disabled={isFetching} onClick={() => qc.invalidateQueries({ queryKey: ["inteligencia"] })}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Regenerar
            </Button>
          </div>
        }
      />

      {isLoading || !k || !breakdowns ? (
        <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Gerando inteligência…
        </div>
      ) : (
        <div className="space-y-6">
          {/* Next best action hero */}
          {nextAction && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-6 shadow-glow-primary"
            >
              <div className="absolute right-0 top-0 h-40 w-40 -translate-y-1/2 translate-x-1/3 rounded-full bg-primary/20 blur-3xl" />
              <div className="relative flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow-primary">
                  <Target className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-2xs font-semibold uppercase tracking-widest text-primary-glow">Próxima melhor ação</p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight">{nextAction.headline}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{nextAction.rationale}</p>
                  <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs text-success">
                    <Zap className="h-3 w-3" /> {nextAction.impact}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Behavioral patterns: channel + segment + day */}
          <div className="grid gap-4 lg:grid-cols-3">
            <SectionCard title="Performance por canal" action={<Activity className="h-5 w-5 text-info" />}>
              <div className="space-y-3">
                {breakdowns.channelBreakdown.length === 0 && <EmptyHint text="Sem outreach registrado." />}
                {breakdowns.channelBreakdown.map((c) => (
                  <div key={c.channel}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium capitalize">{c.channel}</span>
                      <span className="text-muted-foreground">{c.replies}/{c.sent} • {c.replyRate}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${Math.min(c.replyRate * 3, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Top segmentos" action={<TrendingUp className="h-5 w-5 text-success" />}>
              <div className="space-y-2">
                {breakdowns.segmentBreakdown.length === 0 && <EmptyHint text="Importe leads para ver segmentos." />}
                {breakdowns.segmentBreakdown.slice(0, 5).map((s) => (
                  <div key={s.segment} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs">
                    <span className="truncate font-medium">{s.segment}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>{s.leads} leads</span>
                      <Badge variant="outline" className="text-2xs">{s.winRate}% win</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Padrão semanal" action={<Activity className="h-5 w-5 text-accent-glow" />}>
              <div className="flex h-full items-end gap-1.5 pt-2">
                {breakdowns.dayOfWeekBreakdown.length === 0 ? <EmptyHint text="Sem reuniões registradas." />
                  : breakdowns.dayOfWeekBreakdown.map((d) => {
                    const max = Math.max(...breakdowns.dayOfWeekBreakdown.map((x) => x.meetings), 1);
                    const h = (d.meetings / max) * 100;
                    return (
                      <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                        <div className="relative flex w-full flex-1 items-end">
                          <div className="w-full rounded-t bg-gradient-to-t from-primary/40 to-accent/80" style={{ height: `${Math.max(h, 6)}%` }} />
                        </div>
                        <span className="text-2xs text-muted-foreground">{d.day}</span>
                        <span className="text-2xs font-medium">{d.meetings}</span>
                      </div>
                    );
                  })}
              </div>
            </SectionCard>
          </div>

          {/* Insights grid */}
          <SectionCard title={`Análise estratégica (${sortedInsights.length})`} action={<Sparkles className="h-5 w-5 text-accent-glow" />}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sortedInsights.map((ins, i) => {
                const m = META[ins.kind];
                const Icon = m.icon;
                const prio = ins.priority ?? "medium";
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`inline-flex items-center gap-1.5 rounded-md ${m.bg} px-2 py-1`}>
                        <Icon className={`h-3.5 w-3.5 ${m.tone}`} />
                        <span className={`text-2xs font-semibold uppercase tracking-widest ${m.tone}`}>{m.label}</span>
                      </div>
                      <Badge variant="outline" className={`text-2xs ${PRIORITY_TONE[prio]}`}>{prio}</Badge>
                    </div>
                    <p className="mt-3 text-sm font-medium leading-snug">{ins.title}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">{ins.detail}</p>
                    {ins.metric && (
                      <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 px-2 py-0.5 text-2xs font-medium text-foreground">
                        {ins.metric}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="py-4 text-center text-xs text-muted-foreground">{text}</p>;
}
