export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      flashcards: {
        Row: {
          back: string
          created_at: string
          deleted_at: string | null
          front: string
          generation_id: string | null
          id: string
          is_deleted: boolean
          source: Database["public"]["Enums"]["flashcard_source"]
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          deleted_at?: string | null
          front: string
          generation_id?: string | null
          id?: string
          is_deleted?: boolean
          source?: Database["public"]["Enums"]["flashcard_source"]
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          deleted_at?: string | null
          front?: string
          generation_id?: string | null
          id?: string
          is_deleted?: boolean
          source?: Database["public"]["Enums"]["flashcard_source"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_flashcards_generation_id"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "generations"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_error_logs: {
        Row: {
          created_at: string
          error_code: string
          error_message: string
          id: string
          model: string
          source_text_hash: string
          source_text_length: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_code: string
          error_message: string
          id?: string
          model: string
          source_text_hash: string
          source_text_length: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_code?: string
          error_message?: string
          id?: string
          model?: string
          source_text_hash?: string
          source_text_length?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          accepted_edited_count: number
          accepted_unedited_count: number
          created_at: string
          generated_count: number
          id: string
          model: string
          source_text_hash: string
          source_text_length: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_edited_count?: number
          accepted_unedited_count?: number
          created_at?: string
          generated_count: number
          id?: string
          model: string
          source_text_hash: string
          source_text_length: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_edited_count?: number
          accepted_unedited_count?: number
          created_at?: string
          generated_count?: number
          id?: string
          model?: string
          source_text_hash?: string
          source_text_length?: number
          updated_at?: string
          user_id?: string
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
      flashcard_source: "ai-full" | "ai-edited" | "manual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      flashcard_source: ["ai-full", "ai-edited", "manual"],
    },
  },
} as const

