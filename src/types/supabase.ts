export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      events: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          encrypted: boolean | null
          encryption_iv: string | null
          encryption_salt: string | null
          end_time: string
          id: string
          link: string | null
          linked_goal_id: string | null
          linked_note: string | null
          linked_task: string | null
          location: string | null
          project_id: string | null
          start_time: string
          title: string
          title_encrypted: boolean | null
          title_encryption_iv: string | null
          title_encryption_salt: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          encrypted?: boolean | null
          encryption_iv?: string | null
          encryption_salt?: string | null
          end_time: string
          id?: string
          link?: string | null
          linked_goal_id?: string | null
          linked_note?: string | null
          linked_task?: string | null
          location?: string | null
          project_id?: string | null
          start_time: string
          title: string
          title_encrypted?: boolean | null
          title_encryption_iv?: string | null
          title_encryption_salt?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          encrypted?: boolean | null
          encryption_iv?: string | null
          encryption_salt?: string | null
          end_time?: string
          id?: string
          link?: string | null
          linked_goal_id?: string | null
          linked_note?: string | null
          linked_task?: string | null
          location?: string | null
          project_id?: string | null
          start_time?: string
          title?: string
          title_encrypted?: boolean | null
          title_encryption_iv?: string | null
          title_encryption_salt?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "project_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_linked_note_fkey"
            columns: ["linked_note"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_linked_task_fkey"
            columns: ["linked_task"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          encrypted: boolean | null
          encryption_iv: string | null
          encryption_salt: string | null
          id: string
          linked_goal_id: string | null
          project_id: string | null
          starred: boolean | null
          tags: string[] | null
          title: string
          title_encrypted: boolean | null
          title_encryption_iv: string | null
          title_encryption_salt: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          content?: string
          created_at?: string | null
          encrypted?: boolean | null
          encryption_iv?: string | null
          encryption_salt?: string | null
          id?: string
          linked_goal_id?: string | null
          project_id?: string | null
          starred?: boolean | null
          tags?: string[] | null
          title: string
          title_encrypted?: boolean | null
          title_encryption_iv?: string | null
          title_encryption_salt?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          encrypted?: boolean | null
          encryption_iv?: string | null
          encryption_salt?: string | null
          id?: string
          linked_goal_id?: string | null
          project_id?: string | null
          starred?: boolean | null
          tags?: string[] | null
          title?: string
          title_encrypted?: boolean | null
          title_encryption_iv?: string | null
          title_encryption_salt?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "project_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_goals: {
        Row: {
          completed: boolean | null
          created_at: string | null
          current_value: number | null
          description: string | null
          due_date: string | null
          encrypted: boolean | null
          encryption_iv: string | null
          encryption_salt: string | null
          id: string
          project_id: string | null
          target_value: number | null
          title: string
          title_encrypted: boolean | null
          title_encryption_iv: string | null
          title_encryption_salt: string | null
          unit: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          encrypted?: boolean | null
          encryption_iv?: string | null
          encryption_salt?: string | null
          id?: string
          project_id?: string | null
          target_value?: number | null
          title: string
          title_encrypted?: boolean | null
          title_encryption_iv?: string | null
          title_encryption_salt?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          due_date?: string | null
          encrypted?: boolean | null
          encryption_iv?: string | null
          encryption_salt?: string | null
          id?: string
          project_id?: string | null
          target_value?: number | null
          title?: string
          title_encrypted?: boolean | null
          title_encryption_iv?: string | null
          title_encryption_salt?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_goals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          encrypted: boolean | null
          encryption_iv: string | null
          encryption_salt: string | null
          end_date: string | null
          id: string
          start_date: string | null
          status: string | null
          title: string
          title_encrypted: boolean | null
          title_encryption_iv: string | null
          title_encryption_salt: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          encrypted?: boolean | null
          encryption_iv?: string | null
          encryption_salt?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string | null
          title: string
          title_encrypted?: boolean | null
          title_encryption_iv?: string | null
          title_encryption_salt?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          encrypted?: boolean | null
          encryption_iv?: string | null
          encryption_salt?: string | null
          end_date?: string | null
          id?: string
          start_date?: string | null
          status?: string | null
          title?: string
          title_encrypted?: boolean | null
          title_encryption_iv?: string | null
          title_encryption_salt?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean | null
          created_at: string | null
          description: string | null
          encrypted: boolean | null
          encryption_iv: string | null
          encryption_salt: string | null
          end_date: string | null
          end_time: string | null
          id: string
          linked_event: string | null
          linked_goal_id: string | null
          linked_note: string | null
          priority: string | null
          project_id: string | null
          start_date: string | null
          start_time: string | null
          title: string
          title_encrypted: boolean | null
          title_encryption_iv: string | null
          title_encryption_salt: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          encrypted?: boolean | null
          encryption_iv?: string | null
          encryption_salt?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          linked_event?: string | null
          linked_goal_id?: string | null
          linked_note?: string | null
          priority?: string | null
          project_id?: string | null
          start_date?: string | null
          start_time?: string | null
          title: string
          title_encrypted?: boolean | null
          title_encryption_iv?: string | null
          title_encryption_salt?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          description?: string | null
          encrypted?: boolean | null
          encryption_iv?: string | null
          encryption_salt?: string | null
          end_date?: string | null
          end_time?: string | null
          id?: string
          linked_event?: string | null
          linked_goal_id?: string | null
          linked_note?: string | null
          priority?: string | null
          project_id?: string | null
          start_date?: string | null
          start_time?: string | null
          title?: string
          title_encrypted?: boolean | null
          title_encryption_iv?: string | null
          title_encryption_salt?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "project_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
