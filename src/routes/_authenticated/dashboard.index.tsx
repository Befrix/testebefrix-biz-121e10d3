import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Users,
  Mail,
  MessageSquare,
  CalendarCheck,
  CalendarX,
  TrendingUp,
  DollarSign,
  Target,
  Sparkles,
  BrainCircuit,
  Lightbulb,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { PageHeader, StatCard, SectionCard } from "@/components/dashboard/primitives";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { generateCopilotInsights, type CopilotInsight } from "@/lib/copilot.functions";
import { formatCurrencyBRL, formatNumber, formatPercent, PIPELINE_STAGES } from "@/lib/dashboard";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardHome,
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function DashboardHome() {
  const { data, isLoading } = useWorkspaceData();
  const k = data?.kpis;

  const funnelData = useMemo(() => {
    if (!data) return [];
    const counts = PIPELINE_STAGES.filter((s) => s.key !== "lost").map((stage) => ({
      name: stage.label,
      value: data.leads.filter((l) => l.status === stage.leadStatus).length,
    }));
    return counts.map((c, i) => ({ ...c, fill: CHART_COLORS[i % CHART_COLORS.length] }));
  }, [data]);

  const channelData = useMemo(() => {
    if (!data) return [];
    const channels = ["email", "whatsapp", "linkedin"];
    return channels.map((ch) => ({
      name: ch === "email" ? "E-mail" : ch === "whatsapp" ? "WhatsApp" : "LinkedIn",
      enviados: data.outreach.filter((o) => o.channel === ch && o.direction === "outbound").length,
      respostas: data.outreach.filter((o) => o.channel === ch && o.direction === "inbound").length,
    }));
  }, [data]);

  const sourceData = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    data.leads.forEach((l) => {
      const seg = l.segment || "Outros";
      map.set(seg, (map.get(seg) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value], i) => ({ name, value, fill: CHART_COLORS[i % CHART_COLORS.length] }))
      .slice(0, 5);
  }, [data]);

  const trendData = useMemo(() => {
    if (!data) return [];
    const days = 14;
    const out: { day: string; enviados: number; respostas: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const dayStr = d.toDateString();
      out.push({
        day: label,
        enviados: data.outreach.filter((o) => o.direction === "outbound" && new Date(o.created_at).toDateString() === dayStr).length,
        respostas: data.outreach.filter((o) => o.direction === "inbound" && new Date(o.created_at).toDateString() === dayStr).length,
      });
    }
    return out;
  }, [data]);

  const callCopilot = useServerFn(generateCopilotInsights);
  const { data: copilot, isLoading: copilotLoading } = useQuery({
    queryKey: ["copilot", k?.leadsCaptured, k?.won, k?.replies],
    enabled: !!k,
    staleTime: 1000 * 60 * 30,
    queryFn: () =>
      callCopilot({
        data: {
          leadsCaptured: k!.leadsCaptured,
          emailsSent: k!.emailsSent,
          replies: k!.replies,
          meetingsScheduled: k!.meetingsScheduled,
          meetingsCompleted: k!.meetingsCompleted,
          noShows: k!.noShows,
          won: k!.won,
          revenueBRL: k!.revenueCents / 100,
          replyRate: Number(k!.replyRate.toFixed(1)),
          conversionRate: Number(k!.conversionRate.toFixed(1)),
          noShowRate: Number(k!.noShowRate.toFixed(1)),
          topSegments: sourceData.map((s) => s.name),
        },
      }),
  });

  if (isLoading || !k) {
    return (
      <div className="grid place-items-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Acompanhe em tempo real os resultados da sua operação BEFRIX: leads capturados, conversas em andamento, reuniões agendadas e receita gerada — tudo em um só lugar."
        icon={Sparkles}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        <StatCard index={0} label="Leads capturados" value={formatNumber(k.leadsCaptured)} icon={Users} />
        <StatCard index={1} label="E-mails enviados" value={formatNumber(k.emailsSent)} icon={Mail} />
        <StatCard index={2} label="Respostas" value={formatNumber(k.replies)} hint={`taxa ${formatPercent(k.replyRate)}`} icon={MessageSquare} />
        <StatCard index={3} label="Reuniões agendadas" value={formatNumber(k.meetingsScheduled)} icon={CalendarCheck} />
        <StatCard index={4} label="Reuniões concluídas" value={formatNumber(k.meetingsCompleted)} icon={CalendarCheck} />
        <StatCard index={5} label="Reagendadas" value={formatNumber(k.meetingsRescheduled)} icon={CalendarCheck} />
        <StatCard index={6} label="No-show rate" value={formatPercent(k.noShowRate)} icon={CalendarX} delta={{ value: `${k.noShows} no-shows`, positive: k.noShowRate < 20 }} />
        <StatCard index={7} label="Taxa conversão" value={formatPercent(k.conversionRate)} icon={Target} />
        <StatCard index={8} label="Reuniões convertidas" value={formatNumber(k.won)} icon={TrendingUp} />
        <StatCard index={9} label="Receita gerada" value={formatCurrencyBRL(k.revenueCents)} icon={DollarSign} />
        <StatCard index={10} label="ROI campanhas" value={formatPercent(k.roi, 0)} icon={TrendingUp} delta={{ value: k.roi >= 0 ? "positivo" : "negativo", positive: k.roi >= 0 }} />
        <StatCard index={11} label="CAC estimado" value={formatCurrencyBRL(k.cac)} hint={`CPL ${formatCurrencyBRL(k.cpl)}`} icon={DollarSign} />
      </div>

      {/* AI Copilot */}
      <SectionCard
        title="AI Copilot"
        description="Insights, recomendações e alertas gerados por IA a partir dos seus dados."
        action={<BrainCircuit className="h-5 w-5 text-accent" />}
      >
        {copilotLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Analisando campanhas, canais e reuniões…
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {(copilot?.insights ?? []).map((ins, i) => (
              <CopilotCard key={i} insight={ins} index={i} />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="E-mails vs Respostas" description="Últimos 14 dias">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gEnv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gResp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={chartTooltip} />
              <Area type="monotone" dataKey="enviados" stroke="var(--chart-1)" fill="url(#gEnv)" strokeWidth={2} />
              <Area type="monotone" dataKey="respostas" stroke="var(--chart-2)" fill="url(#gResp)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Funil Outbound" description="Distribuição do pipeline SDR">
          {funnelData.some((f) => f.value > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <FunnelChart>
                <Tooltip contentStyle={chartTooltip} />
                <Funnel dataKey="value" data={funnelData} isAnimationActive>
                  <LabelList position="right" fill="var(--foreground)" stroke="none" dataKey="name" fontSize={11} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty />
          )}
        </SectionCard>

        <SectionCard title="Conversão por canal" description="Enviados vs respostas">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={channelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={chartTooltip} cursor={{ fill: "var(--secondary)" }} />
              <Bar dataKey="enviados" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="respostas" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Origem dos leads" description="Por segmento">
          {sourceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {sourceData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltip} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmpty />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

const chartTooltip = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  fontSize: "12px",
  color: "var(--popover-foreground)",
};

function ChartEmpty() {
  return (
    <div className="grid h-[260px] place-items-center text-sm text-muted-foreground">
      Sem dados suficientes ainda.
    </div>
  );
}

const KIND_META: Record<CopilotInsight["kind"], { icon: typeof Lightbulb; tone: string; label: string }> = {
  insight: { icon: Lightbulb, tone: "text-info", label: "Insight" },
  recommendation: { icon: Sparkles, tone: "text-accent-glow", label: "Recomendação" },
  alert: { icon: AlertTriangle, tone: "text-warning", label: "Alerta" },
  opportunity: { icon: Sparkles, tone: "text-success", label: "Oportunidade" },
  risk: { icon: AlertTriangle, tone: "text-destructive", label: "Risco" },
};

function CopilotCard({ insight, index }: { insight: CopilotInsight; index: number }) {
  const meta = KIND_META[insight.kind] ?? KIND_META.insight;
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-border bg-secondary/30 p-4"
    >
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${meta.tone}`} />
        <span className="text-2xs font-semibold uppercase tracking-widest text-muted-foreground">{meta.label}</span>
      </div>
      <p className="mt-2 text-sm font-medium leading-snug">{insight.title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{insight.detail}</p>
    </motion.div>
  );
}
