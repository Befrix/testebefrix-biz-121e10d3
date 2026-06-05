import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const SURVEY_ACTION = "satisfaction_survey";

function monthStartISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

export function SatisfactionSurveyModal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [favorite, setFavorite] = useState("");
  const [improvement, setImprovement] = useState("");
  const [thanks, setThanks] = useState(false);

  const { data } = useQuery({
    queryKey: ["satisfaction-survey-check", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const start = monthStartISO();
      const [{ data: prof }, { count }] = await Promise.all([
        supabase.from("profiles").select("tenant_id").eq("id", user!.id).maybeSingle(),
        supabase
          .from("audit_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id)
          .eq("action", SURVEY_ACTION)
          .gte("created_at", start),
      ]);
      return { tenant_id: prof?.tenant_id as string | undefined, answered: (count ?? 0) > 0 };
    },
  });

  useEffect(() => {
    if (!data) return;
    const today = new Date().getDate();
    const dismissedKey = `befrix.satisfaction.dismissed.${new Date().getFullYear()}-${new Date().getMonth()}`;
    const dismissed = typeof window !== "undefined" && window.localStorage.getItem(dismissedKey) === "1";
    if (today >= 15 && !data.answered && !dismissed) {
      setOpen(true);
    }
  }, [data]);

  const submit = useMutation({
    mutationFn: async () => {
      if (!user || !data?.tenant_id) throw new Error("Sessão inválida");
      if (!score) throw new Error("Selecione uma nota de 1 a 10");
      const { error } = await supabase.from("audit_logs").insert({
        tenant_id: data.tenant_id,
        user_id: user.id,
        action: SURVEY_ACTION,
        entity: "satisfaction_survey",
        metadata: {
          satisfaction_score: score,
          favorite_feature: favorite || null,
          suggested_improvement: improvement || null,
        } as any,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setThanks(true);
      qc.invalidateQueries({ queryKey: ["satisfaction-survey-check"] });
    },
    onError: (e: any) => toast.error(e.message || "Não foi possível enviar"),
  });

  const dismiss = () => {
    const key = `befrix.satisfaction.dismissed.${new Date().getFullYear()}-${new Date().getMonth()}`;
    try {
      window.localStorage.setItem(key, "1");
    } catch {}
    setOpen(false);
  };

  const close = () => {
    setOpen(false);
    setTimeout(() => {
      setThanks(false);
      setScore(null);
      setFavorite("");
      setImprovement("");
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : (thanks ? close() : dismiss()))}>
      <DialogContent className="max-w-lg">
        {thanks ? (
          <div className="space-y-4 text-center py-4">
            <DialogHeader>
              <DialogTitle className="text-xl">🎉 Obrigado pelo seu feedback!</DialogTitle>
              <DialogDescription>
                Sua opinião nos ajuda a evoluir continuamente e construir uma plataforma cada vez melhor para você e sua equipe.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button onClick={close}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">💙 Sua opinião é muito importante para nós</DialogTitle>
              <DialogDescription>
                Estamos trabalhando constantemente para melhorar a plataforma e oferecer a melhor experiência possível para sua empresa. Gostaríamos de ouvir sua opinião.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label>Como você avalia sua experiência com a plataforma atualmente? <span className="text-destructive">*</span></Label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScore(n)}
                      className={cn(
                        "h-10 w-10 rounded-md border text-sm font-medium transition-colors",
                        score === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border bg-card hover:bg-accent",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fav">O que você mais gosta na plataforma?</Label>
                <Textarea id="fav" rows={3} value={favorite} onChange={(e) => setFavorite(e.target.value)} placeholder="Opcional" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imp">Existe algo que poderíamos melhorar?</Label>
                <Textarea id="imp" rows={3} value={improvement} onChange={(e) => setImprovement(e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={dismiss} disabled={submit.isPending}>
                Agora não
              </Button>
              <Button onClick={() => submit.mutate()} disabled={!score || submit.isPending}>
                {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar avaliação
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}