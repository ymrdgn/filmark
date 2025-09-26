import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Search, UserPlus, Check, X, Users, Mail } from 'lucide-react-native';
import { router } from 'expo-router';
import { friendsApi } from '@/lib/friends-api';
import { supabase } from '@/lib/supabase';

export default function FriendsScreen() {
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentUser();
    loadFriends();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const { data, error } = await friendsApi.getFriends();
      if (error) {
        console.error('Error loading friends:', error);
        Alert.alert('Error', 'Failed to load friends list.');
      } else {
        setFriends(data || []);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends list.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const { data, error } = await friendsApi.searchUsersByEmail(searchQuery.trim());
      if (error) {
        Alert.alert('Error', 'Failed to search users.');
      } else {
        // Filter out current user
        const filteredResults = (data || []).filter(user => user.id !== currentUser?.id);
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search users.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (friendId: string) => {
    setSendingRequestTo(friendId);
    try {
      const { error } = await friendsApi.sendFriendRequest(friendId);
      if (error) {
        Alert.alert('Error', error.message || 'Failed to send friend request.');
      } else {
        Alert.alert('Success', 'Friend request sent!');
        loadFriends(); // Reload friends list
      }
    } catch (error) {
      console.error('Send friend request error:', error);
      Alert.alert('Error', 'Failed to send friend request.');
    } finally {
      setSendingRequestTo(null);
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    try {
      const { error } = await friendsApi.acceptFriendRequest(friendshipId);
      if (error) {
        Alert.alert('Error', 'Failed to accept friend request.');
      } else {
        Alert.alert('Success', 'Friend request accepted!');
        loadFriends();
      }
    } catch (error) {
      console.error('Accept request error:', error);
      Alert.alert('Error', 'Failed to accept friend request.');
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    try {
      const { error } = await friendsApi.removeFriend(friendshipId);
      if (error) {
        Alert.alert('Error', 'Failed to reject friend request.');
      } else {
        Alert.alert('Success', 'Friend request rejected.');
        loadFriends();
      }
    } catch (error) {
      console.error('Reject request error:', error);
      Alert.alert('Error', 'Failed to reject friend request.');
    }
  };

  const handleViewFriendProfile = (friendId: string, friendEmail: string) => {
    router.push({
      pathname: '/friend-profile',
      params: {
        friendId,
        friendEmail
      }
    });
  };

  const getRelationshipStatus = (userId: string) => {
    const friendship = friends.find(f => 
      (f.user_id === userId || f.friend_id === userId) && 
      (f.user_id === currentUser?.id || f.friend_id === currentUser?.id)
    );
    
    if (!friendship) return null;
    
    if (friendship.status === 'accepted') return 'friends';
    if (friendship.status === 'pending') {
      // If current user sent the request
      if (friendship.user_id === currentUser?.id) return 'sent';
      // If current user received the request
      return 'received';
    }
    
    return null;
  };

  const renderSearchResult = (user) => {
    const status = getRelationshipStatus(user.id);
    
    return (
      <View key={user.id} style={styles.searchResultCard}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {user.email.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.userName}>{user.email.split('@')[0]}</Text>
          </View>
        </View>
        
        <View style={styles.actionContainer}>
          {status === 'friends' && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Friends</Text>
            </View>
          )}
          {status === 'sent' && (
            <View style={[styles.statusBadge, { backgroundColor: '#F59E0B20' }]}>
              <Text style={[styles.statusText, { color: '#F59E0B' }]}>Request Sent</Text>
            </View>
          )}
          {!status && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleSendFriendRequest(user.id)}
              disabled={sendingRequestTo === user.id}
            >
              {sendingRequestTo === user.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <UserPlus size={16} color="white" strokeWidth={2} />
                  <Text style={styles.addButtonText}>Add</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderFriend = (friend) => {
    if (!currentUser) return null;
    
    const friendId = friend.user_id === currentUser.id ? friend.friend_id : friend.user_id;
    const friendEmail = friend.user_id === currentUser.id ? friend.friend_user?.email : friend.requesting_user?.email;
    
    if (friend.status === 'pending' && friend.friend_id === currentUser.id) {
      // Incoming request
      return (
        <View key={friend.id} style={styles.friendCard}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitial}>
                {friendEmail?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userEmail}>{friendEmail}</Text>
              <Text style={styles.userName}>{friendEmail?.split('@')[0]}</Text>
              <Text style={styles.requestText}>Sent you a friend request</Text>
            </View>
          </View>
          
          <View style={styles.requestActions}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptRequest(friend.id)}
            >
              <Check size={16} color="white" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleRejectRequest(friend.id)}
            >
              <X size={16} color="white" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      );
    } else if (friend.status === 'accepted') {
      // Accepted friend
      return (
        <View key={friend.id} style={styles.friendCard}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitial}>
                {friendEmail?.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userEmail}>{friendEmail}</Text>
              <Text style={styles.userName}>{friendEmail?.split('@')[0]}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewFriendProfile(friendId, friendEmail)}
          >
            <Text style={styles.viewButtonText}>View Lists</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return null;
  };

  const pendingRequests = friends.filter(f => 
    f.status === 'pending' && f.friend_id === currentUser?.id
  );
  
  const acceptedFriends = friends.filter(f => f.status === 'accepted');

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
            <Text style={styles.title}>Friends</Text>
            <Text style={styles.subtitle}>{acceptedFriends.length} friends</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by email..."
              placeholderTextColor="#6B7280"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {searching && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6366F1" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          )}

          {searchResults.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search Results</Text>
              {searchResults.map(renderSearchResult)}
            </View>
          )}

          {pendingRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pending Requests</Text>
              {pendingRequests.map(renderFriend)}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Friends</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Loading friends...</Text>
              </View>
            ) : acceptedFriends.length > 0 ? (
              acceptedFriends.map(renderFriend)
            ) : (
              <View style={styles.emptyState}>
                <Users size={48} color="#6B7280" strokeWidth={1.5} />
                <Text style={styles.emptyStateText}>No friends yet</Text>
                <Text style={styles.emptyStateSubtext}>Search for friends by email to get started</Text>
              </View>
            )}
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
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
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
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 16,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInitial: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  userDetails: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  requestText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
    marginTop: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    backgroundColor: '#10B98120',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#10B981',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
});