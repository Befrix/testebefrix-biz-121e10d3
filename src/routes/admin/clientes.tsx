import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listClientes } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/admin/clientes")({ component: ClientesPage });

function ClientesPage() {
  const fn = useServerFn(listClientes);
  const { data, isLoading } = useQuery({ queryKey: ["admin-clientes"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">Empresas ativas na plataforma.</p>
      </header>
      <Card className="border-border bg-card/50 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Usuários</TableHead>
              <TableHead>Leads / Limite</TableHead>
              <TableHead>Criado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Carregando…</TableCell></TableRow>}
            {data?.clientes.map((c) => {
              const pct = c.limite_leads ? Math.min(100, (c.leads_consumidos / c.limite_leads) * 100) : 0;
              return (
                <TableRow key={c.tenant_id}>
                  <TableCell>
                    <div className="font-medium">{c.empresa}</div>
                    {c.website && <div className="text-xs text-muted-foreground">{c.website}</div>}
                  </TableCell>
                  <TableCell><Badge variant="outline">{c.plano}</Badge></TableCell>
                  <TableCell><Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge></TableCell>
                  <TableCell className="text-right">{c.usuarios}</TableCell>
                  <TableCell className="w-56">
                    <div className="flex items-center gap-2">
                      <span className="text-xs tabular-nums">
                        {c.leads_consumidos}{c.limite_leads ? ` / ${c.limite_leads}` : ""}
                      </span>
                      {c.limite_leads && <Progress value={pct} className="h-1.5 flex-1" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(c.criado_em).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              );
            })}
            {data && data.clientes.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Nenhum cliente cadastrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}