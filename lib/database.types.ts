export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          category: string;
          requirement_type: string;
          requirement_value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon: string;
          category: string;
          requirement_type: string;
          requirement_value: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          category?: string;
          requirement_type?: string;
          requirement_value?: number;
          created_at?: string;
        };
      };
      custom_lists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
          updated_at?: string;
        };
      };
      list_items: {
        Row: {
          id: string;
          list_id: string;
          content_type: 'movie' | 'tv_show';
          content_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          content_type: 'movie' | 'tv_show';
          content_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          content_type?: 'movie' | 'tv_show';
          content_id?: string;
          created_at?: string;
        };
      };
      movies: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          year: string | null;
          poster_url: string | null;
          is_watched: boolean;
          is_favorite: boolean;
          is_watchlist: boolean;
          rating: number | null;
          watched_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          year?: string | null;
          poster_url?: string | null;
          is_watched?: boolean;
          is_favorite?: boolean;
          is_watchlist?: boolean;
          rating?: number | null;
          watched_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          year?: string | null;
          poster_url?: string | null;
          is_watched?: boolean;
          is_favorite?: boolean;
          is_watchlist?: boolean;
          rating?: number | null;
          watched_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          related_user_id: string | null;
          related_id: string | null;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          related_user_id?: string | null;
          related_id?: string | null;
          title: string;
          message: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          related_user_id?: string | null;
          related_id?: string | null;
          title?: string;
          message?: string;
          is_read?: boolean;
          created_at?: string;
        };
      };
      tv_shows: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          year: string | null;
          poster_url: string | null;
          is_watched: boolean;
          is_favorite: boolean;
          is_watchlist: boolean;
          rating: number | null;
          watched_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          year?: string | null;
          poster_url?: string | null;
          is_watched?: boolean;
          is_favorite?: boolean;
          is_watchlist?: boolean;
          rating?: number | null;
          watched_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          year?: string | null;
          poster_url?: string | null;
          is_watched?: boolean;
          is_favorite?: boolean;
          is_watchlist?: boolean;
          rating?: number | null;
          watched_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          earned_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
