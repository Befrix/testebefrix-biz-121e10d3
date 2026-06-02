import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Users, Calendar, Workflow, DollarSign, TrendingUp, Database } from "lucide-react";
import { getAdminDashboard } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/dashboard")({
  component: AdminDashboardPage,
});

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function StatCard({ label, value, icon: Icon, loading }: { label: string; value: string; icon: any; loading?: boolean }) {
  return (
    <Card className="border-border bg-card/50 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-32" />
          ) : (
            <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          )}
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}

function AdminDashboardPage() {
  const fn = useServerFn(getAdminDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Visão Geral da Plataforma</h1>
        <p className="text-sm text-muted-foreground">Métricas em tempo real do SaaS.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de Clientes" value={String(data?.totalClientes ?? 0)} icon={Building2} loading={isLoading} />
        <StatCard label="MRR" value={BRL.format((data?.mrrCents ?? 0) / 100)} icon={TrendingUp} loading={isLoading} />
        <StatCard label="Receita do Mês" value={BRL.format((data?.monthlyRevenueCents ?? 0) / 100)} icon={DollarSign} loading={isLoading} />
        <StatCard label="Usuários Ativos (24h)" value={String(data?.usuariosAtivos ?? 0)} icon={Users} loading={isLoading} />
        <StatCard label="Total de Leads" value={String(data?.totalLeads ?? 0)} icon={Database} loading={isLoading} />
        <StatCard label="Total de Eventos" value={String(data?.totalEventos ?? 0)} icon={Calendar} loading={isLoading} />
        <StatCard label="Execuções N8N (24h)" value={String(data?.execucoesN8N ?? 0)} icon={Workflow} loading={isLoading} />
      </div>
    </div>
  );
}