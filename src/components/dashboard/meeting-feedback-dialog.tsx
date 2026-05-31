import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type MeetingStatus = "completed" | "no_show" | "rescheduled";
type DealStatus = "proposal" | "negotiation" | "won" | "lost";

export function MeetingFeedbackDialog({
  open,
  onOpenChange,
  leadId,
  meetingId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId?: string | null;
  meetingId?: string | null;
}) {
  const qc = useQueryClient();
  const [meetingStatus, setMeetingStatus] = useState<MeetingStatus | null>(null);
  const [dealStatus, setDealStatus] = useState<DealStatus | null>(null);
  const [dealValue, setDealValue] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setMeetingStatus(null);
    setDealStatus(null);
    setDealValue("");
    setNotes("");
  };

  const save = useMutation({
    mutationFn: async () => {
      const { data: emp } = await supabase.from("empresas").select("tenant_id").limit(1).maybeSingle();
      const tenant_id = emp?.tenant_id;
      if (!tenant_id) throw new Error("Workspace não encontrado");
      const { error } = await supabase.from("meeting_feedback").insert({
        tenant_id,
        lead_id: leadId ?? null,
        meeting_id: meetingId ?? null,
        meeting_status: meetingStatus ?? "scheduled",
        deal_status: dealStatus,
        deal_value_cents: dealStatus === "won" && dealValue ? Math.round(parseFloat(dealValue) * 100) : null,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Feedback registrado e analytics atualizados.");
      qc.invalidateQueries({ queryKey: ["workspace-data"] });
      reset();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  const showDealStep = meetingStatus === "completed";
  const showValueStep = dealStatus === "won";
  const canSave = meetingStatus && (!showDealStep || dealStatus);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-primary-glow" /> Feedback da reunião</DialogTitle>
          <DialogDescription>Atualize o status para alimentar o revenue attribution.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label className="mb-2 block text-sm">O lead compareceu?</Label>
            <div className="grid grid-cols-3 gap-2">
              {([["completed", "Compareceu"], ["no_show", "Não compareceu"], ["rescheduled", "Reagendado"]] as const).map(([k, l]) => (
                <Button key={k} type="button" variant={meetingStatus === k ? "secondary" : "outline"} size="sm" onClick={() => setMeetingStatus(k)}>{l}</Button>
              ))}
            </div>
          </div>

          {showDealStep && (
            <div>
              <Label className="mb-2 block text-sm">A reunião avançou?</Label>
              <div className="grid grid-cols-2 gap-2">
                {([["proposal", "Proposta enviada"], ["negotiation", "Negociação"], ["won", "Fechado"], ["lost", "Perdido"]] as const).map(([k, l]) => (
                  <Button key={k} type="button" variant={dealStatus === k ? "secondary" : "outline"} size="sm" onClick={() => setDealStatus(k)}>{l}</Button>
                ))}
              </div>
            </div>
          )}

          {showValueStep && (
            <div>
              <Label className="mb-2 block text-sm">Valor do contrato (R$)</Label>
              <Input type="number" min="0" step="0.01" value={dealValue} onChange={(e) => setDealValue(e.target.value)} placeholder="0,00" />
            </div>
          )}

          {meetingStatus === "no_show" && (
            <div className="rounded-lg border border-warning/25 bg-warning/10 p-3 text-xs text-warning">
              No-show recovery: dispare WhatsApp + e-mail automático e ofereça reagendamento rápido.
            </div>
          )}

          <div>
            <Label className="mb-2 block text-sm">Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações da reunião…" rows={3} />
          </div>

          <Button disabled={!canSave || save.isPending} onClick={() => save.mutate()} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary">
            {save.isPending ? "Salvando…" : "Registrar feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
