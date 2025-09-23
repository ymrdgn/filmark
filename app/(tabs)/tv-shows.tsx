import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Star, Calendar, Eye, Plus, Play } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 72) / 2;

export default function TVShowsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const tvShows = [
    { 
      id: 1, 
      title: 'Breaking Bad', 
      year: 2008, 
      rating: 5, 
      seasons: 5,
      episodes: 62,
      status: 'watched',
      poster: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    { 
      id: 2, 
      title: 'Game of Thrones', 
      year: 2011, 
      rating: 4, 
      seasons: 8,
      episodes: 73,
      status: 'watched',
      poster: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    { 
      id: 3, 
      title: 'The Bear', 
      year: 2022, 
      rating: 0, 
      seasons: 3,
      episodes: 28,
      status: 'watching',
      poster: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    { 
      id: 4, 
      title: 'Stranger Things', 
      year: 2016, 
      rating: 4, 
      seasons: 4,
      episodes: 42,
      status: 'watched',
      poster: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    { 
      id: 5, 
      title: 'The Last of Us', 
      year: 2023, 
      rating: 0, 
      seasons: 1,
      episodes: 9,
      status: 'watchlist',
      poster: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    { 
      id: 6, 
      title: 'Wednesday', 
      year: 2022, 
      rating: 3, 
      seasons: 1,
      episodes: 8,
      status: 'watched',
      poster: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
  ];

  const filteredShows = tvShows.filter(show => {
    const matchesSearch = show.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || show.status === filter;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'watched':
        return <Eye size={14} color="#10B981" strokeWidth={2} />;
      case 'watching':
        return <Play size={14} color="#F59E0B" strokeWidth={2} />;
      case 'watchlist':
        return <Plus size={14} color="#6366F1" strokeWidth={2} />;
      default:
        return <Plus size={14} color="#6366F1" strokeWidth={2} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'watched':
        return '#10B981';
      case 'watching':
        return '#F59E0B';
      case 'watchlist':
        return '#6366F1';
      default:
        return '#6366F1';
    }
  };

  const renderShowCard = (show) => (
    <TouchableOpacity key={show.id} style={styles.showCard}>
      <View style={styles.posterContainer}>
        <View style={styles.poster} />
        <View style={styles.statusBadge}>
          {getStatusIcon(show.status)}
        </View>
        {show.status === 'watching' && (
          <View style={styles.progressBar}>
            <View style={[styles.progress, { backgroundColor: getStatusColor(show.status) }]} />
          </View>
        )}
      </View>
      
      <View style={styles.showInfo}>
        <Text style={styles.showTitle} numberOfLines={2}>{show.title}</Text>
        <Text style={styles.showYear}>{show.year}</Text>
        
        <View style={styles.showMeta}>
          <View style={styles.seasons}>
            <Calendar size={12} color="#9CA3AF" strokeWidth={2} />
            <Text style={styles.seasonsText}>{show.seasons} seasons</Text>
          </View>
          
          {show.status === 'watched' && show.rating > 0 && (
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
        
        {show.status === 'watching' && (
          <View style={styles.watchingStatus}>
            <View style={styles.watchingDot} />
            <Text style={styles.watchingText}>Currently watching</Text>
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
          <Text style={styles.title}>TV Shows</Text>
          <Text style={styles.subtitle}>{filteredShows.length} shows in collection</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search TV shows..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.filters}>
          {['all', 'watched', 'watching', 'watchlist'].map((filterOption) => (
            <TouchableOpacity
              key={filterOption}
              style={[
                styles.filterButton,
                filter === filterOption && styles.filterButtonActive
              ]}
              onPress={() => setFilter(filterOption)}
            >
              <Text style={[
                styles.filterText,
                filter === filterOption && styles.filterTextActive
              ]}>
                {filterOption === 'all' ? 'All' : 
                 filterOption === 'watched' ? 'Watched' : 
                 filterOption === 'watching' ? 'Watching' : 'Watchlist'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.showsGrid}>
            {filteredShows.map(renderShowCard)}
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
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#6366F1',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  filterTextActive: {
    color: '#6366F1',
  },
  scrollView: {
    flex: 1,
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
  posterContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  poster: {
    width: '100%',
    height: cardWidth * 1.5,
    backgroundColor: '#374151',
    borderRadius: 12,
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
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
    width: '65%',
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
  bottomSpacer: {
    height: 20,
  },
});