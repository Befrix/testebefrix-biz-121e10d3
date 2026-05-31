import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AutomationTemplate = z.object({
  key: z.enum([
    "post_meeting_feedback",
    "no_show_recovery",
    "new_lead_welcome",
    "reply_handoff",
    "stale_lead_reactivation",
  ]),
});

const TEMPLATES = {
  post_meeting_feedback: {
    name: "Pós-reunião · Coleta de status",
    trigger: { event: "meeting.completed", delay_minutes: 30 },
    actions: [
      { type: "open_feedback_popup", target: "sdr" },
      { type: "request_deal_status" },
      { type: "update_revenue_analytics" },
    ],
  },
  no_show_recovery: {
    name: "No-show recovery automático",
    trigger: { event: "meeting.no_show", delay_minutes: 5 },
    actions: [
      { type: "send_whatsapp", template: "no_show_friendly" },
      { type: "send_email", template: "reschedule_offer" },
      { type: "open_calendar", goal: "reschedule" },
    ],
  },
  new_lead_welcome: {
    name: "Novo lead · Primeiro toque IA",
    trigger: { event: "lead.created" },
    actions: [
      { type: "ai_score_lead" },
      { type: "ai_choose_channel" },
      { type: "send_first_touch" },
    ],
  },
  reply_handoff: {
    name: "Resposta detectada · Handoff SDR",
    trigger: { event: "outreach.reply" },
    actions: [
      { type: "move_pipeline", to: "contacted" },
      { type: "assign_sdr" },
      { type: "create_task", title: "Responder em até 15min" },
    ],
  },
  stale_lead_reactivation: {
    name: "Lead frio · Reativação IA",
    trigger: { event: "lead.stale", days: 14 },
    actions: [
      { type: "ai_rewrite_message", tone: "curious" },
      { type: "send_email" },
      { type: "wait_days", days: 3 },
      { type: "send_whatsapp" },
    ],
  },
} as const;

export const activateAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => AutomationTemplate.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();
    if (!profile?.tenant_id) throw new Error("Workspace não encontrado");
    const tpl = TEMPLATES[data.key];
    const { error, data: inserted } = await supabase
      .from("automacoes")
      .insert({
        tenant_id: profile.tenant_id,
        name: tpl.name,
        trigger: JSON.parse(JSON.stringify(tpl.trigger)),
        actions: JSON.parse(JSON.stringify(tpl.actions)),
        enabled: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });

const ToggleInput = z.object({ id: z.string().uuid(), enabled: z.boolean() });
export const toggleAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ToggleInput.parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("automacoes")
      .update({ enabled: data.enabled })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const DeleteInput = z.object({ id: z.string().uuid() });
export const deleteAutomation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => DeleteInput.parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("automacoes")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const AUTOMATION_PRESETS = [
  { key: "post_meeting_feedback", name: TEMPLATES.post_meeting_feedback.name, desc: "Coleta status do negócio e atualiza revenue analytics.", icon: "calendar-check" },
  { key: "no_show_recovery", name: TEMPLATES.no_show_recovery.name, desc: "WhatsApp + e-mail + reagendamento rápido em no-shows.", icon: "alert" },
  { key: "new_lead_welcome", name: TEMPLATES.new_lead_welcome.name, desc: "IA escolhe canal, abordagem e dispara primeiro toque.", icon: "sparkles" },
  { key: "reply_handoff", name: TEMPLATES.reply_handoff.name, desc: "Move pipeline, atribui SDR e cria tarefa de resposta rápida.", icon: "reply" },
  { key: "stale_lead_reactivation", name: TEMPLATES.stale_lead_reactivation.name, desc: "Reativa leads frios com mensagens reescritas por IA.", icon: "zap" },
] as const;

export type AutomationPresetKey = (typeof AUTOMATION_PRESETS)[number]["key"];
