export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      adaptation_rules: {
        Row: {
          action: string
          created_at: string
          id: string
          is_seed: boolean
          match_term: string
          priority: number
          reason: string
          replacement_ingredient_id: string | null
          suggested_base_id: string | null
          suggested_role: string | null
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          is_seed?: boolean
          match_term: string
          priority?: number
          reason: string
          replacement_ingredient_id?: string | null
          suggested_base_id?: string | null
          suggested_role?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          is_seed?: boolean
          match_term?: string
          priority?: number
          reason?: string
          replacement_ingredient_id?: string | null
          suggested_base_id?: string | null
          suggested_role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'adaptation_rules_replacement_ingredient_id_fkey'
            columns: ['replacement_ingredient_id']
            isOneToOne: false
            referencedRelation: 'ingredients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'adaptation_rules_suggested_base_id_fkey'
            columns: ['suggested_base_id']
            isOneToOne: false
            referencedRelation: 'bases'
            referencedColumns: ['id']
          },
        ]
      }
      app_settings: {
        Row: {
          default_milk_ingredient_id: string | null
          freeze_hours: number
          id: number
          max_fill_ml: number
          servings_per_tub: number
          standard_method: string
          updated_at: string
        }
        Insert: {
          default_milk_ingredient_id?: string | null
          freeze_hours?: number
          id?: number
          max_fill_ml?: number
          servings_per_tub?: number
          standard_method?: string
          updated_at?: string
        }
        Update: {
          default_milk_ingredient_id?: string | null
          freeze_hours?: number
          id?: number
          max_fill_ml?: number
          servings_per_tub?: number
          standard_method?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'app_settings_default_milk_ingredient_id_fkey'
            columns: ['default_milk_ingredient_id']
            isOneToOne: false
            referencedRelation: 'ingredients'
            referencedColumns: ['id']
          },
        ]
      }
      base_ingredients: {
        Row: {
          base_id: string
          id: string
          ingredient_id: string
          note: string | null
          quantity: number
          sort_order: number
          unit: string
        }
        Insert: {
          base_id: string
          id?: string
          ingredient_id: string
          note?: string | null
          quantity: number
          sort_order?: number
          unit: string
        }
        Update: {
          base_id?: string
          id?: string
          ingredient_id?: string
          note?: string | null
          quantity?: number
          sort_order?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: 'base_ingredients_base_id_fkey'
            columns: ['base_id']
            isOneToOne: false
            referencedRelation: 'bases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'base_ingredients_ingredient_id_fkey'
            columns: ['ingredient_id']
            isOneToOne: false
            referencedRelation: 'ingredients'
            referencedColumns: ['id']
          },
        ]
      }
      bases: {
        Row: {
          created_at: string
          fill_ingredient_id: string
          guidance: string | null
          id: string
          is_variation_of: string | null
          key: string
          name: string
          sort_order: number
          summary: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          fill_ingredient_id: string
          guidance?: string | null
          id?: string
          is_variation_of?: string | null
          key: string
          name: string
          sort_order?: number
          summary?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          fill_ingredient_id?: string
          guidance?: string | null
          id?: string
          is_variation_of?: string | null
          key?: string
          name?: string
          sort_order?: number
          summary?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bases_fill_ingredient_id_fkey'
            columns: ['fill_ingredient_id']
            isOneToOne: false
            referencedRelation: 'ingredients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'bases_is_variation_of_fkey'
            columns: ['is_variation_of']
            isOneToOne: false
            referencedRelation: 'bases'
            referencedColumns: ['id']
          },
        ]
      }
      batches: {
        Row: {
          added_milk_ml: number | null
          created_at: string
          finished_at: string | null
          frozen_at: string
          id: string
          notes: string | null
          ready_at: string
          recipe_id: string
          respin_count: number
          spun_at: string | null
          status: string
        }
        Insert: {
          added_milk_ml?: number | null
          created_at?: string
          finished_at?: string | null
          frozen_at?: string
          id?: string
          notes?: string | null
          ready_at: string
          recipe_id: string
          respin_count?: number
          spun_at?: string | null
          status?: string
        }
        Update: {
          added_milk_ml?: number | null
          created_at?: string
          finished_at?: string | null
          frozen_at?: string
          id?: string
          notes?: string | null
          ready_at?: string
          recipe_id?: string
          respin_count?: number
          spun_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'batches_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipe_list_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'batches_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          accent: string
          emoji: string | null
          id: string
          key: string
          label: string
          sort_order: number
          tint: string
        }
        Insert: {
          accent?: string
          emoji?: string | null
          id?: string
          key: string
          label: string
          sort_order?: number
          tint?: string
        }
        Update: {
          accent?: string
          emoji?: string | null
          id?: string
          key?: string
          label?: string
          sort_order?: number
          tint?: string
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          basis: string
          carbs_g: number
          category: string
          counts_toward_volume: boolean
          created_at: string
          density_g_per_ml: number
          fat_g: number
          grams_per_item: number | null
          grams_per_tsp: number | null
          id: string
          is_seed: boolean
          kcal: number
          name: string
          negligible: boolean
          notes: string | null
          protein_g: number
          slug: string
          updated_at: string
        }
        Insert: {
          basis: string
          carbs_g?: number
          category: string
          counts_toward_volume?: boolean
          created_at?: string
          density_g_per_ml?: number
          fat_g?: number
          grams_per_item?: number | null
          grams_per_tsp?: number | null
          id?: string
          is_seed?: boolean
          kcal?: number
          name: string
          negligible?: boolean
          notes?: string | null
          protein_g?: number
          slug: string
          updated_at?: string
        }
        Update: {
          basis?: string
          carbs_g?: number
          category?: string
          counts_toward_volume?: boolean
          created_at?: string
          density_g_per_ml?: number
          fat_g?: number
          grams_per_item?: number | null
          grams_per_tsp?: number | null
          id?: string
          is_seed?: boolean
          kcal?: number
          name?: string
          negligible?: boolean
          notes?: string | null
          protein_g?: number
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_items: {
        Row: {
          created_at: string
          id: string
          multiplier: number
          recipe_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          multiplier?: number
          recipe_id: string
        }
        Update: {
          created_at?: string
          id?: string
          multiplier?: number
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'plan_items_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: true
            referencedRelation: 'recipe_list_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'plan_items_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: true
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          display: string
          free_text: string | null
          id: string
          ingredient_id: string | null
          optional: boolean
          quantity: number | null
          recipe_id: string
          role: string
          sort_order: number
          unit: string | null
        }
        Insert: {
          display: string
          free_text?: string | null
          id?: string
          ingredient_id?: string | null
          optional?: boolean
          quantity?: number | null
          recipe_id: string
          role: string
          sort_order?: number
          unit?: string | null
        }
        Update: {
          display?: string
          free_text?: string | null
          id?: string
          ingredient_id?: string | null
          optional?: boolean
          quantity?: number | null
          recipe_id?: string
          role?: string
          sort_order?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'recipe_ingredients_ingredient_id_fkey'
            columns: ['ingredient_id']
            isOneToOne: false
            referencedRelation: 'ingredients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipe_ingredients_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipe_list_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipe_ingredients_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
      recipe_sources: {
        Row: {
          adaptation_summary: string | null
          created_at: string
          id: string
          recipe_id: string
          retrieved_at: string | null
          source_site: string | null
          source_title: string | null
          source_url: string | null
        }
        Insert: {
          adaptation_summary?: string | null
          created_at?: string
          id?: string
          recipe_id: string
          retrieved_at?: string | null
          source_site?: string | null
          source_title?: string | null
          source_url?: string | null
        }
        Update: {
          adaptation_summary?: string | null
          created_at?: string
          id?: string
          recipe_id?: string
          retrieved_at?: string | null
          source_site?: string | null
          source_title?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'recipe_sources_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipe_list_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipe_sources_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
      recipes: {
        Row: {
          archived_at: string | null
          base_id: string
          category_id: string
          created_at: string
          id: string
          image_path: string | null
          is_favourite: boolean
          is_seed: boolean
          macro_override_kcal: number | null
          macro_override_protein_g: number | null
          method_override: string | null
          mixin_note: string | null
          name: string
          profile: string | null
          reference_kcal: number | null
          reference_protein_g: number | null
          slug: string
          tip: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          base_id: string
          category_id: string
          created_at?: string
          id?: string
          image_path?: string | null
          is_favourite?: boolean
          is_seed?: boolean
          macro_override_kcal?: number | null
          macro_override_protein_g?: number | null
          method_override?: string | null
          mixin_note?: string | null
          name: string
          profile?: string | null
          reference_kcal?: number | null
          reference_protein_g?: number | null
          slug: string
          tip?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          base_id?: string
          category_id?: string
          created_at?: string
          id?: string
          image_path?: string | null
          is_favourite?: boolean
          is_seed?: boolean
          macro_override_kcal?: number | null
          macro_override_protein_g?: number | null
          method_override?: string | null
          mixin_note?: string | null
          name?: string
          profile?: string | null
          reference_kcal?: number | null
          reference_protein_g?: number | null
          slug?: string
          tip?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipes_base_id_fkey'
            columns: ['base_id']
            isOneToOne: false
            referencedRelation: 'bases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipes_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      shopping_checks: {
        Row: {
          ingredient_id: string
          is_checked: boolean
          updated_at: string
        }
        Insert: {
          ingredient_id: string
          is_checked?: boolean
          updated_at?: string
        }
        Update: {
          ingredient_id?: string
          is_checked?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'shopping_checks_ingredient_id_fkey'
            columns: ['ingredient_id']
            isOneToOne: true
            referencedRelation: 'ingredients'
            referencedColumns: ['id']
          },
        ]
      }
      shopping_extras: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_checked: boolean
          label: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_checked?: boolean
          label: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_checked?: boolean
          label?: string
        }
        Relationships: []
      }
      tasting_notes: {
        Row: {
          batch_id: string | null
          created_at: string
          id: string
          notes: string | null
          rating: number | null
          recipe_id: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          recipe_id: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tasting_notes_batch_id_fkey'
            columns: ['batch_id']
            isOneToOne: false
            referencedRelation: 'batches'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasting_notes_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipe_list_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasting_notes_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      recipe_list_view: {
        Row: {
          accent: string | null
          active_batches: number | null
          archived_at: string | null
          average_rating: number | null
          base_key: string | null
          base_name: string | null
          category_key: string | null
          category_label: string | null
          created_at: string | null
          emoji: string | null
          id: string | null
          image_path: string | null
          is_favourite: boolean | null
          name: string | null
          profile: string | null
          rating_count: number | null
          slug: string | null
          tint: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      recipe_ratings: {
        Row: {
          average_rating: number | null
          last_rated_at: string | null
          rating_count: number | null
          recipe_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tasting_notes_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipe_list_view'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tasting_notes_recipe_id_fkey'
            columns: ['recipe_id']
            isOneToOne: false
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          },
        ]
      }
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
