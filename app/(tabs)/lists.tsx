import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookMarked, Heart, Clock, Star, Film, Tv } from 'lucide-react-native';
import { router } from 'expo-router';
import { moviesApi, tvShowsApi } from '@/lib/api';

export default function ListsScreen() {
  const [favorites, setFavorites] = useState([]);
  const [watchedItems, setWatchedItems] = useState([]);
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const [moviesResult, tvShowsResult] = await Promise.all([
        moviesApi.getAll(),
        tvShowsApi.getAll()
      ]);

      // Favorites
      const favoriteMovies = moviesResult.data?.filter(m => m.is_favorite) || [];
      const favoriteTVShows = tvShowsResult.data?.filter(s => s.is_favorite) || [];
      const allFavorites = [
        ...favoriteMovies.map(m => ({ ...m, type: 'Movie' })),
        ...favoriteTVShows.map(s => ({ ...s, type: 'TV Show' }))
      ];
      setFavorites(allFavorites);

      // Watched
      const watchedMovies = moviesResult.data?.filter(m => m.is_watched) || [];
      const watchedTVShows = tvShowsResult.data?.filter(s => s.is_watched) || [];
      const allWatched = [
        ...watchedMovies.map(m => ({ ...m, type: 'Movie' })),
        ...watchedTVShows.map(s => ({ ...s, type: 'TV Show' }))
      ];
      setWatchedItems(allWatched);

      // Watchlist
      const watchlistMovies = moviesResult.data?.filter(m => m.is_watchlist) || [];
      const watchlistTVShows = tvShowsResult.data?.filter(s => s.is_watchlist) || [];
      const allWatchlist = [
        ...watchlistMovies.map(m => ({ ...m, type: 'Movie' })),
        ...watchlistTVShows.map(s => ({ ...s, type: 'TV Show' }))
      ];
      setWatchlistItems(allWatchlist);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const lists = [
    {
      id: 1,
      name: 'Favorites',
      description: 'My all-time favorite movies and shows',
      icon: Heart,
      color: '#EF4444',
      itemCount: favorites.length,
      items: favorites.slice(0, 3).map(item => item.title),
      type: 'system'
    },
    {
      id: 2,
      name: 'Watched',
      description: 'Movies and shows I have watched',
      icon: Clock,
      color: '#10B981',
      itemCount: watchedItems.length,
      items: watchedItems.slice(0, 3).map(item => item.title),
      type: 'system'
    },
    {
      id: 3,
      name: 'Watchlist',
      description: 'Movies and shows I want to watch',
      icon: Plus,
      color: '#8B5CF6',
      itemCount: watchlistItems.length,
      items: watchlistItems.slice(0, 3).map(item => item.title),
      type: 'system'
    },
  ];

  const renderListCard = (list) => (
    <TouchableOpacity 
      key={list.id} 
      style={styles.listCard}
      onPress={() => {
        if (list.name === 'Favorites') {
          router.push('/list-detail?type=favorites&title=Favorites');
        } else if (list.name === 'Watched') {
          router.push('/list-detail?type=watched&title=Watched');
        } else if (list.name === 'Watchlist') {
          router.push('/list-detail?type=watchlist&title=Watchlist');
        }
      }}
    >
      <View style={styles.listHeader}>
        <View style={[styles.listIcon, { backgroundColor: `${list.color}20` }]}>
          <list.icon size={24} color={list.color} strokeWidth={2} />
        </View>
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{list.name}</Text>
          <Text style={styles.listDescription}>{list.description}</Text>
          <Text style={styles.itemCount}>{list.itemCount} items</Text>
        </View>
      </View>
      
      <View style={styles.listPreview}>
        {list.items.slice(0, 3).map((item, index) => (
          <View key={index} style={styles.previewItem}>
            <Text style={styles.previewText} numberOfLines={1}>{item}</Text>
          </View>
        ))}
        {list.itemCount > 3 && (
          <Text style={styles.moreItems}>+{list.itemCount - 3} more</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Lists</Text>
          <Text style={styles.subtitle}>{favorites.length + watchedItems.length + watchlistItems.length} items in your lists</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.listsContainer}>
            {lists.map(renderListCard)}
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
    padding: 24,
    paddingTop: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  scrollView: {
    flex: 1,
  },
  listsContainer: {
    paddingHorizontal: 24,
  },
  listCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  listIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  listDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 6,
    lineHeight: 18,
  },
  itemCount: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  listPreview: {
    gap: 8,
  },
  previewItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  previewText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
  },
  moreItems: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});