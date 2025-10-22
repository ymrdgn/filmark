import { supabase } from './supabase';
import { Database } from './database.types';

type Movie = Database['public']['Tables']['movies']['Row'];
type TVShow = Database['public']['Tables']['tv_shows']['Row'];
type CustomList = Database['public']['Tables']['custom_lists']['Row'];
type ListItem = Database['public']['Tables']['list_items']['Row'];

// Movies API
export const moviesApi = {
  // Get all movies for current user
  getAll: async () => {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Add a new movie
  add: async (movie: Omit<Movie, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('movies')
      .insert({ ...movie, user_id: user.id })
      .select()
      .single();
    
    return { data, error };
  },

  // Update a movie
  update: async (id: string, updates: Partial<Movie>) => {
    const { data, error } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  // Delete a movie
  delete: async (id: string) => {
    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', id);
    
    return { error };
  },

  // Get watched movies
  getWatched: async () => {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_watched', true)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Get favorite movies
  getFavorites: async () => {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_favorite', true)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Get watchlist movies
  getWatchlist: async () => {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('is_watchlist', true)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },
};

// TV Shows API
export const tvShowsApi = {
  // Get all TV shows for current user
  getAll: async () => {
    const { data, error } = await supabase
      .from('tv_shows')
      .select('*')
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Add a new TV show
  add: async (tvShow: Omit<TVShow, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('tv_shows')
      .insert({ ...tvShow, user_id: user.id })
      .select()
      .single();
    
    return { data, error };
  },

  // Update a TV show
  update: async (id: string, updates: Partial<TVShow>) => {
    const { data, error } = await supabase
      .from('tv_shows')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  // Delete a TV show
  delete: async (id: string) => {
    const { error } = await supabase
      .from('tv_shows')
      .delete()
      .eq('id', id);
    
    return { error };
  },

  // Get watched TV shows
  getWatched: async () => {
    const { data, error } = await supabase
      .from('tv_shows')
      .select('*')
      .eq('is_watched', true)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Get favorite TV shows
  getFavorites: async () => {
    const { data, error } = await supabase
      .from('tv_shows')
      .select('*')
      .eq('is_favorite', true)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Get watchlist TV shows
  getWatchlist: async () => {
    const { data, error } = await supabase
      .from('tv_shows')
      .select('*')
      .eq('is_watchlist', true)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },
};

// Custom Lists API
export const listsApi = {
  // Get all custom lists for current user
  getAll: async () => {
    const { data, error } = await supabase
      .from('custom_lists')
      .select(`
        *,
        list_items (
          id,
          movie_id,
          tv_show_id,
          movies (title, poster_url),
          tv_shows (title, poster_url)
        )
      `)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  // Create a new custom list
  create: async (name: string, description?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('custom_lists')
      .insert({ name, description, user_id: user.id })
      .select()
      .single();
    
    return { data, error };
  },

  // Update a custom list
  update: async (id: string, updates: { name?: string; description?: string }) => {
    const { data, error } = await supabase
      .from('custom_lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  // Delete a custom list
  delete: async (id: string) => {
    const { error } = await supabase
      .from('custom_lists')
      .delete()
      .eq('id', id);
    
    return { error };
  },

  // Add item to list
  addItem: async (listId: string, movieId?: string, tvShowId?: string) => {
    const { data, error } = await supabase
      .from('list_items')
      .insert({ 
        list_id: listId, 
        movie_id: movieId || null, 
        tv_show_id: tvShowId || null 
      })
      .select()
      .single();
    
    return { data, error };
  },

  // Remove item from list
  removeItem: async (listId: string, movieId?: string, tvShowId?: string) => {
    let query = supabase
      .from('list_items')
      .delete()
      .eq('list_id', listId);

    if (movieId) {
      query = query.eq('movie_id', movieId);
    } else if (tvShowId) {
      query = query.eq('tv_show_id', tvShowId);
    }

    const { error } = await query;
    return { error };
  },
};

// Achievements API
export const achievementsApi = {
  // Get all achievements with user progress
  getAchievementsWithProgress: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .order('requirement_value', { ascending: true });
    
    if (achievementsError) return { data: null, error: achievementsError };

    const { data: userAchievements, error: userAchievementsError } = await supabase
      .from('user_achievements')
      .select('achievement_id, earned_at')
      .eq('user_id', user.id);
    
    if (userAchievementsError) return { data: null, error: userAchievementsError };

    // Combine achievements with user progress
    const achievementsWithProgress = achievements?.map(achievement => ({
      ...achievement,
      earned: userAchievements?.some(ua => ua.achievement_id === achievement.id) || false,
      earned_at: userAchievements?.find(ua => ua.achievement_id === achievement.id)?.earned_at || null
    }));

    return { data: achievementsWithProgress, error: null };
  },

  // Manually check and award achievements for current user
  checkAchievements: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.rpc('check_and_award_achievements', {
      user_uuid: user.id
    });

    return { error };
  }
};

// Stats API
export const statsApi = {
  // Get user statistics
  getStats: async () => {
    const [moviesResult, tvShowsResult, allMoviesResult, allTVShowsResult] = await Promise.all([
      supabase.from('movies').select('is_watched, is_favorite, rating').eq('is_watched', true),
      supabase.from('tv_shows').select('is_watched, is_favorite, rating, episodes').eq('is_watched', true),
      supabase.from('movies').select('is_favorite'),
      supabase.from('tv_shows').select('is_favorite')
    ]);

    const watchedMovies = moviesResult.data || [];
    const tvShows = tvShowsResult.data || [];
    const allMovies = allMoviesResult.data || [];
    const allTVShows = allTVShowsResult.data || [];

    const totalMovies = watchedMovies.length;
    const totalTVShows = tvShows.length;
    const totalEpisodes = tvShows.reduce((sum, show) => sum + (show.episodes || 0), 0);

    // Calculate favorites
    const favoriteMovies = allMovies.filter(m => m.is_favorite).length;
    const favoriteTVShows = allTVShows.filter(s => s.is_favorite).length;

    // Calculate average rating
    const allRatings = [
      ...watchedMovies.filter(m => m.rating).map(m => m.rating!),
      ...tvShows.filter(s => s.rating).map(s => s.rating!)
    ];
    const averageRating = allRatings.length > 0
      ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
      : 0;

    // Estimate hours watched (assuming 2h per movie, 45min per episode)
    const movieHours = totalMovies * 2;
    const episodeHours = totalEpisodes * 0.75;
    const totalHours = Math.round(movieHours + episodeHours);

    return {
      data: {
        moviesWatched: totalMovies,
        tvShows: totalTVShows,
        episodes: totalEpisodes,
        hoursWatched: totalHours,
        averageRating: Math.round(averageRating * 10) / 10,
        favoriteMovies,
        favoriteTVShows
      },
      error: null
    };
  }
};

// Privacy Settings API
export const privacyApi = {
  // Get privacy settings
  get: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { data: null, error: new Error('Not authenticated') };
    }

    try {
      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/privacy-settings`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: new Error(error.error || 'Failed to load settings') };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  // Update privacy settings
  update: async (settings: {
    profile_visibility: 'public' | 'friends' | 'private';
    show_activity: boolean;
    allow_friend_requests: boolean;
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { data: null, error: new Error('Not authenticated') };
    }

    try {
      const apiUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/privacy-settings`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        return { data: null, error: new Error(error.error || 'Failed to update settings') };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }
};