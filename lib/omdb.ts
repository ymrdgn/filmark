// OMDB API configuration and functions
const OMDB_BASE_URL = 'https://www.omdbapi.com';

// Get this from http://www.omdbapi.com/apikey.aspx (free tier: 1000 requests/day)
const OMDB_API_KEY = process.env.EXPO_PUBLIC_OMDB_API_KEY;

// Debug: Log API key status
console.log('OMDB API Key Debug:');
console.log('API Key exists:', !!OMDB_API_KEY);
console.log('API Key value:', OMDB_API_KEY);
console.log('All EXPO_PUBLIC env vars:', Object.keys(process.env).filter(key => key.startsWith('EXPO_PUBLIC')));

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
    throw new Error('OMDB API key not configured. Please add EXPO_PUBLIC_OMDB_API_KEY to your .env file');
  }

  console.log('Making OMDB request with key:', OMDB_API_KEY);
  const url = `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&page=${page}&type=movie`;
  console.log('OMDB URL:', url);

  const response = await fetch(
    url
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OMDB API error response:', errorText);
    if (response.status === 401) {
      throw new Error(`OMDB API key is invalid. Please check your EXPO_PUBLIC_OMDB_API_KEY in .env file. Status: ${response.status}`);
    }
    throw new Error(`OMDB API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('OMDB API response:', result);
  return result;
};

// Get movie details by IMDB ID
export const getMovieDetails = async (imdbId: string): Promise<OMDBMovie> => {
  if (!OMDB_API_KEY) {
    throw new Error('OMDB API key not configured. Please add EXPO_PUBLIC_OMDB_API_KEY to your .env file');
  }

  console.log('Getting movie details for:', imdbId);
  const response = await fetch(
    `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&i=${imdbId}&plot=full`
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error(`OMDB API key is invalid. Please check your EXPO_PUBLIC_OMDB_API_KEY in .env file. Status: ${response.status}`);
    }
    throw new Error(`OMDB API error: ${response.status} - ${errorText}`);
  }

  return response.json();
};