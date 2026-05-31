import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/layout/auth-shell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(1, "Informe sua senha").max(128),
});

type LoginValues = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) || "/dashboard" }),
  head: () => ({
    meta: [
      { title: "Entrar — BEFRIX" },
      { name: "description", content: "Acesse sua conta BEFRIX e gerencie suas campanhas de outbound." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const search = Route.useSearch();
  const [loadingPw, setLoadingPw] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingMagic, setLoadingMagic] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (user) navigate({ to: search.redirect ?? "/dashboard", replace: true });
  }, [user, navigate, search.redirect]);

  const onSubmit = async (values: LoginValues) => {
    setLoadingPw(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setLoadingPw(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta!");
  };

  const onGoogle = async () => {
    setLoadingGoogle(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) {
      setLoadingGoogle(false);
      toast.error(result.error.message);
    }
  };

  const onMagic = async () => {
    const email = getValues("email");
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) return toast.error("Informe um e-mail válido");
    setLoadingMagic(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/dashboard" },
    });
    setLoadingMagic(false);
    if (error) return toast.error(error.message);
    toast.success("Magic link enviado! Verifique seu e-mail.");
  };

  const onForgot = async () => {
    const email = getValues("email");
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) return toast.error("Digite seu e-mail acima e clique novamente em Esqueci minha senha");
    setForgotOpen(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setForgotOpen(false);
    if (error) return toast.error(error.message);
    toast.success("E-mail de redefinição enviado!");
  };

  return (
    <AuthShell
      title="Bem-vindo de volta"
      subtitle="Entre na sua conta para continuar."
      footer={
        <>
          Não tem conta?{" "}
          <Link to="/register" className="font-medium text-primary-glow hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <Button type="button" variant="outline" className="w-full" onClick={onGoogle} disabled={loadingGoogle}>
        {loadingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Continuar com Google
      </Button>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
      </div>
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="voce@empresa.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <button type="button" onClick={onForgot} disabled={forgotOpen} className="text-xs text-muted-foreground hover:text-foreground">
              Esqueci minha senha
            </button>
          </div>
          <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <Button
          type="submit"
          disabled={loadingPw}
          className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary hover:opacity-90"
        >
          {loadingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar <ArrowRight className="h-4 w-4" /></>}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onMagic} disabled={loadingMagic}>
          {loadingMagic ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Enviar magic link
        </Button>
      </form>
    </AuthShell>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.5 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C41.7 35.9 44 30.4 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}