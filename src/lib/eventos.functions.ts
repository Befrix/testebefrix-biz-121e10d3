import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ParticipantSchema = z.object({
  full_name: z.string().trim().max(255).optional().nullable(),
  email: z.string().trim().max(255).optional().nullable(),
  company: z.string().trim().max(255).optional().nullable(),
  job_title: z.string().trim().max(255).optional().nullable(),
  phone: z.string().trim().max(64).optional().nullable(),
  segment: z.string().trim().max(120).optional().nullable(),
  region: z.string().trim().max(120).optional().nullable(),
  linkedin_url: z.string().trim().max(500).optional().nullable(),
});

const CreateEventInput = z.object({
  event_name: z.string().min(1).max(200),
  event_date: z.string().min(1).max(40),
  city: z.string().max(120).optional().nullable(),
  organizer: z.string().max(200).optional().nullable(),
  segment: z.string().max(120).optional().nullable(),
  filename: z.string().min(1).max(255),
  participants: z.array(ParticipantSchema).min(1).max(10000),
});

async function getTenantId(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string
) {
  const { data } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
  if (!data?.tenant_id) throw new Error("Workspace não encontrado");
  return data.tenant_id as string;
}

export const listEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const tenant_id = await getTenantId(supabase, userId);
    const { data, error } = await supabase
      .from("eventos_uploads")
      .select("id, filename, status, rows_count, metadata, created_at")
      .eq("tenant_id", tenant_id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { events: data ?? [] };
  });

export const getEventDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tenant_id = await getTenantId(supabase, userId);
    const { data: event, error: evtErr } = await supabase
      .from("eventos_uploads")
      .select("*")
      .eq("id", data.id)
      .eq("tenant_id", tenant_id)
      .maybeSingle();
    if (evtErr) throw new Error(evtErr.message);
    if (!event) throw new Error("Evento não encontrado");

    const { data: leadEventos } = await supabase
      .from("leads_eventos")
      .select("lead_id")
      .eq("upload_id", data.id)
      .eq("tenant_id", tenant_id);

    const leadIds = Array.from(new Set((leadEventos ?? []).map((r) => r.lead_id).filter(Boolean))) as string[];

    let leads: Array<{
      id: string;
      full_name: string | null;
      email: string | null;
      company: string | null;
      phone: string | null;
      job_title: string | null;
      segment: string | null;
      status: string;
      score: number;
    }> = [];
    if (leadIds.length > 0) {
      const { data: leadsData } = await supabase
        .from("leads")
        .select("id, full_name, email, company, phone, job_title, segment, status, score")
        .in("id", leadIds);
      leads = leadsData ?? [];
    }

    const totalParticipants = (event.rows_count as number) ?? leads.length;
    const companies = new Set(
      leads.map((l) => (l.company ?? "").trim().toLowerCase()).filter(Boolean)
    );
    const enriched = leads.filter((l) => Boolean(l.email) || Boolean(l.phone)).length;
    const enrichmentRate = totalParticipants > 0 ? (enriched / totalParticipants) * 100 : 0;

    const { data: campanhas } = await supabase
      .from("campanhas")
      .select("id, name, channel, status, config")
      .eq("tenant_id", tenant_id)
      .order("created_at", { ascending: false });
    const eventCampaigns = (campanhas ?? []).filter((c) => {
      const cfg = (c.config ?? {}) as Record<string, unknown>;
      return cfg.event_upload_id === data.id;
    });

    return {
      event,
      stats: {
        participants: totalParticipants,
        companies: companies.size,
        leads_created: leads.length,
        enrichment_rate: Math.round(enrichmentRate * 10) / 10,
        campaigns: eventCampaigns.length,
      },
      leads,
      campaigns: eventCampaigns,
    };
  });

export const createEventWithParticipants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CreateEventInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tenant_id = await getTenantId(supabase, userId);

    // 1. Create event upload row (processing)
    const eventMetadata = {
      event_name: data.event_name,
      event_date: data.event_date,
      city: data.city ?? null,
      organizer: data.organizer ?? null,
      segment: data.segment ?? null,
      source: "event_upload",
    };
    const { data: upload, error: upErr } = await supabase
      .from("eventos_uploads")
      .insert({
        tenant_id,
        filename: data.filename,
        status: "processing",
        rows_count: data.participants.length,
        metadata: eventMetadata,
      })
      .select()
      .single();
    if (upErr || !upload) throw new Error(upErr?.message ?? "Falha ao criar evento");

    // 2. Insert leads in batches of 200, then link via leads_eventos
    const BATCH = 200;
    let inserted = 0;
    const insertedIds: string[] = [];
    for (let i = 0; i < data.participants.length; i += BATCH) {
      const slice = data.participants.slice(i, i + BATCH);
      const rows = slice
        .filter((p) => p.full_name || p.email || p.company)
        .map((p) => ({
          tenant_id,
          full_name: p.full_name ?? null,
          email: p.email ?? null,
          company: p.company ?? null,
          job_title: p.job_title ?? null,
          phone: p.phone ?? null,
          segment: p.segment ?? data.segment ?? null,
          region: p.region ?? data.city ?? null,
          linkedin_url: p.linkedin_url ?? null,
          status: "new" as const,
          score: 0,
          metadata: {
            source: data.event_name,
            event_upload_id: upload.id,
            event_date: data.event_date,
            organizer: data.organizer ?? null,
          },
        }));
      if (rows.length === 0) continue;
      const { data: insRows, error: insErr } = await supabase
        .from("leads")
        .insert(rows)
        .select("id");
      if (insErr) {
        await supabase
          .from("eventos_uploads")
          .update({ status: "failed", metadata: { ...eventMetadata, error: insErr.message } })
          .eq("id", upload.id);
        throw new Error(`Falha ao importar leads: ${insErr.message}`);
      }
      inserted += insRows?.length ?? 0;
      for (const r of insRows ?? []) insertedIds.push(r.id);
    }

    // 3. Link each lead to this upload in leads_eventos timeline
    if (insertedIds.length > 0) {
      const eventRows = insertedIds.map((lead_id) => ({
        tenant_id,
        lead_id,
        upload_id: upload.id,
        event_type: "event.participant_imported",
        payload: { event_name: data.event_name, event_date: data.event_date },
      }));
      for (let i = 0; i < eventRows.length; i += 500) {
        await supabase.from("leads_eventos").insert(eventRows.slice(i, i + 500));
      }
    }

    // 4. Mark upload completed
    const finalMetadata = {
      ...eventMetadata,
      stats: {
        participants: data.participants.length,
        leads_created: inserted,
      },
    };
    await supabase
      .from("eventos_uploads")
      .update({ status: "completed", metadata: finalMetadata })
      .eq("id", upload.id);

    // 5. Audit log
    await supabase.from("audit_logs").insert({
      tenant_id,
      user_id: userId,
      action: "event.uploaded",
      entity: "eventos_uploads",
      entity_id: upload.id,
      metadata: { event_name: data.event_name, leads_created: inserted } as never,
    });

    // 6. Trigger N8N workflow if configured
    let workflowRunId: string | null = null;
    try {
      const { data: setting } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "n8n")
        .maybeSingle();
      const cfg = (setting?.value ?? {}) as Record<string, unknown>;
      const webhookUrl = (cfg.event_webhook_url ?? cfg.webhook_url) as string | undefined;

      const { data: run } = await supabase
        .from("workflow_runs")
        .insert({
          tenant_id,
          workflow_name: "event_enrichment",
          status: "running",
          trigger_source: "event_upload",
          payload: {
            event_upload_id: upload.id,
            event_name: data.event_name,
            leads_created: inserted,
          },
        })
        .select("id")
        .single();
      workflowRunId = run?.id ?? null;

      if (webhookUrl && workflowRunId) {
        const res = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            run_id: workflowRunId,
            tenant_id,
            event: {
              id: upload.id,
              name: data.event_name,
              date: data.event_date,
              city: data.city,
              organizer: data.organizer,
              segment: data.segment,
            },
            leads_count: inserted,
          }),
        });
        const responseText = await res.text();
        const ok = res.ok;
        await supabase
          .from("workflow_runs")
          .update({
            status: ok ? "queued" : "failed",
            n8n_execution_id: ok ? responseText.slice(0, 200) : null,
            error: ok ? null : `HTTP ${res.status}: ${responseText.slice(0, 200)}`,
            finished_at: ok ? null : new Date().toISOString(),
          })
          .eq("id", workflowRunId);
      } else if (workflowRunId) {
        // No webhook configured — mark as skipped
        await supabase
          .from("workflow_runs")
          .update({
            status: "skipped",
            error: "N8N webhook não configurado (platform_settings.n8n.event_webhook_url)",
            finished_at: new Date().toISOString(),
          })
          .eq("id", workflowRunId);
      }
    } catch (err) {
      if (workflowRunId) {
        await supabase
          .from("workflow_runs")
          .update({
            status: "failed",
            error: err instanceof Error ? err.message : "Erro desconhecido",
            finished_at: new Date().toISOString(),
          })
          .eq("id", workflowRunId);
      }
    }

    return {
      event_id: upload.id,
      leads_created: inserted,
      workflow_run_id: workflowRunId,
    };
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const tenant_id = await getTenantId(supabase, userId);
    const { error } = await supabase
      .from("eventos_uploads")
      .delete()
      .eq("id", data.id)
      .eq("tenant_id", tenant_id);
    if (error) throw new Error(error.message);
    await supabase.from("audit_logs").insert({
      tenant_id,
      user_id: userId,
      action: "event.deleted",
      entity: "eventos_uploads",
      entity_id: data.id,
      metadata: {} as never,
    });
    return { ok: true };
  });