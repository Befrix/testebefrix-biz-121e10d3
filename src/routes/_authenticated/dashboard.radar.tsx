import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Radar, Search, Loader2, Lock, Sparkles, MapPin, Building2 } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { usePlan } from "@/hooks/use-plan";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/radar")({
  component: RadarPage,
});

type RadarLead = {
  id: string;
  full_name: string | null;
  company: string | null;
  segment: string | null;
  region: string | null;
  score: number;
};

function RadarPage() {
  const plan = usePlan();
  const allowed = plan.tier === "pro" || plan.tier === "enterprise";

  const [segmento, setSegmento] = useState("");
  const [cidade, setCidade] = useState("");
  const [raio, setRaio] = useState("50");
  const [results, setResults] = useState<RadarLead[] | null>(null);

  const search = useMutation({
    mutationFn: async () => {
      let q = supabase
        .from("leads")
        .select("id, full_name, company, segment, region, score")
        .order("score", { ascending: false })
        .limit(50);
      if (segmento.trim()) q = q.ilike("segment", `%${segmento.trim()}%`);
      if (cidade.trim()) q = q.ilike("region", `%${cidade.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as RadarLead[];
    },
    onSuccess: (data) => {
      setResults(data);
      toast.success(`${data.length} resultado(s) encontrado(s)`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (plan.loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Radar BEFRIX"
        description="Identifique empresas e oportunidades no seu segmento e região."
        icon={Radar}
      />

      {!allowed ? (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-secondary/40 to-background p-10 text-center">
          <Badge variant="outline" className="mx-auto mb-3 gap-1.5 border-border-glow">
            <Sparkles className="h-3 w-3 text-accent" /> Recurso premium
          </Badge>
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-secondary">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Radar BEFRIX disponível nos planos Pro e Enterprise</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Faça upgrade para descobrir empresas alinhadas ao seu ICP por segmento, cidade e raio de atuação.
          </p>
          <Button
            asChild
            className="mt-5 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary"
          >
            <Link to="/dashboard/pagamentos">Fazer Upgrade</Link>
          </Button>
        </div>
      ) : (
        <>
          <SectionCard>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                search.mutate();
              }}
              className="grid gap-4 md:grid-cols-[1fr_1fr_140px_auto]"
            >
              <div className="space-y-1.5">
                <Label htmlFor="segmento">Segmento</Label>
                <Input
                  id="segmento"
                  placeholder="Ex.: SaaS, Indústria"
                  value={segmento}
                  onChange={(e) => setSegmento(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="Ex.: São Paulo"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="raio">Raio (km)</Label>
                <Input
                  id="raio"
                  type="number"
                  min={0}
                  value={raio}
                  onChange={(e) => setRaio(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={search.isPending}
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary md:w-auto"
                >
                  {search.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Buscar
                </Button>
              </div>
            </form>
          </SectionCard>

          {results !== null && (
            <SectionCard>
              {results.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum resultado para os filtros atuais.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {results.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {l.company ?? l.full_name ?? "—"}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {l.segment && (
                            <span className="inline-flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {l.segment}
                            </span>
                          )}
                          {l.region && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {l.region}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">Score {l.score}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
