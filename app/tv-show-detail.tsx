import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Star, Calendar, Clock, Eye, Plus, Trash2, Heart, User, Tv, Play, Pause } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { tvShowsApi } from '@/lib/api';

export default function TVShowDetailScreen() {
  const params = useLocalSearchParams();
  const [tvShow, setTVShow] = useState({
    id: params.id,
    title: params.title,
    year: params.year,
    poster_url: params.poster_url,
    is_watched: params.is_watched === 'true',
    is_favorite: params.is_favorite === 'true',
    rating: parseInt(params.rating as string) || 0,
    seasons: parseInt(params.seasons as string) || 1,
    episodes: parseInt(params.episodes as string) || 1,
    current_season: parseInt(params.current_season as string) || 1,
    current_episode: parseInt(params.current_episode as string) || 1,
    imdb_rating: null,
    director: null,
    genre: null
  });
  const [loading, setLoading] = useState(false);

  // Load fresh data from API on component mount
  useEffect(() => {
    console.log('TV Show Detail - Loading data for ID:', params.id);
    loadTVShowData();
  }, []);

  // Listen for focus events to reload data when returning to this screen
  useEffect(() => {
    const unsubscribe = router.addListener?.('focus', () => {
      loadTVShowData();
    });
    
    return unsubscribe;
  }, []);

  const loadTVShowData = async () => {
    console.log('Loading TV show data for ID:', params.id);
    try {
      const { data, error } = await tvShowsApi.getAll();
      console.log('API response:', { data: data?.length, error });
      if (!error && data) {
        const currentShow = data.find(s => s.id === params.id);
        console.log('Found current show:', currentShow);
        if (currentShow) {
          setTVShow({
            id: currentShow.id,
            title: currentShow.title,
            year: currentShow.year,
            poster_url: currentShow.poster_url,
            is_watched: currentShow.is_watched,
            is_favorite: currentShow.is_favorite,
            rating: currentShow.rating || 0,
            seasons: currentShow.seasons || 1,
            episodes: currentShow.episodes || 1,
            current_season: currentShow.current_season || 1,
            current_episode: currentShow.current_episode || 1,
            imdb_rating: currentShow.imdb_rating,
            director: currentShow.director,
            genre: currentShow.genre
          });
        } else if (params.inCollection === 'true') {
          const showByTitle = data.find(s => 
            s.title?.toLowerCase().trim() === (params.title as string)?.toLowerCase().trim()
          );
          console.log('Found show by title:', showByTitle);
          if (showByTitle) {
            setTVShow({
              id: showByTitle.id,
              title: showByTitle.title,
              year: showByTitle.year,
              poster_url: showByTitle.poster_url,
              is_watched: showByTitle.is_watched,
              is_favorite: showByTitle.is_favorite,
              rating: showByTitle.rating || 0,
              seasons: showByTitle.seasons || 1,
              episodes: showByTitle.episodes || 1,
              current_season: showByTitle.current_season || 1,
              current_episode: showByTitle.current_episode || 1,
              imdb_rating: showByTitle.imdb_rating,
              director: showByTitle.director,
              genre: showByTitle.genre
            });
          }
        } else {
          // If not in collection, use params data
          setTVShow(prev => ({
            ...prev,
            is_watched: false,
            is_favorite: false,
            rating: 0
          }));
        }
      }
    } catch (error) {
      console.error('Error loading TV show data:', error);
    }
  };

  const handleRatingChange = async (newRating: number) => {
    setLoading(true);
    try {
      const { error } = await tvShowsApi.update(tvShow.id as string, { 
        rating: newRating,
        is_watched: true // Rating verince otomatik watched yap
      });
      
      if (error) {
        Alert.alert('Error', 'Failed to update rating.');
      } else {
        setTVShow(prev => ({ ...prev, rating: newRating, is_watched: true }));
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
      const newWatchedStatus = !tvShow.is_watched;
      const updateData = { is_watched: newWatchedStatus };
      const { error } = await tvShowsApi.update(tvShow.id as string, updateData);
      
      if (error) {
        Alert.alert('Error', 'Failed to update watched status.');
      } else {
        setTVShow(prev => ({ 
          ...prev, 
          is_watched: newWatchedStatus
        }));
        const statusText = newWatchedStatus ? 'marked as watched' : 'unmarked as watched';
        Alert.alert('Success', `TV show ${statusText}!`);
        
        // Navigate back to refresh the TV shows list
        setTimeout(() => {
          router.back();
        }, 1000);
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
      const newFavoriteStatus = !tvShow.is_favorite;
      const { error } = await tvShowsApi.update(tvShow.id as string, { is_favorite: newFavoriteStatus });
      
      if (error) {
        Alert.alert('Error', 'Failed to update favorite status.');
      } else {
        setTVShow(prev => ({ ...prev, is_favorite: newFavoriteStatus }));
        const statusText = newFavoriteStatus ? 'added to favorites' : 'removed from favorites';
        Alert.alert('Success', `TV show ${statusText}!`);
        
        // Navigate back to refresh the TV shows list
        setTimeout(() => {
          router.back();
        }, 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status.');
    } finally {
      setLoading(false);
    }
  };

  const handleEpisodeUpdate = async (newSeason: number, newEpisode: number) => {
    setLoading(true);
    try {
      const { error } = await tvShowsApi.update(tvShow.id as string, { 
        current_season: newSeason,
        current_episode: newEpisode
      });
      
      if (error) {
        Alert.alert('Error', 'Failed to update episode progress.');
      } else {
        setTVShow(prev => ({ 
          ...prev, 
          current_season: newSeason,
          current_episode: newEpisode
        }));
        Alert.alert('Success', 'Episode progress updated!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update episode progress.');
    } finally {
      setLoading(false);
    }
  };

  const getWatchingStatus = () => {
    if (tvShow.is_watched) return 'Completed';
    if (tvShow.current_episode > 1) return 'Watching';
    return 'To Watch';
  };

  const getStatusColor = () => {
    if (tvShow.is_watched) return '#10B981';
    if (tvShow.current_episode > 1) return '#F59E0B';
    return '#6366F1';
  };

  const getStatusIcon = () => {
    if (tvShow.is_watched) return Eye;
    if (tvShow.current_episode > 1) return Play;
    return Clock;
  };

  const StatusIcon = getStatusIcon();

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
          <View style={styles.showHeader}>
            <View style={styles.posterContainer}>
              {tvShow.poster_url ? (
                <Image
                  source={{ uri: tvShow.poster_url as string }}
                  style={styles.poster}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.posterPlaceholder}>
                  <Text style={styles.posterPlaceholderText}>No Image</Text>
                </View>
              )}
            </View>
            
            <View style={styles.showInfo}>
              <Text style={styles.showTitle}>{tvShow.title}</Text>
              <View style={styles.showMeta}>
                <Calendar size={16} color="#9CA3AF" strokeWidth={2} />
                <Text style={styles.showYear}>{tvShow.year}</Text>
              </View>
              
              <View style={styles.showMeta}>
                <Tv size={16} color="#9CA3AF" strokeWidth={2} />
                <Text style={styles.seasonsText}>{tvShow.seasons} seasons</Text>
              </View>
              
              {tvShow.imdb_rating && (
                <View style={styles.imdbRating}>
                  <Star size={16} color="#F5C518" fill="#F5C518" strokeWidth={1} />
                  <Text style={styles.imdbRatingText}>{tvShow.imdb_rating} IMDB</Text>
                </View>
              )}
              
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor()}20` }
                ]}>
                  <StatusIcon size={16} color={getStatusColor()} strokeWidth={2} />
                  <Text style={[
                    styles.statusText,
                    { color: getStatusColor() }
                  ]}>
                    {getWatchingStatus()}
                  </Text>
                </View>
              
                {tvShow.is_favorite && (
                  <View style={styles.favoriteBadge}>
                    <Heart size={16} color="#EF4444" fill="#EF4444" strokeWidth={1} />
                    <Text style={styles.favoriteText}>Favorite</Text>
                  </View>
                )}
              </View>
              
              {!tvShow.is_watched && tvShow.current_episode > 1 && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>
                    Currently watching: S{tvShow.current_season}E{tvShow.current_episode}
                  </Text>
                  <View style={styles.progressBar}>
                    <View style={[
                      styles.progress,
                      { 
                        backgroundColor: getStatusColor(),
                        width: `${Math.min((tvShow.current_episode / tvShow.episodes) * 100, 100)}%`
                      }
                    ]} />
                  </View>
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
                    color={star <= tvShow.rating ? '#F59E0B' : '#374151'}
                    fill={star <= tvShow.rating ? '#F59E0B' : 'transparent'}
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {tvShow.rating > 0 && (
              <Text style={styles.ratingText}>You rated this {tvShow.rating}/5 stars</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  tvShow.is_watched && styles.actionButtonActive
                ]}
                onPress={handleWatchedToggle}
                disabled={loading}
              >
                <Eye size={20} color={tvShow.is_watched ? 'white' : '#10B981'} strokeWidth={2} />
                <Text style={[
                  styles.actionButtonText,
                  tvShow.is_watched && styles.actionButtonTextActive
                ]}>
                  {tvShow.is_watched ? 'Watched ✓' : 'Mark as Watched'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  tvShow.is_favorite && styles.favoriteButtonActive
                ]}
                onPress={handleFavoriteToggle}
                disabled={loading}
              >
                <Heart 
                  size={20} 
                  color={tvShow.is_favorite ? 'white' : '#EF4444'} 
                  fill={tvShow.is_favorite ? 'white' : 'none'}
                  strokeWidth={2} 
                />
                <Text style={[
                  styles.actionButtonText,
                  tvShow.is_favorite && styles.actionButtonTextActive
                ]}>
                  {tvShow.is_favorite ? 'Favorite ❤️' : 'Add to Favorites'}
                </Text>
              </TouchableOpacity>
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
  showHeader: {
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
  showInfo: {
    flex: 1,
  },
  showTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 12,
    lineHeight: 30,
  },
  showMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  showYear: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  seasonsText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  imdbRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  imdbRatingText: {
    fontSize: 16,
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
  progressContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  progress: {
    height: '100%',
    borderRadius: 2,
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
  episodeControls: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  episodeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  episodeLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  episodeButtons: {
    alignItems: 'center',
  },
  episodeButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  episodeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
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
  bottomSpacer: {
    height: 40,
  },
});