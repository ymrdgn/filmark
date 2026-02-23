import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Star,
  Calendar,
  Plus,
  Check,
  Heart,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { moviesApi } from '@/lib/api';
import {
  searchMovies,
  TMDBMovie,
  getImageUrl,
  getPopularMovies,
} from '@/lib/tmdb';
import { useFocusEffect } from '@react-navigation/native';
import Toast from '@/components/Toast';
import { Database } from '@/lib/database.types';
import { DEMO_MODE, demoMovies, demoTMDBMovies } from '@/lib/demo-data';

type Movie = Database['public']['Tables']['movies']['Row'];

const { width } = Dimensions.get('window');
const cardWidth = (width - 72) / 2;

export default function MoviesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [myMovies, setMyMovies] = useState<Movie[]>([]);
  const [tmdbMovies, setTMDBMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [tmdbLoading, setTMDBLoading] = useState(false);
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null);
  const [updatingMovieId, setUpdatingMovieId] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'success',
  );
  const scrollViewRef = React.useRef<ScrollView>(null);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    loadMyMovies();
    loadPopularMovies();

    // Set up global refresh function
    global.refreshMovies = () => {
      loadMyMovies();
    };

    return () => {
      global.refreshMovies = undefined;
    };
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadMyMovies();
      setSearchQuery(''); // Tab değişiminde search'ü temizle
      loadPopularMovies(); // All tab'a dönünce popüler filmleri yükle
      scrollViewRef.current?.scrollTo({ y: 0, animated: true }); // En üste kaydır
    }, []),
  );

  // Filter tab'ı değişince search'ü temizle ve scroll'u sıfırla
  useEffect(() => {
    setSearchQuery('');
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    // All tab'ına dönünce popüler filmleri yükle
    if (filter === 'all') {
      loadPopularMovies();
    }
  }, [filter]);

  const loadMyMovies = async () => {
    // If demo mode is enabled, use demo data
    if (DEMO_MODE) {
      setMyMovies(demoMovies as any);
      setLoading(false);
      return;
    }

    // Check if Supabase is properly configured
    if (
      !process.env.EXPO_PUBLIC_SUPABASE_URL ||
      !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error('❌ Supabase not configured. Please check your .env file.');
      showToast('Configuration error. Please check your setup.', 'error');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await moviesApi.getAll();
      if (error) {
        console.error('Error loading movies:', error.message || error);
        showToast('Failed to load movies', 'error');
      } else {
        setMyMovies(data || []);
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      showToast('Failed to connect to database', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPopularMovies = async () => {
    // If demo mode is enabled, use demo data
    if (DEMO_MODE) {
      setTMDBMovies(demoTMDBMovies as any);
      setTMDBLoading(false);
      return;
    }

    setTMDBLoading(true);
    try {
      const response = await getPopularMovies();
      setTMDBMovies(response.results);
    } catch (error) {
      console.error('Error loading TMDB movies:', error);
    } finally {
      setTMDBLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPopularMovies();
      return;
    }

    setTMDBLoading(true);
    try {
      const response = await searchMovies(searchQuery);
      setTMDBMovies(response.results);
    } catch (error) {
      console.error('Search error:', error);
      showToast('Failed to search movies', 'error');
    } finally {
      setTMDBLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    // If search is cleared, reload popular movies
    if (!text.trim()) {
      loadPopularMovies();
    }
  };

  const handleAddMovie = async (movie: TMDBMovie) => {
    setAddingMovieId(movie.id);
    try {
      const posterUrl = DEMO_MODE
        ? 'https://placehold.co/300x450/6366F1/FFFFFF/png?text=Movie'
        : getImageUrl(movie.poster_path);

      const { data, error } = await moviesApi.add({
        title: movie.title,
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear().toString()
          : null,
        poster_url: posterUrl,
        is_watched: true,
        is_favorite: false,
        is_watchlist: false,
        rating: null,
        watched_date: new Date().toISOString(),
      });

      if (error) {
        showToast('Failed to add movie', 'error');
      } else {
        await loadMyMovies();
        showToast(`${movie.title} added to watched list!`, 'success');
      }
    } catch (error) {
      console.error('Add movie error:', error);
      showToast('Failed to add movie', 'error');
    } finally {
      setAddingMovieId(null);
    }
  };

  const handleToggleFavorite = async (
    movieId: string,
    currentFavoriteStatus: boolean,
  ) => {
    setUpdatingMovieId(movieId);
    try {
      const { error } = await moviesApi.update(movieId, {
        is_favorite: !currentFavoriteStatus,
      });

      if (error) {
        showToast('Failed to update favorite', 'error');
      } else {
        await loadMyMovies();
        showToast(
          currentFavoriteStatus
            ? 'Removed from favorites'
            : 'Added to favorites',
          'success',
        );
      }
    } catch (error) {
      showToast('Failed to update favorite', 'error');
    } finally {
      setUpdatingMovieId(null);
    }
  };

  const filteredMyMovies = myMovies.filter((movie) => {
    const matchesSearch = movie.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getFilteredMovies = () => {
    if (filter === 'watched') {
      const watchedMovies = myMovies.filter((movie) => {
        const matchesSearch = movie.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const isWatched = movie.is_watched === true;
        return matchesSearch && isWatched;
      });
      return watchedMovies;
    }
    if (filter === 'favorites') {
      return myMovies.filter((movie) => {
        const matchesSearch = movie.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        return matchesSearch && movie.is_favorite === true;
      });
    }
    if (filter === 'watchlist') {
      return myMovies.filter((movie) => {
        const matchesSearch = movie.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        return matchesSearch && movie.is_watchlist === true;
      });
    }
    return myMovies.filter((movie) =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  const displayMovies = getFilteredMovies();

  const isMovieInCollection = (tmdbMovieTitle: string) => {
    return myMovies.some(
      (movie) => movie.title.toLowerCase() === tmdbMovieTitle.toLowerCase(),
    );
  };

  const renderMyMovieCard = (movie: Movie) => (
    <TouchableOpacity
      key={movie.id}
      style={styles.movieCard}
      onPress={() =>
        router.push({
          pathname: '/movie-detail',
          params: {
            id: movie.id,
            title: movie.title,
            year: movie.year || '',
            poster_url: movie.poster_url || '',
            is_watched: movie.is_watched?.toString() || 'false',
            is_favorite: movie.is_favorite?.toString() || 'false',
            is_watchlist: movie.is_watchlist?.toString() || 'false',
            rating: movie.rating?.toString() || '0',
            inCollection: 'true',
          },
        })
      }
    >
      <View style={styles.posterContainer}>
        {movie.poster_url ? (
          <Image
            source={
              DEMO_MODE && typeof movie.poster_url !== 'string'
                ? movie.poster_url
                : { uri: movie.poster_url as string }
            }
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Text style={styles.posterPlaceholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.badgeContainer}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleToggleFavorite(movie.id, movie.is_favorite)}
            disabled={updatingMovieId === movie.id}
          >
            {updatingMovieId === movie.id ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Heart
                size={16}
                color="#EF4444"
                fill={movie.is_favorite ? '#EF4444' : 'transparent'}
                strokeWidth={2}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>
          {movie.title}
        </Text>
        <Text style={styles.movieYear}>{movie.year}</Text>

        <View style={styles.movieMeta}>
          {movie.rating !== null && movie.rating > 0 && (
            <View style={styles.rating}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  color={i < (movie.rating ?? 0) ? '#F59E0B' : '#374151'}
                  fill={i < (movie.rating ?? 0) ? '#F59E0B' : 'transparent'}
                  strokeWidth={1}
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTMDBMovieCard = (movie: TMDBMovie) => {
    const inCollection = isMovieInCollection(movie.title);
    const collectionMovie = myMovies.find(
      (m) => m.title.toLowerCase() === movie.title.toLowerCase(),
    );
    const isWatched = collectionMovie?.is_watched || false;

    return (
      <TouchableOpacity
        key={movie.id}
        style={styles.tmdbMovieCard}
        onPress={() => {
          if (inCollection && collectionMovie) {
            router.push({
              pathname: '/movie-detail',
              params: {
                id: collectionMovie.id,
                title: collectionMovie.title,
                year: collectionMovie.year || '',
                poster_url: collectionMovie.poster_url || '',
                is_watched: collectionMovie.is_watched?.toString() || 'false',
                is_favorite: collectionMovie.is_favorite?.toString() || 'false',
                is_watchlist:
                  collectionMovie.is_watchlist?.toString() || 'false',
                rating: collectionMovie.rating?.toString() || '0',
                inCollection: 'true',
              },
            });
          } else {
            const posterUrl = DEMO_MODE
              ? 'https://placehold.co/300x450/6366F1/FFFFFF/png?text=Movie'
              : getImageUrl(movie.poster_path) || '';

            router.push({
              pathname: '/movie-detail',
              params: {
                id: movie.id.toString(),
                title: movie.title,
                year: movie.release_date
                  ? new Date(movie.release_date).getFullYear().toString()
                  : '',
                poster_url: posterUrl,
                tmdb_rating: movie.vote_average?.toString() || '0',
                overview: movie.overview || '',
                inCollection: 'false',
                is_watched: 'false',
                is_favorite: 'false',
                is_watchlist: 'false',
                rating: '0',
              },
            });
          }
        }}
      >
        <View style={styles.posterContainer}>
          <Image
            source={
              DEMO_MODE && (movie as any).poster_url
                ? (movie as any).poster_url
                : {
                    uri:
                      getImageUrl(movie.poster_path) ||
                      'https://via.placeholder.com/300x450?text=No+Image',
                  }
            }
            style={styles.poster}
            resizeMode="cover"
          />

          <View style={styles.badgeContainer}>
            <TouchableOpacity
              style={styles.addBadge}
              onPress={() => handleAddMovie(movie)}
              disabled={addingMovieId === movie.id || isWatched}
            >
              {addingMovieId === movie.id ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : isWatched ? (
                <Check size={16} color="#10B981" strokeWidth={2} />
              ) : (
                <Plus size={16} color="#6366F1" strokeWidth={2} />
              )}
            </TouchableOpacity>

            {inCollection && collectionMovie && (
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() =>
                  handleToggleFavorite(
                    collectionMovie.id,
                    collectionMovie.is_favorite,
                  )
                }
                disabled={updatingMovieId === collectionMovie.id}
              >
                {updatingMovieId === collectionMovie.id ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Heart
                    size={16}
                    color="#EF4444"
                    fill={
                      collectionMovie.is_favorite ? '#EF4444' : 'transparent'
                    }
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle} numberOfLines={2}>
            {movie.title}
          </Text>
          <Text style={styles.movieYear}>
            {movie.release_date
              ? new Date(movie.release_date).getFullYear()
              : 'Unknown'}
          </Text>

          <View style={styles.tmdbRating}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" strokeWidth={1} />
            <Text style={styles.ratingText}>
              {movie.vote_average.toFixed(1)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradient}>
        <Toast
          message={toastMessage}
          type={toastType}
          visible={toastVisible}
          onHide={() => setToastVisible(false)}
        />
        <View style={styles.header}>
          <Text style={styles.title}>Movies</Text>
          <Text style={styles.subtitle}>
            {filter === 'all'
              ? searchQuery
                ? `${tmdbMovies.length} results`
                : 'Discover Popular Movies'
              : `${displayMovies.length} movies`}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search movies..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearch}
            />
          </View>
        </View>

        <View style={styles.filters}>
          <Text style={styles.filterTitle}>Filter:</Text>
          {['all', 'watched', 'favorites', 'watchlist'].map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              style={[
                styles.filterButton,
                filter === filterOption && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(filterOption)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === filterOption && styles.filterTextActive,
                ]}
              >
                {filterOption === 'all'
                  ? 'All'
                  : filterOption === 'watched'
                    ? 'Watched'
                    : filterOption === 'favorites'
                      ? 'Favorites'
                      : 'Watchlist'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* {filter === 'all' && displayMovies.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Collection</Text>
              <View style={styles.moviesGrid}>
                {displayMovies.map(renderMyMovieCard)}
              </View>
            </View>
          )} */}

          {filter === 'watched' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Watched Movies</Text>
              {displayMovies.length > 0 ? (
                <View style={styles.moviesGrid}>
                  {displayMovies.map(renderMyMovieCard)}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No watched movies yet
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Mark some movies as watched to see them here
                  </Text>
                </View>
              )}
            </View>
          )}

          {filter === 'favorites' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Favorite Movies</Text>
              {displayMovies.length > 0 ? (
                <View style={styles.moviesGrid}>
                  {displayMovies.map(renderMyMovieCard)}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No favorite movies yet
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Add some movies to favorites to see them here
                  </Text>
                </View>
              )}
            </View>
          )}

          {filter === 'watchlist' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Watchlist</Text>
              {displayMovies.length > 0 ? (
                <View style={styles.moviesGrid}>
                  {displayMovies.map(renderMyMovieCard)}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No movies in watchlist yet
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Add some movies to your watchlist to see them here
                  </Text>
                </View>
              )}
            </View>
          )}

          {filter === 'all' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {searchQuery ? 'Search Results' : 'Popular Movies'}
              </Text>
              {tmdbLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366F1" />
                  <Text style={styles.loadingText}>Loading movies...</Text>
                </View>
              ) : (
                <View style={styles.moviesGrid}>
                  {tmdbMovies.map(renderTMDBMovieCard)}
                </View>
              )}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
    marginLeft: 12,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#D1D5DB',
    marginRight: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  filterText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  filterTextActive: {
    color: '#6366F1',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  moviesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 24,
  },
  movieCard: {
    width: cardWidth,
    marginBottom: 24,
  },
  tmdbMovieCard: {
    width: cardWidth,
    marginBottom: 24,
  },
  posterContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  poster: {
    width: '100%',
    height: cardWidth * 1.5,
    borderRadius: 12,
  },
  posterPlaceholder: {
    width: '100%',
    height: cardWidth * 1.5,
    backgroundColor: '#374151',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  posterPlaceholderText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'column',
    gap: 4,
  },
  addBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieInfo: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
    lineHeight: 20,
  },
  movieYear: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  movieMeta: {
    gap: 8,
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
  },
  tmdbRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginTop: 12,
  },
  bottomSpacer: {
    height: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
