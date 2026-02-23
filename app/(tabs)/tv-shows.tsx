import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Star,
  Calendar,
  Plus,
  Check,
  Heart,
  Play,
  Eye,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { tvShowsApi } from '@/lib/api';
import {
  searchTVShows,
  TMDBTVShow,
  getImageUrl,
  getPopularTVShows,
} from '@/lib/tmdb';
import { useFocusEffect } from '@react-navigation/native';
import Toast from '@/components/Toast';
import { DEMO_MODE, demoTVShows, demoTMDBTVShows } from '@/lib/demo-data';

const { width } = Dimensions.get('window');
const cardWidth = (width - 72) / 2;

export default function TVShowsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [myTVShows, setMyTVShows] = useState<any[]>([]);
  const [tmdbTVShows, setTMDBTVShows] = useState<TMDBTVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tmdbLoading, setTMDBLoading] = useState(false);
  const [addingShowId, setAddingShowId] = useState<number | null>(null);
  const [updatingShowId, setUpdatingShowId] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>(
    'success',
  );
  const scrollViewRef = React.useRef<ScrollView>(null);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    loadMyTVShows();
    loadPopularTVShows();

    // Set up global refresh function
    global.refreshTVShows = () => {
      loadMyTVShows();
    };

    return () => {
      global.refreshTVShows = undefined;
    };
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadMyTVShows();
      setSearchQuery(''); // Tab değişiminde search'ü temizle
      loadPopularTVShows(); // All tab'a dönünce popüler dizileri yükle
      scrollViewRef.current?.scrollTo({ y: 0, animated: true }); // En üste kaydır
    }, []),
  );

  // Filter tab'ı değişince search'ü temizle ve scroll'u sıfırla
  useEffect(() => {
    setSearchQuery('');
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    // All tab'ına dönünce popüler dizileri yükle
    if (filter === 'all') {
      loadPopularTVShows();
    }
  }, [filter]);

  const loadMyTVShows = async () => {
    // If demo mode is enabled, use demo data
    if (DEMO_MODE) {
      setMyTVShows(demoTVShows as any);
      setLoading(false);
      return;
    }

    // Check if Supabase is properly configured
    if (
      !process.env.EXPO_PUBLIC_SUPABASE_URL ||
      !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error('❌ Supabase not configured. Please check your .env file.');
      showToast('Configuration error. Please check your setup.', 'error');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await tvShowsApi.getAll();
      if (error) {
        console.error('Error loading TV shows:', error.message || error);
        showToast('Failed to load TV shows', 'error');
      } else {
        setMyTVShows(data || []);
      }
    } catch (error) {
      console.error('Error loading TV shows:', error);
      showToast('Failed to connect to database', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPopularTVShows = async () => {
    // If demo mode is enabled, use demo data
    if (DEMO_MODE) {
      setTMDBTVShows(demoTMDBTVShows as any);
      setTMDBLoading(false);
      return;
    }

    setTMDBLoading(true);
    try {
      const response = await getPopularTVShows();
      setTMDBTVShows(response.results);
    } catch (error) {
      console.error('Error loading TMDB TV shows:', error);
    } finally {
      setTMDBLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPopularTVShows();
      return;
    }

    setTMDBLoading(true);
    try {
      const response = await searchTVShows(searchQuery);
      setTMDBTVShows(response.results);
    } catch (error) {
      console.error('Search error:', error);
      showToast('Failed to search TV shows', 'error');
    } finally {
      setTMDBLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    // If search is cleared, reload popular TV shows
    if (!text.trim()) {
      loadPopularTVShows();
    }
  };

  const handleAddTVShow = async (show: TMDBTVShow) => {
    setAddingShowId(show.id);
    try {
      const posterUrl = DEMO_MODE
        ? 'https://placehold.co/300x450/6366F1/FFFFFF/png?text=Show'
        : getImageUrl(show.poster_path);

      const { error } = await tvShowsApi.add({
        title: show.name,
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear().toString()
          : null,
        poster_url: posterUrl,
        is_watched: true,
        is_favorite: false,
        is_watchlist: false,
        rating: null,
        watched_date: new Date().toISOString(),
      });

      if (error) {
        showToast('Failed to add TV show', 'error');
      } else {
        await loadMyTVShows();
        showToast(`${show.name} added to watched list!`, 'success');
      }
    } catch (error) {
      console.error('Add TV show error:', error);
      showToast('Failed to add TV show', 'error');
    } finally {
      setAddingShowId(null);
    }
  };

  const handleToggleFavorite = async (
    showId: string,
    currentFavoriteStatus: boolean,
  ) => {
    setUpdatingShowId(showId);
    try {
      const { error } = await tvShowsApi.update(showId, {
        is_favorite: !currentFavoriteStatus,
      });

      if (error) {
        showToast('Failed to update favorite', 'error');
      } else {
        await loadMyTVShows(); // Reload to show updated status
        showToast(
          currentFavoriteStatus
            ? 'Removed from favorites'
            : 'Added to favorites',
          'success',
        );
      }
    } catch (error) {
      showToast('Failed to update favorite', 'error');
    } finally {
      setUpdatingShowId(null);
    }
  };

  const getFilteredTVShows = () => {
    if (filter === 'watched') {
      return myTVShows.filter((show) => {
        const matchesSearch = show.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        return matchesSearch && show.is_watched === true;
      });
    }
    if (filter === 'favorites') {
      return myTVShows.filter((show) => {
        const matchesSearch = show.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        return matchesSearch && show.is_favorite === true;
      });
    }
    if (filter === 'watchlist') {
      return myTVShows.filter((show) => {
        const matchesSearch = show.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        return matchesSearch && show.is_watchlist === true;
      });
    }
    return myTVShows.filter((show) =>
      show.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  const displayTVShows = getFilteredTVShows();

  const isTVShowInCollection = (tmdbShowName: string) => {
    console.log('Checking if in collection:', tmdbShowName);
    console.log(
      'My TV Shows:',
      myTVShows.map((s) => ({ id: s.id, title: s.title })),
    );

    const found = myTVShows.some((show) => {
      const showTitle = show.title?.toLowerCase().trim();
      const searchTitle = tmdbShowName?.toLowerCase().trim();
      console.log('Comparing:', showTitle, 'vs', searchTitle);
      return showTitle === searchTitle;
    });

    console.log('Found in collection:', found);
    return found;
  };

  const getStatusIcon = (show: any) => {
    if (show.is_watched) {
      return <Eye size={14} color="#10B981" strokeWidth={2} />;
    }
    return <Plus size={14} color="#6366F1" strokeWidth={2} />;
  };

  const getStatusColor = (show: any) => {
    if (show.is_watched) return '#10B981';
    return '#6366F1';
  };

  const renderMyTVShowCard = (show: any) => (
    <TouchableOpacity
      key={show.id}
      style={styles.showCard}
      onPress={() =>
        router.push({
          pathname: '/tv-show-detail',
          params: {
            id: show.id,
            title: show.title,
            year: show.year || '',
            poster_url: show.poster_url || '',
            is_watched: show.is_watched?.toString() || 'false',
            is_favorite: show.is_favorite?.toString() || 'false',
            is_watchlist: show.is_watchlist?.toString() || 'false',
            rating: show.rating?.toString() || '0',
            inCollection: 'true',
          },
        })
      }
    >
      <View style={styles.posterContainer}>
        {show.poster_url ? (
          <Image
            source={
              DEMO_MODE && typeof show.poster_url !== 'string'
                ? show.poster_url
                : { uri: show.poster_url as string }
            }
            style={styles.poster}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Text style={styles.posterPlaceholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.badgeContainer}>
          <View style={styles.statusBadge}>{getStatusIcon(show)}</View>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleToggleFavorite(show.id, show.is_favorite)}
            disabled={updatingShowId === show.id}
          >
            {updatingShowId === show.id ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Heart
                size={16}
                color="#EF4444"
                fill={show.is_favorite ? '#EF4444' : 'transparent'}
                strokeWidth={2}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.showInfo}>
        <Text style={styles.showTitle} numberOfLines={2}>
          {show.title}
        </Text>
        <Text style={styles.showYear}>{show.year}</Text>

        {show.rating > 0 && (
          <View style={styles.rating}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                color={i < show.rating ? '#F59E0B' : '#374151'}
                fill={i < show.rating ? '#F59E0B' : 'transparent'}
                strokeWidth={1}
              />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTMDBTVShowCard = (show: TMDBTVShow) => {
    const inCollection = isTVShowInCollection(show.name);
    const collectionShow = myTVShows.find(
      (s) => s.title?.toLowerCase().trim() === show.name?.toLowerCase().trim(),
    );
    const isWatched = collectionShow?.is_watched || false;

    return (
      <TouchableOpacity
        key={show.id}
        style={styles.tmdbShowCard}
        onPress={() => {
          const posterUrl = DEMO_MODE
            ? 'https://placehold.co/300x450/6366F1/FFFFFF/png?text=Show'
            : getImageUrl(show.poster_path) || '';

          router.push({
            pathname: '/tv-show-detail',
            params: {
              id: collectionShow?.id?.toString() || show.id.toString(),
              title: show.name,
              year: show.first_air_date
                ? new Date(show.first_air_date).getFullYear().toString()
                : '',
              poster_url: posterUrl,
              tmdb_rating: show.vote_average?.toString() || '0',
              overview: show.overview || '',
              inCollection: inCollection ? 'true' : 'false',
              is_watched: collectionShow?.is_watched?.toString() || 'false',
              is_favorite: collectionShow?.is_favorite?.toString() || 'false',
              is_watchlist: collectionShow?.is_watchlist?.toString() || 'false',
              rating: collectionShow?.rating?.toString() || '0',
            },
          });
        }}
      >
        <View style={styles.posterContainer}>
          <Image
            source={
              DEMO_MODE && (show as any).poster_url
                ? (show as any).poster_url
                : {
                    uri:
                      getImageUrl(show.poster_path) ||
                      'https://via.placeholder.com/300x450?text=No+Image',
                  }
            }
            style={styles.poster}
            resizeMode="cover"
          />

          <View style={styles.badgeContainer}>
            <TouchableOpacity
              style={styles.addBadge}
              onPress={() => handleAddTVShow(show)}
              disabled={addingShowId === show.id || isWatched}
            >
              {addingShowId === show.id ? (
                <ActivityIndicator size="small" color="#6366F1" />
              ) : isWatched ? (
                <Check size={16} color="#10B981" strokeWidth={2} />
              ) : (
                <Plus size={16} color="#6366F1" strokeWidth={2} />
              )}
            </TouchableOpacity>

            {inCollection && collectionShow && (
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() =>
                  handleToggleFavorite(
                    collectionShow.id,
                    collectionShow.is_favorite,
                  )
                }
                disabled={updatingShowId === collectionShow.id}
              >
                {updatingShowId === collectionShow.id ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <Heart
                    size={16}
                    color="#EF4444"
                    fill={
                      collectionShow.is_favorite ? '#EF4444' : 'transparent'
                    }
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.showInfo}>
          <Text style={styles.showTitle} numberOfLines={2}>
            {show.name}
          </Text>
          <Text style={styles.showYear}>
            {show.first_air_date
              ? new Date(show.first_air_date).getFullYear()
              : 'Unknown'}
          </Text>

          <View style={styles.tmdbRating}>
            <Star size={12} color="#F59E0B" fill="#F59E0B" strokeWidth={1} />
            <Text style={styles.ratingText}>
              {show.vote_average.toFixed(1)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.title}>TV Shows</Text>
          <Text style={styles.subtitle}>
            {filter === 'all'
              ? searchQuery
                ? `${tmdbTVShows.length} results`
                : 'Discover Popular TV Shows'
              : `${displayTVShows.length} shows`}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search TV shows..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={handleSearchChange}
              onSubmitEditing={handleSearch}
            />
          </View>
        </View>

        <View style={styles.filters}>
          <Text style={styles.filterTitle}>Filter:</Text>
          {['all', 'watched', 'favorites'].map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              style={[
                styles.filterButton,
                filter === filterOption && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(filterOption)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === filterOption && styles.filterTextActive,
                ]}
              >
                {filterOption === 'all'
                  ? 'All'
                  : filterOption === 'watched'
                    ? 'Watched'
                    : filterOption === 'favorites'
                      ? 'Favorites'
                      : 'Watchlist'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* {filter === 'all' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Collection</Text>
              {displayTVShows.length > 0 ? (
                <View style={styles.showsGrid}>
                  {displayTVShows.map(renderMyTVShowCard)}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No TV shows in collection</Text>
                  <Text style={styles.emptyStateSubtext}>Add some shows from popular shows below</Text>
                </View>
              )}
            </View>
          )} */}

          {filter === 'watched' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Watched Shows</Text>
              {displayTVShows.length > 0 ? (
                <View style={styles.showsGrid}>
                  {displayTVShows.map(renderMyTVShowCard)}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No watched shows yet
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Mark some shows as completed to see them here
                  </Text>
                </View>
              )}
            </View>
          )}

          {filter === 'favorites' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Favorite Shows</Text>
              {displayTVShows.length > 0 ? (
                <View style={styles.showsGrid}>
                  {displayTVShows.map(renderMyTVShowCard)}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No favorite shows yet
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Add some shows to favorites to see them here
                  </Text>
                </View>
              )}
            </View>
          )}

          {filter === 'watchlist' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Watchlist</Text>
              {displayTVShows.length > 0 ? (
                <View style={styles.showsGrid}>
                  {displayTVShows.map(renderMyTVShowCard)}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    No shows in watchlist yet
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Add some shows to your watchlist to see them here
                  </Text>
                </View>
              )}
            </View>
          )}

          {filter === 'all' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {searchQuery ? 'Search Results' : 'Popular TV Shows'}
              </Text>
              {tmdbLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366F1" />
                  <Text style={styles.loadingText}>Loading TV shows...</Text>
                </View>
              ) : (
                <View style={styles.showsGrid}>
                  {tmdbTVShows.map(renderTMDBTVShowCard)}
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
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
    marginLeft: 12,
  },
  filters: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#D1D5DB',
    marginRight: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  filterText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  filterTextActive: {
    color: '#6366F1',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  showsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 24,
  },
  showCard: {
    width: cardWidth,
    marginBottom: 24,
  },
  tmdbShowCard: {
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
  posterPlaceholderText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'column',
    gap: 4,
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  progress: {
    height: '100%',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  showInfo: {
    flex: 1,
  },
  showTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
    lineHeight: 20,
  },
  showYear: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  showMeta: {
    gap: 8,
  },
  seasons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seasonsText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
  },
  tmdbRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
  },
  watchingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  watchingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  watchingText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
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
  bottomSpacer: {
    height: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontSize: 18,
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
  },
});
