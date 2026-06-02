import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listEventosPlatform } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/eventos")({ component: EventosPage });

function EventosPage() {
  const fn = useServerFn(listEventosPlatform);
  const { data, isLoading } = useQuery({ queryKey: ["admin-eventos"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Eventos</h1>
        <p className="text-sm text-muted-foreground">Uploads de listas e eventos processados.</p>
      </header>
      <Card className="border-border bg-card/50 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Arquivo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Linhas</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Carregando…</TableCell></TableRow>}
            {data?.uploads.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.empresa}</TableCell>
                <TableCell className="text-sm">{u.filename}</TableCell>
                <TableCell><Badge variant={u.status === "completed" ? "default" : u.status === "failed" ? "destructive" : "secondary"}>{u.status}</Badge></TableCell>
                <TableCell className="text-right tabular-nums">{u.rows_count}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString("pt-BR")}</TableCell>
              </TableRow>
            ))}
            {data && data.uploads.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nenhum upload registrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}