import React from 'react';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Settings, Star, TrendingUp, Award, Clock, Film, Tv, Heart, LogOut, Users, Plus } from 'lucide-react-native';
import { signOut, getCurrentUser } from '@/lib/supabase';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { statsApi, achievementsApi } from '@/lib/api';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    moviesWatched: 0,
    tvShows: 0,
    episodes: 0,
    hoursWatched: 0,
    averageRating: 0,
    favoriteMovies: 0,
    favoriteTVShows: 0
  });
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { user } = await getCurrentUser();
      setUser(user);
      
      if (user) {
        const [statsResult, achievementsResult] = await Promise.all([
          statsApi.getStats(),
          achievementsApi.getAchievementsWithProgress()
        ]);
        
        if (!statsResult.error && statsResult.data) {
          setStats(statsResult.data);
        }
        
        if (!achievementsResult.error && achievementsResult.data) {
          setAchievements(achievementsResult.data);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    
    // If no error or if the error indicates user doesn't exist (already logged out)
    if (!error || 
        error.message?.includes('User from sub claim in JWT does not exist') ||
        error.message?.includes('user_not_found')) {
      router.replace('/(auth)/login');
    } else {
      // For other types of errors, show an alert
      Alert.alert(
        'Sign Out Failed',
        'There was an error signing out. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const statsData = [
    { label: 'Movies Watched', value: stats.moviesWatched.toString(), icon: Film, color: '#EF4444' },
    { label: 'TV Shows', value: stats.tvShows.toString(), icon: Tv, color: '#10B981' },
    { label: 'Hours Watched', value: `${stats.hoursWatched}h`, icon: Clock, color: '#F59E0B' },
    { label: 'Favorites', value: (stats.favoriteMovies + stats.favoriteTVShows).toString(), icon: Heart, color: '#EC4899' },
  ];

  // Map icon names to components
  const iconMap = {
    Award,
    Tv,
    Star,
    TrendingUp,
    Film,
    Heart,
    Plus,
    Clock
  };

  const menuItems = [
    { label: 'Friends', icon: Users, color: '#10B981', onPress: () => router.push('/friends') },
    { label: 'Account Settings', icon: Settings, color: '#6366F1' },
    { label: 'Privacy Settings', icon: User, color: '#8B5CF6' },
    { label: 'Export Data', icon: TrendingUp, color: '#10B981' },
    { label: 'Sign Out', icon: LogOut, color: '#EF4444', onPress: handleSignOut },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1F2937', '#111827']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading profile...</Text>
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
            <View style={styles.avatar}>
              <User size={48} color="#6366F1" strokeWidth={1.5} />
            </View>
            <Text style={styles.name}>
              {user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={styles.email}>{user?.email || 'No email'}</Text>
            <Text style={styles.joinDate}>
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
              }) : 'Unknown'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Stats</Text>
            <View style={styles.statsContainer}>
              {statsData.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={[styles.statIcon, { backgroundColor: `${stat.color}20` }]}>
                    <stat.icon size={20} color={stat.color} strokeWidth={2} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.achievementsContainer}>
              {achievements.map((achievement, index) => (
                <View key={achievement.id} style={[styles.achievementCard, !achievement.earned && styles.achievementLocked]}>
                  <View style={[
                    styles.achievementIcon, 
                    { backgroundColor: achievement.earned ? '#10B98120' : '#37415120' }
                  ]}>
                    {React.createElement(iconMap[achievement.icon] || Award, {
                      size: 24,
                      color: achievement.earned ? '#10B981' : '#6B7280',
                      strokeWidth: 2
                    })}
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={[
                      styles.achievementName,
                      !achievement.earned && styles.achievementNameLocked
                    ]}>
                      {achievement.name}
                    </Text>
                    <Text style={styles.achievementDescription}>
                      {achievement.description}
                    </Text>
                  </View>
                  {achievement.earned && (
                    <View style={styles.achievementBadge}>
                      <Text style={styles.achievementBadgeText}>✓</Text>
                    </View>
                  )}
                  {achievement.earned && achievement.earned_at && (
                    <Text style={styles.achievementDate}>
                      {new Date(achievement.earned_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => (
                <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                    <item.icon size={20} color={item.color} strokeWidth={2} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
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
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#6366F1',
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  joinDate: {
    fontSize: 14,
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
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
  achievementsContainer: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  achievementNameLocked: {
    color: '#9CA3AF',
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  achievementBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementBadgeText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  achievementDate: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    position: 'absolute',
    top: 8,
    right: 8,
  },
  menuContainer: {
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
  },
  bottomSpacer: {
    height: 40,
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
});