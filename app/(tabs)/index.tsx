import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Clock, Star, Plus, Eye, Film, Tv } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { moviesApi, tvShowsApi, statsApi } from '@/lib/api';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [user, setUser] = React.useState(null);
  const [stats, setStats] = React.useState({
    moviesWatched: 0,
    tvShows: 0,
    episodes: 0,
    hoursWatched: 0,
    averageRating: 0,
    favoriteMovies: 0,
    favoriteTVShows: 0
  });
  const [recentActivity, setRecentActivity] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { user } = await getCurrentUser();
      setUser(user);
      
      if (user) {
        await Promise.all([
          loadStats(),
          loadRecentActivity()
        ]);
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
      if (!error && data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const [moviesResult, tvShowsResult] = await Promise.all([
        moviesApi.getAll(),
        tvShowsApi.getAll()
      ]);

      const activities = [];

      // Movies - watched and favorites
      if (moviesResult.data) {
        moviesResult.data.forEach(movie => {
          if (movie.is_watched) {
            activities.push({
              id: `movie-watched-${movie.id}`,
              title: movie.title,
              type: 'Movie',
              action: 'watched',
              date: movie.updated_at,
              poster: movie.poster_url,
              rating: movie.rating
            });
          }
          if (movie.is_favorite) {
            activities.push({
              id: `movie-favorite-${movie.id}`,
              title: movie.title,
              type: 'Movie',
              action: 'favorited',
              date: movie.updated_at,
              poster: movie.poster_url,
              rating: movie.rating
            });
          }
        });
      }

      // TV Shows - watched and favorites
      if (tvShowsResult.data) {
        tvShowsResult.data.forEach(show => {
          if (show.is_watched) {
            activities.push({
              id: `tv-watched-${show.id}`,
              title: show.title,
              type: 'TV Show',
              action: 'watched',
              date: show.updated_at,
              poster: show.poster_url,
              rating: show.rating
            });
          }
          if (show.is_favorite) {
            activities.push({
              id: `tv-favorite-${show.id}`,
              title: show.title,
              type: 'TV Show',
              action: 'favorited',
              date: show.updated_at,
              poster: show.poster_url,
              rating: show.rating
            });
          }
        });
      }

      // Sort by date (newest first) and take first 10
      const sortedActivities = activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      setRecentActivity(sortedActivities);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const statsData = [
    { label: 'Movies Watched', value: stats.moviesWatched.toString(), icon: Film, color: '#EF4444' },
    { label: 'TV Shows', value: stats.tvShows.toString(), icon: Tv, color: '#10B981' },
    { label: 'Hours Watched', value: `${stats.hoursWatched}h`, icon: Clock, color: '#F59E0B' },
    { label: 'Average Rating', value: stats.averageRating > 0 ? stats.averageRating.toString() : '0', icon: Star, color: '#8B5CF6' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1F2937', '#111827']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.greeting}>
              {user ? `Welcome back, ${user.email?.split('@')[0]}!` : 'Welcome to WatchTracker!'}
            </Text>
            <Text style={styles.subtitle}>What would you like to watch today?</Text>
            
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
                  <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
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
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              
              {recentActivity.map((item, index) => (
                <View key={item.id} style={styles.activityCard}>
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
                      {item.action === 'watched' ? '📺 Watched' : '❤️ Added to favorites'} • {formatDate(item.date)}
                    </Text>
                    {item.rating > 0 && (
                      <View style={styles.activityRating}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            color={i < item.rating ? '#F59E0B' : '#374151'}
                            fill={i < item.rating ? '#F59E0B' : 'transparent'}
                            strokeWidth={1.5}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionButton}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  style={styles.actionGradient}
                >
                  <Plus size={24} color="white" strokeWidth={2} />
                  <Text style={styles.actionText}>Add to Watchlist</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <View style={styles.actionSecondary}>
                  <TrendingUp size={24} color="#6366F1" strokeWidth={2} />
                  <Text style={styles.actionTextSecondary}>Discover Trending</Text>
                </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 16,
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
    marginBottom: 20,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6366F1',
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
    fontSize: 12,
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