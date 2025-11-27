import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Star,
  Calendar,
  Plus,
  Eye,
  Heart,
  User,
  Clock,
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { moviesApi } from '@/lib/api';
import { getMovieDetails } from '@/lib/omdb';

export default function OMDBMovieDetailScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [inCollection, setInCollection] = useState(
    params.inCollection === 'true'
  );
  const [movieDetails, setMovieDetails] = useState(null);

  const movie = {
    id: params.id,
    title: params.title,
    year: params.year,
    poster_url: params.poster_url,
    type: params.type,
  };

  React.useEffect(() => {
    loadMovieDetails();
  }, []);

  const loadMovieDetails = async () => {
    try {
      const details = await getMovieDetails(movie.id as string);
      setMovieDetails(details);
    } catch (error) {
      console.error('Error loading movie details:', error);
    }
  };

  const handleAddToCollection = async (isWatched: boolean = false) => {
    setLoading(true);
    try {
      const { error } = await moviesApi.add({
        title: movie.title as string,
        year: movie.year ? parseInt(movie.year as string) : null,
        poster_url: movie.poster_url as string,
        is_watched: isWatched,
        is_favorite: false,
        rating: null,
        duration: movieDetails?.Runtime
          ? parseInt(movieDetails.Runtime.replace(' min', ''))
          : null,
        // Add IMDB data if available
        imdb_rating:
          movieDetails?.imdbRating !== 'N/A'
            ? parseFloat(movieDetails.imdbRating)
            : null,
        director:
          movieDetails?.Director !== 'N/A' ? movieDetails.Director : null,
        genre: movieDetails?.Genre !== 'N/A' ? movieDetails.Genre : null,
      });

      if (error) {
        Alert.alert('Error', 'Failed to add movie to your collection.');
      } else {
        const statusText = isWatched ? 'watched list' : 'collection';
        Alert.alert('Success', `${movie.title} added to your ${statusText}!`);
        setInCollection(true);
      }
    } catch (error) {
      console.error('Add movie error:', error);
      Alert.alert('Error', 'Failed to add movie to your collection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="white" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
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
                <Calendar size={16} color="#9CA3AF" strokeWidth={2} />
                <Text style={styles.movieYear}>{movie.year}</Text>
              </View>

              {movieDetails?.imdbRating &&
                movieDetails.imdbRating !== 'N/A' && (
                  <View style={styles.ratingContainer}>
                    <Star
                      size={16}
                      color="#F5C518"
                      fill="#F5C518"
                      strokeWidth={1}
                    />
                    <Text style={styles.imdbRating}>
                      {movieDetails.imdbRating} IMDB
                    </Text>
                  </View>
                )}

              {movieDetails?.Director && movieDetails.Director !== 'N/A' && (
                <View style={styles.movieMeta}>
                  <User size={16} color="#9CA3AF" strokeWidth={2} />
                  <Text style={styles.movieDirector}>
                    {movieDetails.Director}
                  </Text>
                </View>
              )}

              {movieDetails?.Runtime && movieDetails.Runtime !== 'N/A' && (
                <View style={styles.movieMeta}>
                  <Clock size={16} color="#9CA3AF" strokeWidth={2} />
                  <Text style={styles.movieRuntime}>
                    {movieDetails.Runtime}
                  </Text>
                </View>
              )}

              {inCollection && (
                <View style={styles.inCollectionBadge}>
                  <Text style={styles.inCollectionText}>
                    ✓ In Your Collection
                  </Text>
                </View>
              )}
            </View>
          </View>

          {movieDetails?.Plot && movieDetails.Plot !== 'N/A' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Plot</Text>
              <Text style={styles.overview}>{movieDetails.Plot}</Text>
            </View>
          )}

          {movieDetails?.Genre && movieDetails.Genre !== 'N/A' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genre</Text>
              <Text style={styles.genreText}>{movieDetails.Genre}</Text>
            </View>
          )}

          {movieDetails?.Actors && movieDetails.Actors !== 'N/A' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cast</Text>
              <Text style={styles.castText}>{movieDetails.Actors}</Text>
            </View>
          )}

          {!inCollection && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add to Collection</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddToCollection(false)}
                  disabled={loading}
                >
                  <Plus size={20} color="#6366F1" strokeWidth={2} />
                  <Text style={styles.addButtonText}>Add to Collection</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.watchedButton}
                  onPress={() => handleAddToCollection(true)}
                  disabled={loading}
                >
                  <Eye size={20} color="white" strokeWidth={2} />
                  <Text style={styles.watchedButtonText}>Mark as Watched</Text>
                </TouchableOpacity>
              </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
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
    gap: 8,
    marginBottom: 12,
  },
  movieYear: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  imdbRating: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#F5C518',
  },
  movieDirector: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  movieRuntime: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  inCollectionBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  inCollectionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
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
  overview: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
    lineHeight: 24,
  },
  genreText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
  },
  castText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
    lineHeight: 22,
  },
  actionButtons: {
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6366F1',
  },
  watchedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
  },
  watchedButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  bottomSpacer: {
    height: 40,
  },
});
