import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLogs, listSatisfactionSurveys } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/logs")({ component: LogsPage });

const CATEGORIES = [
  { key: "", label: "Todos" },
  { key: "login", label: "Login" },
  { key: "upload", label: "Uploads" },
  { key: "n8n", label: "Execuções N8N" },
  { key: "plano", label: "Mudanças de Plano" },
  { key: "admin", label: "Alterações Admin" },
  { key: "satisfacao", label: "Pesquisa de Satisfação" },
];

function LogsPage() {
  const [cat, setCat] = useState<string>("");
  const fn = useServerFn(listLogs);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-logs", cat],
    enabled: cat !== "satisfacao",
    queryFn: () => fn({ data: { category: cat || undefined } }),
  });
  const surveysFn = useServerFn(listSatisfactionSurveys);
  const { data: surveysData, isLoading: surveysLoading } = useQuery({
    queryKey: ["admin-satisfaction"],
    enabled: cat === "satisfacao",
    queryFn: () => surveysFn(),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Logs</h1>
        <p className="text-sm text-muted-foreground">Auditoria e execuções de workflows.</p>
      </header>

      <Tabs value={cat || "all"} onValueChange={(v) => setCat(v === "all" ? "" : v)}>
        <TabsList>
          {CATEGORIES.map((c) => (
            <TabsTrigger key={c.key || "all"} value={c.key || "all"}>{c.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {cat === "satisfacao" ? (
        <Card className="border-border bg-card/50 p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>O que mais gosta</TableHead>
                <TableHead>Sugestão de melhoria</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveysLoading && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Carregando…</TableCell></TableRow>}
              {surveysData?.surveys.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{s.empresa}</TableCell>
                  <TableCell className="text-sm">
                    <div>{s.user_name}</div>
                    <div className="text-xs text-muted-foreground">{s.user_email}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{s.satisfaction_score ?? "—"}</Badge></TableCell>
                  <TableCell className="text-sm max-w-[260px] whitespace-pre-wrap">{s.favorite_feature || "—"}</TableCell>
                  <TableCell className="text-sm max-w-[260px] whitespace-pre-wrap">{s.suggested_improvement || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("pt-BR")}</TableCell>
                </TableRow>
              ))}
              {surveysData && surveysData.surveys.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Nenhuma resposta registrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
      <Card className="border-border bg-card/50 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoria</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Quando</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Carregando…</TableCell></TableRow>}
            {data?.logs.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell><Badge variant="outline">{l.category}</Badge></TableCell>
                <TableCell className="text-sm font-medium">{l.action}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{String(l.entity || "—")}</TableCell>
                <TableCell>{l.empresa}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</TableCell>
              </TableRow>
            ))}
            {data && data.logs.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nenhum log nesta categoria.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      )}
    </div>
  );
}