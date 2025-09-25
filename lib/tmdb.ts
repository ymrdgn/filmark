// TMDB API configuration and functions
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// You need to get this from https://www.themoviedb.org/settings/api
const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
  popularity: number;
  video: boolean;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
  original_name: string;
  popularity: number;
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBTVSearchResponse {
  page: number;
  results: TMDBTVShow[];
  total_pages: number;
  total_results: number;
}

// Helper function to get full image URL
export const getImageUrl = (path: string | null, size: 'w200' | 'w300' | 'w500' | 'original' = 'w500'): string | null => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// Search movies
export const searchMovies = async (query: string, page: number = 1): Promise<TMDBSearchResponse> => {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not configured. Please add EXPO_PUBLIC_TMDB_API_KEY to your .env file');
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error(`TMDB API key is invalid. Please check your EXPO_PUBLIC_TMDB_API_KEY in .env file. Status: ${response.status}`);
    }
    throw new Error(`TMDB API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// Search TV shows
export const searchTVShows = async (query: string, page: number = 1): Promise<TMDBTVSearchResponse> => {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not configured. Please add EXPO_PUBLIC_TMDB_API_KEY to your .env file');
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error(`TMDB API key is invalid. Please check your EXPO_PUBLIC_TMDB_API_KEY in .env file. Status: ${response.status}`);
    }
    throw new Error(`TMDB API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// Get popular movies
export const getPopularMovies = async (page: number = 1): Promise<TMDBSearchResponse> => {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not configured. Please add EXPO_PUBLIC_TMDB_API_KEY to your .env file');
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error(`TMDB API key is invalid. Please check your EXPO_PUBLIC_TMDB_API_KEY in .env file. Status: ${response.status}`);
    }
    throw new Error(`TMDB API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// Get popular TV shows
export const getPopularTVShows = async (page: number = 1): Promise<TMDBTVSearchResponse> => {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not configured. Please add EXPO_PUBLIC_TMDB_API_KEY to your .env file');
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&page=${page}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error(`TMDB API key is invalid. Please check your EXPO_PUBLIC_TMDB_API_KEY in .env file. Status: ${response.status}`);
    }
    throw new Error(`TMDB API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// Get movie details
export const getMovieDetails = async (movieId: number) => {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not configured. Please add EXPO_PUBLIC_TMDB_API_KEY to your .env file');
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error(`TMDB API key is invalid. Please check your EXPO_PUBLIC_TMDB_API_KEY in .env file. Status: ${response.status}`);
    }
    throw new Error(`TMDB API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};

// Get TV show details
export const getTVShowDetails = async (tvId: number) => {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB API key not configured. Please add EXPO_PUBLIC_TMDB_API_KEY to your .env file');
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}`
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error(`TMDB API key is invalid. Please check your EXPO_PUBLIC_TMDB_API_KEY in .env file. Status: ${response.status}`);
    }
    throw new Error(`TMDB API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};