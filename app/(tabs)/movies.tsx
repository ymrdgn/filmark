import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Star, Clock, Eye, Plus, Check, Heart, Image as ImageIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { moviesApi } from '@/lib/api';
import { getPopularMovies, searchMovies, TMDBMovie, getImageUrl } from '@/lib/tmdb';
import { Image } from 'react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 72) / 2;

export default function MoviesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, watched, watchlist
  const [movies, setMovies] = useState([]);
  const [tmdbMovies, setTmdbMovies] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null);

  const loadMovies = async () => {
    try {
      setLoading(true);
      const { data, error } = await moviesApi.getAll();
      if (error) {
        console.error('Error loading movies:', error);
      } else {
        setMovies(data || []);
      }
    } catch (error) {
      console.error('Error loading movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPopularMovies = async () => {
    try {
      const response = await getPopularMovies();
      setTmdbMovies(response.results.slice(0, 20)); // İlk 20 film
    } catch (error) {
      console.error('Error loading popular movies:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      loadPopularMovies();
      return;
    }

    setSearchLoading(true);
    try {
      const response = await searchMovies(query);
      setTmdbMovies(response.results.slice(0, 20));
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search movies. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddMovie = async (movie: TMDBMovie, status: 'watched' | 'watchlist') => {
    // Zaten eklenmiş mi kontrol et
    const existingMovie = movies.find(m => m.title.toLowerCase() === movie.title.toLowerCase());
    if (existingMovie) {
      Alert.alert('Already Added', `${movie.title} is already in your collection.`);
      return;
    }

    setAddingMovieId(movie.id);
    try {
      const { error } = await moviesApi.add({
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        poster_url: getImageUrl(movie.poster_path),
        status: status,
        rating: null,
        duration: null,
      });

      if (error) {
        Alert.alert('Error', 'Failed to add movie to your list.');
      } else {
        const statusText = status === 'watched' ? 'watched list' : 'watchlist';
        Alert.alert('Success', `${movie.title} added to your ${statusText}!`);
        loadMovies(); // Refresh movies list
      }
    } catch (error) {
      console.error('Add movie error:', error);
      Alert.alert('Error', 'Failed to add movie to your list.');
    } finally {
      setAddingMovieId(null);
    }
  };

  const navigateToMovieDetail = (movie) => {
    // Movie detail sayfasına navigate et
    router.push({
      pathname: '/movie-detail',
      params: {
        id: movie.id,
        title: movie.title,
        year: movie.year,
        poster_url: movie.poster_url,
        status: movie.status,
        rating: movie.rating
      }
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      loadMovies();
      loadPopularMovies();
    }, [])
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const filteredMyMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || movie.status === filter;
    return matchesSearch && matchesFilter;
  });

  const isMovieInCollection = (tmdbMovie: TMDBMovie) => {
    return movies.some(m => m.title.toLowerCase() === tmdbMovie.title.toLowerCase());
  };

  const renderMyMovieCard = (movie) => (
    <TouchableOpacity key={movie.id} style={styles.movieCard} onPress={() => navigateToMovieDetail(movie)}>
      <View style={styles.posterContainer}>
        {movie.poster_url ? (
          <Image
            source={{ uri: movie.poster_url }}
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.posterPlaceholder}>
            <ImageIcon size={32} color="#6B7280" strokeWidth={1.5} />
          </View>
        )}
        <View style={styles.statusBadge}>
          {movie.status === 'watched' ? (
            <Eye size={14} color="#10B981" strokeWidth={2} />
          ) : (
            <Plus size={14} color="#6366F1" strokeWidth={2} />
          )}
        </View>
      </View>
      
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
        <Text style={styles.movieYear}>{movie.year}</Text>
        
        <View style={styles.movieMeta}>
          <View style={styles.duration}>
            <Clock size={12} color="#9CA3AF" strokeWidth={2} />
            <Text style={styles.durationText}>
              {movie.duration ? `${movie.duration}m` : 'N/A'}
            </Text>
          </View>
          
          {movie.status === 'watched' && movie.rating && movie.rating > 0 && (
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
    const inCollection = isMovieInCollection(movie);
    
    return (
      <TouchableOpacity key={movie.id} style={styles.tmdbMovieCard} onPress={() => navigateToTMDBMovieDetail(movie)}>
        <View style={styles.posterContainer}>
          <Image
            source={{ 
              uri: getImageUrl(movie.poster_path, 'w300') || 'https://via.placeholder.com/200x300?text=No+Image'
            }}
            style={styles.poster}
            resizeMode="cover"
          />
          {inCollection && (
            <View style={styles.inCollectionBadge}>
              <Check size={14} color="#10B981" strokeWidth={2} />
            </View>
          )}
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

        {!inCollection && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.watchlistButton]}
              onPress={() => handleAddMovie(movie, 'watchlist')}
              disabled={addingMovieId === movie.id}
            >
              {addingMovieId === movie.id ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : (
                <>
                  <Plus size={14} color="#6366F1" strokeWidth={2} />
                  <Text style={styles.watchlistButtonText}>Watchlist</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.watchedButton]}
              onPress={() => handleAddMovie(movie, 'watched')}
              disabled={addingMovieId === movie.id}
            >
              {addingMovieId === movie.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Eye size={14} color="white" strokeWidth={2} />
                  <Text style={styles.watchedButtonText}>Watched</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
    );
  };

  const navigateToTMDBMovieDetail = (movie: TMDBMovie) => {
    // TMDB movie detail sayfasına navigate et
    router.push({
      pathname: '/tmdb-movie-detail',
      params: {
        id: movie.id,
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        poster_url: getImageUrl(movie.poster_path),
        overview: movie.overview,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        inCollection: isMovieInCollection(movie)
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Movies</Text>
          <Text style={styles.subtitle}>
            {searchQuery ? 'Search Results' : 'Popular Movies'}
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
              onChangeText={setSearchQuery}
            />
            {searchLoading && (
              <ActivityIndicator size="small" color="#6366F1" />
            )}
          </View>
        </View>

        {!searchQuery && (
          <View style={styles.filters}>
            <Text style={styles.filterTitle}>My Collection:</Text>
            {['all', 'watched', 'watchlist'].map((filterOption) => (
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
                  {filterOption === 'all' ? 'All' : filterOption === 'watched' ? 'Watched' : 'Watchlist'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {!searchQuery && filteredMyMovies.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Movies ({filteredMyMovies.length})</Text>
              <View style={styles.moviesGrid}>
                {filteredMyMovies.map(renderMyMovieCard)}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? `Search: "${searchQuery}"` : 'Popular Movies'}
            </Text>
            <View style={styles.moviesGrid}>
              {tmdbMovies.map(renderTMDBMovieCard)}
            </View>
          </View>

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
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inCollectionBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieInfo: {
    flex: 1,
    marginBottom: 12,
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
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  watchlistButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  watchlistButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6366F1',
  },
  watchedButton: {
    backgroundColor: '#10B981',
  },
  watchedButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  bottomSpacer: {
    height: 20,
  },
});