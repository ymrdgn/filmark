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

  // Get movies by status
  getByStatus: async (status: 'watched' | 'watchlist') => {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('status', status)
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

  // Get TV shows by status
  getByStatus: async (status: 'watched' | 'watching' | 'watchlist') => {
    const { data, error } = await supabase
      .from('tv_shows')
      .select('*')
      .eq('status', status)
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

// Stats API
export const statsApi = {
  // Get user statistics
  getStats: async () => {
    const [moviesResult, tvShowsResult] = await Promise.all([
      supabase.from('movies').select('status, rating').eq('status', 'watched'),
      supabase.from('tv_shows').select('status, rating, episodes').in('status', ['watched', 'watching'])
    ]);

    const watchedMovies = moviesResult.data || [];
    const tvShows = tvShowsResult.data || [];
    
    const totalMovies = watchedMovies.length;
    const totalTVShows = tvShows.length;
    const totalEpisodes = tvShows.reduce((sum, show) => sum + (show.episodes || 0), 0);
    
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
        averageRating: Math.round(averageRating * 10) / 10
      },
      error: null
    };
  }
};