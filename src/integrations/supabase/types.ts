export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      automacoes: {
        Row: {
          actions: Json
          created_at: string
          enabled: boolean
          id: string
          name: string
          tenant_id: string
          trigger: Json
        }
        Insert: {
          actions?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          tenant_id: string
          trigger?: Json
        }
        Update: {
          actions?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          tenant_id?: string
          trigger?: Json
        }
        Relationships: [
          {
            foreignKeyName: "automacoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      campanhas: {
        Row: {
          channel: Database["public"]["Enums"]["channel"]
          config: Json
          created_at: string
          id: string
          name: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["channel"]
          config?: Json
          created_at?: string
          id?: string
          name: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["channel"]
          config?: Json
          created_at?: string
          id?: string
          name?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_strategy_profiles: {
        Row: {
          biggest_challenges: string | null
          channels_enabled: Database["public"]["Enums"]["channel"][]
          communication_style: string | null
          created_at: string
          cta: string | null
          custom_links: Json
          daily_limits: Json
          desired_result: string | null
          differentials: string[]
          email_signature: string | null
          forbidden_words: string[]
          id: string
          keywords: string[]
          main_pain: string | null
          objections: string[]
          objetivos: string[]
          offer: string | null
          onboarding_completed: boolean
          problems_solved: string[]
          secondary_pains: string[]
          send_windows: Json
          target_audience: string | null
          target_roles: string[]
          tenant_id: string
          ticket_medio: string | null
          tone_of_voice: string | null
          updated_at: string
        }
        Insert: {
          biggest_challenges?: string | null
          channels_enabled?: Database["public"]["Enums"]["channel"][]
          communication_style?: string | null
          created_at?: string
          cta?: string | null
          custom_links?: Json
          daily_limits?: Json
          desired_result?: string | null
          differentials?: string[]
          email_signature?: string | null
          forbidden_words?: string[]
          id?: string
          keywords?: string[]
          main_pain?: string | null
          objections?: string[]
          objetivos?: string[]
          offer?: string | null
          onboarding_completed?: boolean
          problems_solved?: string[]
          secondary_pains?: string[]
          send_windows?: Json
          target_audience?: string | null
          target_roles?: string[]
          tenant_id: string
          ticket_medio?: string | null
          tone_of_voice?: string | null
          updated_at?: string
        }
        Update: {
          biggest_challenges?: string | null
          channels_enabled?: Database["public"]["Enums"]["channel"][]
          communication_style?: string | null
          created_at?: string
          cta?: string | null
          custom_links?: Json
          daily_limits?: Json
          desired_result?: string | null
          differentials?: string[]
          email_signature?: string | null
          forbidden_words?: string[]
          id?: string
          keywords?: string[]
          main_pain?: string | null
          objections?: string[]
          objetivos?: string[]
          offer?: string | null
          onboarding_completed?: boolean
          problems_solved?: string[]
          secondary_pains?: string[]
          send_windows?: Json
          target_audience?: string | null
          target_roles?: string[]
          tenant_id?: string
          ticket_medio?: string | null
          tone_of_voice?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_strategy_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          calendar_url: string | null
          cnpj: string | null
          company_instagram: string | null
          company_linkedin: string | null
          company_name: string
          company_segment: string | null
          company_size: string | null
          company_subsegment: string | null
          company_website: string | null
          created_at: string
          faturamento_anual: string | null
          id: string
          nome_fantasia: string | null
          onboarding_completed: boolean
          razao_social: string | null
          target_region: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          calendar_url?: string | null
          cnpj?: string | null
          company_instagram?: string | null
          company_linkedin?: string | null
          company_name: string
          company_segment?: string | null
          company_size?: string | null
          company_subsegment?: string | null
          company_website?: string | null
          created_at?: string
          faturamento_anual?: string | null
          id?: string
          nome_fantasia?: string | null
          onboarding_completed?: boolean
          razao_social?: string | null
          target_region?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          calendar_url?: string | null
          cnpj?: string | null
          company_instagram?: string | null
          company_linkedin?: string | null
          company_name?: string
          company_segment?: string | null
          company_size?: string | null
          company_subsegment?: string | null
          company_website?: string | null
          created_at?: string
          faturamento_anual?: string | null
          id?: string
          nome_fantasia?: string | null
          onboarding_completed?: boolean
          razao_social?: string | null
          target_region?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_uploads: {
        Row: {
          created_at: string
          filename: string
          id: string
          metadata: Json
          rows_count: number
          status: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          metadata?: Json
          rows_count?: number
          status?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          metadata?: Json
          rows_count?: number
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_uploads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financeiro: {
        Row: {
          amount_cents: number
          created_at: string
          description: string | null
          id: string
          occurred_at: string
          tenant_id: string
          type: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          description?: string | null
          id?: string
          occurred_at?: string
          tenant_id: string
          type: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string | null
          id?: string
          occurred_at?: string
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      icp_profiles: {
        Row: {
          average_ticket: string | null
          created_at: string
          id: string
          niches: string[]
          preferred_segments: string[]
          target_company_size: string[]
          target_regions: string[]
          target_roles: string[]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          average_ticket?: string | null
          created_at?: string
          id?: string
          niches?: string[]
          preferred_segments?: string[]
          target_company_size?: string[]
          target_regions?: string[]
          target_roles?: string[]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          average_ticket?: string | null
          created_at?: string
          id?: string
          niches?: string[]
          preferred_segments?: string[]
          target_company_size?: string[]
          target_regions?: string[]
          target_roles?: string[]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "icp_profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          provider: string
          tenant_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          provider: string
          tenant_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          provider?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          due_at: string | null
          id: string
          paid_at: string | null
          status: string
          subscription_id: string | null
          tenant_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          due_at?: string | null
          id?: string
          paid_at?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          due_at?: string | null
          id?: string
          paid_at?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          linkedin_url: string | null
          metadata: Json
          phone: string | null
          region: string | null
          score: number
          segment: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          linkedin_url?: string | null
          metadata?: Json
          phone?: string | null
          region?: string | null
          score?: number
          segment?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          linkedin_url?: string | null
          metadata?: Json
          phone?: string | null
          region?: string | null
          score?: number
          segment?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_eventos: {
        Row: {
          event_type: string
          id: string
          lead_id: string | null
          occurred_at: string
          payload: Json
          tenant_id: string
          upload_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          lead_id?: string | null
          occurred_at?: string
          payload?: Json
          tenant_id: string
          upload_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          lead_id?: string | null
          occurred_at?: string
          payload?: Json
          tenant_id?: string
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_eventos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_eventos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_eventos_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "eventos_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_feedback: {
        Row: {
          created_at: string
          deal_status: string | null
          deal_value_cents: number | null
          feedback_date: string
          id: string
          lead_id: string | null
          meeting_id: string | null
          meeting_status: string
          notes: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_status?: string | null
          deal_value_cents?: number | null
          feedback_date?: string
          id?: string
          lead_id?: string | null
          meeting_id?: string | null
          meeting_status?: string
          notes?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_status?: string | null
          deal_value_cents?: number | null
          feedback_date?: string
          id?: string
          lead_id?: string | null
          meeting_id?: string | null
          meeting_status?: string
          notes?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      outreach_logs: {
        Row: {
          campanha_id: string | null
          channel: Database["public"]["Enums"]["channel"]
          content: string | null
          created_at: string
          direction: string
          id: string
          lead_id: string | null
          metadata: Json
          status: string
          tenant_id: string
        }
        Insert: {
          campanha_id?: string | null
          channel: Database["public"]["Enums"]["channel"]
          content?: string | null
          created_at?: string
          direction?: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          status?: string
          tenant_id: string
        }
        Update: {
          campanha_id?: string | null
          channel?: Database["public"]["Enums"]["channel"]
          content?: string | null
          created_at?: string
          direction?: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_logs_campanha_id_fkey"
            columns: ["campanha_id"]
            isOneToOne: false
            referencedRelation: "campanhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outreach_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          created_at: string
          features: Json
          id: string
          monthly_price_cents: number
          name: string
          tier: Database["public"]["Enums"]["plan_tier"]
        }
        Insert: {
          created_at?: string
          features?: Json
          id?: string
          monthly_price_cents?: number
          name: string
          tier: Database["public"]["Enums"]["plan_tier"]
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          monthly_price_cents?: number
          name?: string
          tier?: Database["public"]["Enums"]["plan_tier"]
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sequencias: {
        Row: {
          created_at: string
          id: string
          name: string
          steps: Json
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          steps?: Json
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          steps?: Json
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sequencias_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          onboarding_completed: boolean
          plan: Database["public"]["Enums"]["plan_tier"]
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          onboarding_completed?: boolean
          plan?: Database["public"]["Enums"]["plan_tier"]
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          onboarding_completed?: boolean
          plan?: Database["public"]["Enums"]["plan_tier"]
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          created_at: string
          error: string | null
          finished_at: string | null
          id: string
          n8n_execution_id: string | null
          payload: Json
          result: Json
          started_at: string
          status: string
          tenant_id: string
          trigger_source: string
          workflow_id: string | null
          workflow_name: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          n8n_execution_id?: string | null
          payload?: Json
          result?: Json
          started_at?: string
          status?: string
          tenant_id: string
          trigger_source?: string
          workflow_id?: string | null
          workflow_name?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          n8n_execution_id?: string | null
          payload?: Json
          result?: Json
          started_at?: string
          status?: string
          tenant_id?: string
          trigger_source?: string
          workflow_id?: string | null
          workflow_name?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string
          definition: Json
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          definition?: Json
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          definition?: Json
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_tenant_id: { Args: never; Returns: string }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      is_tenant_member: { Args: { _tenant_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "owner"
        | "admin"
        | "manager"
        | "sdr"
        | "viewer"
        | "platform_admin"
      channel: "email" | "whatsapp" | "linkedin"
      lead_status:
        | "new"
        | "qualified"
        | "contacted"
        | "meeting_booked"
        | "won"
        | "lost"
      plan_tier: "starter" | "pro" | "enterprise"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "owner",
        "admin",
        "manager",
        "sdr",
        "viewer",
        "platform_admin",
      ],
      channel: ["email", "whatsapp", "linkedin"],
      lead_status: [
        "new",
        "qualified",
        "contacted",
        "meeting_booked",
        "won",
        "lost",
      ],
      plan_tier: ["starter", "pro", "enterprise"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "paused",
      ],
    },
  },
} as const
