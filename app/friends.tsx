import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Search, UserPlus, Users, Check, X, Mail, Clock, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { friendsApi, Friend, UserSearchResult } from '@/lib/friends-api';

export default function FriendsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sendingRequestId, setSendingRequestId] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [removingFriendId, setRemovingFriendId] = useState<string | null>(null);

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
    setLoading(true);
    try {
      const { data, error } = await friendsApi.getFriends();
      if (error) {
        console.error('Error loading friends:', error);
        Alert.alert('Error', 'Failed to load friends');
      } else {
        setFriends(data || []);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data, error } = await friendsApi.searchUsersByEmail(searchQuery);
      if (error) {
        console.error('Search error:', error);
        Alert.alert('Error', 'Failed to search users');
      } else {
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search users');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId: string, userEmail: string) => {
    setSendingRequestId(userId);
    try {
      const { data, error } = await friendsApi.sendFriendRequest(userId);
      if (error) {
        Alert.alert('Error', error.message || 'Failed to send friend request');
      } else {
        Alert.alert('Success', `Friend request sent to ${userEmail}!`);
        // Reload friends to show pending request but keep search results
        loadFriends();
      }
    } catch (error) {
      console.error('Send friend request error:', error);
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setSendingRequestId(null);
    }
  };

  const handleAcceptRequest = async (friendshipId: string) => {
    setProcessingRequestId(friendshipId);
    try {
      const { error } = await friendsApi.acceptFriendRequest(friendshipId);
      if (error) {
        Alert.alert('Error', 'Failed to accept friend request');
      } else {
        Alert.alert('Success', 'Friend request accepted!');
        loadFriends();
      }
    } catch (error) {
      console.error('Accept request error:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRejectRequest = async (friendshipId: string) => {
    setProcessingRequestId(friendshipId);
    try {
      const { error } = await friendsApi.removeFriend(friendshipId);
      if (error) {
        Alert.alert('Error', 'Failed to reject friend request');
      } else {
        Alert.alert('Success', 'Friend request rejected');
        loadFriends();
      }
    } catch (error) {
      console.error('Reject request error:', error);
      Alert.alert('Error', 'Failed to reject friend request');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleRemoveFriend = async (friendshipId: string, friendEmail: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendEmail} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingFriendId(friendshipId);
            try {
              const { error } = await friendsApi.removeFriend(friendshipId);
              if (error) {
                Alert.alert('Error', 'Failed to remove friend');
              } else {
                Alert.alert('Success', 'Friend removed successfully');
                loadFriends();
              }
            } catch (error) {
              console.error('Remove friend error:', error);
              Alert.alert('Error', 'Failed to remove friend');
            } finally {
              setRemovingFriendId(null);
            }
          }
        }
      ]
    );
  };

  const handleViewFriendProfile = (friend: Friend) => {
    if (!currentUser) return;
    
    const friendId = friend.user_id === currentUser.id ? friend.friend_id : friend.user_id;
    const friendEmail = friend.user_id === currentUser.id ? friend.friend_email : friend.requesting_email;
    
    router.push({
      pathname: '/friend-profile',
      params: {
        friendId,
        friendEmail
      }
    });
  };

  const renderSearchResult = (user: UserSearchResult) => {
    // Check if user already has a pending/accepted friendship
    const existingFriendship = friends.find(f => 
      (f.user_id === user.id && f.friend_id === currentUser?.id) ||
      (f.friend_id === user.id && f.user_id === currentUser?.id)
    );
    
    return (
      <View key={user.id} style={styles.searchResultCard}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Mail size={20} color="#6366F1" strokeWidth={2} />
          </View>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
        {existingFriendship ? (
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {existingFriendship.status === 'pending' ? 'Request Sent' : 'Friends'}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, sendingRequestId === user.id && styles.addButtonDisabled]}
            onPress={() => handleSendFriendRequest(user.id, user.email)}
            disabled={sendingRequestId === user.id}
          >
            {sendingRequestId === user.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <UserPlus size={20} color="white" strokeWidth={2} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFriend = (friend: Friend) => {
    if (!currentUser) return null;
    
    const isIncoming = friend.friend_id === currentUser.id;
    const friendEmail = isIncoming ? friend.requesting_email : friend.friend_email;
    
    return (
      <View key={friend.id} style={styles.friendCard}>
        <View style={styles.friendInfo}>
          <View style={[
            styles.friendAvatar,
            { backgroundColor: friend.status === 'accepted' ? '#10B981' : '#F59E0B' }
          ]}>
            <Users size={20} color="white" strokeWidth={2} />
          </View>
          <View style={styles.friendDetails}>
            <Text style={styles.friendEmail}>{friendEmail}</Text>
            <View style={styles.friendStatus}>
              {friend.status === 'pending' && (
                <>
                  <Clock size={14} color="#F59E0B" strokeWidth={2} />
                  <Text style={styles.statusText}>
                    {isIncoming ? 'Incoming request' : 'Request sent'}
                  </Text>
                </>
              )}
              {friend.status === 'accepted' && (
                <>
                  <Check size={14} color="#10B981" strokeWidth={2} />
                  <Text style={[styles.statusText, { color: '#10B981' }]}>Friends</Text>
                </>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.friendActions}>
          {friend.status === 'pending' && isIncoming && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAcceptRequest(friend.id)}
                disabled={processingRequestId === friend.id}
              >
                {processingRequestId === friend.id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Check size={16} color="white" strokeWidth={2} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleRejectRequest(friend.id)}
                disabled={processingRequestId === friend.id}
              >
                <X size={16} color="white" strokeWidth={2} />
              </TouchableOpacity>
            </>
          )}
          {friend.status === 'accepted' && (
            <>
              <TouchableOpacity
                style={styles.viewProfileButton}
                onPress={() => handleViewFriendProfile(friend)}
              >
                <Text style={styles.viewProfileText}>View Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.removeButton]}
                onPress={() => handleRemoveFriend(friend.id, friendEmail)}
                disabled={removingFriendId === friend.id}
              >
                {removingFriendId === friend.id ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Trash2 size={16} color="white" strokeWidth={2} />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const pendingRequests = friends.filter(f => f.status === 'pending');
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
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Search Results */}
          {searchResults.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search Results</Text>
              {searchLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#6366F1" />
                </View>
              ) : (
                searchResults.map(renderSearchResult)
              )}
            </View>
          )}

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pending Requests</Text>
              {pendingRequests.map(renderFriend)}
            </View>
          )}

          {/* Friends */}
          {acceptedFriends.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Friends</Text>
              {acceptedFriends.map(renderFriend)}
            </View>
          )}

          {/* Empty State */}
          {friends.length === 0 && !loading && (
            <View style={styles.emptyState}>
              <Users size={48} color="#6B7280" strokeWidth={1.5} />
              <Text style={styles.emptyStateText}>No friends yet</Text>
              <Text style={styles.emptyStateSubtext}>Search for friends by email to get started</Text>
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
    marginRight: 16,
    minWidth: 0, // Allow text to shrink
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
    flex: 1,
    numberOfLines: 1,
    flexShrink: 1,
  },
  addButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  statusBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#F59E0B',
    textAlign: 'center',
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
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendDetails: {
    flex: 1,
  },
  friendEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
    marginBottom: 4,
  },
  friendStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#F59E0B',
  },
  friendActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  removeButton: {
    backgroundColor: '#EF4444',
  },
  viewProfileButton: {
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewProfileText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
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