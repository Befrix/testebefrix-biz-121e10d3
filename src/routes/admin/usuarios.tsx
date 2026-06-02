import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listUsuarios, togglePlatformAdmin } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/usuarios")({ component: UsuariosPage });

function UsuariosPage() {
  const fn = useServerFn(listUsuarios);
  const toggle = useServerFn(togglePlatformAdmin);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-usuarios"], queryFn: () => fn() });

  const m = useMutation({
    mutationFn: (input: { user_id: string; grant: boolean }) => toggle({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-usuarios"] });
      toast.success("Permissão atualizada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p className="text-sm text-muted-foreground">Todos os usuários da plataforma.</p>
      </header>
      <Card className="border-border bg-card/50 p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Papéis</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Carregando…</TableCell></TableRow>}
            {data?.usuarios.map((u) => {
              const isAdmin = u.roles.includes("platform_admin");
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.nome || "—"}</div>
                    {u.cargo && <div className="text-xs text-muted-foreground">{u.cargo}</div>}
                  </TableCell>
                  <TableCell className="text-sm">{u.email}</TableCell>
                  <TableCell>{u.empresa}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r} variant={r === "platform_admin" ? "default" : "outline"}>{r}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={isAdmin ? "destructive" : "outline"}
                      disabled={m.isPending}
                      onClick={() => m.mutate({ user_id: u.id, grant: !isAdmin })}
                    >
                      {isAdmin ? "Revogar Admin" : "Tornar Admin"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}