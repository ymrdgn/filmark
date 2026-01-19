import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Heart, Star, Film, Tv } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { moviesApi, tvShowsApi } from '@/lib/api';
import { Database } from '@/lib/database.types';

type Movie = Database['public']['Tables']['movies']['Row'];
type TVShow = Database['public']['Tables']['tv_shows']['Row'];

type MediaItem = (Movie | TVShow) & {
  type: 'Movie' | 'TV Show';
};

export default function ListDetailScreen() {
  const params = useLocalSearchParams();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const listType = params.type as string;
  const listTitle = params.title as string;

  useEffect(() => {
    loadListItems();
  }, []);

  const loadListItems = async () => {
    try {
      const [moviesResult, tvShowsResult] = await Promise.all([
        moviesApi.getAll(),
        tvShowsApi.getAll(),
      ]);

      let filteredItems: MediaItem[] = [];

      if (listType === 'favorites') {
        const favoriteMovies =
          (moviesResult.data as Movie[])?.filter((m) => m.is_favorite) || [];
        const favoriteTVShows =
          (tvShowsResult.data as TVShow[])?.filter((s) => s.is_favorite) || [];
        filteredItems = [
          ...favoriteMovies.map((m) => ({ ...m, type: 'Movie' as const })),
          ...favoriteTVShows.map((s) => ({ ...s, type: 'TV Show' as const })),
        ];
      } else if (listType === 'watched') {
        const watchedMovies =
          (moviesResult.data as Movie[])?.filter((m) => m.is_watched) || [];
        const watchedTVShows =
          (tvShowsResult.data as TVShow[])?.filter((s) => s.is_watched) || [];
        filteredItems = [
          ...watchedMovies.map((m) => ({ ...m, type: 'Movie' as const })),
          ...watchedTVShows.map((s) => ({ ...s, type: 'TV Show' as const })),
        ];
      } else if (listType === 'watchlist') {
        const watchlistMovies =
          (moviesResult.data as Movie[])?.filter((m) => m.is_watchlist) || [];
        const watchlistTVShows =
          (tvShowsResult.data as TVShow[])?.filter((s) => s.is_watchlist) || [];
        filteredItems = [
          ...watchlistMovies.map((m) => ({ ...m, type: 'Movie' as const })),
          ...watchlistTVShows.map((s) => ({ ...s, type: 'TV Show' as const })),
        ];
      }

      // Sort by updated_at (newest first)
      filteredItems.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
      setItems(filteredItems);
    } catch (error) {
      console.error('Error loading list items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (item: MediaItem) => {
    setUpdatingItemId(item.id);
    try {
      const newFavoriteStatus = !item.is_favorite;
      let error;

      if (item.type === 'Movie') {
        const result = await moviesApi.update(item.id, {
          is_favorite: newFavoriteStatus,
        });
        error = result.error;
      } else {
        const result = await tvShowsApi.update(item.id, {
          is_favorite: newFavoriteStatus,
        });
        error = result.error;
      }

      if (error) {
        Alert.alert('Error', 'Failed to update favorite status.');
      } else {
        // Update local state
        setItems((prevItems) =>
          prevItems.map((prevItem) =>
            prevItem.id === item.id
              ? { ...prevItem, is_favorite: newFavoriteStatus }
              : prevItem,
          ),
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleItemPress = (item: MediaItem) => {
    if (item.type === 'Movie') {
      router.push({
        pathname: '/movie-detail',
        params: {
          id: item.id,
          title: item.title,
          year: item.year,
          poster_url: item.poster_url,
          is_watched: String(item.is_watched),
          is_favorite: String(item.is_favorite),
          rating: item.rating,
        },
      });
    } else {
      router.push({
        pathname: '/tv-show-detail',
        params: {
          id: item.id,
          title: item.title,
          year: item.year,
          poster_url: item.poster_url,
          is_watched: String(item.is_watched),
          is_favorite: String(item.is_favorite),
          rating: item.rating,
          inCollection: 'true',
        },
      });
    }
  };

  const renderListItem = (item: MediaItem) => (
    <View key={item.id} style={styles.listItem}>
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => handleItemPress(item)}
      >
        <View style={styles.posterContainer}>
          {item.poster_url ? (
            <Image
              source={{ uri: item.poster_url }}
              style={styles.poster}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.posterPlaceholder}>
              {item.type === 'Movie' ? (
                <Film size={20} color="#9CA3AF" strokeWidth={1.5} />
              ) : (
                <Tv size={20} color="#9CA3AF" strokeWidth={1.5} />
              )}
            </View>
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.itemMeta}>
            <Text style={styles.itemType}>{item.type}</Text>
            {item.year && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.itemYear}>{item.year}</Text>
              </>
            )}
          </View>

          {item.rating && item.rating > 0 && (
            <View style={styles.rating}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  color={i < (item.rating || 0) ? '#F59E0B' : '#374151'}
                  fill={i < (item.rating || 0) ? '#F59E0B' : 'transparent'}
                  strokeWidth={1}
                />
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Favorite button - only show for watched list */}
      {listType === 'watched' && (
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => handleToggleFavorite(item)}
          disabled={updatingItemId === item.id}
        >
          <Heart
            size={20}
            color="#EF4444"
            fill={item.is_favorite ? '#EF4444' : 'transparent'}
            strokeWidth={2}
          />
        </TouchableOpacity>
      )}
    </View>
  );

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
            <Text style={styles.title}>{listTitle}</Text>
            <Text style={styles.subtitle}>{items.length} items</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : items.length > 0 ? (
            <View style={styles.itemsList}>{items.map(renderListItem)}</View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No items in this list</Text>
              <Text style={styles.emptyStateSubtext}>
                {listType === 'favorites'
                  ? 'Add some movies or shows to favorites to see them here'
                  : listType === 'watched'
                    ? 'Mark some movies or shows as watched to see them here'
                    : 'Add some movies or shows to your watchlist to see them here'}
              </Text>
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
    paddingBottom: 24,
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
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
    marginBottom: 6,
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
  rating: {
    flexDirection: 'row',
    gap: 3,
  },
  favoriteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
