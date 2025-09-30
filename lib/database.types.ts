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
          is_watched: boolean
          is_favorite: boolean
          is_watchlist: boolean
          rating: number | null
          watched_date: string | null
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
          is_watched?: boolean
          is_favorite?: boolean
          is_watchlist?: boolean
          rating?: number | null
          watched_date?: string | null
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
          is_watched?: boolean
          is_favorite?: boolean
          is_watchlist?: boolean
          rating?: number | null
          watched_date?: string | null
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
          is_watched: boolean
          is_favorite: boolean
          is_watchlist: boolean
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
          is_watched?: boolean
          is_favorite?: boolean
          is_watchlist?: boolean
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
          is_watched?: boolean
          is_favorite?: boolean
          is_watchlist?: boolean
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
      friends: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'blocked'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'blocked'
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          requirement_type: string
          requirement_value: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          icon: string
          requirement_type: string
          requirement_value: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          requirement_type?: string
          requirement_value?: number
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          username?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_users_by_email: {
        Args: {
          search_email: string
        }
        Returns: {
          id: string
          email: string
        }[]
      }
      get_friend_movies: {
        Args: {
          friend_user_id: string
        }
        Returns: {
          id: string
          title: string
          year: number | null
          poster_url: string | null
          is_watched: boolean
          is_favorite: boolean
          rating: number | null
        }[]
      }
      get_friend_tv_shows: {
        Args: {
          friend_user_id: string
        }
        Returns: {
          id: string
          title: string
          year: number | null
          seasons: number
          episodes: number
          poster_url: string | null
          is_watched: boolean
          is_favorite: boolean
          rating: number | null
          current_season: number | null
          current_episode: number | null
        }[]
      }
      check_and_award_achievements: {
        Args: {
          user_uuid: string
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}