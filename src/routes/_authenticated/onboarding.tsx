import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowRight, ArrowLeft, Building2, Target, Flame, Sparkles,
  Radio, CheckCircle2, Loader2, Zap, CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { GlowOrb } from "@/components/ui/glow-orb";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding estratégico — BEFRIX" },
      { name: "description", content: "Configure ICP, dores, oferta e canais para alimentar a IA da BEFRIX." },
    ],
  }),
  component: OnboardingPage,
});

// ---------- Schemas ----------
const sizes = ["1-10", "11-50", "51-200", "201-500", "500+"] as const;
const tones = ["consultivo", "direto", "executivo", "casual", "técnico", "provocativo"] as const;
const styles = ["objetivo", "narrativo", "data-driven", "humano", "premium"] as const;
const tickets = ["até R$3k", "R$3k-R$10k", "R$10k-R$30k", "R$30k-R$100k", "R$100k+"] as const;
const channelOpts = ["email", "whatsapp", "linkedin"] as const;

const stepEmpresaSchema = z.object({
  company_name: z.string().trim().min(2).max(120),
  company_website: z.string().trim().url("URL inválida (https://)").max(255),
  company_linkedin: z.string().trim().max(255).optional().or(z.literal("")),
  company_instagram: z.string().trim().max(255).optional().or(z.literal("")),
  company_segment: z.string().trim().min(2).max(80),
  company_subsegment: z.string().trim().max(80).optional().or(z.literal("")),
  target_region: z.string().trim().min(2).max(120),
  company_size: z.enum(sizes),
});

const csvList = z.string().max(2000).optional();
const toArr = (v?: string) =>
  (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const stepIcpSchema = z.object({
  niches: csvList,
  target_company_size: csvList,
  average_ticket: z.enum(tickets),
  target_regions: csvList,
  target_roles: csvList,
  preferred_segments: csvList,
});

const stepPainSchema = z.object({
  main_pain: z.string().trim().min(10, "Descreva a principal dor").max(500),
  secondary_pains: csvList,
  problems_solved: csvList,
  objections: csvList,
  biggest_challenges: z.string().trim().max(500).optional().or(z.literal("")),
  desired_result: z.string().trim().min(5).max(500),
  differentials: csvList,
  communication_style: z.enum(styles),
  forbidden_words: csvList,
  tone_of_voice: z.enum(tones),
});

const stepOfferSchema = z.object({
  offer: z.string().trim().min(10, "Descreva sua oferta").max(1000),
  cta: z.string().trim().min(2).max(160),
  target_audience: z.string().trim().min(5).max(300),
  keywords: csvList,
});

const stepChannelsSchema = z.object({
  channels_enabled: z.array(z.enum(channelOpts)).min(1, "Ative ao menos um canal"),
  daily_limit_email: z.coerce.number().int().min(0).max(2000).default(50),
  daily_limit_whatsapp: z.coerce.number().int().min(0).max(2000).default(30),
  daily_limit_linkedin: z.coerce.number().int().min(0).max(2000).default(20),
  window_start: z.string().regex(/^\d{2}:\d{2}$/).default("09:00"),
  window_end: z.string().regex(/^\d{2}:\d{2}$/).default("18:00"),
  email_signature: z.string().trim().max(500).optional().or(z.literal("")),
  calendar_url: z.string().trim().url("URL inválida").max(255).or(z.literal("")),
});

type EmpresaForm = z.input<typeof stepEmpresaSchema>;
type IcpForm = z.input<typeof stepIcpSchema>;
type PainForm = z.input<typeof stepPainSchema>;
type OfferForm = z.input<typeof stepOfferSchema>;
type ChannelsForm = z.input<typeof stepChannelsSchema>;

// ---------- Step config ----------
const stepsMeta = [
  { id: 0, icon: Building2, title: "Empresa", desc: "Quem é você no mercado" },
  { id: 1, icon: Target, title: "ICP ideal", desc: "Quem é seu cliente perfeito" },
  { id: 2, icon: Flame, title: "Dor & estratégia", desc: "Contexto para a IA escrever" },
  { id: 3, icon: Sparkles, title: "Oferta", desc: "O que você vende" },
  { id: 4, icon: Radio, title: "Canais & calendário", desc: "Onde a máquina opera" },
] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Load existing rows (created by handle_new_user trigger)
  const { data: state, isLoading, refetch } = useQuery({
    queryKey: ["onboarding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [emp, icp, strat] = await Promise.all([
        supabase.from("empresas").select("*").limit(1).maybeSingle(),
        supabase.from("icp_profiles").select("*").limit(1).maybeSingle(),
        supabase.from("client_strategy_profiles").select("*").limit(1).maybeSingle(),
      ]);
      return { empresa: emp.data, icp: icp.data, strategy: strat.data };
    },
  });

  // If onboarding already complete, send to dashboard
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

  const next = () => setStep((s) => Math.min(stepsMeta.length, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const saveEmpresa = async (v: EmpresaForm) => {
    setSaving(true);
    const { error } = await supabase.from("empresas").update({
      company_name: v.company_name,
      company_website: v.company_website,
      company_linkedin: v.company_linkedin || null,
      company_instagram: v.company_instagram || null,
      company_segment: v.company_segment,
      company_subsegment: v.company_subsegment || null,
      target_region: v.target_region,
      company_size: v.company_size,
    }).eq("id", state.empresa!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refetch();
    next();
  };

  const saveIcp = async (v: IcpForm) => {
    setSaving(true);
    const { error } = await supabase.from("icp_profiles").update({
      niches: toArr(v.niches),
      target_company_size: toArr(v.target_company_size),
      average_ticket: v.average_ticket,
      target_regions: toArr(v.target_regions),
      target_roles: toArr(v.target_roles),
      preferred_segments: toArr(v.preferred_segments),
    }).eq("id", state.icp!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
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
      differentials: toArr(v.differentials),
      communication_style: v.communication_style,
      forbidden_words: toArr(v.forbidden_words),
      tone_of_voice: v.tone_of_voice,
    }).eq("id", state.strategy!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refetch();
    next();
  };

  const saveOffer = async (v: OfferForm) => {
    setSaving(true);
    const { error } = await supabase.from("client_strategy_profiles").update({
      offer: v.offer,
      cta: v.cta,
      target_audience: v.target_audience,
      keywords: toArr(v.keywords),
    }).eq("id", state.strategy!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    await refetch();
    next();
  };

  const saveChannels = async (v: ChannelsForm) => {
    setSaving(true);
    const [stratRes, empRes] = await Promise.all([
      supabase.from("client_strategy_profiles").update({
        channels_enabled: v.channels_enabled,
        daily_limits: {
          email: Number(v.daily_limit_email),
          whatsapp: Number(v.daily_limit_whatsapp),
          linkedin: Number(v.daily_limit_linkedin),
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
                  <StepEmpresa initial={state.empresa} onSubmit={saveEmpresa} onBack={back} saving={saving} />
                )}
                {step === 1 && (
                  <StepIcp initial={state.icp} onSubmit={saveIcp} onBack={back} saving={saving} />
                )}
                {step === 2 && (
                  <StepPain initial={state.strategy} onSubmit={savePain} onBack={back} saving={saving} />
                )}
                {step === 3 && (
                  <StepOffer initial={state.strategy} onSubmit={saveOffer} onBack={back} saving={saving} />
                )}
                {step === 4 && (
                  <StepChannels
                    initialStrategy={state.strategy}
                    initialEmpresa={state.empresa}
                    onSubmit={saveChannels}
                    onBack={back}
                    saving={saving}
                  />
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
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <ol className="mt-4 grid grid-cols-5 gap-2 text-xs">
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
    </div>
  );
}

// ---------- Shared form primitives ----------
function Field({ label, error, hint, children }: { label: React.ReactNode; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

function Footer({ onBack, saving, last }: { onBack: () => void; saving: boolean; last?: boolean }) {
  return (
    <div className="mt-8 flex gap-3">
      <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={saving}>
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>
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

const arrToCsv = (a?: string[] | null) => (a ?? []).join(", ");

// ---------- Step 0: Empresa ----------
function StepEmpresa({
  initial, onSubmit, onBack, saving,
}: { initial: any; onSubmit: (v: EmpresaForm) => void; onBack: () => void; saving: boolean }) {
  const form = useForm<EmpresaForm>({
    resolver: zodResolver(stepEmpresaSchema),
    defaultValues: {
      company_name: initial?.company_name ?? "",
      company_website: initial?.company_website ?? "",
      company_linkedin: initial?.company_linkedin ?? "",
      company_instagram: initial?.company_instagram ?? "",
      company_segment: initial?.company_segment ?? "",
      company_subsegment: initial?.company_subsegment ?? "",
      target_region: initial?.target_region ?? "",
      company_size: (initial?.company_size as EmpresaForm["company_size"]) ?? "11-50",
    },
  });
  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const sizeV = watch("company_size");

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nome da empresa" error={errors.company_name?.message}>
          <Input {...register("company_name")} placeholder="Acme Inc." />
        </Field>
        <Field label="Website" error={errors.company_website?.message}>
          <Input {...register("company_website")} placeholder="https://acme.com" />
        </Field>
        <Field label="LinkedIn da empresa" error={errors.company_linkedin?.message}>
          <Input {...register("company_linkedin")} placeholder="linkedin.com/company/acme" />
        </Field>
        <Field label="Instagram" error={errors.company_instagram?.message}>
          <Input {...register("company_instagram")} placeholder="@acme" />
        </Field>
        <Field label="Nicho" error={errors.company_segment?.message}>
          <Input {...register("company_segment")} placeholder="Ex: SaaS B2B" />
        </Field>
        <Field label="Subnicho" error={errors.company_subsegment?.message}>
          <Input {...register("company_subsegment")} placeholder="Ex: RevOps tools" />
        </Field>
        <Field label="Região alvo" error={errors.target_region?.message}>
          <Input {...register("target_region")} placeholder="Brasil, LATAM…" />
        </Field>
        <Field label="Tamanho da empresa" error={errors.company_size?.message}>
          <Select value={sizeV} onValueChange={(v) => setValue("company_size", v as EmpresaForm["company_size"], { shouldValidate: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{sizes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>
      <Footer onBack={onBack} saving={saving} />
    </form>
  );
}

// ---------- Step 1: ICP ----------
function StepIcp({
  initial, onSubmit, onBack, saving,
}: { initial: any; onSubmit: (v: IcpForm) => void; onBack: () => void; saving: boolean }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<IcpForm>({
    resolver: zodResolver(stepIcpSchema),
    defaultValues: {
      niches: arrToCsv(initial?.niches),
      target_company_size: arrToCsv(initial?.target_company_size),
      average_ticket: (initial?.average_ticket as IcpForm["average_ticket"]) ?? "R$3k-R$10k",
      target_regions: arrToCsv(initial?.target_regions),
      target_roles: arrToCsv(initial?.target_roles),
      preferred_segments: arrToCsv(initial?.preferred_segments),
    },
  });
  const ticketV = watch("average_ticket");
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="Nichos alvo" hint="Separe por vírgula" error={errors.niches?.message as string}>
          <Input {...register("niches")} placeholder="Fintech, Healthtech, SaaS" />
        </Field>
        <Field label="Tamanhos alvo" hint="Ex: 11-50, 51-200" error={errors.target_company_size?.message as string}>
          <Input {...register("target_company_size")} placeholder="11-50, 51-200" />
        </Field>
        <Field label="Ticket médio desejado" error={errors.average_ticket?.message}>
          <Select value={ticketV} onValueChange={(v) => setValue("average_ticket", v as IcpForm["average_ticket"], { shouldValidate: true })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{tickets.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Regiões alvo" hint="Separe por vírgula" error={errors.target_regions?.message as string}>
          <Input {...register("target_regions")} placeholder="Brasil, México" />
        </Field>
        <Field label="Cargos alvo" hint="Separe por vírgula" error={errors.target_roles?.message as string}>
          <Input {...register("target_roles")} placeholder="CFO, Head of Growth, COO" />
        </Field>
        <Field label="Segmentos prioritários" hint="Separe por vírgula" error={errors.preferred_segments?.message as string}>
          <Input {...register("preferred_segments")} placeholder="B2B SaaS, Marketplace" />
        </Field>
      </div>
      <Footer onBack={onBack} saving={saving} />
    </form>
  );
}

// ---------- Step 2: Pain / Strategy ----------
function StepPain({
  initial, onSubmit, onBack, saving,
}: { initial: any; onSubmit: (v: PainForm) => void; onBack: () => void; saving: boolean }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PainForm>({
    resolver: zodResolver(stepPainSchema),
    defaultValues: {
      main_pain: initial?.main_pain ?? "",
      secondary_pains: arrToCsv(initial?.secondary_pains),
      problems_solved: arrToCsv(initial?.problems_solved),
      objections: arrToCsv(initial?.objections),
      biggest_challenges: initial?.biggest_challenges ?? "",
      desired_result: initial?.desired_result ?? "",
      differentials: arrToCsv(initial?.differentials),
      communication_style: (initial?.communication_style as PainForm["communication_style"]) ?? "objetivo",
      forbidden_words: arrToCsv(initial?.forbidden_words),
      tone_of_voice: (initial?.tone_of_voice as PainForm["tone_of_voice"]) ?? "consultivo",
    },
  });
  const toneV = watch("tone_of_voice");
  const styleV = watch("communication_style");

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4">
        <Field label="Principal dor do lead" error={errors.main_pain?.message}>
          <Textarea rows={3} {...register("main_pain")} placeholder="Ex: pipeline frio, dependência de indicações…" />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Dores secundárias" hint="Separe por vírgula" error={errors.secondary_pains?.message as string}>
            <Input {...register("secondary_pains")} placeholder="CAC alto, ciclo longo" />
          </Field>
          <Field label="Problemas que sua solução resolve" hint="Separe por vírgula" error={errors.problems_solved?.message as string}>
            <Input {...register("problems_solved")} placeholder="Falta de SDR, baixa conversão" />
          </Field>
          <Field label="Objeções comuns" hint="Separe por vírgula" error={errors.objections?.message as string}>
            <Input {...register("objections")} placeholder="Preço, prazo de implementação" />
          </Field>
          <Field label="Diferenciais competitivos" hint="Separe por vírgula" error={errors.differentials?.message as string}>
            <Input {...register("differentials")} placeholder="IA proprietária, ROI em 30 dias" />
          </Field>
        </div>
        <Field label="Maiores desafios do público-alvo" error={errors.biggest_challenges?.message}>
          <Textarea rows={2} {...register("biggest_challenges")} placeholder="Contexto sobre o dia-a-dia do decisor" />
        </Field>
        <Field label="Resultado prometido" error={errors.desired_result?.message}>
          <Textarea rows={2} {...register("desired_result")} placeholder="Ex: 30 reuniões qualificadas/mês em 60 dias" />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Tom de voz" error={errors.tone_of_voice?.message}>
            <Select value={toneV} onValueChange={(v) => setValue("tone_of_voice", v as PainForm["tone_of_voice"], { shouldValidate: true })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{tones.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Estilo de comunicação" error={errors.communication_style?.message}>
            <Select value={styleV} onValueChange={(v) => setValue("communication_style", v as PainForm["communication_style"], { shouldValidate: true })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{styles.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Palavras proibidas" hint="Separe por vírgula" error={errors.forbidden_words?.message as string}>
            <Input {...register("forbidden_words")} placeholder="barato, garantido" />
          </Field>
        </div>
      </div>
      <Footer onBack={onBack} saving={saving} />
    </form>
  );
}

// ---------- Step 3: Offer ----------
function StepOffer({
  initial, onSubmit, onBack, saving,
}: { initial: any; onSubmit: (v: OfferForm) => void; onBack: () => void; saving: boolean }) {
  const { register, handleSubmit, formState: { errors } } = useForm<OfferForm>({
    resolver: zodResolver(stepOfferSchema),
    defaultValues: {
      offer: initial?.offer ?? "",
      cta: initial?.cta ?? "",
      target_audience: initial?.target_audience ?? "",
      keywords: arrToCsv(initial?.keywords),
    },
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4">
        <Field label="Oferta principal" error={errors.offer?.message}>
          <Textarea rows={3} {...register("offer")} placeholder="O que você entrega, em uma frase forte" />
        </Field>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="CTA principal" error={errors.cta?.message}>
            <Input {...register("cta")} placeholder="Ex: agendar diagnóstico de 20 min" />
          </Field>
          <Field label="Público-alvo" error={errors.target_audience?.message}>
            <Input {...register("target_audience")} placeholder="Ex: CFOs de SaaS B2B série A/B" />
          </Field>
        </div>
        <Field label="Palavras-chave da copy" hint="Separe por vírgula" error={errors.keywords?.message as string}>
          <Input {...register("keywords")} placeholder="pipeline, previsibilidade, ROI" />
        </Field>
      </div>
      <Footer onBack={onBack} saving={saving} />
    </form>
  );
}

// ---------- Step 4: Channels ----------
function StepChannels({
  initialStrategy, initialEmpresa, onSubmit, onBack, saving,
}: {
  initialStrategy: any; initialEmpresa: any;
  onSubmit: (v: ChannelsForm) => void; onBack: () => void; saving: boolean;
}) {
  const initialChannels = useMemo<("email"|"whatsapp"|"linkedin")[]>(() => {
    const arr = (initialStrategy?.channels_enabled ?? []) as string[];
    return arr.filter((c): c is "email"|"whatsapp"|"linkedin" => channelOpts.includes(c as any));
  }, [initialStrategy]);

  const dl = (initialStrategy?.daily_limits ?? {}) as Record<string, number>;
  const sw = (initialStrategy?.send_windows ?? {}) as Record<string, string>;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ChannelsForm>({
    resolver: zodResolver(stepChannelsSchema),
    defaultValues: {
      channels_enabled: initialChannels.length ? initialChannels : ["email"],
      daily_limit_email: dl.email ?? 50,
      daily_limit_whatsapp: dl.whatsapp ?? 30,
      daily_limit_linkedin: dl.linkedin ?? 20,
      window_start: sw.start ?? "09:00",
      window_end: sw.end ?? "18:00",
      email_signature: initialStrategy?.email_signature ?? "",
      calendar_url: initialEmpresa?.calendar_url ?? "",
    },
  });
  const channels = watch("channels_enabled") ?? [];
  const toggle = (c: "email"|"whatsapp"|"linkedin", v: boolean) => {
    const set = new Set(channels);
    if (v) set.add(c); else set.delete(c);
    setValue("channels_enabled", Array.from(set), { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label>Canais ativos</Label>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
            {channelOpts.map((c) => {
              const checked = channels.includes(c);
              return (
                <label
                  key={c}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${
                    checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
                  }`}
                >
                  <Checkbox checked={checked} onCheckedChange={(v) => toggle(c, !!v)} />
                  <span className="text-sm capitalize">{c}</span>
                </label>
              );
            })}
          </div>
          {errors.channels_enabled?.message && (
            <p className="mt-1 text-[11px] text-destructive">{errors.channels_enabled.message as string}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Field label="Limite diário — Email" error={errors.daily_limit_email?.message as string}>
            <Input type="number" min={0} max={2000} {...register("daily_limit_email")} />
          </Field>
          <Field label="Limite diário — WhatsApp" error={errors.daily_limit_whatsapp?.message as string}>
            <Input type="number" min={0} max={2000} {...register("daily_limit_whatsapp")} />
          </Field>
          <Field label="Limite diário — LinkedIn" error={errors.daily_limit_linkedin?.message as string}>
            <Input type="number" min={0} max={2000} {...register("daily_limit_linkedin")} />
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
          hint="Calendly, Google Calendar booking, Microsoft Bookings ou Cal.com"
          error={errors.calendar_url?.message}
        >
          <Input {...register("calendar_url")} placeholder="https://cal.com/seu-handle/intro" />
        </Field>
      </div>
      <Footer onBack={onBack} saving={saving} last />
    </form>
  );
}