import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SETTINGS_VISIBLE_DOCS, LEGAL_DOCS } from "@/lib/legal-docs";
import { DocViewer } from "@/components/legal/doc-viewer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos da plataforma — BEFRIX" },
      { name: "description", content: "Consulte o Termo de Uso e a Política de Privacidade da BEFRIX." },
    ],
  }),
  component: DocumentosPage,
});

function DocumentosPage() {
  const { user } = useAuth();
  const { data: consents } = useQuery({
    queryKey: ["my-consents", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("id, created_at, metadata")
        .eq("action", "document_accepted")
        .eq("entity", "legal_document")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const latestById = new Map<string, any>();
  for (const c of consents ?? []) {
    const docId = (c.metadata as any)?.document_id;
    if (docId && !latestById.has(docId)) latestById.set(docId, c);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ShieldCheck className="h-5 w-5 text-primary" /> Documentos da plataforma
        </h1>
        <p className="text-sm text-muted-foreground">
          Consulte o Termo de Consentimento e Uso e a Política de Privacidade da BEFRIX.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SETTINGS_VISIBLE_DOCS.map((doc) => {
          const consent = latestById.get(doc.id);
          return (
            <Card key={doc.id} className="border-border bg-card/50 p-5">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-primary-glow" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold">{doc.title}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Versão {doc.version} — {doc.updatedAt}
                  </p>
                  {consent && (
                    <Badge variant="outline" className="mt-2 gap-1 border-emerald-500/30 text-emerald-500">
                      <CheckCircle2 className="h-3 w-3" /> Aceito em{" "}
                      {new Date(consent.created_at).toLocaleString("pt-BR")}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <DocViewer
                  doc={doc}
                  trigger={
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" /> Ler documento
                    </Button>
                  }
                />
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="border-border bg-card/30 p-5">
        <h3 className="text-sm font-semibold">Contrato de Prestação de Serviços SaaS</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Este contrato será apresentado para aceite após a confirmação do pagamento do plano contratado.
        </p>
        <div className="mt-3">
          <DocViewer
            doc={LEGAL_DOCS.contrato_saas}
            trigger={
              <Button variant="ghost" size="sm">
                <FileText className="mr-2 h-4 w-4" /> Prévia do contrato
              </Button>
            }
          />
        </div>
      </Card>
    </div>
  );
}
