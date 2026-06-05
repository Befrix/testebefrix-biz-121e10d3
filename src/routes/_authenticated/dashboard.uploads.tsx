import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Upload, FileSpreadsheet } from "lucide-react";
import { PageHeader, SectionCard, EmptyState, StatusPill } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatNumber } from "@/lib/dashboard";

export const Route = createFileRoute("/_authenticated/dashboard/uploads")({
  component: UploadsPage,
});

const TONE: Record<string, string> = { completed: "success", processing: "warning", pending: "muted", failed: "destructive" };

function UploadsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["uploads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("eventos_uploads").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Array<{ id: string; filename: string; status: string; rows_count: number; created_at: string }>;
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Importação de Eventos" description="Envie listas de participantes de eventos em CSV/planilha. Cada linha vira um lead enriquecido automaticamente." icon={Upload}
        action={
          <Button asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary">
            <Link to="/dashboard/eventos"><Upload className="h-4 w-4" /> Novo upload</Link>
          </Button>
        } />
      {isLoading ? (
        <div className="grid place-items-center py-32"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="Nenhum upload"
          description="Envie uma planilha de leads para importar em massa."
          action={
            <Button asChild>
              <Link to="/dashboard/eventos"><Upload className="h-4 w-4" /> Importar planilha</Link>
            </Button>
          }
        />
      ) : (
        <SectionCard>
          <div className="space-y-2">
            {data.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-4 w-4 text-primary-glow" />
                  <div>
                    <p className="text-sm font-medium">{u.filename}</p>
                    <p className="text-xs text-muted-foreground">{formatNumber(u.rows_count)} linhas · {new Date(u.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
                <StatusPill label={u.status} tone={TONE[u.status] ?? "muted"} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
