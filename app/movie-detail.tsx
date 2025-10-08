import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Star, Calendar, Clock, Eye, Plus, Trash2, CreditCard as Edit3, Heart, User, Film, ExternalLink } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { moviesApi } from '@/lib/api';
import { Database } from '@/lib/database.types';

type Movie = Database['public']['Tables']['movies']['Row'];

interface MovieState {
  id: string | string[];
  title: string | string[];
  year: string | string[] | null;
  poster_url: string | string[] | null;
  is_watched: boolean;
  is_favorite: boolean;
  is_watchlist: boolean;
  rating: number;
  imdb_rating: number | null;
  director: string | null;
  genre: string | null;
  watched_date: string | null;
}

export default function MovieDetailScreen() {
  const params = useLocalSearchParams();
  const [movie, setMovie] = useState<MovieState>({
    id: params.id || '',
    title: params.title || '',
    year: params.year || null,
    poster_url: params.poster_url || null,
    is_watched: params.is_watched === 'true',
    is_favorite: params.is_favorite === 'true',
    is_watchlist: params.is_watchlist === 'true',
    rating: parseInt(params.rating as string) || 0,
    imdb_rating: null,
    director: null,
    genre: null,
    watched_date: null
  });
  const [loading, setLoading] = useState(false);

  // Load fresh data from API on component mount
  useEffect(() => {
    loadMovieData();
  }, []);

  const loadMovieData = async () => {
    if (!params.id) return;

    try {
      const { data, error } = await moviesApi.getAll();
      if (!error && data) {
        const currentMovie = data.find(m => m.id === params.id);
        if (currentMovie) {
          setMovie({
            id: currentMovie.id,
            title: currentMovie.title,
            year: currentMovie.year,
            poster_url: currentMovie.poster_url,
            is_watched: currentMovie.is_watched,
            is_favorite: currentMovie.is_favorite,
            is_watchlist: currentMovie.is_watchlist || false,
            rating: currentMovie.rating || 0,
            imdb_rating: currentMovie.imdb_rating,
            director: currentMovie.director,
            genre: currentMovie.genre,
            watched_date: currentMovie.watched_date || null
          });
        }
      }
    } catch (error) {
      console.error('Error loading movie data:', error);
    }
  };

  const handleRatingChange = async (newRating: number) => {
    setLoading(true);
    try {
      const { error } = await moviesApi.update(movie.id as string, {
        rating: newRating,
        is_watched: true,
        watched_date: movie.watched_date || new Date().toISOString()
      });

      if (error) {
        Alert.alert('Error', 'Failed to update rating.');
      } else {
        await loadMovieData();
        Alert.alert('Success', 'Rating updated!');
        global.refreshMovies?.();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update rating.');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchedToggle = async () => {
    setLoading(true);
    try {
      const newWatchedStatus = !movie.is_watched;
      const updateData: Partial<Movie> = {
        is_watched: newWatchedStatus,
        watched_date: newWatchedStatus ? new Date().toISOString() : null
      };
      const { error } = await moviesApi.update(movie.id as string, updateData);

      if (error) {
        Alert.alert('Error', 'Failed to update watched status.');
      } else {
        await loadMovieData();
        const statusText = newWatchedStatus ? 'marked as watched' : 'unmarked as watched';
        Alert.alert('Success', `Movie ${statusText}!`);
        global.refreshMovies?.();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update watched status.');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    setLoading(true);
    try {
      const newFavoriteStatus = !movie.is_favorite;
      const { error } = await moviesApi.update(movie.id as string, { is_favorite: newFavoriteStatus });

      if (error) {
        Alert.alert('Error', 'Failed to update favorite status.');
      } else {
        await loadMovieData();
        const statusText = newFavoriteStatus ? 'added to favorites' : 'removed from favorites';
        Alert.alert('Success', `Movie ${statusText}!`);
        global.refreshMovies?.();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status.');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlistToggle = async () => {
    setLoading(true);
    try {
      const newWatchlistStatus = !movie.is_watchlist;
      const { error } = await moviesApi.update(movie.id as string, { is_watchlist: newWatchlistStatus });

      if (error) {
        Alert.alert('Error', 'Failed to update watchlist status.');
      } else {
        await loadMovieData();
        const statusText = newWatchlistStatus ? 'added to watchlist' : 'removed from watchlist';
        Alert.alert('Success', `Movie ${statusText}!`);
        global.refreshMovies?.();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update watchlist status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="white" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.movieHeader}>
            <View style={styles.posterContainer}>
              {movie.poster_url ? (
                <Image
                  source={{ uri: movie.poster_url as string }}
                  style={styles.poster}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.posterPlaceholder}>
                  <Text style={styles.posterPlaceholderText}>No Image</Text>
                </View>
              )}
            </View>
            
            <View style={styles.movieInfo}>
              <Text style={styles.movieTitle}>{movie.title}</Text>

              <View style={styles.movieMeta}>
                <Calendar size={14} color="#9CA3AF" strokeWidth={2} />
                <Text style={styles.movieMetaText}>{movie.year}</Text>
              </View>

              {movie.director && (
                <View style={styles.movieMeta}>
                  <User size={14} color="#9CA3AF" strokeWidth={2} />
                  <Text style={styles.movieMetaText}>{movie.director}</Text>
                </View>
              )}

              {movie.imdb_rating && (
                <View style={styles.movieMeta}>
                  <Star size={14} color="#F5C518" fill="#F5C518" strokeWidth={1} />
                  <Text style={styles.imdbRatingText}>{movie.imdb_rating}/10</Text>
                </View>
              )}

              {movie.genre && (
                <View style={styles.movieMeta}>
                  <Film size={14} color="#9CA3AF" strokeWidth={2} />
                  <Text style={styles.movieMetaText}>{movie.genre}</Text>
                </View>
              )}
              
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: movie.is_watched ? '#10B98120' : '#6366F120' }
                ]}>
                  {movie.is_watched ? (
                    <Eye size={16} color="#10B981" strokeWidth={2} />
                  ) : (
                    <Clock size={16} color="#6366F1" strokeWidth={2} />
                  )}
                  <Text style={[
                    styles.statusText,
                    { color: movie.is_watched ? '#10B981' : '#6366F1' }
                  ]}>
                    {movie.is_watched ? 'Watched' : 'To Watch'}
                  </Text>
                </View>
              
                {movie.is_favorite && (
                  <View style={styles.favoriteBadge}>
                    <Heart size={16} color="#EF4444" fill="#EF4444" strokeWidth={1} />
                    <Text style={styles.favoriteText}>Favorite</Text>
                  </View>
                )}
              </View>
              
              {movie.is_watched && movie.watched_date && (
                <View style={styles.watchedDateContainer}>
                  <Clock size={14} color="#6B7280" strokeWidth={2} />
                  <Text style={styles.watchedDateText}>
                    Watched on {new Date(movie.watched_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rating</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRatingChange(star)}
                  disabled={loading}
                  style={styles.starButton}
                >
                  <Star
                    size={32}
                    color={star <= movie.rating ? '#F59E0B' : '#374151'}
                    fill={star <= movie.rating ? '#F59E0B' : 'transparent'}
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {movie.rating > 0 && (
              <Text style={styles.ratingText}>You rated this {movie.rating}/5 stars</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  movie.is_watched && styles.actionButtonActive
                ]}
                onPress={handleWatchedToggle}
                disabled={loading}
              >
                <Eye size={20} color={movie.is_watched ? 'white' : '#10B981'} strokeWidth={2} />
                <Text style={[
                  styles.actionButtonText,
                  movie.is_watched && styles.actionButtonTextActive
                ]}>
                  {movie.is_watched ? 'Watched ✓' : 'Mark as Watched'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  movie.is_favorite && styles.favoriteButtonActive
                ]}
                onPress={handleFavoriteToggle}
                disabled={loading}
              >
                <Heart
                  size={20}
                  color={movie.is_favorite ? 'white' : '#EF4444'}
                  fill={movie.is_favorite ? 'white' : 'none'}
                  strokeWidth={2}
                />
                <Text style={[
                  styles.actionButtonText,
                  movie.is_favorite && styles.actionButtonTextActive
                ]}>
                  {movie.is_favorite ? 'Favorite ❤️' : 'Add to Favorites'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imdbButton}
                onPress={() => {
                  const searchQuery = `${movie.title} ${movie.year || ''}`;
                  const imdbUrl = `https://www.imdb.com/find?q=${encodeURIComponent(searchQuery)}`;
                  Linking.openURL(imdbUrl);
                }}
              >
                <View style={styles.imdbLogo}>
                  <Text style={styles.imdbLogoText}>IMDb</Text>
                </View>
                <Text style={styles.imdbButtonText}>View on IMDb</Text>
                <ExternalLink size={16} color="#F5C518" strokeWidth={2} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  movie.is_watchlist && styles.watchlistButtonActive
                ]}
                onPress={handleWatchlistToggle}
                disabled={loading}
              >
                <Plus 
                  size={20} 
                  color={movie.is_watchlist ? 'white' : '#8B5CF6'} 
                  strokeWidth={2} 
                />
                <Text style={[
                  styles.actionButtonText,
                  movie.is_watchlist && styles.actionButtonTextActive
                ]}>
                  {movie.is_watchlist ? 'In Watchlist 📝' : 'Add to Watchlist'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  movieHeader: {
    flexDirection: 'row',
    padding: 24,
    gap: 20,
  },
  posterContainer: {
    width: 120,
    height: 180,
  },
  poster: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
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
  movieInfo: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 12,
    lineHeight: 30,
  },
  movieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  movieMetaText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  imdbRatingText: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    color: '#F5C518',
  },
  statusContainer: {
    marginTop: 8,
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  favoriteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EF444420',
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  favoriteText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
  },
  watchedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  watchedDateText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  favoriteButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  watchlistButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
  },
  actionButtonTextActive: {
    color: 'white',
  },
  imdbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 197, 24, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 197, 24, 0.3)',
  },
  imdbLogo: {
    backgroundColor: '#F5C518',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  imdbLogoText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#000000',
  },
  imdbButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#F5C518',
    flex: 1,
  },
});