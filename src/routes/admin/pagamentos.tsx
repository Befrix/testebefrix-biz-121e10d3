import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPagamentos } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/admin/pagamentos")({ component: PagamentosPage });
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function PagamentosPage() {
  const fn = useServerFn(listPagamentos);
  const { data, isLoading } = useQuery({ queryKey: ["admin-pagamentos"], queryFn: () => fn() });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pagamentos</h1>
        <p className="text-sm text-muted-foreground">Assinaturas e faturas.</p>
      </header>
      <Tabs defaultValue="assinaturas">
        <TabsList>
          <TabsTrigger value="assinaturas">Assinaturas</TabsTrigger>
          <TabsTrigger value="faturas">Histórico de Faturas</TabsTrigger>
        </TabsList>
        <TabsContent value="assinaturas">
          <Card className="border-border bg-card/50 p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Mensal</TableHead>
                  <TableHead>Vencimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Carregando…</TableCell></TableRow>}
                {data?.assinaturas.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.empresa}</TableCell>
                    <TableCell>{s.plano}</TableCell>
                    <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{BRL.format((s.preco_cents || 0) / 100)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.current_period_end ? new Date(s.current_period_end).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="faturas">
          <Card className="border-border bg-card/50 p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pago em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.faturas.map((i: any) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.empresa}</TableCell>
                    <TableCell><Badge variant={i.status === "paid" ? "default" : i.status === "open" ? "secondary" : "destructive"}>{i.status}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{BRL.format((i.amount_cents || 0) / 100)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{i.due_at ? new Date(i.due_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{i.paid_at ? new Date(i.paid_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  </TableRow>
                ))}
                {data && data.faturas.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Nenhuma fatura.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}