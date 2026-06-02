import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPlanos, updatePlano } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/planos")({ component: PlanosPage });

function PlanosPage() {
  const fn = useServerFn(listPlanos);
  const upd = useServerFn(updatePlano);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-planos"], queryFn: () => fn() });

  const m = useMutation({
    mutationFn: (input: { id: string; name?: string; monthly_price_cents?: number; features?: Record<string, unknown> }) => upd({ data: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-planos"] });
      toast.success("Plano atualizado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Planos</h1>
        <p className="text-sm text-muted-foreground">Preço, limites e recursos.</p>
      </header>
      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      <div className="grid gap-4 lg:grid-cols-3">
        {data?.planos.map((p: any) => (
          <PlanoCard key={p.id} plano={p} onSave={m.mutate} saving={m.isPending} />
        ))}
      </div>
    </div>
  );
}

function PlanoCard({ plano, onSave, saving }: { plano: any; onSave: (i: any) => void; saving: boolean }) {
  const [name, setName] = useState(plano.name);
  const [price, setPrice] = useState((plano.monthly_price_cents / 100).toFixed(2));
  const [features, setFeatures] = useState(JSON.stringify(plano.features, null, 2));

  return (
    <Card className="border-border bg-card/50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="uppercase">{plano.tier}</Badge>
      </div>
      <div className="space-y-2">
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Preço mensal (R$)</Label>
        <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
      </div>
      <div className="space-y-2">
        <Label>Recursos (JSON)</Label>
        <Textarea
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          className="font-mono text-xs h-64"
        />
      </div>
      <Button
        className="w-full"
        disabled={saving}
        onClick={() => {
          try {
            const feat = JSON.parse(features);
            const cents = Math.round(parseFloat(price.replace(",", ".")) * 100);
            onSave({ id: plano.id, name, monthly_price_cents: cents, features: feat });
          } catch {
            toast.error("JSON de recursos inválido");
          }
        }}
      >
        Salvar alterações
      </Button>
    </Card>
  );
}