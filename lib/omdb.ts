// OMDB API configuration and functions
const OMDB_BASE_URL = 'https://www.omdbapi.com';

// Get this from http://www.omdbapi.com/apikey.aspx (free tier: 1000 requests/day)
const OMDB_API_KEY = process.env.EXPO_PUBLIC_OMDB_API_KEY;

export interface OMDBMovie {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
  Plot?: string;
  Director?: string;
  Actors?: string;
  imdbRating?: string;
  Runtime?: string;
  Genre?: string;
}

export interface OMDBSearchResponse {
  Search: OMDBMovie[];
  totalResults: string;
  Response: string;
  Error?: string;
}

// Search movies
export const searchMovies = async (query: string, page: number = 1): Promise<OMDBSearchResponse> => {
  if (!OMDB_API_KEY) {
    throw new Error('OMDB API key not configured');
  }

  const response = await fetch(
    `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&page=${page}&type=movie`
  );

  if (!response.ok) {
    throw new Error(`OMDB API error: ${response.status}`);
  }

  return response.json();
};

// Get movie details by IMDB ID
export const getMovieDetails = async (imdbId: string): Promise<OMDBMovie> => {
  if (!OMDB_API_KEY) {
    throw new Error('OMDB API key not configured');
  }

  const response = await fetch(
    `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&i=${imdbId}&plot=full`
  );

  if (!response.ok) {
    throw new Error(`OMDB API error: ${response.status}`);
  }

  return response.json();
};