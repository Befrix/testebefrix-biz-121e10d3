import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { executeEvent, type SdrEvent } from "./automation-engine.server";

const EventInput = z.object({
  event: z.enum([
    "lead.created",
    "lead.score.updated",
    "email.opened",
    "email.clicked",
    "reply.received",
    "pipeline.changed",
    "meeting.completed",
    "meeting.no_show",
    "meeting.rescheduled",
  ]),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const processEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => EventInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .single();
    if (!profile?.tenant_id) throw new Error("Workspace não encontrado");

    return executeEvent({
      supabase,
      tenant_id: profile.tenant_id,
      event: data.event as SdrEvent,
      payload: data.payload,
    });
  });

// Copilot-style insight generator on top of existing tables.
export const generateCopilotInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
    if (!profile?.tenant_id) throw new Error("Workspace não encontrado");

    const [{ data: outreach }, { data: meetings }, { data: leads }] = await Promise.all([
      supabase.from("outreach_logs").select("channel, status, created_at").limit(500),
      supabase.from("meeting_feedback").select("meeting_status, deal_status, deal_value_cents, created_at").limit(200),
      supabase.from("leads").select("segment, region, status, score").limit(500),
    ]);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { insight: "IA indisponível.", data: { outreach, meetings, leads } };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Você é o AI Copilot SDR da BEFRIX. Gere 4 insights curtos (uma frase cada) sobre melhores canais, horários, performance por segmento e padrões de resposta. Responda em português, formato bullet '- '.",
          },
          { role: "user", content: JSON.stringify({ outreach, meetings, leads }).slice(0, 6000) },
        ],
      }),
    });
    if (!res.ok) return { insight: `IA falhou (${res.status})`, data: null };
    const j = await res.json();
    const insight: string = j?.choices?.[0]?.message?.content ?? "";

    await supabase.from("audit_logs").insert({
      tenant_id: profile.tenant_id,
      action: "copilot.insight",
      entity: "tenant",
      metadata: { insight } as never,
    });
    return { insight, data: null };
  });
