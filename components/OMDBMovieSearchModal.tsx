import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Search, Plus, Star } from 'lucide-react-native';
import { searchMovies, getMovieDetails, OMDBMovie } from '@/lib/omdb';
import { moviesApi } from '@/lib/api';

interface OMDBMovieSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onMovieAdded?: () => void;
}

export default function OMDBMovieSearchModal({ visible, onClose, onMovieAdded }: OMDBMovieSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingMovieId, setAddingMovieId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await searchMovies(searchQuery);
      if (response.Response === 'True') {
        setSearchResults(response.Search);
      } else {
        setSearchResults([]);
        Alert.alert('No Results', response.Error || 'No movies found');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search movies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovie = async (movie: OMDBMovie) => {
    setAddingMovieId(movie.imdbID);
    try {
      // Get full movie details from OMDB
      const details = await getMovieDetails(movie.imdbID);
      console.log('OMDB Movie Details:', details);

      const runtime = details.Runtime ? parseInt(details.Runtime.replace(' min', '')) : null;
      const imdbRating = details.imdbRating && details.imdbRating !== 'N/A' ? parseFloat(details.imdbRating) : null;

      const { error } = await moviesApi.add({
        title: movie.Title,
        year: parseInt(movie.Year) || null,
        poster_url: movie.Poster !== 'N/A' ? movie.Poster : null,
        is_watched: false,
        is_favorite: false,
        is_watchlist: true,
        rating: null,
        duration: runtime,
        watched_date: null,
        director: details.Director && details.Director !== 'N/A' ? details.Director : null,
        genre: details.Genre && details.Genre !== 'N/A' ? details.Genre : null,
        imdb_rating: imdbRating,
        tmdb_id: null,
        imdb_id: movie.imdbID,
      });

      if (error) {
        console.error('Database error:', error);
        Alert.alert('Error', 'Failed to add movie to your list.');
      } else {
        Alert.alert('Success', `${movie.Title} added to your watchlist!`);
        onMovieAdded?.();
      }
    } catch (error) {
      console.error('Add movie error:', error);
      Alert.alert('Error', 'Failed to add movie to your list.');
    } finally {
      setAddingMovieId(null);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1F2937', '#111827']}
            style={styles.modalGradient}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Movie</Text>
              <TouchableOpacity onPress={handleClose}>
                <X size={24} color="#9CA3AF" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <View style={styles.searchBar}>
                <Search size={20} color="#9CA3AF" strokeWidth={2} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for movies..."
                  placeholderTextColor="#6B7280"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  autoFocus
                />
                <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                  <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366F1" />
                  <Text style={styles.loadingText}>Searching movies...</Text>
                </View>
              )}

              {searchResults.map((movie) => (
                <View key={movie.imdbID} style={styles.movieCard}>
                  <Image
                    source={{ 
                      uri: movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300?text=No+Image'
                    }}
                    style={styles.moviePoster}
                    resizeMode="cover"
                  />
                  <View style={styles.movieInfo}>
                    <Text style={styles.movieTitle} numberOfLines={2}>
                      {movie.Title}
                    </Text>
                    <Text style={styles.movieYear}>
                      {movie.Year}
                    </Text>
                    <Text style={styles.movieType}>
                      {movie.Type.charAt(0).toUpperCase() + movie.Type.slice(1)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.addButton, addingMovieId === movie.imdbID && styles.addButtonDisabled]}
                    onPress={() => handleAddMovie(movie)}
                    disabled={addingMovieId === movie.imdbID}
                  >
                    {addingMovieId === movie.imdbID ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Plus size={20} color="white" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>
              ))}

              {searchResults.length === 0 && !loading && searchQuery && (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>No movies found</Text>
                  <Text style={styles.noResultsSubtext}>Try a different search term</Text>
                </View>
              )}
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  searchContainer: {
    padding: 20,
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
  searchButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
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
  movieCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  moviePoster: {
    width: 60,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  movieInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  movieTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  movieYear: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  movieType: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
});