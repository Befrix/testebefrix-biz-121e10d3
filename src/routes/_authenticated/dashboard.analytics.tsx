import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Loader2, BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, SectionCard, StatCard } from "@/components/dashboard/primitives";
import { useWorkspaceData } from "@/hooks/use-workspace-data";
import { formatCurrencyBRL, formatPercent } from "@/lib/dashboard";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
  component: AnalyticsPage,
});

const tip = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "0.75rem", fontSize: "12px", color: "var(--popover-foreground)" };

function AnalyticsPage() {
  const { data, isLoading } = useWorkspaceData();
  const k = data?.kpis;

  const revenueByCampaign = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, number>();
    data.feedback.filter((f) => f.deal_status === "won").forEach((f) => {
      const lead = data.leads.find((l) => l.id === f.lead_id);
      const key = lead?.segment ?? "Geral";
      map.set(key, (map.get(key) ?? 0) + (f.deal_value_cents ?? 0) / 100);
    });
    return Array.from(map.entries()).map(([name, receita]) => ({ name, receita }));
  }, [data]);

  const meetingStatus = useMemo(() => {
    if (!data) return [];
    const statuses = ["scheduled", "completed", "no_show", "rescheduled", "cancelled"];
    const labels: Record<string, string> = { scheduled: "Agendada", completed: "Concluída", no_show: "No-show", rescheduled: "Reagendada", cancelled: "Cancelada" };
    return statuses.map((s) => ({ name: labels[s], total: data.feedback.filter((f) => f.meeting_status === s).length }));
  }, [data]);

  if (isLoading || !k) {
    return <div className="grid place-items-center py-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" description="ROI, revenue attribution e performance de reuniões." icon={BarChart3} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard index={0} label="Receita gerada" value={formatCurrencyBRL(k.revenueCents)} />
        <StatCard index={1} label="ROI" value={formatPercent(k.roi, 0)} delta={{ value: k.roi >= 0 ? "positivo" : "negativo", positive: k.roi >= 0 }} />
        <StatCard index={2} label="CAC" value={formatCurrencyBRL(k.cac)} />
        <StatCard index={3} label="No-show rate" value={formatPercent(k.noShowRate)} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Revenue por campanha" description="Receita fechada por segmento">
          {revenueByCampaign.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueByCampaign}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={tip} cursor={{ fill: "var(--secondary)" }} formatter={(v: number) => formatCurrencyBRL(v * 100)} />
                <Bar dataKey="receita" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="grid h-[280px] place-items-center text-sm text-muted-foreground">Sem receita registrada.</div>}
        </SectionCard>
        <SectionCard title="Comparecimento de reuniões" description="Distribuição por status">
          {meetingStatus.some((m) => m.total > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={meetingStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={tip} cursor={{ fill: "var(--secondary)" }} />
                <Bar dataKey="total" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="grid h-[280px] place-items-center text-sm text-muted-foreground">Sem reuniões registradas.</div>}
        </SectionCard>
      </div>
    </div>
  );
}
