import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight, ArrowLeft, Building2, Target, Flame, Sparkles,
  Radio, CheckCircle2, Loader2, Zap, CalendarClock, Goal, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { GlowOrb } from "@/components/ui/glow-orb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePlan } from "@/hooks/use-plan";
import { maskCNPJ, isValidCNPJ, onlyDigits } from "@/lib/cnpj";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding estratégico — BEFRIX" },
      { name: "description", content: "Configure perfil da empresa, ICP, oferta e canais para alimentar a IA da BEFRIX." },
    ],
  }),
  component: OnboardingPage,
});

// ---------- Constantes ----------
const sizes = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;
const faturamentoOpts = [
  "Até R$ 500 mil",
  "R$ 500 mil – R$ 2 mi",
  "R$ 2 mi – R$ 10 mi",
  "R$ 10 mi – R$ 50 mi",
  "R$ 50 mi – R$ 100 mi",
  "Acima de R$ 100 mi",
] as const;
const tonesArr = ["consultivo", "direto", "executivo", "casual", "técnico", "provocativo"] as const;
const stylesArr = ["objetivo", "narrativo", "data-driven", "humano", "premium"] as const;
const ticketOpts = [
  "Até R$ 50.000",
  "R$ 50.000 a R$ 100.000",
  "R$ 100.000 a R$ 250.000",
  "R$ 250.000 a R$ 500.000",
  "R$ 500.000 a R$ 1.000.000",
  "Outro",
] as const;
const channelOpts = ["email", "whatsapp"] as const;

const REQUIRED_MSG = "Complete os campos obrigatórios para continuar.";

// ---------- Schemas ----------
const empresaSchema = z.object({
  razao_social: z.string().trim().min(2, REQUIRED_MSG).max(200),
  nome_fantasia: z.string().trim().min(2, REQUIRED_MSG).max(200),
  cnpj: z.string().refine((v) => isValidCNPJ(v), { message: "CNPJ inválido." }),
  company_website: z.string().trim().url("URL inválida (https://)").max(255),
  company_segment: z.string().trim().min(2, REQUIRED_MSG).max(120),
  company_size: z.enum(sizes),
  faturamento_anual: z.enum(faturamentoOpts),
  phone: z.string().trim().min(8, REQUIRED_MSG).max(40),
});
type EmpresaForm = z.input<typeof empresaSchema>;

const ofertaSchema = z.object({
  offer: z.string().trim().min(10, REQUIRED_MSG).max(1000),
  cta: z.string().trim().min(2, REQUIRED_MSG).max(160),
  target_audience: z.string().trim().min(5, REQUIRED_MSG).max(300),
  differentials: z.string().max(2000).optional(),
  keywords: z.string().max(2000).optional(),
});
type OfertaForm = z.input<typeof ofertaSchema>;

const icpSchema = z.object({
  niches: z.array(z.string().min(1).max(80)).min(1, REQUIRED_MSG),
  target_company_size: z.string().max(500).optional(),
  target_regions: z.string().max(500).optional(),
  target_roles: z.string().max(500).optional(),
  preferred_segments: z.string().max(500).optional(),
  ticket_choice: z.enum(ticketOpts, { message: REQUIRED_MSG }),
  ticket_custom: z.string().max(120).optional(),
}).refine((v) => v.ticket_choice !== "Outro" || (v.ticket_custom && v.ticket_custom.trim().length >= 2), {
  message: "Informe o ticket médio personalizado.",
  path: ["ticket_custom"],
});
type IcpForm = z.input<typeof icpSchema>;

const painSchema = z.object({
  main_pain: z.string().trim().min(10, REQUIRED_MSG).max(500),
  secondary_pains: z.string().max(2000).optional(),
  problems_solved: z.string().max(2000).optional(),
  objections: z.string().max(2000).optional(),
  biggest_challenges: z.string().trim().max(500).optional().or(z.literal("")),
  desired_result: z.string().trim().min(5, REQUIRED_MSG).max(500),
  communication_style: z.enum(stylesArr),
  tone_of_voice: z.enum(tonesArr),
  forbidden_words: z.string().max(2000).optional(),
});
type PainForm = z.input<typeof painSchema>;

const objetivosSchema = z.object({
  objetivos: z.array(z.string().min(2).max(160)).min(1, REQUIRED_MSG),
});
type ObjetivosForm = z.input<typeof objetivosSchema>;

const channelsSchema = z.object({
  channels_enabled: z.array(z.enum(channelOpts)).min(1, "Ative ao menos um canal"),
  daily_limit_email: z.coerce.number().int().min(0).max(2000).default(50),
  daily_limit_whatsapp: z.coerce.number().int().min(0).max(2000).default(30),
  window_start: z.string().regex(/^\d{2}:\d{2}$/).default("09:00"),
  window_end: z.string().regex(/^\d{2}:\d{2}$/).default("18:00"),
  email_signature: z.string().trim().max(500).optional().or(z.literal("")),
  calendar_url: z.string().trim().url("URL inválida").max(255).or(z.literal("")),
});
type ChannelsForm = z.input<typeof channelsSchema>;

// ---------- Step config ----------
const stepsMeta = [
  { id: 0, icon: Building2, title: "Empresa", desc: "Quem é você no mercado", helper: null },
  { id: 1, icon: Sparkles, title: "Oferta", desc: "O que você vende",
    helper: "Essas informações ajudam a BEFRIX a compreender sua oferta, diferenciais e objetivos comerciais para gerar campanhas e estratégias mais alinhadas ao seu negócio." },
  { id: 2, icon: Target, title: "ICP & Nichos", desc: "Quem é seu cliente perfeito",
    helper: "Essas informações ajudam a BEFRIX a identificar empresas e contatos com maior potencial de conversão." },
  { id: 3, icon: Flame, title: "Dores & estratégia", desc: "Contexto para a IA escrever",
    helper: "Quanto melhor a BEFRIX entender os desafios dos seus clientes, mais precisas serão as oportunidades e recomendações apresentadas." },
  { id: 4, icon: Goal, title: "Objetivos", desc: "Onde você quer chegar",
    helper: "Informe os resultados que deseja alcançar para direcionar melhor sua operação." },
  { id: 5, icon: Radio, title: "Canais & calendário", desc: "Onde a máquina opera", helper: null },
] as const;

// ---------- utils ----------
const toArr = (v?: string) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const arrToCsv = (a?: string[] | null) => (a ?? []).join(", ");

function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const plan = usePlan();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const { data: state, isLoading, refetch } = useQuery({
    queryKey: ["onboarding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [emp, icp, strat, prof] = await Promise.all([
        supabase.from("empresas").select("*").limit(1).maybeSingle(),
        supabase.from("icp_profiles").select("*").limit(1).maybeSingle(),
        supabase.from("client_strategy_profiles").select("*").limit(1).maybeSingle(),
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
      ]);
      return { empresa: emp.data, icp: icp.data, strategy: strat.data, profile: prof.data };
    },
  });

  useEffect(() => {
    if (state?.empresa?.onboarding_completed && state?.strategy?.onboarding_completed) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [state, navigate]);

  if (isLoading || !state) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const next = () => setStep((s) => Math.min(stepsMeta.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  // ---------- save handlers ----------
  const saveEmpresa = async (v: EmpresaForm) => {
    setSaving(true);
    const [empRes, profRes] = await Promise.all([
      supabase.from("empresas").update({
        razao_social: v.razao_social,
        nome_fantasia: v.nome_fantasia,
        company_name: v.nome_fantasia,
        cnpj: onlyDigits(v.cnpj),
        company_website: v.company_website,
        company_segment: v.company_segment,
        company_size: v.company_size,
        faturamento_anual: v.faturamento_anual,
      }).eq("id", state.empresa!.id),
      supabase.from("profiles").update({ phone: v.phone }).eq("id", user!.id),
    ]);
    setSaving(false);
    if (empRes.error) return toast.error(empRes.error.message);
    if (profRes.error) return toast.error(profRes.error.message);
    toast.success("Dados da empresa salvos.");
    await refetch();
    next();
  };

  const saveOferta = async (v: OfertaForm) => {
    setSaving(true);
    const { error } = await supabase.from("client_strategy_profiles").update({
      offer: v.offer,
      cta: v.cta,
      target_audience: v.target_audience,
      differentials: toArr(v.differentials),
      keywords: toArr(v.keywords),
    }).eq("id", state.strategy!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Oferta salva.");
    await refetch();
    next();
  };

  const saveIcp = async (v: IcpForm) => {
    const nicheLimit = plan.limit("niches");
    if (nicheLimit !== null && v.niches.length > nicheLimit) {
      return toast.error(`Seu plano atual permite até ${nicheLimit} ${nicheLimit === 1 ? "nicho" : "nichos"}.`);
    }
    setSaving(true);
    const ticket = v.ticket_choice === "Outro" ? (v.ticket_custom || "").trim() : v.ticket_choice;
    const [icpRes, stratRes] = await Promise.all([
      supabase.from("icp_profiles").update({
        niches: v.niches,
        target_company_size: toArr(v.target_company_size),
        target_regions: toArr(v.target_regions),
        target_roles: toArr(v.target_roles),
        preferred_segments: toArr(v.preferred_segments),
        average_ticket: ticket,
      }).eq("id", state.icp!.id),
      supabase.from("client_strategy_profiles").update({
        ticket_medio: ticket,
      }).eq("id", state.strategy!.id),
    ]);
    setSaving(false);
    if (icpRes.error) return toast.error(icpRes.error.message);
    if (stratRes.error) return toast.error(stratRes.error.message);
    toast.success("ICP e nichos salvos.");
    await refetch();
    next();
  };

  const savePain = async (v: PainForm) => {
    setSaving(true);
    const { error } = await supabase.from("client_strategy_profiles").update({
      main_pain: v.main_pain,
      secondary_pains: toArr(v.secondary_pains),
      problems_solved: toArr(v.problems_solved),
      objections: toArr(v.objections),
      biggest_challenges: v.biggest_challenges || null,
      desired_result: v.desired_result,
      communication_style: v.communication_style,
      tone_of_voice: v.tone_of_voice,
      forbidden_words: toArr(v.forbidden_words),
    }).eq("id", state.strategy!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Estratégia salva.");
    await refetch();
    next();
  };

  const saveObjetivos = async (v: ObjetivosForm) => {
    setSaving(true);
    const { error } = await supabase.from("client_strategy_profiles").update({
      objetivos: v.objetivos,
    }).eq("id", state.strategy!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Objetivos salvos.");
    await refetch();
    next();
  };

  const saveChannels = async (v: ChannelsForm) => {
    const dailyMax = plan.limit("daily_contacts");
    if (dailyMax !== null) {
      if (v.daily_limit_email > dailyMax || v.daily_limit_whatsapp > dailyMax) {
        return toast.error(`Seu plano atual permite até ${dailyMax} contatos/dia por canal.`);
      }
    }
    setSaving(true);
    const [stratRes, empRes] = await Promise.all([
      supabase.from("client_strategy_profiles").update({
        channels_enabled: v.channels_enabled,
        daily_limits: {
          email: Number(v.daily_limit_email),
          whatsapp: Number(v.daily_limit_whatsapp),
        },
        send_windows: { start: v.window_start, end: v.window_end },
        email_signature: v.email_signature || null,
        onboarding_completed: true,
      }).eq("id", state.strategy!.id),
      supabase.from("empresas").update({
        calendar_url: v.calendar_url || null,
        onboarding_completed: true,
      }).eq("id", state.empresa!.id),
    ]);
    setSaving(false);
    if (stratRes.error) return toast.error(stratRes.error.message);
    if (empRes.error) return toast.error(empRes.error.message);
    toast.success("Onboarding concluído. Escolha seu plano para ativar.");
    navigate({ to: "/planos" });
  };

  const onInvalid = () => toast.error(REQUIRED_MSG);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-40" />
      <GlowOrb className="-top-40 -left-40" variant="primary" size="xl" />
      <GlowOrb className="-bottom-40 -right-40" variant="accent" size="lg" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow-primary">
              <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold tracking-tight">BEFRIX</span>
          </div>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Onboarding estratégico
          </span>
        </header>

        <Stepper step={step} />

        <div className="mt-8 flex-1">
          <div className="glass-strong rounded-2xl border border-border-glow/30 p-8 shadow-glow-soft">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <StepHeader step={step} />

                {step === 0 && (
                  <StepEmpresa initial={state.empresa} profile={state.profile}
                    onSubmit={saveEmpresa} onInvalid={onInvalid} onBack={back} saving={saving} />
                )}
                {step === 1 && (
                  <StepOferta initial={state.strategy}
                    onSubmit={saveOferta} onInvalid={onInvalid} onBack={back} saving={saving} />
                )}
                {step === 2 && (
                  <StepIcp initial={state.icp} initialStrategy={state.strategy} plan={plan}
                    onSubmit={saveIcp} onInvalid={onInvalid} onBack={back} saving={saving} />
                )}
                {step === 3 && (
                  <StepPain initial={state.strategy}
                    onSubmit={savePain} onInvalid={onInvalid} onBack={back} saving={saving} />
                )}
                {step === 4 && (
                  <StepObjetivos initial={state.strategy}
                    onSubmit={saveObjetivos} onInvalid={onInvalid} onBack={back} saving={saving} />
                )}
                {step === 5 && (
                  <StepChannels initialStrategy={state.strategy} initialEmpresa={state.empresa} plan={plan}
                    onSubmit={saveChannels} onInvalid={onInvalid} onBack={back} saving={saving} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Stepper ----------
function Stepper({ step }: { step: number }) {
  const pct = ((step + 1) / stepsMeta.length) * 100;
  return (
    <div className="mt-8">
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>Etapa {step + 1} de {stepsMeta.length}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <ol className="mt-4 grid grid-cols-3 gap-2 text-xs md:grid-cols-6">
        {stepsMeta.map((s, i) => {
          const active = i === step;
          const done = i < step;
          const Icon = s.icon;
          return (
            <li key={s.id} className="flex items-center gap-2">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-all ${
                  active
                    ? "border-primary bg-primary/10 text-primary shadow-glow-primary"
                    : done
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
              </span>
              <span className={active ? "text-foreground" : "text-muted-foreground"}>{s.title}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepHeader({ step }: { step: number }) {
  const s = stepsMeta[step];
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
      {s.helper && (
        <p className="mt-3 rounded-lg border border-border-subtle bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
          {s.helper}
        </p>
      )}
    </div>
  );
}

// ---------- Shared primitives ----------
function Field({ label, error, hint, required, children }: { label: React.ReactNode; error?: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

function Footer({ onBack, saving, last, hideBack }: { onBack: () => void; saving: boolean; last?: boolean; hideBack?: boolean }) {
  return (
    <div className="mt-8 flex gap-3">
      {!hideBack && (
        <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={saving}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      )}
      <Button
        type="submit"
        className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary hover:opacity-90"
        disabled={saving}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (last ? "Concluir" : "Continuar")}
        {!saving && <ArrowRight className="h-4 w-4" />}
      </Button>
    </div>
  );
}

// Chip-input para listas (niches, objetivos)
function ChipInput({
  value, onChange, placeholder, max,
}: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; max?: number | null }) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (!t) return;
    if (value.includes(t)) { setText(""); return; }
    if (max !== null && max !== undefined && value.length >= max) {
      toast.error(`Limite de ${max} ${max === 1 ? "item" : "itens"} atingido neste plano.`);
      return;
    }
    onChange([...value, t]);
    setText("");
  };
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((v, i) => (
          <Badge key={`${v}-${i}`} variant="secondary" className="gap-1 pl-2 pr-1">
            {v}
            <button type="button" onClick={() => remove(i)} className="rounded p-0.5 hover:bg-muted-foreground/10" aria-label="Remover">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
        }}
        onBlur={add}
        placeholder={placeholder}
      />
    </div>
  );
}

// ---------- Step 0: Empresa ----------
function StepEmpresa({
  initial, profile, onSubmit, onInvalid, onBack, saving,
}: { initial: any; profile: any; onSubmit: (v: EmpresaForm) => void; onInvalid: () => void; onBack: () => void; saving: boolean }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EmpresaForm>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      razao_social: initial?.razao_social ?? "",
      nome_fantasia: initial?.nome_fantasia ?? initial?.company_name ?? "",
      cnpj: initial?.cnpj ? maskCNPJ(initial.cnpj) : "",
      company_website: initial?.company_website ?? "",
      company_segment: initial?.company_segment ?? "",
      company_size: (initial?.company_size as EmpresaForm["company_size"]) ?? "11-50",
      faturamento_anual: (initial?.faturamento_anual as EmpresaForm["faturamento_anual"]) ?? "Até R$ 500 mil",
      phone: profile?.phone ?? "",
    },
  });
  const sizeV = watch("company_size");
  const fatV = watch("faturamento_anual");
  const cnpjV = watch("cnpj");
  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Razão Social" required error={errors.razao_social?.message}>
          <Input {...register("razao_social")} placeholder="Acme Tecnologia LTDA" />
        </Field>
        <Field label="Nome Fantasia" required error={errors.nome_fantasia?.message}>
          <Input {...register("nome_fantasia")} placeholder="Acme" />
        </Field>
        <Field label="CNPJ" required hint="Apenas o número, com validação de dígitos." error={errors.cnpj?.message}>
          <Input
            value={cnpjV}
            onChange={(e) => setValue("cnpj", maskCNPJ(e.target.value), { shouldValidate: true })}
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            maxLength={18}
          />
        </Field>
        <Field label="Website" required error={errors.company_website?.message}>
          <Input {...register("company_website")} placeholder="https://acme.com" />
        </Field>
        <Field label="Segmento" required error={errors.company_segment?.message}>
          <Input {...register("company_segment")} placeholder="Ex: SaaS B2B" />
        </Field>
        <Field label="Quantidade de colaboradores" required error={errors.company_size?.message}>
          <Select value={sizeV} onValueChange={(v) => setValue("company_size", v as EmpresaForm["company_size"], { shouldValidate: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{sizes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Faturamento anual" required error={errors.faturamento_anual?.message}>
          <Select value={fatV} onValueChange={(v) => setValue("faturamento_anual", v as EmpresaForm["faturamento_anual"], { shouldValidate: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{faturamentoOpts.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Telefone de contato" required error={errors.phone?.message}>
          <Input {...register("phone")} placeholder="(11) 99999-9999" />
        </Field>
      </div>
      <Footer onBack={onBack} saving={saving} hideBack />
    </form>
  );
}

// ---------- Step 1: Oferta ----------
function StepOferta({
  initial, onSubmit, onInvalid, onBack, saving,
}: { initial: any; onSubmit: (v: OfertaForm) => void; onInvalid: () => void; onBack: () => void; saving: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<OfertaForm>({
    resolver: zodResolver(ofertaSchema),
    defaultValues: {
      offer: initial?.offer ?? "",
      cta: initial?.cta ?? "",
      target_audience: initial?.target_audience ?? "",
      differentials: arrToCsv(initial?.differentials),
      keywords: arrToCsv(initial?.keywords),
    },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
      <div className="grid grid-cols-1 gap-4">
        <Field label="Oferta principal" required error={errors.offer?.message}>
          <Textarea rows={3} {...register("offer")} placeholder="O que você entrega, em uma frase forte" />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="CTA principal" required error={errors.cta?.message}>
            <Input {...register("cta")} placeholder="Ex: agendar diagnóstico de 20 min" />
          </Field>
          <Field label="Público-alvo" required error={errors.target_audience?.message}>
            <Input {...register("target_audience")} placeholder="Ex: CFOs de SaaS B2B" />
          </Field>
        </div>
        <Field label="Diferenciais competitivos" hint="Separe por vírgula" error={errors.differentials?.message as string}>
          <Input {...register("differentials")} placeholder="IA proprietária, ROI em 30 dias" />
        </Field>
        <Field label="Palavras-chave da copy" hint="Separe por vírgula" error={errors.keywords?.message as string}>
          <Input {...register("keywords")} placeholder="pipeline, previsibilidade, ROI" />
        </Field>
      </div>
      <Footer onBack={onBack} saving={saving} />
    </form>
  );
}

// ---------- Step 2: ICP & Nichos ----------
function StepIcp({
  initial, initialStrategy, plan, onSubmit, onInvalid, onBack, saving,
}: { initial: any; initialStrategy: any; plan: ReturnType<typeof usePlan>; onSubmit: (v: IcpForm) => void; onInvalid: () => void; onBack: () => void; saving: boolean }) {
  const nicheLimit = plan.limit("niches");
  const currentTicket: string = initialStrategy?.ticket_medio || initial?.average_ticket || "";
  const isPreset = (ticketOpts as readonly string[]).includes(currentTicket);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<IcpForm>({
    resolver: zodResolver(icpSchema),
    defaultValues: {
      niches: (initial?.niches as string[] | null) ?? [],
      target_company_size: arrToCsv(initial?.target_company_size),
      target_regions: arrToCsv(initial?.target_regions),
      target_roles: arrToCsv(initial?.target_roles),
      preferred_segments: arrToCsv(initial?.preferred_segments),
      ticket_choice: (isPreset ? currentTicket : (currentTicket ? "Outro" : "Até R$ 50.000")) as IcpForm["ticket_choice"],
      ticket_custom: isPreset ? "" : (currentTicket || ""),
    },
  });
  const niches = watch("niches");
  const ticketChoice = watch("ticket_choice");

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
      <div className="grid grid-cols-1 gap-4">
        <Field
          label="Nichos alvo"
          required
          hint={
            nicheLimit === null
              ? "Seu plano atual permite nichos ilimitados."
              : `Seu plano atual permite até ${nicheLimit} ${nicheLimit === 1 ? "nicho" : "nichos"}.`
          }
          error={errors.niches?.message as string}
        >
          <p className="mb-2 text-[11px] text-muted-foreground">
            Selecione os segmentos que deseja atender para personalizar pesquisas, campanhas e oportunidades.
          </p>
          <ChipInput
            value={niches}
            onChange={(v) => setValue("niches", v, { shouldValidate: true })}
            placeholder="Digite e pressione Enter (ex: Fintech)"
            max={nicheLimit}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tamanhos alvo" hint="Separe por vírgula (Ex: 11-50, 51-200)" error={errors.target_company_size?.message as string}>
            <Input {...register("target_company_size")} placeholder="11-50, 51-200" />
          </Field>
          <Field label="Regiões alvo" hint="Separe por vírgula" error={errors.target_regions?.message as string}>
            <Input {...register("target_regions")} placeholder="Brasil, LATAM" />
          </Field>
          <Field label="Cargos alvo" hint="Separe por vírgula" error={errors.target_roles?.message as string}>
            <Input {...register("target_roles")} placeholder="CFO, Head of Growth, COO" />
          </Field>
          <Field label="Segmentos prioritários" hint="Separe por vírgula" error={errors.preferred_segments?.message as string}>
            <Input {...register("preferred_segments")} placeholder="B2B SaaS, Marketplace" />
          </Field>
        </div>

        <Field label="Ticket médio" required error={errors.ticket_choice?.message}>
          <Select value={ticketChoice} onValueChange={(v) => setValue("ticket_choice", v as IcpForm["ticket_choice"], { shouldValidate: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{ticketOpts.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        {ticketChoice === "Outro" && (
          <Field label="Ticket médio personalizado" required error={errors.ticket_custom?.message}>
            <Input {...register("ticket_custom")} placeholder="Ex: R$ 1,5 milhão" />
          </Field>
        )}
      </div>
      <Footer onBack={onBack} saving={saving} />
    </form>
  );
}

// ---------- Step 3: Dores & Estratégia ----------
function StepPain({
  initial, onSubmit, onInvalid, onBack, saving,
}: { initial: any; onSubmit: (v: PainForm) => void; onInvalid: () => void; onBack: () => void; saving: boolean }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PainForm>({
    resolver: zodResolver(painSchema),
    defaultValues: {
      main_pain: initial?.main_pain ?? "",
      secondary_pains: arrToCsv(initial?.secondary_pains),
      problems_solved: arrToCsv(initial?.problems_solved),
      objections: arrToCsv(initial?.objections),
      biggest_challenges: initial?.biggest_challenges ?? "",
      desired_result: initial?.desired_result ?? "",
      communication_style: (initial?.communication_style as PainForm["communication_style"]) ?? "objetivo",
      tone_of_voice: (initial?.tone_of_voice as PainForm["tone_of_voice"]) ?? "consultivo",
      forbidden_words: arrToCsv(initial?.forbidden_words),
    },
  });
  const toneV = watch("tone_of_voice");
  const styleV = watch("communication_style");

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
      <div className="grid grid-cols-1 gap-4">
        <Field label="Principal dor do lead" required error={errors.main_pain?.message}>
          <Textarea rows={3} {...register("main_pain")} placeholder="Ex: pipeline frio, dependência de indicações…" />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Dores secundárias" hint="Separe por vírgula">
            <Input {...register("secondary_pains")} placeholder="CAC alto, ciclo longo" />
          </Field>
          <Field label="Problemas que sua solução resolve" hint="Separe por vírgula">
            <Input {...register("problems_solved")} placeholder="Falta de SDR, baixa conversão" />
          </Field>
          <Field label="Objeções comuns" hint="Separe por vírgula">
            <Input {...register("objections")} placeholder="Preço, prazo de implementação" />
          </Field>
          <Field label="Palavras proibidas" hint="Separe por vírgula">
            <Input {...register("forbidden_words")} placeholder="barato, garantido" />
          </Field>
        </div>
        <Field label="Maiores desafios do público-alvo">
          <Textarea rows={2} {...register("biggest_challenges")} placeholder="Contexto sobre o dia-a-dia do decisor" />
        </Field>
        <Field label="Resultado prometido" required error={errors.desired_result?.message}>
          <Textarea rows={2} {...register("desired_result")} placeholder="Ex: 30 reuniões qualificadas/mês em 60 dias" />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Tom de voz">
            <Select value={toneV} onValueChange={(v) => setValue("tone_of_voice", v as PainForm["tone_of_voice"], { shouldValidate: true })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{tonesArr.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Estilo de comunicação">
            <Select value={styleV} onValueChange={(v) => setValue("communication_style", v as PainForm["communication_style"], { shouldValidate: true })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{stylesArr.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
        </div>
      </div>
      <Footer onBack={onBack} saving={saving} />
    </form>
  );
}

// ---------- Step 4: Objetivos ----------
function StepObjetivos({
  initial, onSubmit, onInvalid, onBack, saving,
}: { initial: any; onSubmit: (v: ObjetivosForm) => void; onInvalid: () => void; onBack: () => void; saving: boolean }) {
  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<ObjetivosForm>({
    resolver: zodResolver(objetivosSchema),
    defaultValues: {
      objetivos: (initial?.objetivos as string[] | null) ?? [],
    },
  });
  const objetivos = watch("objetivos");
  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
      <Field label="Objetivos comerciais" required error={errors.objetivos?.message as string}
        hint="Pressione Enter para adicionar. Ex: '30 reuniões/mês', 'reduzir CAC em 20%'">
        <ChipInput
          value={objetivos}
          onChange={(v) => setValue("objetivos", v, { shouldValidate: true })}
          placeholder="Digite e pressione Enter"
        />
      </Field>
      <Footer onBack={onBack} saving={saving} />
    </form>
  );
}

// ---------- Step 5: Canais ----------
function StepChannels({
  initialStrategy, initialEmpresa, plan, onSubmit, onInvalid, onBack, saving,
}: {
  initialStrategy: any; initialEmpresa: any; plan: ReturnType<typeof usePlan>;
  onSubmit: (v: ChannelsForm) => void; onInvalid: () => void; onBack: () => void; saving: boolean;
}) {
  const initialChannels = useMemo<("email" | "whatsapp")[]>(() => {
    const arr = (initialStrategy?.channels_enabled ?? []) as string[];
    return arr.filter((c): c is "email" | "whatsapp" => channelOpts.includes(c as any));
  }, [initialStrategy]);
  const dl = (initialStrategy?.daily_limits ?? {}) as Record<string, number>;
  const sw = (initialStrategy?.send_windows ?? {}) as Record<string, string>;
  const dailyMax = plan.limit("daily_contacts");
  const whatsappEnabled = plan.channel("whatsapp");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ChannelsForm>({
    resolver: zodResolver(channelsSchema),
    defaultValues: {
      channels_enabled: initialChannels.length ? initialChannels : ["email"],
      daily_limit_email: dl.email ?? Math.min(50, dailyMax ?? 50),
      daily_limit_whatsapp: dl.whatsapp ?? Math.min(30, dailyMax ?? 30),
      window_start: sw.start ?? "09:00",
      window_end: sw.end ?? "18:00",
      email_signature: initialStrategy?.email_signature ?? "",
      calendar_url: initialEmpresa?.calendar_url ?? "",
    },
  });
  const channels = watch("channels_enabled") ?? [];
  const toggle = (c: "email" | "whatsapp", v: boolean) => {
    const set = new Set(channels);
    if (v) set.add(c); else set.delete(c);
    setValue("channels_enabled", Array.from(set), { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label>Canais ativos</Label>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            {channelOpts.map((c) => {
              const checked = channels.includes(c);
              const disabled = c === "whatsapp" && !whatsappEnabled;
              return (
                <label
                  key={c}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                    disabled ? "opacity-50 cursor-not-allowed" : checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                  }`}
                >
                  <Checkbox checked={checked} disabled={disabled} onCheckedChange={(v) => !disabled && toggle(c, !!v)} />
                  <span className="text-sm capitalize">{c}</span>
                  {disabled && <span className="ml-auto text-[10px] text-muted-foreground">Plano superior</span>}
                </label>
              );
            })}
          </div>
          {errors.channels_enabled?.message && (
            <p className="mt-1 text-[11px] text-destructive">{errors.channels_enabled.message as string}</p>
          )}
          {dailyMax !== null && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Seu plano atual permite até <strong>{dailyMax}</strong> contatos/dia por canal.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Limite diário — Email" error={errors.daily_limit_email?.message as string}>
            <Input type="number" min={0} max={dailyMax ?? 2000} {...register("daily_limit_email")} />
          </Field>
          <Field label="Limite diário — WhatsApp" error={errors.daily_limit_whatsapp?.message as string}>
            <Input type="number" min={0} max={dailyMax ?? 2000} {...register("daily_limit_whatsapp")} disabled={!whatsappEnabled} />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Janela de envio — início" error={errors.window_start?.message as string}>
            <Input type="time" {...register("window_start")} />
          </Field>
          <Field label="Janela de envio — fim" error={errors.window_end?.message as string}>
            <Input type="time" {...register("window_end")} />
          </Field>
        </div>

        <Field label="Assinatura de e-mail" error={errors.email_signature?.message}>
          <Textarea rows={3} {...register("email_signature")} placeholder="— Seu nome, cargo, empresa, link do calendário" />
        </Field>

        <Field
          label={<span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4 text-primary-glow" /> URL do seu calendário</span>}
          hint="Calendly, Google Calendar, Microsoft Bookings ou Cal.com"
          error={errors.calendar_url?.message}
        >
          <Input {...register("calendar_url")} placeholder="https://cal.com/seu-handle/intro" />
        </Field>
      </div>
      <Footer onBack={onBack} saving={saving} last />
    </form>
  );
}