import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPlatformSettings, updatePlatformSetting } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes")({ component: ConfigPage });

const TITLES: Record<string, string> = {
  n8n: "Integração N8N",
  global_limits: "Limites Globais",
  platform_features: "Recursos da Plataforma",
};

function ConfigPage() {
  const list = useServerFn(listPlatformSettings);
  const { data, isLoading } = useQuery({ queryKey: ["platform-settings"], queryFn: () => list() });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações da Plataforma</h1>
        <p className="text-sm text-muted-foreground">Integrações, limites globais e recursos.</p>
      </header>
      {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {data?.settings.map((s: any) => (
          <SettingCard key={s.key} setting={s} />
        ))}
      </div>
    </div>
  );
}

function SettingCard({ setting }: { setting: any }) {
  const upd = useServerFn(updatePlatformSetting);
  const qc = useQueryClient();
  const [value, setValue] = useState(JSON.stringify(setting.value, null, 2));

  useEffect(() => {
    setValue(JSON.stringify(setting.value, null, 2));
  }, [setting.value]);

  const m = useMutation({
    mutationFn: (v: Record<string, unknown>) => upd({ data: { key: setting.key, value: v } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-settings"] });
      toast.success("Configuração salva");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card className="border-border bg-card/50 p-5 space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{TITLES[setting.key] || setting.key}</h3>
        {setting.description && <p className="text-xs text-muted-foreground">{setting.description}</p>}
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Valor (JSON)</Label>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="font-mono text-xs h-44"
        />
      </div>
      <Button
        size="sm"
        disabled={m.isPending}
        onClick={() => {
          try {
            m.mutate(JSON.parse(value));
          } catch {
            toast.error("JSON inválido");
          }
        }}
      >
        Salvar
      </Button>
    </Card>
  );
}