import { triggerCampaignCreation } from "@/lib/n8n";

// dentro do onSubmit:
await triggerCampaignCreation({
  organization_id: user.organization_id,
  niche: form.niche,
  company_name: form.company_name,
  // ...resto dos campos
});
