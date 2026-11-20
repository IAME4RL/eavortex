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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          amount_cents: number
          created_at: string
          id: string
          reference: string
        }
        Insert: {
          affiliate_id: string
          amount_cents: number
          created_at?: string
          id?: string
          reference?: string
        }
        Update: {
          affiliate_id?: string
          amount_cents?: number
          created_at?: string
          id?: string
          reference?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          commission_cents: number
          created_at: string
          id: string
          paid_at: string | null
          referred_label: string
          referred_user_id: string
          status: string
        }
        Insert: {
          affiliate_id: string
          commission_cents?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          referred_label?: string
          referred_user_id: string
          status?: string
        }
        Update: {
          affiliate_id?: string
          commission_cents?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          referred_label?: string
          referred_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          account_holder: string
          account_number: string
          bank_name: string
          code: string
          created_at: string
          full_name: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          account_holder?: string
          account_number?: string
          bank_name?: string
          code: string
          created_at?: string
          full_name?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          account_holder?: string
          account_number?: string
          bank_name?: string
          code?: string
          created_at?: string
          full_name?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          daily_scan_limit: number
          id: number
          scanner_enabled: boolean
          updated_at: string
        }
        Insert: {
          daily_scan_limit?: number
          id?: number
          scanner_enabled?: boolean
          updated_at?: string
        }
        Update: {
          daily_scan_limit?: number
          id?: number
          scanner_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      backtest_runs: {
        Row: {
          bar_count: number
          created_at: string
          first_bar: string | null
          id: string
          last_bar: string | null
          metrics: Json
          strategy: string
          symbol: string
          timeframe: string
          user_id: string
        }
        Insert: {
          bar_count?: number
          created_at?: string
          first_bar?: string | null
          id?: string
          last_bar?: string | null
          metrics?: Json
          strategy: string
          symbol: string
          timeframe: string
          user_id: string
        }
        Update: {
          bar_count?: number
          created_at?: string
          first_bar?: string | null
          id?: string
          last_bar?: string | null
          metrics?: Json
          strategy?: string
          symbol?: string
          timeframe?: string
          user_id?: string
        }
        Relationships: []
      }
      bots: {
        Row: {
          account_id: string
          bridge_token_hash: string | null
          created_at: string
          default_lot: number
          demo_only: boolean
          emergency_close_ack_at: string | null
          emergency_close_requested_at: string | null
          emergency_close_result: string | null
          goal_close_ack_at: string | null
          goal_close_requested_at: string | null
          goal_profit: number
          goal_reached_at: string | null
          goal_started_at: string | null
          id: string
          last_decision: string | null
          last_error: string | null
          last_heartbeat: string | null
          live_confirmed_at: string | null
          max_daily_loss: number
          max_lot: number
          max_open_trades: number
          profit_goal: number
          profit_goal_mode: string
          risk_per_trade_pct: number
          status: string
          stop_ack_at: string | null
          stop_requested_at: string | null
          strategy: string
          terminal_info: Json | null
          trading_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          bridge_token_hash?: string | null
          created_at?: string
          default_lot?: number
          demo_only?: boolean
          emergency_close_ack_at?: string | null
          emergency_close_requested_at?: string | null
          emergency_close_result?: string | null
          goal_close_ack_at?: string | null
          goal_close_requested_at?: string | null
          goal_profit?: number
          goal_reached_at?: string | null
          goal_started_at?: string | null
          id?: string
          last_decision?: string | null
          last_error?: string | null
          last_heartbeat?: string | null
          live_confirmed_at?: string | null
          max_daily_loss?: number
          max_lot?: number
          max_open_trades?: number
          profit_goal?: number
          profit_goal_mode?: string
          risk_per_trade_pct?: number
          status?: string
          stop_ack_at?: string | null
          stop_requested_at?: string | null
          strategy?: string
          terminal_info?: Json | null
          trading_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          bridge_token_hash?: string | null
          created_at?: string
          default_lot?: number
          demo_only?: boolean
          emergency_close_ack_at?: string | null
          emergency_close_requested_at?: string | null
          emergency_close_result?: string | null
          goal_close_ack_at?: string | null
          goal_close_requested_at?: string | null
          goal_profit?: number
          goal_reached_at?: string | null
          goal_started_at?: string | null
          id?: string
          last_decision?: string | null
          last_error?: string | null
          last_heartbeat?: string | null
          live_confirmed_at?: string | null
          max_daily_loss?: number
          max_lot?: number
          max_open_trades?: number
          profit_goal?: number
          profit_goal_mode?: string
          risk_per_trade_pct?: number
          status?: string
          stop_ack_at?: string | null
          stop_requested_at?: string | null
          strategy?: string
          terminal_info?: Json | null
          trading_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "trading_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cloud_api_keys: {
        Row: {
          api_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentor_assignments: {
        Row: {
          client_id: string
          created_at: string
          id: string
          mentor_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          mentor_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          mentor_id?: string
        }
        Relationships: []
      }
      mentor_bot_licenses: {
        Row: {
          bot_id: string
          client_email: string
          client_id: string | null
          client_name: string
          created_at: string
          id: string
          license_hash: string
          license_key: string
          mentor_id: string
          redeemed_at: string | null
          status: string
        }
        Insert: {
          bot_id: string
          client_email: string
          client_id?: string | null
          client_name: string
          created_at?: string
          id?: string
          license_hash: string
          license_key: string
          mentor_id: string
          redeemed_at?: string | null
          status?: string
        }
        Update: {
          bot_id?: string
          client_email?: string
          client_id?: string | null
          client_name?: string
          created_at?: string
          id?: string
          license_hash?: string
          license_key?: string
          mentor_id?: string
          redeemed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_bot_licenses_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "mentor_bots"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_bots: {
        Row: {
          avatar_url: string | null
          background_url: string | null
          created_at: string
          description: string
          id: string
          mentor_id: string
          mentor_name: string
          name: string
          strategies: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          background_url?: string | null
          created_at?: string
          description?: string
          id?: string
          mentor_id: string
          mentor_name?: string
          name: string
          strategies?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          background_url?: string | null
          created_at?: string
          description?: string
          id?: string
          mentor_id?: string
          mentor_name?: string
          name?: string
          strategies?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          sender_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          sender_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          mentor_requested: boolean
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          mentor_requested?: boolean
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          mentor_requested?: boolean
        }
        Relationships: []
      }
      scans: {
        Row: {
          analysis: Json | null
          created_at: string
          error: string | null
          id: string
          image_path: string | null
          instrument: string
          saved: boolean
          status: string
          timeframe: string
          trading_style: string
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          created_at?: string
          error?: string | null
          id?: string
          image_path?: string | null
          instrument: string
          saved?: boolean
          status?: string
          timeframe: string
          trading_style: string
          user_id: string
        }
        Update: {
          analysis?: Json | null
          created_at?: string
          error?: string | null
          id?: string
          image_path?: string | null
          instrument?: string
          saved?: boolean
          status?: string
          timeframe?: string
          trading_style?: string
          user_id?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          created_at: string
          data_at: string
          entry: number
          expires_at: string
          explanation: string
          id: string
          reason: string
          risk_reward: number
          side: string
          signal_key: string
          status: string
          stop_loss: number
          strategy: string
          symbol: string
          take_profit: number
          timeframe: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_at: string
          entry: number
          expires_at: string
          explanation: string
          id?: string
          reason: string
          risk_reward: number
          side: string
          signal_key: string
          status?: string
          stop_loss: number
          strategy: string
          symbol: string
          take_profit: number
          timeframe: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_at?: string
          entry?: number
          expires_at?: string
          explanation?: string
          id?: string
          reason?: string
          risk_reward?: number
          side?: string
          signal_key?: string
          status?: string
          stop_loss?: number
          strategy?: string
          symbol?: string
          take_profit?: number
          timeframe?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_signals: {
        Row: {
          bot_id: string
          close_price: number | null
          closed_at: string | null
          comment: string | null
          created_at: string
          error: string | null
          fill_price: number | null
          filled_at: string | null
          id: string
          profit: number | null
          sent_at: string | null
          side: string
          signal_key: string | null
          status: string
          stop_loss: number | null
          strategy: string | null
          symbol: string
          take_profit: number | null
          ticket: string | null
          user_id: string
          volume: number
        }
        Insert: {
          bot_id: string
          close_price?: number | null
          closed_at?: string | null
          comment?: string | null
          created_at?: string
          error?: string | null
          fill_price?: number | null
          filled_at?: string | null
          id?: string
          profit?: number | null
          sent_at?: string | null
          side: string
          signal_key?: string | null
          status?: string
          stop_loss?: number | null
          strategy?: string | null
          symbol: string
          take_profit?: number | null
          ticket?: string | null
          user_id: string
          volume: number
        }
        Update: {
          bot_id?: string
          close_price?: number | null
          closed_at?: string | null
          comment?: string | null
          created_at?: string
          error?: string | null
          fill_price?: number | null
          filled_at?: string | null
          id?: string
          profit?: number | null
          sent_at?: string | null
          side?: string
          signal_key?: string | null
          status?: string
          stop_loss?: number | null
          strategy?: string | null
          symbol?: string
          take_profit?: number | null
          ticket?: string | null
          user_id?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "trade_signals_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_accounts: {
        Row: {
          account_login: string
          broker_server: string
          connection_status: string
          created_at: string
          id: string
          label: string | null
          platform: string
          user_id: string
        }
        Insert: {
          account_login: string
          broker_server: string
          connection_status?: string
          created_at?: string
          id?: string
          label?: string | null
          platform?: string
          user_id: string
        }
        Update: {
          account_login?: string
          broker_server?: string
          connection_status?: string
          created_at?: string
          id?: string
          label?: string | null
          platform?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          instrument: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instrument: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instrument?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_affiliate_overview: {
        Args: never
        Returns: {
          account_holder: string
          account_number: string
          balance_cents: number
          bank_name: string
          code: string
          created_at: string
          earned_cents: number
          email: string
          full_name: string
          id: string
          paid_out_cents: number
          referrals_paid: number
          referrals_total: number
          status: string
        }[]
      }
      admin_affiliate_referrals: {
        Args: never
        Returns: {
          affiliate_code: string
          affiliate_name: string
          commission_cents: number
          created_at: string
          id: string
          paid_at: string
          referred_email: string
          status: string
        }[]
      }
      admin_record_payout: {
        Args: {
          p_affiliate_id: string
          p_amount_cents: number
          p_reference: string
        }
        Returns: undefined
      }
      admin_set_affiliate_status: {
        Args: { p_affiliate_id: string; p_status: string }
        Returns: undefined
      }
      admin_set_referral_status: {
        Args: { p_referral_id: string; p_status: string }
        Returns: undefined
      }
      admin_stats: { Args: never; Returns: Json }
      affiliate_balance_cents: {
        Args: { p_affiliate_id: string }
        Returns: number
      }
      claim_referral: { Args: { p_code: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_mentor_of: {
        Args: { _client: string; _mentor: string }
        Returns: boolean
      }
      issue_mentor_bot_license: {
        Args: {
          p_bot_id: string
          p_client_email: string
          p_client_name: string
          p_license_key: string
        }
        Returns: undefined
      }
      join_affiliate: {
        Args: { p_full_name: string }
        Returns: {
          account_holder: string
          account_number: string
          bank_name: string
          code: string
          created_at: string
          full_name: string
          id: string
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "affiliates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      my_affiliate_summary: { Args: never; Returns: Json }
      redeem_mentor_bot_license: {
        Args: { p_license_key: string }
        Returns: {
          bot_id: string
          bot_name: string
          mentor_name: string
        }[]
      }
      update_affiliate_payout: {
        Args: {
          p_account_holder: string
          p_account_number: string
          p_bank_name: string
          p_full_name: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "mentor" | "client"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "mentor", "client"],
    },
  },
} as const
