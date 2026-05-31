// Workflow builder serverFns — drag/drop visual SDR automation engine.
// Workflow definition is stored as JSONB in the `workflows` table.
//
// Definition shape:
// {
//   enabled: boolean,
//   trigger: { event: string, label: string, config?: Record<string,unknown> },
//   steps: Step[]
// }
//
// Step kinds: action | delay | ai | branch.
// Branch is one level deep with `yes` and `no` arrays.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Schemas ----------
const StepBase = z.object({
  id: z.string().min(1),
  kind: z.enum(["action", "delay", "ai", "branch"]),
  type: z.string().min(1),
  label: z.string().min(1).max(120),
  config: z.record(z.string(), z.unknown()).default({}),
});

// Schema is recursive only one level deep; we accept arbitrary nested for safety.
const StepSchema: z.ZodType<unknown> = StepBase.extend({
  yes: z.array(z.lazy(() => StepSchema)).optional(),
  no: z.array(z.lazy(() => StepSchema)).optional(),
});

const DefinitionSchema = z.object({
  enabled: z.boolean().default(true),
  trigger: z.object({
    event: z.string().min(1),
    label: z.string().min(1).max(80),
    config: z.record(z.string(), z.unknown()).optional(),
  }),
  steps: z.array(StepSchema).max(64),
});

const SaveInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(120),
  definition: DefinitionSchema,
});

// ---------- Catalogs (shared with the UI) ----------
export const WORKFLOW_TRIGGERS = [
  { event: "lead.created", label: "Novo lead", desc: "Lead criado no workspace" },
  { event: "email.opened", label: "E-mail aberto", desc: "Lead abriu um e-mail outbound" },
  { event: "email.clicked", label: "Clique em e-mail", desc: "Lead clicou em link" },
  { event: "reply.received", label: "Resposta recebida", desc: "Lead respondeu em qualquer canal" },
  { event: "lead.score.updated", label: "Score IA alterado", desc: "Score recalculado pela IA" },
  { event: "pipeline.changed", label: "Mudança de pipeline", desc: "Estágio do lead mudou" },
  { event: "meeting.completed", label: "Reunião concluída", desc: "Reunião finalizada com sucesso" },
  { event: "meeting.no_show", label: "No-show detectado", desc: "Lead não compareceu" },
  { event: "meeting.rescheduled", label: "Reunião reagendada", desc: "Nova data definida" },
] as const;

export const WORKFLOW_ACTIONS = [
  { type: "send_email", kind: "action", label: "Enviar e-mail", icon: "mail", desc: "Disparo de e-mail outbound" },
  { type: "send_whatsapp", kind: "action", label: "Enviar WhatsApp", icon: "message", desc: "Mensagem WhatsApp" },
  { type: "send_linkedin", kind: "action", label: "Enviar LinkedIn", icon: "linkedin", desc: "DM LinkedIn outbound" },
  { type: "create_task", kind: "action", label: "Criar tarefa", icon: "check", desc: "Tarefa para o SDR" },
  { type: "move_pipeline", kind: "action", label: "Mover pipeline", icon: "move", desc: "Mudar estágio do lead" },
  { type: "add_tag", kind: "action", label: "Adicionar tag", icon: "tag", desc: "Tag no lead" },
  { type: "webhook_call", kind: "action", label: "Webhook", icon: "webhook", desc: "POST para URL externa" },
  { type: "open_feedback_popup", kind: "action", label: "Popup feedback", icon: "popup", desc: "Coletar status do SDR" },
  { type: "open_calendar", kind: "action", label: "Reagendar reunião", icon: "calendar", desc: "Abrir calendar do lead" },
  { type: "wait_days", kind: "delay", label: "Aguardar", icon: "clock", desc: "Atrasar próxima etapa" },
  { type: "ai_best_channel", kind: "ai", label: "IA · Melhor canal", icon: "sparkles", desc: "Decide canal ideal" },
  { type: "ai_best_time", kind: "ai", label: "IA · Melhor horário", icon: "sparkles", desc: "Decide horário ideal" },
  { type: "ai_best_approach", kind: "ai", label: "IA · Melhor abordagem", icon: "sparkles", desc: "Tom e ângulo" },
  { type: "ai_score_lead", kind: "ai", label: "IA · Predictive scoring", icon: "sparkles", desc: "Score predictivo" },
  { type: "ai_rewrite_message", kind: "ai", label: "IA · Reescrever mensagem", icon: "sparkles", desc: "Personalização" },
  { type: "branch_if_replied", kind: "branch", label: "Se respondeu", icon: "branch", desc: "Sim / Não" },
  { type: "branch_if_opened", kind: "branch", label: "Se abriu", icon: "branch", desc: "Sim / Não" },
  { type: "branch_score_gt", kind: "branch", label: "Se score > 70", icon: "branch", desc: "Sim / Não" },
] as const;

async function getTenantId(supabase: import("@supabase/supabase-js").SupabaseClient, userId: string) {
  const { data } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
  if (!data?.tenant_id) throw new Error("Workspace não encontrado");
  return data.tenant_id as string;
}

// ---------- List ----------
export const listWorkflows = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const tenant_id = await getTenantId(supabase, userId);
    const { data: workflows } = await supabase
      .from("workflows")
      .select("id, name, definition, created_at")
      .eq("tenant_id", tenant_id)
      .order("created_at", { ascending: false });

    // Mini analytics: count audit_logs (action='automation.executed') per workflow id
    const ids = (workflows ?? []).map((w) => w.id);
    const stats: Record<string, { runs: number; ok: number; errors: number; lastRun: string | null }> = {};
    for (const id of ids) stats[id] = { runs: 0, ok: 0, errors: 0, lastRun: null };

    if (ids.length > 0) {
      const { data: logs } = await supabase
        .from("audit_logs")
        .select("metadata, created_at")
        .eq("tenant_id", tenant_id)
        .eq("action", "automation.executed")
        .order("created_at", { ascending: false })
        .limit(500);

      for (const log of logs ?? []) {
        const meta = (log.metadata as { executed?: Array<{ automation_id?: string; results?: Array<{ ok: boolean }> }> }) ?? {};
        for (const exec of meta.executed ?? []) {
          const id = exec.automation_id;
          if (!id || !stats[id]) continue;
          stats[id].runs += 1;
          const allOk = (exec.results ?? []).every((r) => r.ok);
          if (allOk) stats[id].ok += 1;
          else stats[id].errors += 1;
          if (!stats[id].lastRun) stats[id].lastRun = log.created_at as string;
        }
      }
    }

    return { workflows: workflows ?? [], stats };
  });

// ---------- Recent executions (global) ----------
export const recentWorkflowExecutions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const tenant_id = await getTenantId(supabase, userId);
    const { data } = await supabase
      .from("audit_logs")
      .select("id, created_at, metadata")
      .eq("tenant_id", tenant_id)
      .eq("action", "automation.executed")
      .order("created_at", { ascending: false })
      .limit(20);
    return { items: data ?? [] };
  });

// ---------- Save (insert or update) ----------
export const saveWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SaveInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tenant_id = await getTenantId(supabase, userId);
    const payload = {
      tenant_id,
      name: data.name,
      definition: JSON.parse(JSON.stringify(data.definition)),
    };
    if (data.id) {
      const { error, data: row } = await supabase
        .from("workflows")
        .update(payload)
        .eq("id", data.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { error, data: row } = await supabase.from("workflows").insert(payload).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Toggle enabled ----------
const ToggleInput = z.object({ id: z.string().uuid(), enabled: z.boolean() });
export const toggleWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ToggleInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: row } = await supabase.from("workflows").select("definition").eq("id", data.id).single();
    const def = (row?.definition as Record<string, unknown>) ?? {};
    const next = { ...def, enabled: data.enabled };
    const { error } = await supabase.from("workflows").update({ definition: next }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Delete ----------
const DeleteInput = z.object({ id: z.string().uuid() });
export const deleteWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DeleteInput.parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("workflows").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type WorkflowDefinition = z.infer<typeof DefinitionSchema>;
