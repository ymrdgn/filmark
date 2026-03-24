import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookMarked,
  Heart,
  Clock,
  Star,
  Film,
  Tv,
  Plus,
  LucideIcon,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { moviesApi, tvShowsApi } from '@/lib/api';
import { Database } from '@/lib/database.types';

type Movie = Database['public']['Tables']['movies']['Row'];
type TVShow = Database['public']['Tables']['tv_shows']['Row'];
type ContentItem = (Movie | TVShow) & { type: 'Movie' | 'TV Show' };

interface ListData {
  id: number;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  itemCount: number;
  items: string[];
  type: string;
}

export default function ListsScreen() {
  const { t } = useTranslation();
  const [favorites, setFavorites] = useState<ContentItem[]>([]);
  const [watchedItems, setWatchedItems] = useState<ContentItem[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const [moviesResult, tvShowsResult] = await Promise.all([
        moviesApi.getAll(),
        tvShowsApi.getAll(),
      ]);

      // Favorites
      const favoriteMovies =
        (moviesResult.data as Movie[])?.filter((m) => m.is_favorite) || [];
      const favoriteTVShows =
        (tvShowsResult.data as TVShow[])?.filter((s) => s.is_favorite) || [];
      const allFavorites: ContentItem[] = [
        ...favoriteMovies.map((m) => ({ ...m, type: 'Movie' as const })),
        ...favoriteTVShows.map((s) => ({ ...s, type: 'TV Show' as const })),
      ];
      setFavorites(allFavorites);

      // Watched
      const watchedMovies =
        (moviesResult.data as Movie[])?.filter((m) => m.is_watched) || [];
      const watchedTVShows =
        (tvShowsResult.data as TVShow[])?.filter((s) => s.is_watched) || [];
      const allWatched: ContentItem[] = [
        ...watchedMovies.map((m) => ({ ...m, type: 'Movie' as const })),
        ...watchedTVShows.map((s) => ({ ...s, type: 'TV Show' as const })),
      ];
      setWatchedItems(allWatched);

      // Watchlist
      const watchlistMovies =
        (moviesResult.data as Movie[])?.filter((m) => m.is_watchlist) || [];
      const watchlistTVShows =
        (tvShowsResult.data as TVShow[])?.filter((s) => s.is_watchlist) || [];
      const allWatchlist: ContentItem[] = [
        ...watchlistMovies.map((m) => ({ ...m, type: 'Movie' as const })),
        ...watchlistTVShows.map((s) => ({ ...s, type: 'TV Show' as const })),
      ];
      setWatchlistItems(allWatchlist);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const lists: ListData[] = [
    {
      id: 1,
      name: t('lists.favorites'),
      description: t('lists.favoritesDescription'),
      icon: Heart,
      color: '#EF4444',
      itemCount: favorites.length,
      items: favorites.slice(0, 3).map((item) => item.title),
      type: 'system',
    },
    {
      id: 2,
      name: t('lists.watched'),
      description: t('lists.watchedDescription'),
      icon: Clock,
      color: '#10B981',
      itemCount: watchedItems.length,
      items: watchedItems.slice(0, 3).map((item) => item.title),
      type: 'system',
    },
    {
      id: 3,
      name: t('lists.watchlist'),
      description: t('lists.watchlistDescription'),
      icon: Plus,
      color: '#8B5CF6',
      itemCount: watchlistItems.length,
      items: watchlistItems.slice(0, 3).map((item) => item.title),
      type: 'system',
    },
  ];

  const renderListCard = (list: ListData) => {
    const getFriendlyType = () => {
      if (list.id === 1) return 'favorites';
      if (list.id === 2) return 'watched';
      if (list.id === 3) return 'watchlist';
      return 'custom';
    };

    return (
      <TouchableOpacity
        key={list.id}
        style={styles.listCard}
        onPress={() => {
          const type = getFriendlyType();
          router.push(
            `/list-detail?type=${type}&title=${encodeURIComponent(list.name)}`,
          );
        }}
      >
        <View style={styles.listHeader}>
          <View
            style={[styles.listIcon, { backgroundColor: `${list.color}20` }]}
          >
            <list.icon size={24} color={list.color} strokeWidth={2} />
          </View>
          <View style={styles.listInfo}>
            <Text style={styles.listName}>{list.name}</Text>
            <Text style={styles.listDescription}>{list.description}</Text>
            <Text style={styles.itemCount}>
              {t('lists.items', { count: list.itemCount })}
            </Text>
          </View>
        </View>

        <View style={styles.listPreview}>
          {list.items.slice(0, 3).map((item, index) => (
            <View key={index} style={styles.previewItem}>
              <Text style={styles.previewText} numberOfLines={1}>
                {item}
              </Text>
            </View>
          ))}
          {list.itemCount > 3 && (
            <Text style={styles.moreItems}>
              {t('lists.more', { count: list.itemCount - 3 })}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('lists.title')}</Text>
          <Text style={styles.subtitle}>
            {t('lists.subtitle', {
              count:
                favorites.length + watchedItems.length + watchlistItems.length,
            })}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.listsContainer}>{lists.map(renderListCard)}</View>

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
    paddingTop: 60,
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
