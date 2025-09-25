import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Star, Calendar, Clock, Eye, Plus, Trash2, CreditCard as Edit3 } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { moviesApi } from '@/lib/api';

export default function MovieDetailScreen() {
  const params = useLocalSearchParams();
  const [rating, setRating] = useState(parseInt(params.rating as string) || 0);
  const [status, setStatus] = useState(params.status as string);
  const [loading, setLoading] = useState(false);

  const movie = {
    id: params.id,
    title: params.title,
    year: params.year,
    poster_url: params.poster_url,
    status: status,
    rating: rating
  };

  const handleRatingChange = async (newRating: number) => {
    setLoading(true);
    try {
      const { error } = await moviesApi.update(movie.id as string, { 
        rating: newRating,
        status: 'watched' // Rating verince otomatik watched yap
      });
      
      if (error) {
        Alert.alert('Error', 'Failed to update rating.');
      } else {
        setRating(newRating);
        setStatus('watched');
        Alert.alert('Success', 'Rating updated!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update rating.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'watched' | 'watchlist') => {
    setLoading(true);
    try {
      const { error } = await moviesApi.update(movie.id as string, { status: newStatus });
      
      if (error) {
        Alert.alert('Error', 'Failed to update status.');
      } else {
        setStatus(newStatus);
        const statusText = newStatus === 'watched' ? 'watched' : 'watchlist';
        Alert.alert('Success', `Moved to ${statusText}!`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update status.');
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
                  { backgroundColor: status === 'watched' ? '#10B98120' : '#6366F120' }
                ]}>
                  {status === 'watched' ? (
                    <Eye size={16} color="#10B981" strokeWidth={2} />
                  ) : (
                    <Plus size={16} color="#6366F1" strokeWidth={2} />
                  )}
                  <Text style={[
                    styles.statusText,
                    { color: status === 'watched' ? '#10B981' : '#6366F1' }
                  ]}>
                    {status === 'watched' ? 'Watched' : 'Watchlist'}
                  </Text>
                </View>
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
                  status === 'watchlist' && styles.actionButtonActive
                ]}
                onPress={() => handleStatusChange('watchlist')}
                disabled={loading}
              >
                <Plus size={20} color={status === 'watchlist' ? 'white' : '#6366F1'} strokeWidth={2} />
                <Text style={[
                  styles.actionButtonText,
                  status === 'watchlist' && styles.actionButtonTextActive
                ]}>
                  Add to Watchlist
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  status === 'watched' && styles.actionButtonActive
                ]}
                onPress={() => handleStatusChange('watched')}
                disabled={loading}
              >
                <Eye size={20} color={status === 'watched' ? 'white' : '#10B981'} strokeWidth={2} />
                <Text style={[
                  styles.actionButtonText,
                  status === 'watched' && styles.actionButtonTextActive
                ]}>
                  Mark as Watched
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
  statusText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
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
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
  },
  actionButtonTextActive: {
    color: 'white',
  },
});