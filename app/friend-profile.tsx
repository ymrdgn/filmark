import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  User,
  Film,
  Tv,
  Heart,
  Eye,
  Star,
} from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { friendsApi } from '@/lib/friends-api';

interface Movie {
  id: string;
  title: string;
  year?: string | null;
  poster_url?: string | null;
  is_watched: boolean;
  is_favorite: boolean;
  is_watchlist?: boolean;
  rating?: number;
}

interface TVShow {
  id: string;
  title: string;
  year?: string | null;
  poster_url?: string | null;
  is_watched: boolean;
  is_favorite: boolean;
  is_watchlist?: boolean;
  rating?: number;
  current_season?: number;
  current_episode?: number;
  seasons?: number;
}

export default function FriendProfileScreen() {
  const params = useLocalSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');

  const friendId = params.friendId as string;
  const friendEmail = params.friendEmail as string;

  useEffect(() => {
    loadFriendData();
  }, []);

  const loadFriendData = async () => {
    setLoading(true);
    try {
      const [moviesResult, tvShowsResult] = await Promise.all([
        friendsApi.getFriendMovies(friendId),
        friendsApi.getFriendTVShows(friendId),
      ]);

      if (moviesResult.error) {
        console.error('Error loading friend movies:', moviesResult.error);
      } else {
        setMovies(moviesResult.data || []);
      }

      if (tvShowsResult.error) {
        console.error('Error loading friend TV shows:', tvShowsResult.error);
      } else {
        setTVShows(tvShowsResult.data || []);
      }
    } catch (error) {
      console.error('Error loading friend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMovieItem = (movie: Movie) => (
    <TouchableOpacity
      key={movie.id}
      style={styles.listItem}
      onPress={() =>
        router.push({
          pathname: '/movie-detail',
          params: {
            id: movie.id,
            title: movie.title,
            year: movie.year || '',
            poster_url: movie.poster_url || '',
            is_watched: movie.is_watched.toString(),
            is_favorite: movie.is_favorite.toString(),
            is_watchlist: movie.is_watchlist?.toString() || 'false',
            rating: movie.rating?.toString() || '0',
          },
        })
      }
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
            <Film size={20} color="#9CA3AF" strokeWidth={1.5} />
          </View>
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {movie.title}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemType}>Movie</Text>
          {movie.year && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.itemYear}>{movie.year}</Text>
            </>
          )}
        </View>

        <View style={styles.itemStatus}>
          {movie.is_watched && (
            <View style={styles.statusBadge}>
              <Eye size={12} color="#10B981" strokeWidth={2} />
              <Text style={styles.statusText}>Watched</Text>
            </View>
          )}
          {movie.is_favorite && (
            <View
              style={[styles.statusBadge, { backgroundColor: '#EF444420' }]}
            >
              <Heart size={12} color="#EF4444" fill="#EF4444" strokeWidth={1} />
              <Text style={[styles.statusText, { color: '#EF4444' }]}>
                Favorite
              </Text>
            </View>
          )}
        </View>

        {(movie.rating || 0) > 0 && (
          <View style={styles.rating}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                color={i < (movie.rating || 0) ? '#F59E0B' : '#374151'}
                fill={i < (movie.rating || 0) ? '#F59E0B' : 'transparent'}
                strokeWidth={1}
              />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTVShowItem = (show: TVShow) => (
    <TouchableOpacity
      key={show.id}
      style={styles.listItem}
      onPress={() =>
        router.push({
          pathname: '/tv-show-detail',
          params: {
            id: show.id,
            title: show.title,
            year: show.year || '',
            poster_url: show.poster_url || '',
            is_watched: show.is_watched.toString(),
            is_favorite: show.is_favorite.toString(),
            is_watchlist: show.is_watchlist?.toString() || 'false',
            rating: show.rating?.toString() || '0',
            current_season: show.current_season?.toString() || '1',
            current_episode: show.current_episode?.toString() || '1',
            seasons: show.seasons?.toString() || '',
          },
        })
      }
    >
      <View style={styles.posterContainer}>
        {show.poster_url ? (
          <Image
            source={{ uri: show.poster_url }}
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Tv size={20} color="#9CA3AF" strokeWidth={1.5} />
          </View>
        )}
      </View>

      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {show.title}
        </Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemType}>TV Show</Text>
          {show.year && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.itemYear}>{show.year}</Text>
            </>
          )}
          {show.seasons && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.itemYear}>{show.seasons} seasons</Text>
            </>
          )}
        </View>

        <View style={styles.itemStatus}>
          {show.is_watched && (
            <View style={styles.statusBadge}>
              <Eye size={12} color="#10B981" strokeWidth={2} />
              <Text style={styles.statusText}>Watched</Text>
            </View>
          )}
          {show.is_favorite && (
            <View
              style={[styles.statusBadge, { backgroundColor: '#EF444420' }]}
            >
              <Heart size={12} color="#EF4444" fill="#EF4444" strokeWidth={1} />
              <Text style={[styles.statusText, { color: '#EF4444' }]}>
                Favorite
              </Text>
            </View>
          )}
          {!show.is_watched && (show.current_episode || 0) > 1 && (
            <View
              style={[styles.statusBadge, { backgroundColor: '#F59E0B20' }]}
            >
              <Text style={[styles.statusText, { color: '#F59E0B' }]}>
                S{show.current_season}E{show.current_episode}
              </Text>
            </View>
          )}
        </View>

        {(show.rating || 0) > 0 && (
          <View style={styles.rating}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                color={i < (show.rating || 0) ? '#F59E0B' : '#374151'}
                fill={i < (show.rating || 0) ? '#F59E0B' : 'transparent'}
                strokeWidth={1}
              />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const favoriteMovies = movies.filter((m) => m.is_favorite);
  const watchedMovies = movies.filter((m) => m.is_watched);
  const favoriteTVShows = tvShows.filter((s) => s.is_favorite);
  const watchedTVShows = tvShows.filter((s) => s.is_watched);

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
          <View style={styles.headerInfo}>
            <Text style={styles.title}>
              {friendEmail?.split('@')[0]}'s Lists
            </Text>
            <Text style={styles.subtitle}>{friendEmail}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Film size={20} color="#EF4444" strokeWidth={2} />
            <Text style={styles.statValue}>{watchedMovies.length}</Text>
            <Text style={styles.statLabel}>Movies</Text>
          </View>
          <View style={styles.statCard}>
            <Tv size={20} color="#10B981" strokeWidth={2} />
            <Text style={styles.statValue}>{watchedTVShows.length}</Text>
            <Text style={styles.statLabel}>TV Shows</Text>
          </View>
          <View style={styles.statCard}>
            <Heart size={20} color="#EF4444" strokeWidth={2} />
            <Text style={styles.statValue}>
              {favoriteMovies.length + favoriteTVShows.length}
            </Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'movies' && styles.activeTab]}
            onPress={() => setActiveTab('movies')}
          >
            <Film
              size={20}
              color={activeTab === 'movies' ? '#6366F1' : '#9CA3AF'}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'movies' && styles.activeTabText,
              ]}
            >
              Movies ({movies.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tv' && styles.activeTab]}
            onPress={() => setActiveTab('tv')}
          >
            <Tv
              size={20}
              color={activeTab === 'tv' ? '#6366F1' : '#9CA3AF'}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'tv' && styles.activeTabText,
              ]}
            >
              TV Shows ({tvShows.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {activeTab === 'movies' ? (
                movies.length > 0 ? (
                  movies.map(renderMovieItem)
                ) : (
                  <View style={styles.emptyState}>
                    <Film size={48} color="#6B7280" strokeWidth={1.5} />
                    <Text style={styles.emptyStateText}>No movies yet</Text>
                  </View>
                )
              ) : tvShows.length > 0 ? (
                tvShows.map(renderTVShowItem)
              ) : (
                <View style={styles.emptyState}>
                  <Tv size={48} color="#6B7280" strokeWidth={1.5} />
                  <Text style={styles.emptyStateText}>No TV shows yet</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#6366F1',
  },
  scrollView: {
    flex: 1,
  },
  itemsList: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  posterContainer: {
    width: 50,
    height: 75,
    marginRight: 16,
  },
  poster: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#374151',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemType: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
  separator: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginHorizontal: 6,
  },
  itemYear: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  itemStatus: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#10B98120',
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: '#10B981',
  },
  rating: {
    flexDirection: 'row',
    gap: 3,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginTop: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});
