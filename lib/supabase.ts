import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          category: 'mallet' | 'awl' | 'coin' | 'square'
          image_url: string
          created_at: string
          updated_at: string
          stock_status: 'in_stock' | 'made_to_order' | 'out_of_stock'
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      commissions: {
        Row: {
          id: string
          name: string
          email: string
          project_description: string
          budget: string
          timeline: string
          preferred_custom_build: string
          status: 'pending' | 'contacted' | 'in_progress' | 'completed'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['commissions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['commissions']['Insert']>
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          customer_email: string
          total_amount: number
          paypal_order_id: string
          status: 'pending' | 'paid' | 'shipped' | 'completed'
          order_details: any
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
    }
  }
}

