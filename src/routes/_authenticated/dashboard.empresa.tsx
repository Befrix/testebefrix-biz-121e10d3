import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save, Building2, Target, Flame, Sparkles, Goal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePlan } from "@/hooks/use-plan";
import { maskCNPJ, isValidCNPJ, onlyDigits } from "@/lib/cnpj";
import { X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/empresa")({
  head: () => ({
    meta: [
      { title: "Perfil da empresa — BEFRIX" },
      { name: "description", content: "Edite os dados da sua empresa, ICP, oferta, estratégia e objetivos." },
    ],
  }),
  component: EmpresaPage,
});

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

const toArr = (v?: string) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const arrToCsv = (a?: string[] | null) => (a ?? []).join(", ");

function ChipInput({ value, onChange, placeholder, max }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; max?: number | null }) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (!t || value.includes(t)) { setText(""); return; }
    if (max != null && value.length >= max) { toast.error(`Limite de ${max} itens.`); return; }
    onChange([...value, t]); setText("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((v, i) => (
          <Badge key={`${v}-${i}`} variant="secondary" className="gap-1 pl-2 pr-1">
            {v}
            <button type="button" onClick={() => onChange(value.filter((_, idx) => idx !== i))} className="rounded p-0.5 hover:bg-muted-foreground/10" aria-label="Remover">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input value={text} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add} placeholder={placeholder} />
    </div>
  );
}

function Field({ label, error, hint, required, children }: { label: React.ReactNode; error?: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="ml-1 text-destructive">*</span>}</Label>
      {children}
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}

function SaveButton({ saving }: { saving: boolean }) {
  return (
    <Button type="submit" disabled={saving} className="mt-4">
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {saving ? "Salvando…" : "Salvar alterações"}
    </Button>
  );
}

// ---------- Page ----------
function EmpresaPage() {
  const { user } = useAuth();
  const plan = usePlan();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["perfil-empresa", user?.id],
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

  if (isLoading || !data) {
    return (
      <div className="grid h-64 place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const refresh = () => qc.invalidateQueries({ queryKey: ["perfil-empresa", user?.id] });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Perfil da empresa</h1>
        <p className="text-sm text-muted-foreground">
          Revise e atualize os dados informados no onboarding. As alterações alimentam imediatamente a IA e as campanhas.
        </p>
      </header>

      <SectionEmpresa initial={data.empresa} profile={data.profile} userId={user!.id} onSaved={refresh} />
      <SectionOferta initial={data.strategy} onSaved={refresh} />
      <SectionIcp initial={data.icp} initialStrategy={data.strategy} plan={plan} onSaved={refresh} />
      <SectionPain initial={data.strategy} onSaved={refresh} />
      <SectionObjetivos initial={data.strategy} onSaved={refresh} />
    </div>
  );
}

// ---------- Section: Empresa ----------
const empresaSchema = z.object({
  razao_social: z.string().trim().min(2).max(200),
  nome_fantasia: z.string().trim().min(2).max(200),
  cnpj: z.string().refine(isValidCNPJ, { message: "CNPJ inválido." }),
  company_website: z.string().trim().url("URL inválida").max(255),
  company_segment: z.string().trim().min(2).max(120),
  company_size: z.enum(sizes),
  faturamento_anual: z.enum(faturamentoOpts),
  phone: z.string().trim().min(8).max(40),
});
type EmpresaForm = z.input<typeof empresaSchema>;

function SectionEmpresa({ initial, profile, userId, onSaved }: { initial: any; profile: any; userId: string; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
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
  const cnpjV = watch("cnpj"); const sizeV = watch("company_size"); const fatV = watch("faturamento_anual");

  const onSubmit = async (v: EmpresaForm) => {
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
      }).eq("id", initial.id),
      supabase.from("profiles").update({ phone: v.phone }).eq("id", userId),
    ]);
    setSaving(false);
    if (empRes.error) return toast.error(empRes.error.message);
    if (profRes.error) return toast.error(profRes.error.message);
    toast.success("Dados da empresa atualizados.");
    onSaved();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary-glow" /> Empresa</CardTitle>
        <CardDescription>Razão social, CNPJ, website, segmento, colaboradores e faturamento.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit, () => toast.error("Complete os campos obrigatórios para continuar."))} noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Razão Social" required error={errors.razao_social?.message}>
              <Input {...register("razao_social")} />
            </Field>
            <Field label="Nome Fantasia" required error={errors.nome_fantasia?.message}>
              <Input {...register("nome_fantasia")} />
            </Field>
            <Field label="CNPJ" required error={errors.cnpj?.message}>
              <Input value={cnpjV} inputMode="numeric" maxLength={18}
                onChange={(e) => setValue("cnpj", maskCNPJ(e.target.value), { shouldValidate: true })} />
            </Field>
            <Field label="Website" required error={errors.company_website?.message}>
              <Input {...register("company_website")} placeholder="https://..." />
            </Field>
            <Field label="Segmento" required error={errors.company_segment?.message}>
              <Input {...register("company_segment")} />
            </Field>
            <Field label="Colaboradores" required error={errors.company_size?.message}>
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
            <Field label="Telefone" required error={errors.phone?.message}>
              <Input {...register("phone")} />
            </Field>
          </div>
          <SaveButton saving={saving} />
        </form>
      </CardContent>
    </Card>
  );
}

// ---------- Section: Oferta ----------
const ofertaSchema = z.object({
  offer: z.string().trim().min(10).max(1000),
  cta: z.string().trim().min(2).max(160),
  target_audience: z.string().trim().min(5).max(300),
  differentials: z.string().max(2000).optional(),
  keywords: z.string().max(2000).optional(),
});
type OfertaForm = z.input<typeof ofertaSchema>;

function SectionOferta({ initial, onSaved }: { initial: any; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<OfertaForm>({
    resolver: zodResolver(ofertaSchema),
    defaultValues: {
      offer: initial?.offer ?? "", cta: initial?.cta ?? "",
      target_audience: initial?.target_audience ?? "",
      differentials: arrToCsv(initial?.differentials), keywords: arrToCsv(initial?.keywords),
    },
  });
  const onSubmit = async (v: OfertaForm) => {
    setSaving(true);
    const { error } = await supabase.from("client_strategy_profiles").update({
      offer: v.offer, cta: v.cta, target_audience: v.target_audience,
      differentials: toArr(v.differentials), keywords: toArr(v.keywords),
    }).eq("id", initial.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Oferta atualizada."); onSaved();
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary-glow" /> Oferta</CardTitle>
        <CardDescription>O que você vende, CTA, público e diferenciais.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Oferta principal" required error={errors.offer?.message}>
              <Textarea rows={3} {...register("offer")} />
            </Field>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="CTA" required error={errors.cta?.message}><Input {...register("cta")} /></Field>
              <Field label="Público-alvo" required error={errors.target_audience?.message}><Input {...register("target_audience")} /></Field>
            </div>
            <Field label="Diferenciais" hint="Separe por vírgula"><Input {...register("differentials")} /></Field>
            <Field label="Palavras-chave" hint="Separe por vírgula"><Input {...register("keywords")} /></Field>
          </div>
          <SaveButton saving={saving} />
        </form>
      </CardContent>
    </Card>
  );
}

// ---------- Section: ICP & Nichos ----------
const icpSchema = z.object({
  niches: z.array(z.string().min(1).max(80)).min(1),
  target_company_size: z.string().max(500).optional(),
  target_regions: z.string().max(500).optional(),
  target_roles: z.string().max(500).optional(),
  preferred_segments: z.string().max(500).optional(),
  ticket_choice: z.enum(ticketOpts),
  ticket_custom: z.string().max(120).optional(),
}).refine((v) => v.ticket_choice !== "Outro" || (v.ticket_custom && v.ticket_custom.trim().length >= 2), {
  message: "Informe o ticket médio personalizado.", path: ["ticket_custom"],
});
type IcpForm = z.input<typeof icpSchema>;

function SectionIcp({ initial, initialStrategy, plan, onSaved }: { initial: any; initialStrategy: any; plan: ReturnType<typeof usePlan>; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
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
  const niches = watch("niches"); const ticketChoice = watch("ticket_choice");

  const onSubmit = async (v: IcpForm) => {
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
      }).eq("id", initial.id),
      supabase.from("client_strategy_profiles").update({ ticket_medio: ticket }).eq("id", initialStrategy.id),
    ]);
    setSaving(false);
    if (icpRes.error) return toast.error(icpRes.error.message);
    if (stratRes.error) return toast.error(stratRes.error.message);
    toast.success("ICP e nichos atualizados."); onSaved();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4 text-primary-glow" /> ICP & Nichos</CardTitle>
        <CardDescription>Quem é seu cliente ideal e ticket médio.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Nichos" required
              hint={nicheLimit === null ? "Plano atual: nichos ilimitados." : `Plano atual permite até ${nicheLimit} ${nicheLimit === 1 ? "nicho" : "nichos"}.`}
              error={errors.niches?.message as string}>
              <ChipInput value={niches} onChange={(v) => setValue("niches", v, { shouldValidate: true })} placeholder="Digite e pressione Enter" max={nicheLimit} />
            </Field>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Tamanhos alvo" hint="Separe por vírgula"><Input {...register("target_company_size")} /></Field>
              <Field label="Regiões alvo" hint="Separe por vírgula"><Input {...register("target_regions")} /></Field>
              <Field label="Cargos alvo" hint="Separe por vírgula"><Input {...register("target_roles")} /></Field>
              <Field label="Segmentos prioritários" hint="Separe por vírgula"><Input {...register("preferred_segments")} /></Field>
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
          <SaveButton saving={saving} />
        </form>
      </CardContent>
    </Card>
  );
}

// ---------- Section: Dores & Estratégia ----------
const painSchema = z.object({
  main_pain: z.string().trim().min(10).max(500),
  secondary_pains: z.string().max(2000).optional(),
  problems_solved: z.string().max(2000).optional(),
  objections: z.string().max(2000).optional(),
  biggest_challenges: z.string().trim().max(500).optional().or(z.literal("")),
  desired_result: z.string().trim().min(5).max(500),
  communication_style: z.enum(stylesArr),
  tone_of_voice: z.enum(tonesArr),
  forbidden_words: z.string().max(2000).optional(),
});
type PainForm = z.input<typeof painSchema>;

function SectionPain({ initial, onSaved }: { initial: any; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
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
  const onSubmit = async (v: PainForm) => {
    setSaving(true);
    const { error } = await supabase.from("client_strategy_profiles").update({
      main_pain: v.main_pain, secondary_pains: toArr(v.secondary_pains),
      problems_solved: toArr(v.problems_solved), objections: toArr(v.objections),
      biggest_challenges: v.biggest_challenges || null, desired_result: v.desired_result,
      communication_style: v.communication_style, tone_of_voice: v.tone_of_voice,
      forbidden_words: toArr(v.forbidden_words),
    }).eq("id", initial.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Estratégia atualizada."); onSaved();
  };
  const toneV = watch("tone_of_voice"); const styleV = watch("communication_style");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Flame className="h-4 w-4 text-primary-glow" /> Dores & Estratégia</CardTitle>
        <CardDescription>Contexto para a IA personalizar mensagens.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Principal dor" required error={errors.main_pain?.message}>
              <Textarea rows={3} {...register("main_pain")} />
            </Field>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Dores secundárias" hint="Separe por vírgula"><Input {...register("secondary_pains")} /></Field>
              <Field label="Problemas que sua solução resolve" hint="Separe por vírgula"><Input {...register("problems_solved")} /></Field>
              <Field label="Objeções comuns" hint="Separe por vírgula"><Input {...register("objections")} /></Field>
              <Field label="Palavras proibidas" hint="Separe por vírgula"><Input {...register("forbidden_words")} /></Field>
            </div>
            <Field label="Maiores desafios do público"><Textarea rows={2} {...register("biggest_challenges")} /></Field>
            <Field label="Resultado prometido" required error={errors.desired_result?.message}>
              <Textarea rows={2} {...register("desired_result")} />
            </Field>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Tom de voz">
                <Select value={toneV} onValueChange={(v) => setValue("tone_of_voice", v as PainForm["tone_of_voice"], { shouldValidate: true })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{tonesArr.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Estilo">
                <Select value={styleV} onValueChange={(v) => setValue("communication_style", v as PainForm["communication_style"], { shouldValidate: true })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{stylesArr.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </div>
          </div>
          <SaveButton saving={saving} />
        </form>
      </CardContent>
    </Card>
  );
}

// ---------- Section: Objetivos ----------
const objSchema = z.object({ objetivos: z.array(z.string().min(2).max(160)).min(1) });
type ObjForm = z.input<typeof objSchema>;

function SectionObjetivos({ initial, onSaved }: { initial: any; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const { handleSubmit, setValue, watch, formState: { errors } } = useForm<ObjForm>({
    resolver: zodResolver(objSchema),
    defaultValues: { objetivos: (initial?.objetivos as string[] | null) ?? [] },
  });
  const objetivos = watch("objetivos");
  const onSubmit = async (v: ObjForm) => {
    setSaving(true);
    const { error } = await supabase.from("client_strategy_profiles").update({ objetivos: v.objetivos }).eq("id", initial.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Objetivos atualizados."); onSaved();
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Goal className="h-4 w-4 text-primary-glow" /> Objetivos</CardTitle>
        <CardDescription>Resultados que você quer alcançar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="Objetivos comerciais" required error={errors.objetivos?.message as string}>
            <ChipInput value={objetivos} onChange={(v) => setValue("objetivos", v, { shouldValidate: true })} placeholder="Digite e pressione Enter" />
          </Field>
          <SaveButton saving={saving} />
        </form>
      </CardContent>
    </Card>
  );
}