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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      banks: {
        Row: {
          cor: string
          created_at: string
          custom_logo: string | null
          id: string
          logo: string | null
          nome: string
          saldo: number
          user_id: string
        }
        Insert: {
          cor?: string
          created_at?: string
          custom_logo?: string | null
          id?: string
          logo?: string | null
          nome: string
          saldo?: number
          user_id: string
        }
        Update: {
          cor?: string
          created_at?: string
          custom_logo?: string | null
          id?: string
          logo?: string | null
          nome?: string
          saldo?: number
          user_id?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          created_at: string
          descricao: string
          id: string
          mes_ano: string
          pago: boolean
          tipo: string
          user_id: string
          valor: number
          vencimento: string | null
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          mes_ano: string
          pago?: boolean
          tipo: string
          user_id: string
          valor?: number
          vencimento?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          mes_ano?: string
          pago?: boolean
          tipo?: string
          user_id?: string
          valor?: number
          vencimento?: string | null
        }
        Relationships: []
      }
      cards: {
        Row: {
          bandeira: string
          cor: string
          created_at: string
          custom_image: string | null
          id: string
          limite: number
          nome: string
          usado: number
          user_id: string
          vencimento: number
        }
        Insert: {
          bandeira?: string
          cor?: string
          created_at?: string
          custom_image?: string | null
          id?: string
          limite?: number
          nome: string
          usado?: number
          user_id: string
          vencimento?: number
        }
        Update: {
          bandeira?: string
          cor?: string
          created_at?: string
          custom_image?: string | null
          id?: string
          limite?: number
          nome?: string
          usado?: number
          user_id?: string
          vencimento?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          nome: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          categoria: string
          cor: string
          created_at: string
          data: string
          id: string
          investido: number
          nome: string
          retorno: number
          user_id: string
        }
        Insert: {
          categoria?: string
          cor?: string
          created_at?: string
          data?: string
          id?: string
          investido?: number
          nome: string
          retorno?: number
          user_id: string
        }
        Update: {
          categoria?: string
          cor?: string
          created_at?: string
          data?: string
          id?: string
          investido?: number
          nome?: string
          retorno?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nome: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id: string
          nome?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          categoria: string
          conta: string
          created_at: string
          data: string
          descricao: string
          id: string
          mes_ano: string
          pago: boolean
          parcela_atual: number | null
          parcelas: number | null
          tipo: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria?: string
          conta?: string
          created_at?: string
          data: string
          descricao: string
          id?: string
          mes_ano: string
          pago?: boolean
          parcela_atual?: number | null
          parcelas?: number | null
          tipo: string
          user_id: string
          valor?: number
        }
        Update: {
          categoria?: string
          conta?: string
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          mes_ano?: string
          pago?: boolean
          parcela_atual?: number | null
          parcelas?: number | null
          tipo?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
