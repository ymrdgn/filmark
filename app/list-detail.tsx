import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Heart, Eye, Star, Calendar, Film, Tv } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { moviesApi, tvShowsApi } from '@/lib/api';

const { width } = Dimensions.get('window');
const cardWidth = (width - 72) / 2;

export default function ListDetailScreen() {
  const params = useLocalSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const listType = params.type as string;
  const listTitle = params.title as string;

  useEffect(() => {
    loadListItems();
  }, []);

  const loadListItems = async () => {
    try {
      const [moviesResult, tvShowsResult] = await Promise.all([
        moviesApi.getAll(),
        tvShowsApi.getAll()
      ]);

      let filteredItems = [];

      if (listType === 'favorites') {
        const favoriteMovies = moviesResult.data?.filter(m => m.is_favorite) || [];
        const favoriteTVShows = tvShowsResult.data?.filter(s => s.is_favorite) || [];
        filteredItems = [
          ...favoriteMovies.map(m => ({ ...m, type: 'Movie' })),
          ...favoriteTVShows.map(s => ({ ...s, type: 'TV Show' }))
        ];
      } else if (listType === 'watched') {
        const watchedMovies = moviesResult.data?.filter(m => m.is_watched) || [];
        const watchedTVShows = tvShowsResult.data?.filter(s => s.is_watched) || [];
        filteredItems = [
          ...watchedMovies.map(m => ({ ...m, type: 'Movie' })),
          ...watchedTVShows.map(s => ({ ...s, type: 'TV Show' }))
        ];
      }

      // Sort by updated_at (newest first)
      filteredItems.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      setItems(filteredItems);
    } catch (error) {
      console.error('Error loading list items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item) => {
    if (item.type === 'Movie') {
      router.push({
        pathname: '/movie-detail',
        params: {
          id: item.id,
          title: item.title,
          year: item.year,
          poster_url: item.poster_url,
          is_watched: item.is_watched,
          is_favorite: item.is_favorite,
          rating: item.rating
        }
      });
    } else {
      router.push({
        pathname: '/tv-show-detail',
        params: {
          id: item.id,
          title: item.title,
          year: item.year,
          poster_url: item.poster_url,
          is_watched: item.is_watched,
          is_favorite: item.is_favorite,
          rating: item.rating,
          seasons: item.seasons,
          episodes: item.episodes,
          current_season: item.current_season,
          current_episode: item.current_episode
        }
      });
    }
  };

  const renderItemCard = (item) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.itemCard}
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
              <Film size={24} color="#9CA3AF" strokeWidth={1.5} />
            ) : (
              <Tv size={24} color="#9CA3AF" strokeWidth={1.5} />
            )}
          </View>
        )}
        
        <View style={styles.badgeContainer}>
          {listType === 'favorites' && (
            <View style={styles.favoriteBadge}>
              <Heart size={14} color="#EF4444" fill="#EF4444" strokeWidth={1} />
            </View>
          )}
          {listType === 'watched' && (
            <View style={styles.watchedBadge}>
              <Eye size={14} color="#10B981" strokeWidth={2} />
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.itemMeta}>
          <Text style={styles.itemType}>{item.type}</Text>
          {item.year && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.itemYear}>{item.year}</Text>
            </>
          )}
        </View>
        
        {item.rating > 0 && (
          <View style={styles.rating}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                color={i < item.rating ? '#F59E0B' : '#374151'}
                fill={i < item.rating ? '#F59E0B' : 'transparent'}
                strokeWidth={1}
              />
            ))}
          </View>
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="white" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{listTitle}</Text>
            <Text style={styles.subtitle}>{items.length} items</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : items.length > 0 ? (
            <View style={styles.itemsGrid}>
              {items.map(renderItemCard)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No items in this list</Text>
              <Text style={styles.emptyStateSubtext}>
                {listType === 'favorites' 
                  ? 'Add some movies or shows to favorites to see them here'
                  : 'Mark some movies or shows as watched to see them here'
                }
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
    paddingTop: 16,
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
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 24,
  },
  itemCard: {
    width: cardWidth,
    marginBottom: 24,
  },
  posterContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  poster: {
    width: '100%',
    height: cardWidth * 1.5,
    borderRadius: 12,
  },
  posterPlaceholder: {
    width: '100%',
    height: cardWidth * 1.5,
    backgroundColor: '#374151',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  favoriteBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
    lineHeight: 20,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemType: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
  separator: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginHorizontal: 6,
  },
  itemYear: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
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