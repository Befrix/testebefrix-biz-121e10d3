// Server-only execution engine for BEFRIX SDR automation.
// Reads enabled automations (trigger jsonb) + workflows (definition jsonb),
// matches the incoming event and executes actions against existing tables.
import type { SupabaseClient } from "@supabase/supabase-js";

export type SdrEvent =
  | "lead.created"
  | "lead.score.updated"
  | "email.opened"
  | "email.clicked"
  | "reply.received"
  | "pipeline.changed"
  | "meeting.completed"
  | "meeting.no_show"
  | "meeting.rescheduled";

type Action = { type: string; [k: string]: unknown };
type Ctx = {
  supabase: SupabaseClient;
  tenant_id: string;
  event: SdrEvent;
  payload: Record<string, unknown>;
};

// ---------- AI decision layer (best-effort, never throws fatally) ----------
async function aiDecide(prompt: string): Promise<string | null> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é o decision engine SDR da BEFRIX. Responda curto e direto." },
          { role: "user", content: prompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j?.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

// ---------- Action executor ----------
async function runAction(action: Action, ctx: Ctx): Promise<{ ok: boolean; info?: unknown; error?: string }> {
  const leadId = (ctx.payload.lead_id as string | undefined) ?? null;
  const { supabase, tenant_id } = ctx;

  try {
    switch (action.type) {
      case "send_email":
      case "send_whatsapp":
      case "send_linkedin": {
        const channel = action.type.replace("send_", "") as "email" | "whatsapp" | "linkedin";
        const { error } = await supabase.from("outreach_logs").insert({
          tenant_id,
          lead_id: leadId,
          channel,
          direction: "outbound",
          status: "queued",
          content: (action.template as string) ?? null,
          metadata: { action, event: ctx.event },
        });
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      }
      case "move_pipeline": {
        if (!leadId) return { ok: false, error: "missing lead_id" };
        const to = (action.to as string) ?? "contacted";
        const { error } = await supabase.from("leads").update({ status: to }).eq("id", leadId);
        if (error) return { ok: false, error: error.message };
        return { ok: true, info: { to } };
      }
      case "add_tag": {
        if (!leadId) return { ok: false, error: "missing lead_id" };
        const tag = (action.tag as string) ?? "auto";
        const { data: lead } = await supabase.from("leads").select("metadata").eq("id", leadId).single();
        const meta = (lead?.metadata as Record<string, unknown>) ?? {};
        const tags = Array.isArray(meta.tags) ? (meta.tags as string[]) : [];
        if (!tags.includes(tag)) tags.push(tag);
        await supabase.from("leads").update({ metadata: { ...meta, tags } }).eq("id", leadId);
        return { ok: true };
      }
      case "create_task":
      case "schedule_followup":
      case "open_feedback_popup":
      case "request_deal_status": {
        await supabase.from("audit_logs").insert({
          tenant_id,
          action: action.type,
          entity: "lead",
          entity_id: leadId,
          metadata: { action, event: ctx.event },
        });
        return { ok: true };
      }
      case "webhook_call": {
        const url = action.url as string | undefined;
        if (!url) return { ok: false, error: "missing url" };
        try {
          await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: ctx.event, payload: ctx.payload }),
          });
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "webhook error" };
        }
      }
      case "update_revenue_analytics": {
        const cents = ctx.payload.deal_value_cents as number | undefined;
        const dealStatus = ctx.payload.deal_status as string | undefined;
        if (dealStatus === "won" && cents && cents > 0) {
          await supabase.from("financeiro").insert({
            tenant_id,
            type: "revenue",
            amount_cents: cents,
            description: `Deal fechado via automação (${ctx.event})`,
          });
        }
        return { ok: true };
      }
      case "ai_score_lead":
      case "ai_choose_channel":
      case "ai_rewrite_message": {
        const decision = await aiDecide(
          `Ação: ${action.type}. Evento: ${ctx.event}. Payload: ${JSON.stringify(ctx.payload).slice(0, 800)}`
        );
        if (decision && leadId) {
          const { data: lead } = await supabase.from("leads").select("metadata").eq("id", leadId).single();
          const meta = (lead?.metadata as Record<string, unknown>) ?? {};
          await supabase
            .from("leads")
            .update({ metadata: { ...meta, [`ai_${action.type}`]: decision.slice(0, 500) } })
            .eq("id", leadId);
        }
        return { ok: true, info: { decision } };
      }
      case "wait_days":
      case "assign_sdr":
        // No-op placeholders (scheduler / assignment live outside this loop)
        return { ok: true };
      default:
        return { ok: false, error: `unknown action: ${action.type}` };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "action error" };
  }
}

// ---------- Engine: match + execute ----------
export async function executeEvent(ctx: Ctx) {
  const executed: Array<{ automation_id: string; results: Array<{ action: string; ok: boolean; error: string | null }> }> = [];

  // 1) automacoes: trigger.event === ctx.event AND enabled
  const { data: autos } = await ctx.supabase
    .from("automacoes")
    .select("id, name, trigger, actions, enabled")
    .eq("tenant_id", ctx.tenant_id)
    .eq("enabled", true);

  for (const a of autos ?? []) {
    const trigger = (a.trigger as { event?: string }) ?? {};
    if (trigger.event !== ctx.event) continue;
    const actions = Array.isArray(a.actions) ? (a.actions as Action[]) : [];
    const results: Array<{ action: string; ok: boolean; error: string | null }> = [];
    for (const action of actions) {
      const r = await runAction(action, ctx);
      results.push({ action: action.type, ok: r.ok, error: r.error ?? null });
    }
    executed.push({ automation_id: a.id, results });
  }

  // 2) workflows: definition.trigger.event matches
  const { data: wfs } = await ctx.supabase
    .from("workflows")
    .select("id, name, definition")
    .eq("tenant_id", ctx.tenant_id);

  for (const w of wfs ?? []) {
    const def = (w.definition as { trigger?: { event?: string }; steps?: Action[] }) ?? {};
    if (def?.trigger?.event !== ctx.event) continue;
    const steps = Array.isArray(def.steps) ? def.steps : [];
    const results: Array<{ action: string; ok: boolean; error: string | null }> = [];
    for (const step of steps) {
      const r = await runAction(step, ctx);
      results.push({ action: step.type, ok: r.ok, error: r.error ?? null });
    }
    executed.push({ automation_id: w.id, results });
  }

  // 3) Observability: persist event + execution trace
  await ctx.supabase.from("leads_eventos").insert({
    tenant_id: ctx.tenant_id,
    lead_id: (ctx.payload.lead_id as string | undefined) ?? null,
    event_type: ctx.event,
    payload: ctx.payload as never,
  });
  await ctx.supabase.from("audit_logs").insert({
    tenant_id: ctx.tenant_id,
    action: "automation.executed",
    entity: "event",
    metadata: { event: ctx.event, executed } as never,
  });

  return { event: ctx.event, executed };
}
