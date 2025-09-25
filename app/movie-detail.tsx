import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Star, Calendar, Clock, Eye, Plus, Trash2, CreditCard as Edit3 } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { moviesApi } from '@/lib/api';

export default function MovieDetailScreen() {
  const params = useLocalSearchParams();
  const [rating, setRating] = useState(parseInt(params.rating as string) || 0);
  const [isWatched, setIsWatched] = useState(params.is_watched === 'true');
  const [isFavorite, setIsFavorite] = useState(params.is_favorite === 'true');
  const [loading, setLoading] = useState(false);

  const movie = {
    id: params.id,
    title: params.title,
    year: params.year,
    poster_url: params.poster_url,
    is_watched: isWatched,
    is_favorite: isFavorite,
    rating: rating
  };

  const handleRatingChange = async (newRating: number) => {
    setLoading(true);
    try {
      const { error } = await moviesApi.update(movie.id as string, { 
        rating: newRating,
        is_watched: true // Rating verince otomatik watched yap
      });
      
      if (error) {
        Alert.alert('Error', 'Failed to update rating.');
      } else {
        setRating(newRating);
        setIsWatched(true);
        Alert.alert('Success', 'Rating updated!');
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
      const newWatchedStatus = !isWatched;
      const { error } = await moviesApi.update(movie.id as string, { is_watched: newWatchedStatus });
      
      if (error) {
        Alert.alert('Error', 'Failed to update watched status.');
      } else {
        setIsWatched(newWatchedStatus);
        const statusText = newWatchedStatus ? 'marked as watched' : 'unmarked as watched';
        Alert.alert('Success', `Movie ${statusText}!`);
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
      const newFavoriteStatus = !isFavorite;
      const { error } = await moviesApi.update(movie.id as string, { is_favorite: newFavoriteStatus });
      
      if (error) {
        Alert.alert('Error', 'Failed to update favorite status.');
      } else {
        setIsFavorite(newFavoriteStatus);
        const statusText = newFavoriteStatus ? 'added to favorites' : 'removed from favorites';
        Alert.alert('Success', `Movie ${statusText}!`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Movie',
      `Are you sure you want to remove "${movie.title}" from your collection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await moviesApi.delete(movie.id as string);
              
              if (error) {
                Alert.alert('Error', 'Failed to delete movie.');
              } else {
                Alert.alert('Success', 'Movie removed from collection!', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete movie.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Trash2 size={20} color="#EF4444" strokeWidth={2} />
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
              
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: isWatched ? '#10B98120' : '#6366F120' }
                ]}>
                  {isWatched ? (
                    <Eye size={16} color="#10B981" strokeWidth={2} />
                  ) : (
                    <Clock size={16} color="#6366F1" strokeWidth={2} />
                  )}
                  <Text style={[
                    styles.statusText,
                    { color: isWatched ? '#10B981' : '#6366F1' }
                  ]}>
                    {isWatched ? 'Watched' : 'Not Watched'}
                  </Text>
                </View>
                
                {isFavorite && (
                  <View style={styles.favoriteBadge}>
                    <Heart size={16} color="#EF4444" fill="#EF4444" strokeWidth={1} />
                    <Text style={styles.favoriteText}>Favorite</Text>
                  </View>
                )}
              </View>
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
                    color={star <= rating ? '#F59E0B' : '#374151'}
                    fill={star <= rating ? '#F59E0B' : 'transparent'}
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingText}>You rated this {rating}/5 stars</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isWatched && styles.actionButtonActive
                ]}
                onPress={handleWatchedToggle}
                disabled={loading}
              >
                <Eye size={20} color={isWatched ? 'white' : '#10B981'} strokeWidth={2} />
                <Text style={[
                  styles.actionButtonText,
                  isWatched && styles.actionButtonTextActive
                ]}>
                  {isWatched ? 'Watched ✓' : 'Mark as Watched'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isFavorite && styles.favoriteButtonActive
                ]}
                onPress={handleFavoriteToggle}
                disabled={loading}
              >
                <Heart 
                  size={20} 
                  color={isFavorite ? 'white' : '#EF4444'} 
                  fill={isFavorite ? 'white' : 'transparent'}
                  strokeWidth={2} 
                />
                <Text style={[
                  styles.actionButtonText,
                  isFavorite && styles.actionButtonTextActive
                ]}>
                  {isFavorite ? 'Favorite ❤️' : 'Add to Favorites'}
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
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
    marginBottom: 16,
  },
  movieYear: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
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
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
  },
  actionButtonTextActive: {
    color: 'white',
  },
});