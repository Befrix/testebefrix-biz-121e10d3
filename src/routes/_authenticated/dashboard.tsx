import { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { GlowOrb } from "@/components/ui/glow-orb";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: empresa, isLoading } = useQuery({
    queryKey: ["empresa-onboarding", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("empresas").select("onboarding_completed").limit(1).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!isLoading && empresa && !empresa.onboarding_completed) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [empresa, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 bg-mesh opacity-30" />
      <GlowOrb className="-top-40 left-1/3 fixed" variant="primary" size="xl" />
      <DashboardSidebar />
      <div className="relative z-10 lg:pl-64">
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
