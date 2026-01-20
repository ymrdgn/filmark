import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Star,
  Calendar,
  Clock,
  Eye,
  Plus,
  Trash2,
  Heart,
  User,
  Tv,
  Play,
  Pause,
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { tvShowsApi } from '@/lib/api';
import { useFocusEffect } from '@react-navigation/native';
import { Database } from '@/lib/database.types';
import Toast from '@/components/Toast';

type TVShow = Database['public']['Tables']['tv_shows']['Row'];

// Declare global type for refresh function
declare global {
  var refreshTVShows: (() => void) | undefined;
}

interface TVShowState {
  id: string | string[];
  title: string | string[];
  year: string | string[];
  poster_url: string | string[];
  is_watched: boolean;
  is_favorite: boolean;
  is_watchlist: boolean;
  rating: number | null;
  seasons: number;
  episodes: number;
  current_season: number;
  current_episode: number;
  imdb_rating: number | null;
  director: string | null;
  genre: string | null;
  inCollection: boolean;
}

export default function TVShowDetailScreen() {
  const params = useLocalSearchParams();
  const [tvShow, setTVShow] = useState<TVShowState>({
    id: params.id,
    title: params.title,
    year: params.year,
    poster_url: params.poster_url,
    is_watched: params.is_watched === 'true',
    is_favorite: params.is_favorite === 'true',
    is_watchlist: params.is_watchlist === 'true',
    rating: parseInt(params.rating as string) || 0,
    seasons: parseInt(params.seasons as string) || 1,
    episodes: parseInt(params.episodes as string) || 1,
    current_season: parseInt(params.current_season as string) || 1,
    current_episode: parseInt(params.current_episode as string) || 1,
    imdb_rating: null,
    director: null,
    genre: null,
    inCollection: params.inCollection === 'true',
  });
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'success',
  );

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Auto refresh parent screen when going back
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // This runs when screen loses focus (going back)
        // Force refresh the TV shows list
        if (router.canGoBack()) {
          setTimeout(() => {
            // Trigger a refresh on the parent screen
            global.refreshTVShows?.();
          }, 100);
        }
      };
    }, []),
  );

  // Load fresh data from API on component mount
  useEffect(() => {
    console.log('TV Show Detail - Loading data for ID:', params.id);
    loadTVShowData();
  }, []);

  // Use useFocusEffect to reload when screen comes back into focus
  useFocusEffect(
    React.useCallback(() => {
      loadTVShowData();
    }, []),
  );

  const loadTVShowData = async () => {
    console.log('Loading TV show data for ID:', params.id);
    if (!params.id) return;

    try {
      const { data, error } = await tvShowsApi.getAll();
      console.log('API response:', { data: data?.length, error });
      if (!error && data) {
        // First try to find by exact ID match
        let currentShow = (data as TVShow[]).find((s) => s.id === params.id);

        // If not found by ID, try to find by title and year (for friend's TV shows)
        if (!currentShow && params.title) {
          currentShow = (data as TVShow[]).find(
            (s) => s.title === params.title && s.year === params.year,
          );
        }

        console.log('Found current show:', currentShow);
        if (currentShow) {
          setTVShow({
            id: currentShow.id,
            title: currentShow.title,
            year: currentShow.year || '',
            poster_url: currentShow.poster_url || '',
            is_watched: currentShow.is_watched,
            is_favorite: currentShow.is_favorite,
            is_watchlist: currentShow.is_watchlist || false,
            rating: currentShow.rating || 0,
            seasons: 1,
            episodes: 1,
            current_season: 1,
            current_episode: 1,
            imdb_rating: null,
            director: null,
            genre: null,
            inCollection: true,
          });
        } else {
          setTVShow((prev) => ({ ...prev, inCollection: false }));
        }
      }
    } catch (error) {
      console.error('Error loading TV show data:', error);
    }
  };

  const handleRatingChange = async (newRating: number) => {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        tvShow.id as string,
      );

    if (!isUUID || !tvShow.inCollection) {
      // Add TV show to collection as watched with rating
      setLoading(true);
      try {
        const { data, error } = await tvShowsApi.add({
          title: tvShow.title as string,
          year: tvShow.year as string,
          poster_url: tvShow.poster_url as string,
          is_watched: true,
          is_favorite: false,
          is_watchlist: false,
          rating: newRating,
          watched_date: new Date().toISOString(),
          seasons: 1,
          episodes: 1,
          current_season: 1,
          current_episode: 1,
        } as any);

        if (error || !data) {
          showToast('Failed to add TV show to your collection', 'error');
          return;
        }

        const showData = data as any;
        // Update local state with new TV show data
        setTVShow((prev) => ({
          ...prev,
          id: showData.id,
          rating: newRating,
          is_watched: true,
          inCollection: true,
        }));
        global.refreshTVShows?.();
        return;
      } catch (error) {
        showToast('Failed to add TV show to your collection', 'error');
        return;
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    try {
      const { error } = await tvShowsApi.update(tvShow.id as string, {
        rating: newRating,
        is_watched: true,
      });

      if (error) {
        showToast('Failed to update rating', 'error');
      } else {
        // Update local state immediately
        setTVShow((prev) => ({
          ...prev,
          rating: newRating,
          is_watched: true,
        }));
        global.refreshTVShows?.();
      }
    } catch (error) {
      showToast('Failed to update rating', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchedToggle = async () => {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        tvShow.id as string,
      );

    if (!isUUID || !tvShow.inCollection) {
      // Add TV show to collection as watched
      try {
        const { data, error } = await tvShowsApi.add({
          title: tvShow.title as string,
          year: tvShow.year as string,
          poster_url: tvShow.poster_url as string,
          is_watched: true,
          is_favorite: false,
          is_watchlist: false,
          rating: null,
          watched_date: new Date().toISOString(),
          seasons: 1,
          episodes: 1,
          current_season: 1,
          current_episode: 1,
        } as any);

        if (error || !data) {
          console.error('Failed to add TV show (watched):', error);
          return;
        }

        const showData = data as any;
        // Update local state with new TV show data
        setTVShow((prev) => ({
          ...prev,
          id: showData.id,
          is_watched: true,
          inCollection: true,
        }));
        global.refreshTVShows?.();
        return;
      } catch (error) {
        console.error('Exception adding TV show (watched):', error);
        return;
      }
    }
    setLoading(true);
    try {
      const newWatchedStatus = !tvShow.is_watched;
      const updateData: any = {
        is_watched: newWatchedStatus,
        is_favorite: newWatchedStatus ? tvShow.is_favorite : false,
      };

      // Only include rating in update if it has a valid value
      if (
        newWatchedStatus &&
        tvShow.rating &&
        tvShow.rating >= 1 &&
        tvShow.rating <= 5
      ) {
        updateData.rating = tvShow.rating;
      }

      const { error } = await tvShowsApi.update(
        tvShow.id as string,
        updateData,
      );

      if (error) {
        showToast('Failed to update watched status', 'error');
        console.error('Update error:', error);
      } else {
        // Update local state immediately
        setTVShow((prev) => ({
          ...prev,
          is_watched: newWatchedStatus,
          is_favorite: newWatchedStatus ? prev.is_favorite : false,
          rating: newWatchedStatus && prev.rating ? prev.rating : null,
        }));
        const statusText = newWatchedStatus
          ? 'marked as watched'
          : 'unmarked as watched';
        global.refreshTVShows?.();
      }
    } catch (error) {
      showToast('Failed to update watched status', 'error');
      console.error('Caught error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        tvShow.id as string,
      );

    if (!isUUID || !tvShow.inCollection) {
      // Add TV show to collection with favorite status
      try {
        const { data, error } = await tvShowsApi.add({
          title: tvShow.title as string,
          year: tvShow.year as string,
          poster_url: tvShow.poster_url as string,
          is_watched: true,
          is_favorite: true,
          is_watchlist: false,
          rating: null,
          watched_date: new Date().toISOString(),
          seasons: 1,
          episodes: 1,
          current_season: 1,
          current_episode: 1,
        } as any);

        if (error || !data) {
          console.error('Failed to add TV show (favorite):', error);
          return;
        }

        const showData = data as any;
        // Update local state with new TV show data
        setTVShow((prev) => ({
          ...prev,
          id: showData.id,
          is_watched: true,
          is_favorite: true,
          inCollection: true,
        }));
        global.refreshTVShows?.();
        return;
      } catch (error) {
        console.error('Exception adding TV show (favorite):', error);
        return;
      }
    }
    setLoading(true);
    try {
      const newFavoriteStatus = !tvShow.is_favorite;
      const updateData: any = {
        is_favorite: newFavoriteStatus,
      };

      // Favoriye eklenince izledim de işaretlensin
      if (newFavoriteStatus && !tvShow.is_watched) {
        updateData.is_watched = true;
        updateData.watched_date = new Date().toISOString();
      }

      const { error } = await tvShowsApi.update(
        tvShow.id as string,
        updateData,
      );

      if (error) {
        showToast('Failed to update favorite status', 'error');
      } else {
        // Update local state immediately
        setTVShow((prev) => ({
          ...prev,
          is_favorite: newFavoriteStatus,
          is_watched: newFavoriteStatus ? true : prev.is_watched,
        }));
        const statusText = newFavoriteStatus
          ? 'added to favorites'
          : 'removed from favorites';
        global.refreshTVShows?.();
      }
    } catch (error) {
      showToast('Failed to update favorite status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWatchlistToggle = async () => {
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        tvShow.id as string,
      );

    if (!isUUID || !tvShow.inCollection) {
      // Add TV show to watchlist
      try {
        const { data, error } = await tvShowsApi.add({
          title: tvShow.title as string,
          year: tvShow.year as string,
          poster_url: tvShow.poster_url as string,
          is_watched: false,
          is_favorite: false,
          is_watchlist: true,
          rating: null,
          watched_date: null,
          seasons: 1,
          episodes: 1,
          current_season: 1,
          current_episode: 1,
        } as any);

        if (error || !data) {
          console.error('Failed to add TV show (watchlist):', error);
          return;
        }

        const showData = data as any;
        // Update local state with new TV show data
        setTVShow((prev) => ({
          ...prev,
          id: showData.id,
          is_watchlist: true,
          inCollection: true,
        }));
        global.refreshTVShows?.();
        return;
      } catch (error) {
        console.error('Exception adding TV show (watchlist):', error);
        return;
      }
    }
    setLoading(true);
    try {
      const newWatchlistStatus = !tvShow.is_watchlist;
      const { error } = await tvShowsApi.update(tvShow.id as string, {
        is_watchlist: newWatchlistStatus,
      });

      if (error) {
        showToast('Failed to update watchlist status', 'error');
      } else {
        // Update local state immediately
        setTVShow((prev) => ({
          ...prev,
          is_watchlist: newWatchlistStatus,
        }));
        const statusText = newWatchlistStatus
          ? 'added to watchlist'
          : 'removed from watchlist';
        global.refreshTVShows?.();
      }
    } catch (error) {
      showToast('Failed to update watchlist status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEpisodeUpdate = async (newSeason: number, newEpisode: number) => {
    setLoading(true);
    try {
      // Note: current_season and current_episode fields don't exist in the database schema
      // This functionality needs to be implemented by adding these columns to tv_shows table
      showToast(
        'Episode tracking feature is not yet implemented in the database',
        'info',
      );
      /*
      const { error } = await tvShowsApi.update(tvShow.id as string, {
        current_season: newSeason,
        current_episode: newEpisode,
      });

      if (error) {
        showToast('Failed to update episode progress', 'error');
      } else {
        setTVShow((prev) => ({
          ...prev,
          current_season: newSeason,
          current_episode: newEpisode,
        }));
        Alert.alert('Success', 'Episode progress updated!');
      }
      */
    } catch (error) {
      showToast('Failed to update episode progress', 'error');
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
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradient}>
        <Toast
          message={toastMessage}
          type={toastType}
          visible={toastVisible}
          onHide={() => setToastVisible(false)}
        />
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
                  <Star
                    size={16}
                    color="#F5C518"
                    fill="#F5C518"
                    strokeWidth={1}
                  />
                  <Text style={styles.imdbRatingText}>
                    {tvShow.imdb_rating} IMDB
                  </Text>
                </View>
              )}

              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor()}20` },
                  ]}
                >
                  <StatusIcon
                    size={16}
                    color={getStatusColor()}
                    strokeWidth={2}
                  />
                  <Text
                    style={[styles.statusText, { color: getStatusColor() }]}
                  >
                    {getWatchingStatus()}
                  </Text>
                </View>

                {tvShow.is_favorite && (
                  <View style={styles.favoriteBadge}>
                    <Heart
                      size={16}
                      color="#EF4444"
                      fill="#EF4444"
                      strokeWidth={1}
                    />
                    <Text style={styles.favoriteText}>Favorite</Text>
                  </View>
                )}
              </View>

              {!tvShow.is_watched && tvShow.current_episode > 1 && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>
                    Currently watching: S{tvShow.current_season}E
                    {tvShow.current_episode}
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progress,
                        {
                          backgroundColor: getStatusColor(),
                          width: `${Math.min(
                            (tvShow.current_episode / tvShow.episodes) * 100,
                            100,
                          )}%`,
                        },
                      ]}
                    />
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
                    color={star <= (tvShow.rating ?? 0) ? '#F59E0B' : '#374151'}
                    fill={
                      star <= (tvShow.rating ?? 0) ? '#F59E0B' : 'transparent'
                    }
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {tvShow.rating !== null && tvShow.rating > 0 && (
              <Text style={styles.ratingText}>
                You rated this {tvShow.rating}/5 stars
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  tvShow.is_watched && styles.actionButtonActive,
                ]}
                onPress={handleWatchedToggle}
                disabled={loading}
              >
                <Eye
                  size={20}
                  color={tvShow.is_watched ? 'white' : '#10B981'}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    tvShow.is_watched && styles.actionButtonTextActive,
                  ]}
                >
                  {tvShow.is_watched ? 'Watched ✓' : 'Mark as Watched'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  tvShow.is_favorite && styles.favoriteButtonActive,
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
                <Text
                  style={[
                    styles.actionButtonText,
                    tvShow.is_favorite && styles.actionButtonTextActive,
                  ]}
                >
                  {tvShow.is_favorite ? 'Favorite ❤️' : 'Add to Favorites'}
                </Text>
              </TouchableOpacity>

              {!tvShow.is_watched && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    tvShow.is_watchlist && styles.watchlistButtonActive,
                  ]}
                  onPress={handleWatchlistToggle}
                  disabled={loading}
                >
                  <Plus
                    size={20}
                    color={tvShow.is_watchlist ? 'white' : '#8B5CF6'}
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      styles.actionButtonText,
                      tvShow.is_watchlist && styles.actionButtonTextActive,
                    ]}
                  >
                    {tvShow.is_watchlist
                      ? 'In Watchlist 📝'
                      : 'Add to Watchlist'}
                  </Text>
                </TouchableOpacity>
              )}
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
  bottomSpacer: {
    height: 40,
  },
});
