import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Dimensions, Image, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Star, Calendar, Plus, Check, Heart } from 'lucide-react-native';
import { router } from 'expo-router';
import { moviesApi } from '@/lib/api';
import { searchMovies, getPopularMovies, TMDBMovie, getImageUrl } from '@/lib/tmdb';

const { width } = Dimensions.get('window');
const cardWidth = (width - 72) / 2;

export default function MoviesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [myMovies, setMyMovies] = useState([]);
  const [tmdbMovies, setTMDBMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null);
  const [updatingMovieId, setUpdatingMovieId] = useState<string | null>(null);

  useEffect(() => {
    loadMyMovies();
    loadTMDBMovies();
  }, []);

  const loadMyMovies = async () => {
    // Check if Supabase is properly configured
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Supabase not configured. Please check your .env file.');
      Alert.alert(
        'Configuration Error',
        'Supabase is not configured. Please check your .env file and restart the development server.',
        [{ text: 'OK' }]
      );
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await moviesApi.getAll();
      if (error) {
        console.error('Error loading movies:', error.message || error);
        Alert.alert(
          'Database Error',
          `Failed to load movies: ${error.message || 'Unknown error'}`,
          [{ text: 'OK' }]
        );
      } else {
        setMyMovies(data || []);
      }
    } catch (error) {
      console.error('Error loading movies:', error);
      Alert.alert(
        'Connection Error',
        'Failed to connect to the database. Please check your internet connection and Supabase configuration.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTMDBMovies = async () => {
    setTmdbLoading(true);
    try {
      const response = await getPopularMovies();
      setTMDBMovies(response.results);
    } catch (error) {
      console.error('Error loading TMDB movies:', error);
    } finally {
      setTmdbLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadTMDBMovies();
      return;
    }

    setTmdbLoading(true);
    try {
      const response = await searchMovies(searchQuery);
      setTMDBMovies(response.results);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search movies. Please try again.');
    } finally {
      setTmdbLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    // If search is cleared, reload popular movies
    if (!text.trim()) {
      loadTMDBMovies();
    }
  };

  const handleAddMovie = async (movie: TMDBMovie) => {
    setAddingMovieId(movie.id);
    try {
      const { error } = await moviesApi.add({
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        poster_url: getImageUrl(movie.poster_path),
        is_watched: false,
        is_favorite: false,
        rating: null,
        duration: null,
      });

      if (error) {
        Alert.alert('Error', 'Failed to add movie to your collection.');
      } else {
        Alert.alert('Success', `${movie.title} added to your collection!`);
        loadMyMovies(); // Reload to show the new movie
      }
    } catch (error) {
      console.error('Add movie error:', error);
      Alert.alert('Error', 'Failed to add movie to your collection.');
    } finally {
      setAddingMovieId(null);
    }
  };

  const handleToggleFavorite = async (movieId: string, currentFavoriteStatus: boolean) => {
    setUpdatingMovieId(movieId);
    try {
      const { error } = await moviesApi.update(movieId, { 
        is_favorite: !currentFavoriteStatus 
      });
      
      if (error) {
        Alert.alert('Error', 'Failed to update favorite status.');
      } else {
        loadMyMovies(); // Reload to show updated status
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status.');
    } finally {
      setUpdatingMovieId(null);
    }
  };

  const filteredMyMovies = myMovies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Filter movies based on current tab
  const getFilteredMovies = () => {
    if (filter === 'watched') {
      const watchedMovies = myMovies.filter(movie => {
        const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
        const isWatched = movie.is_watched === true;
        return matchesSearch && isWatched;
      });
      return watchedMovies;
    }
    if (filter === 'favorites') {
      return myMovies.filter(movie => {
        const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && movie.is_favorite === true;
      });
    }
    return myMovies.filter(movie => 
      movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    ); // 'all' case
  };

  const displayMovies = getFilteredMovies();

  const isMovieInCollection = (tmdbMovieTitle: string) => {
    return myMovies.some(movie => 
      movie.title.toLowerCase() === tmdbMovieTitle.toLowerCase()
    );
  };

  const renderMyMovieCard = (movie) => (
    <TouchableOpacity 
      key={movie.id} 
      style={styles.movieCard}
      onPress={() => router.push({
        pathname: '/movie-detail',
        params: {
          id: movie.id,
          title: movie.title,
          year: movie.year,
          poster_url: movie.poster_url,
          is_watched: movie.is_watched,
          is_favorite: movie.is_favorite,
          rating: movie.rating
        }
      })}
    >
      <View style={styles.posterContainer}>
        {movie.poster_url ? (
          <Image
            source={{ uri: movie.poster_url }}
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
        <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
        <Text style={styles.movieYear}>{movie.year}</Text>
        
        <View style={styles.movieMeta}>
          {movie.rating > 0 && (
            <View style={styles.rating}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  color={i < movie.rating ? '#F59E0B' : '#374151'}
                  fill={i < movie.rating ? '#F59E0B' : 'transparent'}
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
    const collectionMovie = myMovies.find(m => 
      m.title.toLowerCase() === movie.title.toLowerCase()
    );

    return (
      <TouchableOpacity 
        key={movie.id} 
        style={styles.tmdbMovieCard}
        onPress={() => router.push({
          pathname: '/tmdb-movie-detail',
          params: {
            id: movie.id,
            title: movie.title,
            year: movie.release_date ? new Date(movie.release_date).getFullYear() : '',
            poster_url: getImageUrl(movie.poster_path),
            overview: movie.overview,
            vote_average: movie.vote_average,
            release_date: movie.release_date,
            inCollection: inCollection
          }
        })}
      >
        <View style={styles.posterContainer}>
          <Image
            source={{ 
              uri: getImageUrl(movie.poster_path, 'w500') || 'https://via.placeholder.com/300x450?text=No+Image'
            }}
            style={styles.poster}
            resizeMode="cover"
          />
          
          <View style={styles.badgeContainer}>
            <TouchableOpacity
              style={styles.addBadge}
              onPress={() => handleAddMovie(movie)}
              disabled={addingMovieId === movie.id || inCollection}
            >
              {addingMovieId === movie.id ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : inCollection ? (
                <Check size={16} color="#10B981" strokeWidth={2} />
              ) : (
                <Plus size={16} color="#6366F1" strokeWidth={2} />
              )}
            </TouchableOpacity>
            
            {inCollection && collectionMovie && (
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => handleToggleFavorite(collectionMovie.id, collectionMovie.is_favorite)}
                disabled={updatingMovieId === collectionMovie.id}
              >
                {updatingMovieId === collectionMovie.id ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Heart
                    size={16}
                    color="#EF4444"
                    fill={collectionMovie.is_favorite ? '#EF4444' : 'transparent'}
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
          <Text style={styles.movieYear}>
            {movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}
          </Text>
          
          <View style={styles.tmdbRating}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" strokeWidth={1} />
            <Text style={styles.ratingText}>{movie.vote_average.toFixed(1)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Movies</Text>
          <Text style={styles.subtitle}>{displayMovies.length} movies in collection</Text>
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
          {['all', 'watched', 'favorites'].map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              style={[
                styles.filterButton,
                filter === filterOption && styles.filterButtonActive
              ]}
              onPress={() => setFilter(filterOption)}
            >
              <Text style={[
                styles.filterText,
                filter === filterOption && styles.filterTextActive
              ]}>
                {filterOption === 'all' ? 'All' : 
                 filterOption === 'watched' ? 'Watched' : 'Favorites'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {filter === 'all' && displayMovies.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Collection</Text>
              <View style={styles.moviesGrid}>
                {displayMovies.map(renderMyMovieCard)}
              </View>
            </View>
          )}

          {filter === 'watched' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Watched Movies</Text>
              {displayMovies.length > 0 ? (
                <View style={styles.moviesGrid}>
                  {displayMovies.map(renderMyMovieCard)}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No watched movies yet</Text>
                  <Text style={styles.emptyStateSubtext}>Mark some movies as watched to see them here</Text>
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
                  <Text style={styles.emptyStateText}>No favorite movies yet</Text>
                  <Text style={styles.emptyStateSubtext}>Add some movies to favorites to see them here</Text>
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
    paddingTop: 16,
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