import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLegalConsents } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LEGAL_DOCS } from "@/lib/legal-docs";

export const Route = createFileRoute("/admin/aceites")({ component: AceitesPage });

const FILTERS = [
  { key: "", label: "Todos" },
  { key: "termo_uso", label: LEGAL_DOCS.termo_uso.title },
  { key: "politica_privacidade", label: LEGAL_DOCS.politica_privacidade.title },
  { key: "contrato_saas", label: LEGAL_DOCS.contrato_saas.title },
];

function AceitesPage() {
  const [docId, setDocId] = useState("");
  const fn = useServerFn(listLegalConsents);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-legal-consents", docId],
    queryFn: () => fn({ data: { document_id: docId || undefined } }),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Aceites de documentos</h1>
        <p className="text-sm text-muted-foreground">
          Registros de aceite do Termo de Uso, Política de Privacidade e Contrato SaaS.
        </p>
      </header>

      <Tabs value={docId || "all"} onValueChange={(v) => setDocId(v === "all" ? "" : v)}>
        <TabsList>
          {FILTERS.map((f) => (
            <TabsTrigger key={f.key || "all"} value={f.key || "all"}>
              {f.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden border-border bg-card/50 p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data / hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">Carregando…</TableCell>
              </TableRow>
            )}
            {data?.consents.map((c: any) => (
              <TableRow key={c.id}>
                <TableCell>{c.tenant}</TableCell>
                <TableCell>
                  <div className="text-sm">{c.user_name}</div>
                  <div className="text-xs text-muted-foreground">{c.user_email}</div>
                </TableCell>
                <TableCell className="text-sm">{c.document_title}</TableCell>
                <TableCell><Badge variant="outline">{c.version}</Badge></TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.source}</TableCell>
                <TableCell>
                  <Badge variant={c.status === "accepted" ? "default" : "destructive"}>{c.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(c.created_at).toLocaleString("pt-BR")}
                </TableCell>
              </TableRow>
            ))}
            {data && data.consents.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                  Nenhum aceite registrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
