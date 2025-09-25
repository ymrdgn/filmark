import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Filter, Star, Clock, Eye, EyeOff, Plus } from 'lucide-react-native';
import MovieSearchModal from '@/components/MovieSearchModal';

const { width } = Dimensions.get('window');
const cardWidth = (width - 72) / 2;

export default function MoviesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, watched, watchlist
  const [showAddModal, setShowAddModal] = useState(false);

  const movies = [
    { 
      id: 1, 
      title: 'The Dark Knight', 
      year: 2008, 
      rating: 5, 
      duration: 152, 
      status: 'watched',
      poster: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    { 
      id: 2, 
      title: 'Inception', 
      year: 2010, 
      rating: 4, 
      duration: 148, 
      status: 'watched',
      poster: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    { 
      id: 3, 
      title: 'Dune', 
      year: 2021, 
      rating: 0, 
      duration: 155, 
      status: 'watchlist',
      poster: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    { 
      id: 4, 
      title: 'Interstellar', 
      year: 2014, 
      rating: 5, 
      duration: 169, 
      status: 'watched',
      poster: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    { 
      id: 5, 
      title: 'The Matrix', 
      year: 1999, 
      rating: 4, 
      duration: 136, 
      status: 'watched',
      poster: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    { 
      id: 6, 
      title: 'Blade Runner 2049', 
      year: 2017, 
      rating: 0, 
      duration: 164, 
      status: 'watchlist',
      poster: 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
  ];

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || movie.status === filter;
    return matchesSearch && matchesFilter;
  });

  const renderMovieCard = (movie) => (
    <TouchableOpacity key={movie.id} style={styles.movieCard}>
      <View style={styles.posterContainer}>
        <View style={styles.poster} />
        <View style={styles.statusBadge}>
          {movie.status === 'watched' ? (
            <Eye size={14} color="#10B981" strokeWidth={2} />
          ) : (
            <Plus size={14} color="#6366F1" strokeWidth={2} />
          )}
        </View>
      </View>
      
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
        <Text style={styles.movieYear}>{movie.year}</Text>
        
        <View style={styles.movieMeta}>
          <View style={styles.duration}>
            <Clock size={12} color="#9CA3AF" strokeWidth={2} />
            <Text style={styles.durationText}>{movie.duration}m</Text>
          </View>
          
          {movie.status === 'watched' && (
            <View style={styles.rating}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={12}
                  color={i < movie.rating ? '#F59E0B' : '#374151'}
                  fill={i < movie.rating ? '#F59E0B' : 'transparent'}
                  strokeWidth={1}
                />
              ))}
            </View>
          )}
        </View>
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
          <Text style={styles.title}>Movies</Text>
          <Text style={styles.subtitle}>{filteredMovies.length} movies in collection</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search movies..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <View style={styles.addButtonContainer}>
          <TouchableOpacity 
            style={styles.addMovieButton}
            onPress={() => setShowAddModal(true)}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={styles.addMovieGradient}
            >
              <Plus size={20} color="white" strokeWidth={2} />
              <Text style={styles.addMovieText}>Add Movie</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.filters}>
          {['all', 'watched', 'watchlist'].map((filterOption) => (
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
                {filterOption === 'all' ? 'All' : filterOption === 'watched' ? 'Watched' : 'Watchlist'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.moviesGrid}>
            {filteredMovies.map(renderMovieCard)}
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>

        <MovieSearchModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onMovieAdded={() => {
            // Refresh movies list here
            console.log('Movie added, should refresh list');
          }}
        />
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
  moviesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 24,
  },
  movieCard: {
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
  movieInfo: {
    flex: 1,
  },
  movieTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
    lineHeight: 20,
  },
  movieYear: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  movieMeta: {
    gap: 8,
  },
  duration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
  },
  bottomSpacer: {
    height: 20,
  },
  addButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  addMovieButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addMovieGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  addMovieText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});