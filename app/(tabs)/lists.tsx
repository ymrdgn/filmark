import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookMarked, Heart, Clock, Star, Plus, X, Film, Tv } from 'lucide-react-native';
import { moviesApi, tvShowsApi } from '@/lib/api';

export default function ListsScreen() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [watchedItems, setWatchedItems] = useState([]);
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
  ];

  const handleCreateList = () => {
    if (newListName.trim()) {
      // Add logic to create new list
      console.log('Creating list:', newListName);
      setNewListName('');
      setShowCreateModal(false);
    }
  };

  const renderListCard = (list) => (
    <TouchableOpacity key={list.id} style={styles.listCard}>
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
          <Text style={styles.subtitle}>{favorites.length + watchedItems.length} items in your lists</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.listsContainer}>
            {lists.map(renderListCard)}
          </View>
          
          <TouchableOpacity 
            style={styles.createButton} 
            onPress={() => setShowCreateModal(true)}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              style={styles.createButtonGradient}
            >
              <Plus size={24} color="white" strokeWidth={2} />
              <Text style={styles.createButtonText}>Create New List</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <View style={styles.bottomSpacer} />
        </ScrollView>

        <Modal
          visible={showCreateModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New List</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <X size={24} color="#9CA3AF" strokeWidth={2} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <Text style={styles.inputLabel}>List Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter list name..."
                  placeholderTextColor="#6B7280"
                  value={newListName}
                  onChangeText={setNewListName}
                  autoFocus
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => setShowCreateModal(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.confirmButton, !newListName.trim() && styles.confirmButtonDisabled]} 
                    onPress={handleCreateList}
                    disabled={!newListName.trim()}
                  >
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6']}
                      style={styles.confirmButtonGradient}
                    >
                      <Text style={styles.confirmButtonText}>Create</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
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
  createButton: {
    margin: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  bottomSpacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});