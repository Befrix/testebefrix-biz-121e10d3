import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CreditCard, Check, X, Sparkles, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";
import { PageHeader, SectionCard, StatCard, StatusPill } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyBRL } from "@/lib/dashboard";
import { usePlan, type Plan } from "@/hooks/use-plan";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const CANCEL_REASONS = [
  "Não estou utilizando a plataforma",
  "Preço",
  "Não encontrei os recursos que precisava",
  "Dificuldade de uso",
  "Problemas técnicos",
  "Vou utilizar outra solução",
  "Empresa encerrou atividades",
  "Outro",
] as const;

export const Route = createFileRoute("/_authenticated/dashboard/pagamentos")({
  component: PagamentosPage,
});

const TIER_ORDER = ["starter", "pro", "enterprise"] as const;
type TierKey = (typeof TIER_ORDER)[number];

type ConfirmKind = "upgrade" | "downgrade" | "cancel" | null;

function PagamentosPage() {
  const { user } = useAuth();
  const current = usePlan();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<{ kind: ConfirmKind; targetPlan?: Plan }>({ kind: null });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelReasonDetail, setCancelReasonDetail] = useState<string>("");
  const [cancelImprovement, setCancelImprovement] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["pagamentos", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [subRes, invRes, plansRes, profRes] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("id, status, current_period_start, current_period_end, plan_id, tenant_id")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("invoices").select("*").order("created_at", { ascending: false }),
        supabase.from("planos").select("id, tier, name, monthly_price_cents, features"),
        supabase.from("profiles").select("tenant_id").eq("id", user!.id).maybeSingle(),
      ]);
      return {
        subscription: subRes.data,
        tenantId: profRes.data?.tenant_id as string | undefined,
        invoices: (invRes.data ?? []) as Array<{
          id: string;
          amount_cents: number;
          status: string;
          created_at: string;
          due_at: string | null;
          paid_at: string | null;
        }>,
        plans: ((plansRes.data ?? []) as unknown as Plan[])
          .slice()
          .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)),
      };
    },
  });

  const requestChange = useMutation({
    mutationFn: async (args: {
      kind: "upgrade" | "downgrade" | "cancel";
      targetPlan?: Plan;
      cancel?: { reason: string; reason_detail?: string; improvement_suggestion?: string };
    }) => {
      if (!data?.tenantId) throw new Error("Tenant não encontrado");
      const action =
        args.kind === "cancel"
          ? "subscription.cancel_requested"
          : args.kind === "upgrade"
            ? "subscription.upgrade_requested"
            : "subscription.downgrade_requested";

      const metadata: Record<string, unknown> = {
        from_plan_id: current.plan?.id ?? null,
        from_plan_name: current.plan?.name ?? null,
        to_plan_id: args.targetPlan?.id ?? null,
        to_plan_name: args.targetPlan?.name ?? null,
        to_plan_tier: args.targetPlan?.tier ?? null,
        monthly_price_cents: args.targetPlan?.monthly_price_cents ?? null,
        requested_by: user?.id,
        requested_at: new Date().toISOString(),
      };
      if (args.kind === "cancel" && args.cancel) {
        metadata.reason = args.cancel.reason;
        if (args.cancel.reason_detail) metadata.reason_detail = args.cancel.reason_detail;
        if (args.cancel.improvement_suggestion)
          metadata.improvement_suggestion = args.cancel.improvement_suggestion;
      }

      const { error: auditErr } = await supabase.from("audit_logs").insert({
        tenant_id: data.tenantId,
        user_id: user?.id,
        action,
        entity: "subscription",
        entity_id: data.subscription?.id ?? null,
        metadata: metadata as any,
      });
      if (auditErr) throw auditErr;

      const amount =
        args.kind === "cancel"
          ? -(current.plan?.monthly_price_cents ?? 0)
          : (args.targetPlan?.monthly_price_cents ?? 0) - (current.plan?.monthly_price_cents ?? 0);

      const { error: finErr } = await supabase.from("financeiro").insert({
        tenant_id: data.tenantId,
        type: args.kind === "cancel" ? "cancel_request" : `plan_${args.kind}_request`,
        amount_cents: amount,
        description:
          args.kind === "cancel"
            ? `Solicitação de cancelamento do plano ${current.plan?.name ?? ""}`
            : `Solicitação de ${args.kind === "upgrade" ? "upgrade" : "downgrade"} de ${current.plan?.name ?? "—"} → ${args.targetPlan?.name ?? "—"}`,
      });
      if (finErr) throw finErr;
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.kind === "cancel"
          ? "Solicitação de cancelamento registrada"
          : `Solicitação de ${vars.kind === "upgrade" ? "upgrade" : "downgrade"} registrada`,
      );
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      setConfirm({ kind: null });
      if (vars.kind === "cancel") {
        setCancelOpen(false);
        setCancelReason("");
        setCancelReasonDetail("");
        setCancelImprovement("");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading || current.loading) {
    return (
      <div className="grid place-items-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlan = current.plan;
  const sub = data?.subscription;
  const nextDue = sub?.current_period_end ? new Date(sub.current_period_end) : null;
  const daysToNext = nextDue ? Math.ceil((nextDue.getTime() - Date.now()) / 86400000) : null;
  const statusTone: "success" | "warning" | "muted" | "danger" =
    sub?.status === "active"
      ? "success"
      : sub?.status === "trialing"
        ? "warning"
        : sub?.status === "canceled" || sub?.status === "past_due"
          ? "danger"
          : "muted";

  const currentTierIdx = currentPlan ? TIER_ORDER.indexOf(currentPlan.tier as TierKey) : -1;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pagamentos"
        description="Assinatura, plano atual, faturas e mudança de plano."
        icon={CreditCard}
        action={
          <Button asChild variant="outline">
            <Link to="/planos">Ver planos públicos</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard index={0} label="Plano atual" value={currentPlan?.name ?? "—"} />
        <StatCard index={1} label="Valor mensal" value={formatCurrencyBRL(currentPlan?.monthly_price_cents ?? 0)} />
        <StatCard
          index={2}
          label="Próximo vencimento"
          value={nextDue ? nextDue.toLocaleDateString("pt-BR") : "—"}
          hint={daysToNext !== null ? `em ${daysToNext} dia(s)` : undefined}
        />
        <StatCard
          index={3}
          label="Status assinatura"
          value={sub?.status ?? "—"}
          hint={statusTone === "warning" ? "Período de teste" : undefined}
        />
      </div>

      {currentPlan && (
        <SectionCard title="Resumo do plano contratado" description="Limites e recursos liberados pelo seu plano.">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <LimitCell label="Limite de leads/mês" value={currentPlan.features.limits.leads_per_month ?? "Ilimitado"} />
            <LimitCell label="Usuários permitidos" value={currentPlan.features.limits.users ?? "Ilimitado"} />
            <LimitCell label="Nichos permitidos" value={currentPlan.features.limits.niches ?? "Ilimitado"} />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-2 md:grid-cols-2">
            {currentPlan.features.features.map((f) => (
              <div key={f} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span className="text-muted-foreground">{f}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Mudança de plano" description="Solicite upgrade, downgrade ou cancelamento. A solicitação é registrada para a equipe administrativa.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {data?.plans.map((p) => {
            const isCurrent = currentPlan?.id === p.id;
            const idx = TIER_ORDER.indexOf(p.tier as TierKey);
            const kind: "upgrade" | "downgrade" | null =
              isCurrent || currentTierIdx < 0 ? null : idx > currentTierIdx ? "upgrade" : "downgrade";
            return (
              <div
                key={p.id}
                className={cn(
                  "relative rounded-2xl border p-6",
                  isCurrent ? "border-primary/60 bg-primary/5 shadow-glow-primary" : "border-border bg-secondary/30",
                )}
              >
                {p.features.badge && (
                  <Badge className="absolute -top-3 left-6 bg-gradient-to-r from-primary to-accent text-primary-foreground">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {p.features.badge}
                  </Badge>
                )}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">{p.name}</h3>
                  {isCurrent && <StatusPill label="Atual" tone="success" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{p.features.tagline}</p>
                <p className="mt-3 text-2xl font-semibold">
                  {formatCurrencyBRL(p.monthly_price_cents)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
                <ul className="mt-4 space-y-1.5 text-xs">
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Leads/mês</span>
                    <span className="font-medium">{p.features.limits.leads_per_month ?? "Ilimitado"}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Usuários</span>
                    <span className="font-medium">{p.features.limits.users ?? "Ilimitado"}</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Nichos</span>
                    <span className="font-medium">{p.features.limits.niches ?? "Ilimitado"}</span>
                  </li>
                </ul>
                <ul className="mt-4 space-y-1.5 text-xs">
                  {p.features.features.slice(0, 6).map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-success" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <ChannelRow label="WhatsApp Automation" enabled={p.features.channels.whatsapp_automation} />
                <ChannelRow label="Sequências Omnichannel IA" enabled={p.features.channels.sequences_omnichannel} />
                <Button
                  disabled={isCurrent || !kind}
                  className="mt-4 w-full"
                  variant={isCurrent ? "outline" : "default"}
                  onClick={() => kind && setConfirm({ kind, targetPlan: p })}
                >
                  {isCurrent ? (
                    "Plano atual"
                  ) : kind === "upgrade" ? (
                    <><ArrowUpRight className="mr-1 h-4 w-4" />Solicitar upgrade</>
                  ) : (
                    <><ArrowDownRight className="mr-1 h-4 w-4" />Solicitar downgrade</>
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
            <div>
              <p className="font-medium">Cancelar assinatura</p>
              <p className="text-xs text-muted-foreground">A solicitação será analisada pela equipe e o acesso permanece até o fim do período vigente.</p>
            </div>
          </div>
          <Button
            variant="destructive"
            disabled={!currentPlan || sub?.status === "canceled"}
            onClick={() => setConfirm({ kind: "cancel" })}
          >
            Solicitar cancelamento
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Histórico de pagamentos" description="Faturas emitidas para o seu tenant.">
        {(data?.invoices ?? []).length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma fatura registrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {data!.invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{formatCurrencyBRL(inv.amount_cents)}</p>
                  <p className="text-xs text-muted-foreground">
                    Emitida em {new Date(inv.created_at).toLocaleDateString("pt-BR")}
                    {inv.due_at ? ` • Vence ${new Date(inv.due_at).toLocaleDateString("pt-BR")}` : ""}
                    {inv.paid_at ? ` • Paga ${new Date(inv.paid_at).toLocaleDateString("pt-BR")}` : ""}
                  </p>
                </div>
                <StatusPill
                  label={inv.status}
                  tone={inv.status === "paid" ? "success" : inv.status === "open" ? "warning" : "muted"}
                />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <AlertDialog open={confirm.kind !== null} onOpenChange={(o) => !o && setConfirm({ kind: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm.kind === "cancel"
                ? "Confirmar solicitação de cancelamento"
                : confirm.kind === "upgrade"
                  ? "Confirmar solicitação de upgrade"
                  : "Confirmar solicitação de downgrade"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm.kind === "cancel"
                ? "Sua solicitação será registrada para análise. O acesso permanece ativo até o fim do período vigente."
                : `Mudar do plano ${currentPlan?.name ?? "—"} para ${confirm.targetPlan?.name ?? "—"} (${formatCurrencyBRL(confirm.targetPlan?.monthly_price_cents ?? 0)}/mês). A solicitação será registrada e processada pela equipe administrativa.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={requestChange.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={requestChange.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!confirm.kind) return;
                requestChange.mutate({ kind: confirm.kind, targetPlan: confirm.targetPlan });
              }}
            >
              {requestChange.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function LimitCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function ChannelRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="mt-2 flex items-center gap-1.5 text-xs">
      {enabled ? <Check className="h-3 w-3 text-success" /> : <X className="h-3 w-3 text-muted-foreground" />}
      <span className={enabled ? "" : "text-muted-foreground line-through"}>{label}</span>
    </div>
  );
}