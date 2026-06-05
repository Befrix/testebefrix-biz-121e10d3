import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GlobalSearch } from "./global-search";
import { NotificationsBell } from "./notifications";

const REALTIME_TABLES = ["leads", "outreach_logs", "meeting_feedback", "campanhas", "eventos_uploads"] as const;

export function DashboardTopbar() {
  const qc = useQueryClient();

  useEffect(() => {
    const ch = supabase.channel("dashboard-realtime");
    for (const table of REALTIME_TABLES) {
      ch.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        qc.invalidateQueries({ queryKey: ["workspace-data"] });
      });
    }
    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  return (
    <div className="sticky top-0 z-20 -mx-4 mb-6 flex items-center gap-3 border-b border-border-subtle bg-background/70 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex-1">
        <GlobalSearch />
      </div>
      <NotificationsBell />
    </div>
  );
}