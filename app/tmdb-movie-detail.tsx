import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Star, Calendar, Plus, Eye, Heart } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { moviesApi } from '@/lib/api';

export default function TMDBMovieDetailScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [inCollection, setInCollection] = useState(params.inCollection === 'true');

  const movie = {
    id: params.id,
    title: params.title,
    year: params.year,
    poster_url: params.poster_url,
    overview: params.overview,
    vote_average: parseFloat(params.vote_average as string),
    release_date: params.release_date,
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
        rating: status === 'watched' ? null : null, // Rating detay sayfasında verilebilir
        duration: null,
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
                <Calendar size={16} color="#9CA3AF" strokeWidth={2} />
                <Text style={styles.movieYear}>{movie.year}</Text>
              </View>
              
              <View style={styles.ratingContainer}>
                <Star size={16} color="#F59E0B" fill="#F59E0B" strokeWidth={1} />
                <Text style={styles.tmdbRating}>
                  {movie.vote_average.toFixed(1)} TMDB
                </Text>
              </View>

              {inCollection && (
                <View style={styles.inCollectionBadge}>
                  <Text style={styles.inCollectionText}>✓ In Your Collection</Text>
                </View>
              )}
            </View>
          </View>

          {movie.overview && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <Text style={styles.overview}>{movie.overview}</Text>
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
    marginBottom: 16,
  },
  tmdbRating: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
  },
  inCollectionBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
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