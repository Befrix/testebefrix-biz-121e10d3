import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLogs } from "@/lib/admin.functions";
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
];

function LogsPage() {
  const [cat, setCat] = useState<string>("");
  const fn = useServerFn(listLogs);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-logs", cat],
    queryFn: () => fn({ data: { category: cat || undefined } }),
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
    </div>
  );
}