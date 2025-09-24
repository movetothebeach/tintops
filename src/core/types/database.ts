export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          subdomain: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          subscription_plan: string
          trial_ends_at: string | null
          current_period_end: string | null
          settings: Json
          is_active: boolean
          onboarding_completed: boolean
          twilio_subaccount_sid: string | null
          twilio_phone_number: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subdomain: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_plan?: string
          trial_ends_at?: string | null
          current_period_end?: string | null
          settings?: Json
          is_active?: boolean
          onboarding_completed?: boolean
          twilio_subaccount_sid?: string | null
          twilio_phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subdomain?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_plan?: string
          trial_ends_at?: string | null
          current_period_end?: string | null
          settings?: Json
          is_active?: boolean
          onboarding_completed?: boolean
          twilio_subaccount_sid?: string | null
          twilio_phone_number?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          organization_id: string
          email: string
          full_name: string | null
          role: 'owner' | 'admin' | 'member'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          full_name?: string | null
          role?: 'owner' | 'admin' | 'member'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          full_name?: string | null
          role?: 'owner' | 'admin' | 'member'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          organization_id: string
          phone: string
          name: string
          email: string | null
          source: 'website' | 'call' | 'walkin' | 'referral' | null
          status: 'new' | 'contacted' | 'quoted' | 'won' | 'lost' | 'ghost'
          automation_enabled: boolean
          tags: string[]
          sms_consent: boolean
          consent_date: string | null
          consent_method: string | null
          metadata: Json
          last_contact_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          phone: string
          name: string
          email?: string | null
          source?: 'website' | 'call' | 'walkin' | 'referral' | null
          status?: 'new' | 'contacted' | 'quoted' | 'won' | 'lost' | 'ghost'
          automation_enabled?: boolean
          tags?: string[]
          sms_consent?: boolean
          consent_date?: string | null
          consent_method?: string | null
          metadata?: Json
          last_contact_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          phone?: string
          name?: string
          email?: string | null
          source?: 'website' | 'call' | 'walkin' | 'referral' | null
          status?: 'new' | 'contacted' | 'quoted' | 'won' | 'lost' | 'ghost'
          automation_enabled?: boolean
          tags?: string[]
          sms_consent?: boolean
          consent_date?: string | null
          consent_method?: string | null
          metadata?: Json
          last_contact_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      communications: {
        Row: {
          id: string
          organization_id: string
          customer_id: string
          type: 'sms' | 'call' | 'email' | null
          direction: 'inbound' | 'outbound' | null
          content: string | null
          status: string | null
          automation_rule_id: string | null
          cost: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          customer_id: string
          type?: 'sms' | 'call' | 'email' | null
          direction?: 'inbound' | 'outbound' | null
          content?: string | null
          status?: string | null
          automation_rule_id?: string | null
          cost?: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          customer_id?: string
          type?: 'sms' | 'call' | 'email' | null
          direction?: 'inbound' | 'outbound' | null
          content?: string | null
          status?: string | null
          automation_rule_id?: string | null
          cost?: number
          metadata?: Json
          created_at?: string
        }
      }
      automation_rules: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          type: string
          enabled: boolean
          triggers: Json
          actions: Json
          max_sends_per_day: number
          max_sends_per_customer: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          type: string
          enabled?: boolean
          triggers: Json
          actions: Json
          max_sends_per_day?: number
          max_sends_per_customer?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          type?: string
          enabled?: boolean
          triggers?: Json
          actions?: Json
          max_sends_per_day?: number
          max_sends_per_customer?: number
          created_at?: string
          updated_at?: string
        }
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
  }
}