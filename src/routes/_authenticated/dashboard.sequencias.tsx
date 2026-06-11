import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ListOrdered, Plus, Mail, MessageCircle, Linkedin, Clock } from "lucide-react";
import { PageHeader, SectionCard, EmptyState } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { triggerRadarSearch } from "@/lib/n8n";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/sequencias")({
  component: SequenciasPage,
});

const STEP_ICON: Record<string, typeof Mail> = {
  email: Mail, whatsapp: MessageCircle, linkedin: Linkedin, wait: Clock,
};

// Dialog para nova sequência
function NovaSequenciaDialog({ open, onClose, tenantId }: { open: boolean; onClose: () => void; tenantId: string }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim()) return toast.error("Dê um nome para a sequência.");
    setLoading(true);
    const { error } = await supabase.from("sequencias").insert({
      name: name.trim(),
      tenant_id: tenantId,
      steps: [],
      status: "draft",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Sequência criada!");
    setName("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Sequência</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor="seq-name">Nome da sequência</Label>
            <Input
              id="seq-name"
              placeholder="Ex: Prospecção SaaS — Email + WhatsApp"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Após criar, configure os passos (canal, mensagem e intervalo) diretamente na sequência.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button
            onClick={submit}
            disabled={loading}
            className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando...</> : "Criar sequência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SequenciasPage() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile-tenant", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["sequencias", profile?.tenant_id],
    enabled: !!profile?.tenant_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("sequencias")
        .select("*")
        .eq("tenant_id", profile!.tenant_id)
        .order("created_at", { ascending: false });
      return (data ?? []) as Array<{
        id: string;
        name: string;
        steps: Array<{ channel?: string; type?: string; delay_days?: number; label?: string }>;
      }>;
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sequências"
        description="Cadências multi-toque automatizadas."
        icon={ListOrdered}
        action={
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary"
          >
            <Plus className="h-4 w-4" /> Nova sequência
          </Button>
        }
      />

      {profile?.tenant_id && (
        <NovaSequenciaDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); refetch(); }}
          tenantId={profile.tenant_id}
        />
      )}

      {isLoading ? (
        <div className="grid place-items-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="Nenhuma sequência"
          description="Monte cadências de e-mail, WhatsApp e LinkedIn com intervalos automáticos."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.map((seq) => (
            <SectionCard key={seq.id} title={seq.name}>
              <div className="flex flex-wrap items-center gap-2">
                {(seq.steps ?? []).map((step, i) => {
                  const Icon = STEP_ICON[step.channel ?? step.type ?? "email"] ?? Mail;
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-1.5 text-xs">
                        <Icon className="h-3.5 w-3.5 text-primary-glow" />
                        {step.label ?? step.channel ?? `Passo ${i + 1}`}
                        {step.delay_days ? <span className="text-muted-foreground">+{step.delay_days}d</span> : null}
                      </div>
                      {i < (seq.steps?.length ?? 0) - 1 && <span className="text-muted-foreground">→</span>}
                    </div>
                  );
                })}
                {(seq.steps ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem passos configurados.</p>
                )}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
