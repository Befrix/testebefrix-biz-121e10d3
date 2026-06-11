import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { triggerCampaignCreation } from "@/lib/n8n";
import { useAuth } from "@/hooks/use-auth";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const INITIAL = {
  niche: "",
  company_name: "",
  segmento: "",
  cargo_alvo: "",
  dores_cliente: "",
  oferta: "",
  tom_voz: "",
};

export function NovaCampanhaDialog({ open, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function submit() {
  setError(null);
  if (!form.niche || !form.oferta) {
    setError("Preencha pelo menos Nicho e Oferta.");
    return;
  }
  setLoading(true);
  try {
    // Busca o tenant_id correto
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", user!.id)
      .maybeSingle();

    await triggerCampaignCreation({
      organization_id: profile?.tenant_id ?? user?.id ?? "",
      ...form,
    });
    setForm(INITIAL);
    onSuccess?.();
    onClose();
  } catch (err: any) {
    setError(err.message ?? "Erro ao criar campanha. Verifique a conexão com o N8N.");
  } finally {
    setLoading(false);
  }
}

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Campanha</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="niche">Nicho *</Label>
              <Input id="niche" name="niche" placeholder="ex: SaaS B2B" value={form.niche} onChange={handle} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="segmento">Segmento</Label>
              <Input id="segmento" name="segmento" placeholder="ex: Fintech" value={form.segmento} onChange={handle} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="company_name">Sua empresa</Label>
            <Input id="company_name" name="company_name" placeholder="Nome da sua empresa" value={form.company_name} onChange={handle} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cargo_alvo">Cargo alvo</Label>
            <Input id="cargo_alvo" name="cargo_alvo" placeholder="ex: CEO, Head de Vendas" value={form.cargo_alvo} onChange={handle} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="oferta">Oferta *</Label>
            <Textarea
              id="oferta"
              name="oferta"
              rows={2}
              placeholder="O que você oferece e qual o resultado gerado"
              value={form.oferta}
              onChange={handle}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="dores_cliente">Dores do cliente</Label>
            <Textarea
              id="dores_cliente"
              name="dores_cliente"
              rows={2}
              placeholder="Principais problemas que você resolve"
              value={form.dores_cliente}
              onChange={handle}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tom_voz">Tom de voz</Label>
            <Input
              id="tom_voz"
              name="tom_voz"
              placeholder="ex: Consultivo, direto, executivo"
              value={form.tom_voz}
              onChange={handle}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={loading}
            className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Criando...
              </>
            ) : (
              "Criar campanha"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
