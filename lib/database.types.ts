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
      movies: {
        Row: {
          id: string
          user_id: string
          title: string
          year: number | null
          duration: number | null
          poster_url: string | null
          status: 'watched' | 'watchlist'
          rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          year?: number | null
          duration?: number | null
          poster_url?: string | null
          status?: 'watched' | 'watchlist'
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          year?: number | null
          duration?: number | null
          poster_url?: string | null
          status?: 'watched' | 'watchlist'
          rating?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      tv_shows: {
        Row: {
          id: string
          user_id: string
          title: string
          year: number | null
          seasons: number
          episodes: number
          poster_url: string | null
          status: 'watched' | 'watching' | 'watchlist'
          rating: number | null
          current_season: number | null
          current_episode: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          year?: number | null
          seasons?: number
          episodes?: number
          poster_url?: string | null
          status?: 'watched' | 'watching' | 'watchlist'
          rating?: number | null
          current_season?: number | null
          current_episode?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          year?: number | null
          seasons?: number
          episodes?: number
          poster_url?: string | null
          status?: 'watched' | 'watching' | 'watchlist'
          rating?: number | null
          current_season?: number | null
          current_episode?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      custom_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      list_items: {
        Row: {
          id: string
          list_id: string
          movie_id: string | null
          tv_show_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          movie_id?: string | null
          tv_show_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          movie_id?: string | null
          tv_show_id?: string | null
          created_at?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}