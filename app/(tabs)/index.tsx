import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  TrendingUp,
  Clock,
  Star,
  Plus,
  Eye,
  Film,
  Tv,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { moviesApi, tvShowsApi, statsApi } from '@/lib/api';
import { friendsApi } from '@/lib/friends-api';
import { Database } from '@/lib/database.types';
import { useFocusEffect } from '@react-navigation/native';
import NotificationBell from '@/components/NotificationBell';

type Movie = Database['public']['Tables']['movies']['Row'];
type TVShow = Database['public']['Tables']['tv_shows']['Row'];

interface ActivityItem {
  id: string;
  item_id: string;
  title: string;
  type: 'Movie' | 'TV Show';
  action: 'watched' | 'favorited';
  date: string;
  poster: string | null;
  rating: number | null;
  year?: string | null;
  is_watched: boolean;
  is_favorite: boolean;
  is_watchlist?: boolean;
}

interface FriendActivity {
  id: string;
  item_id: string;
  friendName: string;
  friendEmail: string;
  title: string;
  type: 'Movie' | 'TV Show';
  action: 'watched' | 'favorited';
  date: string;
  poster: string | null;
  rating: number | null;
  year?: string | null;
  is_watched: boolean;
  is_favorite: boolean;
  is_watchlist?: boolean;
}

interface StatsData {
  moviesWatched: number;
  tvShows: number;
  episodes: number;
  hoursWatched: number;
  averageRating: number;
  favoriteMovies: number;
  favoriteTVShows: number;
}

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [user, setUser] = React.useState<any>(null);
  const [stats, setStats] = React.useState<StatsData>({
    moviesWatched: 0,
    tvShows: 0,
    episodes: 0,
    hoursWatched: 0,
    averageRating: 0,
    favoriteMovies: 0,
    favoriteTVShows: 0,
  });
  const [recentActivity, setRecentActivity] = React.useState<ActivityItem[]>(
    []
  );
  const [friendsActivity, setFriendsActivity] = React.useState<
    FriendActivity[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadUserData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadStats();
        loadRecentActivity();
        loadFriendsActivity();
      }
    }, [user])
  );

  const loadUserData = async () => {
    try {
      const { user } = await getCurrentUser();
      setUser(user);

      if (user) {
        try {
          await loadStats();
        } catch (error) {
          console.error('Error loading stats:', error);
        }

        try {
          await loadRecentActivity();
        } catch (error) {
          console.error('Error loading recent activity:', error);
        }

        try {
          await loadFriendsActivity();
        } catch (error) {
          console.error('Error loading friends activity:', error);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await statsApi.getStats();
      if (error) {
        console.error('Stats API error:', error);
      } else if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const activities: ActivityItem[] = [];

      const [moviesResult, tvShowsResult] = await Promise.all([
        moviesApi.getAll(),
        tvShowsApi.getAll(),
      ]);

      // Movies - watched and favorites
      if (!moviesResult.error && moviesResult.data) {
        moviesResult.data.forEach((movie: Movie) => {
          if (movie.is_watched) {
            activities.push({
              id: `movie-watched-${movie.id}`,
              item_id: movie.id,
              title: movie.title,
              type: 'Movie',
              action: 'watched',
              date: movie.updated_at,
              poster: movie.poster_url,
              rating: movie.rating,
              year: movie.year,
              is_watched: movie.is_watched,
              is_favorite: movie.is_favorite,
              is_watchlist: movie.is_watchlist,
            });
          }
          if (movie.is_favorite) {
            activities.push({
              id: `movie-favorite-${movie.id}`,
              item_id: movie.id,
              title: movie.title,
              type: 'Movie',
              action: 'favorited',
              date: movie.updated_at,
              poster: movie.poster_url,
              rating: movie.rating,
              year: movie.year,
              is_watched: movie.is_watched,
              is_favorite: movie.is_favorite,
              is_watchlist: movie.is_watchlist,
            });
          }
        });
      } else if (moviesResult.error) {
        console.error('Movies API error:', moviesResult.error);
      }

      // TV Shows - watched and favorites
      if (!tvShowsResult.error && tvShowsResult.data) {
        tvShowsResult.data.forEach((show: TVShow) => {
          if (show.is_watched) {
            activities.push({
              id: `tv-watched-${show.id}`,
              item_id: show.id,
              title: show.title,
              type: 'TV Show',
              action: 'watched',
              date: show.updated_at,
              poster: show.poster_url,
              rating: show.rating,
              year: show.year,
              is_watched: show.is_watched,
              is_favorite: show.is_favorite,
              is_watchlist: show.is_watchlist,
            });
          }
          if (show.is_favorite) {
            activities.push({
              id: `tv-favorite-${show.id}`,
              item_id: show.id,
              title: show.title,
              type: 'TV Show',
              action: 'favorited',
              date: show.updated_at,
              poster: show.poster_url,
              rating: show.rating,
              year: show.year,
              is_watched: show.is_watched,
              is_favorite: show.is_favorite,
              is_watchlist: show.is_watchlist,
            });
          }
        });
      } else if (tvShowsResult.error) {
        console.error('TV Shows API error:', tvShowsResult.error);
      }

      // Sort by date (newest first) and take first 3
      const sortedActivities = activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

      setRecentActivity(sortedActivities);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadFriendsActivity = async () => {
    try {
      // Get accepted friends
      const { data: friends, error: friendsError } =
        await friendsApi.getAcceptedFriends();
      if (friendsError || !friends) {
        if (friendsError) {
          console.error('Error loading friends:', friendsError);
        }
        return;
      }
      const allFriendsActivity: FriendActivity[] = [];

      // Get activity for each friend
      for (const friend of friends) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) continue;

        const friendId =
          friend.user_id === user.id ? friend.friend_id : friend.user_id;
        const friendEmail =
          friend.user_id === user.id
            ? friend.friend_email
            : friend.requesting_email;
        const friendName = friendEmail?.split('@')[0] || 'Unknown';

        try {
          // Get friend's movies and TV shows
          const [moviesResult, tvShowsResult] = await Promise.all([
            friendsApi.getFriendMovies(friendId),
            friendsApi.getFriendTVShows(friendId),
          ]);

          // Process movies
          if (!moviesResult.error && moviesResult.data) {
            const movies = moviesResult.data as Movie[]; // Type assertion to ensure it's treated as an array
            movies.forEach((movie: Movie) => {
              if (movie.is_watched) {
                allFriendsActivity.push({
                  id: `friend-movie-${friendId}-${movie.id}`,
                  item_id: movie.id,
                  friendName,
                  friendEmail,
                  title: movie.title,
                  type: 'Movie',
                  action: 'watched',
                  date: new Date().toISOString(),
                  poster: movie.poster_url,
                  rating: movie.rating,
                  year: movie.year,
                  is_watched: movie.is_watched,
                  is_favorite: movie.is_favorite,
                  is_watchlist: movie.is_watchlist,
                });
              }
              if (movie.is_favorite) {
                allFriendsActivity.push({
                  id: `friend-movie-fav-${friendId}-${movie.id}`,
                  item_id: movie.id,
                  friendName,
                  friendEmail,
                  title: movie.title,
                  type: 'Movie',
                  action: 'favorited',
                  date: new Date().toISOString(),
                  poster: movie.poster_url,
                  rating: movie.rating,
                  year: movie.year,
                  is_watched: movie.is_watched,
                  is_favorite: movie.is_favorite,
                  is_watchlist: movie.is_watchlist,
                });
              }
            });
          }

          // Process TV shows
          if (!tvShowsResult.error && tvShowsResult.data) {
            const tvShows = tvShowsResult.data as TVShow[]; // Ensure correct typing
            tvShows.forEach((show: TVShow) => {
              if (show.is_watched) {
                allFriendsActivity.push({
                  id: `friend-tv-${friendId}-${show.id}`,
                  item_id: show.id,
                  friendName,
                  friendEmail,
                  title: show.title,
                  type: 'TV Show',
                  action: 'watched',
                  date: new Date().toISOString(),
                  poster: show.poster_url,
                  rating: show.rating,
                  year: show.year,
                  is_watched: show.is_watched,
                  is_favorite: show.is_favorite,
                  is_watchlist: show.is_watchlist,
                });
              }
              if (show.is_favorite) {
                allFriendsActivity.push({
                  id: `friend-tv-fav-${friendId}-${show.id}`,
                  item_id: show.id,
                  friendName,
                  friendEmail,
                  title: show.title,
                  type: 'TV Show',
                  action: 'favorited',
                  date: new Date().toISOString(),
                  poster: show.poster_url,
                  rating: show.rating,
                  year: show.year,
                  is_watched: show.is_watched,
                  is_favorite: show.is_favorite,
                  is_watchlist: show.is_watchlist,
                });
              }
            });
          }
        } catch (friendError) {
          console.error(
            `Error loading activity for friend ${friendId}:`,
            friendError
          );
        }
      }

      // Sort by date and take first 3
      const sortedActivity = allFriendsActivity
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

      setFriendsActivity(sortedActivity);
    } catch (error) {
      console.error('Error loading friends activity:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'today';
    if (diffDays === 2) return 'yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  interface StatCardData {
    label: string;
    value: string;
    icon: any;
    color: string;
  }
  const statsData: StatCardData[] = [
    {
      label: 'Movies Watched',
      value: stats.moviesWatched.toString(),
      icon: Film,
      color: '#EF4444',
    },
    {
      label: 'TV Shows',
      value: stats.tvShows.toString(),
      icon: Tv,
      color: '#10B981',
    },
    {
      label: 'Hours Watched',
      value: `${stats.hoursWatched}h`,
      icon: Clock,
      color: '#F59E0B',
    },
    {
      label: 'Average Rating',
      value: stats.averageRating > 0 ? stats.averageRating.toString() : '0',
      icon: Star,
      color: '#8B5CF6',
    },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.greeting}>
                  {user
                    ? `Welcome back, ${
                        user.user_metadata?.username ||
                        user.email?.split('@')[0]
                      }!`
                    : 'Welcome to WatchTracker!'}
                </Text>
                <Text style={styles.subtitle}>
                  What would you like to watch today?
                </Text>
              </View>
              {user && <NotificationBell />}
            </View>

            {!user && (
              <TouchableOpacity
                style={styles.authButton}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.authButtonText}>Sign In / Sign Up</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statsContainer}>
            <Text style={styles.sectionTitle}>Your Stats</Text>
            <View style={styles.statsGrid}>
              {statsData.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View
                    style={[
                      styles.statIcon,
                      { backgroundColor: `${stat.color}20` },
                    ]}
                  >
                    <stat.icon size={24} color={stat.color} strokeWidth={2} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {recentActivity.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>

              {recentActivity.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.activityCard}
                  onPress={() => {
                    const detailPath =
                      item.type === 'Movie'
                        ? '/movie-detail'
                        : '/tv-show-detail';
                    router.push({
                      pathname: detailPath,
                      params: {
                        id: item.item_id,
                        title: item.title,
                        year: item.year || '',
                        poster_url: item.poster || '',
                        is_watched: item.is_watched.toString(),
                        is_favorite: item.is_favorite.toString(),
                        is_watchlist: item.is_watchlist?.toString() || 'false',
                        rating: item.rating?.toString() || '0',
                        inCollection: 'true',
                      },
                    });
                  }}
                >
                  <View style={styles.activityPoster}>
                    {item.poster ? (
                      <Image
                        source={{ uri: item.poster }}
                        style={styles.activityPosterImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.activityPosterPlaceholder}>
                        {item.type === 'Movie' ? (
                          <Film size={20} color="#9CA3AF" strokeWidth={1.5} />
                        ) : (
                          <Tv size={20} color="#9CA3AF" strokeWidth={1.5} />
                        )}
                      </View>
                    )}
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activityType}>{item.type}</Text>
                    <Text style={styles.activityAction}>
                      {item.action === 'watched'
                        ? 'izlendi'
                        : 'favoriye eklendi'}{' '}
                      - {formatDate(item.date)}
                    </Text>
                    {item.rating != null && item.rating > 0 && (
                      <View style={styles.activityRating}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            color={
                              item.rating != null && i < item.rating
                                ? '#F59E0B'
                                : '#374151'
                            }
                            fill={
                              item.rating != null && i < item.rating
                                ? '#F59E0B'
                                : 'transparent'
                            }
                            strokeWidth={1.5}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {friendsActivity.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Friends Activity</Text>
              <View style={styles.friendsActivity}>
                {friendsActivity.map((activity, index) => (
                  <TouchableOpacity
                    key={activity.id}
                    style={styles.friendActivityCard}
                    onPress={() => {
                      const detailPath =
                        activity.type === 'Movie'
                          ? '/movie-detail'
                          : '/tv-show-detail';
                      router.push({
                        pathname: detailPath,
                        params: {
                          id: activity.item_id,
                          title: activity.title,
                          year: activity.year || '',
                          poster_url: activity.poster || '',
                          is_watched: activity.is_watched.toString(),
                          is_favorite: activity.is_favorite.toString(),
                          is_watchlist:
                            activity.is_watchlist?.toString() || 'false',
                          rating: activity.rating?.toString() || '0',
                          inCollection: 'true',
                        },
                      });
                    }}
                  >
                    <View
                      style={[
                        styles.friendAvatar,
                        {
                          backgroundColor: [
                            '#6366F1',
                            '#10B981',
                            '#F59E0B',
                            '#EF4444',
                            '#8B5CF6',
                          ][index % 5],
                        },
                      ]}
                    >
                      <Text style={styles.friendInitial}>
                        {activity.friendName?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View style={styles.friendActivityContent}>
                      <Text style={styles.friendName}>
                        {activity.friendName}
                      </Text>
                      <Text style={styles.friendActivity}>
                        {activity.title} {activity.action} -{' '}
                        {formatDate(activity.date)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  authButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  authButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6366F1',
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  activityPoster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    marginRight: 16,
    overflow: 'hidden',
  },
  activityPosterImage: {
    width: '100%',
    height: '100%',
  },
  activityPosterPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  activityType: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  activityAction: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 8,
  },
  activityRating: {
    flexDirection: 'row',
    gap: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  friendsActivity: {
    gap: 12,
  },
  friendActivityCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendInitial: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  friendActivityContent: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  friendActivity: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  bottomSpacer: {
    height: 40,
  },
});
