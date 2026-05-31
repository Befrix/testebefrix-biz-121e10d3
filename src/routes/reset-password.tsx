import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/layout/auth-shell";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres").max(128),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Senhas não conferem" });
type Values = z.infer<typeof schema>;

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Redefinir senha — BEFRIX" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) });

  useEffect(() => {
    // The recovery link sets a session via hash. Wait for it.
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session);
      if (!data.session) toast.error("Link inválido ou expirado. Solicite um novo e-mail.");
    });
  }, []);

  const onSubmit = async (values: Values) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: values.password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha redefinida com sucesso!");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <AuthShell title="Redefinir senha" subtitle="Escolha uma nova senha segura para sua conta.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password">Nova senha</Label>
          <Input id="password" type="password" placeholder="Mínimo 8 caracteres" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirme a senha</Label>
          <Input id="confirm" type="password" placeholder="Repita a senha" {...register("confirm")} />
          {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
        </div>
        <Button
          type="submit"
          disabled={loading || !ready}
          className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary hover:opacity-90"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Salvar nova senha <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </form>
    </AuthShell>
  );
}