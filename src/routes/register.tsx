import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { AuthShell } from "@/components/layout/auth-shell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";

const registerSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome completo").max(120),
  company_name: z.string().trim().min(2, "Informe sua empresa").max(120),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
  phone: z.string().trim().min(8, "Telefone inválido").max(30),
  company_website: z.string().trim().url("URL inválida (inclua https://)").max(255),
  company_segment: z.string().trim().min(2).max(80),
  company_size: z.string().min(1, "Selecione o porte"),
  job_title: z.string().trim().min(2, "Informe seu cargo").max(80),
});
type RegisterValues = z.infer<typeof registerSchema>;

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Criar conta — BEFRIX" },
      { name: "description", content: "Crie sua conta BEFRIX em menos de 2 minutos e comece a gerar pipeline com IA." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });
  const sizeValue = watch("company_size");

  useEffect(() => {
    if (user) navigate({ to: "/planos", replace: true });
  }, [user, navigate]);

  const onSubmit = async (values: RegisterValues) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: {
          full_name: values.full_name,
          company_name: values.company_name,
          phone: values.phone,
          company_website: values.company_website,
          company_segment: values.company_segment,
          company_size: values.company_size,
          job_title: values.job_title,
        },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Redirecionando...");
  };

  const onGoogle = async () => {
    setLoadingGoogle(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) {
      setLoadingGoogle(false);
      toast.error(result.error.message);
    }
  };

  return (
    <AuthShell
      title="Crie sua conta"
      subtitle="Comece grátis hoje mesmo."
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-primary-glow hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <Button type="button" variant="outline" className="w-full" onClick={onGoogle} disabled={loadingGoogle}>
        {loadingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Continuar com Google
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
      </div>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Nome completo" id="full_name" error={errors.full_name?.message}>
          <Input id="full_name" placeholder="Seu nome completo" autoComplete="name" {...register("full_name")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cargo" id="job_title" error={errors.job_title?.message}>
            <Input id="job_title" placeholder="Head of Growth" {...register("job_title")} />
          </Field>
          <Field label="Telefone" id="phone" error={errors.phone?.message}>
            <Input id="phone" placeholder="+55 11 99999-9999" autoComplete="tel" {...register("phone")} />
          </Field>
        </div>
        <Field label="Empresa" id="company_name" error={errors.company_name?.message}>
          <Input id="company_name" placeholder="Nome da empresa" autoComplete="organization" {...register("company_name")} />
        </Field>
        <Field label="Website" id="company_website" error={errors.company_website?.message}>
          <Input id="company_website" placeholder="https://empresa.com" {...register("company_website")} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Segmento" id="company_segment" error={errors.company_segment?.message}>
            <Input id="company_segment" placeholder="SaaS B2B" {...register("company_segment")} />
          </Field>
          <Field label="Funcionários" id="company_size" error={errors.company_size?.message}>
            <Select value={sizeValue} onValueChange={(v) => setValue("company_size", v, { shouldValidate: true })}>
              <SelectTrigger id="company_size"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field label="E-mail corporativo" id="email" error={errors.email?.message}>
          <Input id="email" type="email" placeholder="voce@empresa.com" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Senha" id="password" error={errors.password?.message}>
          <Input id="password" type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" {...register("password")} />
        </Field>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary hover:opacity-90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Criar conta <ArrowRight className="h-4 w-4" /></>}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Ao criar uma conta você concorda com nossos{" "}
          <a href="#" className="underline hover:text-foreground">Termos</a> e{" "}
          <a href="#" className="underline hover:text-foreground">Privacidade</a>.
        </p>
      </form>
    </AuthShell>
  );
}

function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}