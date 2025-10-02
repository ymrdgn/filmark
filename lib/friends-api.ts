import { supabase } from './supabase';

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  friend_email?: string;
  requesting_email?: string;
}

export interface UserSearchResult {
  id: string;
  email: string;
}

// Friends API
export const friendsApi = {
  // Search users by email - uses RPC function that searches auth.users
  searchUsersByEmail: async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('search_users_by_email', {
        search_email: email
      });
      
      if (error) {
        console.error('Search users RPC error:', error);
        return { data: [], error };
      }
      
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Search users error:', error);
      return { data: [], error };
    }
  },

  // Send friend request
  sendFriendRequest: async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
        .maybeSingle();

      if (existing) {
        return { data: null, error: { message: 'Friend request already exists' } };
      }

      const { data, error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        console.error('Send friend request error:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Send friend request error:', error);
      return { data: null, error };
    }
  },

  // Get all friends with email enrichment from auth.users
  getFriends: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: { message: 'User not authenticated' } };
      }

      // Get friendships
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      
      if (friendsError) {
        console.error('Get friends error:', friendsError);
        return { data: [], error: friendsError };
      }
      
      if (!friendsData || friendsData.length === 0) {
        return { data: [], error: null };
      }

      // Get all unique user IDs we need emails for
      const userIds = new Set<string>();
      friendsData.forEach(friend => {
        userIds.add(friend.user_id);
        userIds.add(friend.friend_id);
      });

      // Get emails from public.users table
      const emailMap = new Map<string, string>();
      
      // Get emails from public.users table
      const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', Array.from(userIds));

      if (!publicError && publicUsers) {
        publicUsers.forEach(user => {
          if (user.email) {
            emailMap.set(user.id, user.email);
          }
        });
      }
      const enrichedFriends = friendsData.map(friend => {
        const friendUserId = friend.user_id === user.id ? friend.friend_id : friend.user_id;
        const requestingUserId = friend.user_id;

        console.log("**********friendUserId", friendUserId)
        console.log("emailMap.get(friendUserId)", emailMap.get(friendUserId.toString()))
        const friendEmail = emailMap.get(friendUserId) || 'Unknown user';
        const requestingEmail = emailMap.get(requestingUserId) || 'Unknown user';
        
        console.log('Enriching frienddwedede:', {
          friendshipId: friend.id,
          friend: friend,
          currentUserId: user.id,
          friendUserId,
          requestingUserId,
          friendEmail,
          requestingEmail,
          status: friend.status
        });
        
        return {
          ...friend,
          friend_email: friendEmail,
          requesting_email: requestingEmail
        };
      });

      console.log('Final enriched friends:', enrichedFriends);
      return { data: enrichedFriends, error: null };
    } catch (error) {
      console.error('Get friends error:', error);
      return { data: [], error };
    }
  },

  // Accept friend request
  acceptFriendRequest: async (friendshipId: string) => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .update({ status: 'accepted' })
        .eq('id', friendshipId)
        .select()
        .single();
      
      if (error) {
        console.error('Accept friend request error:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Accept friend request error:', error);
      return { data: null, error };
    }
  },

  // Reject/Remove friend
  removeFriend: async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);
      
      if (error) {
        console.error('Remove friend error:', error);
        return { error };
      }
      
      return { error: null };
    } catch (error) {
      console.error('Remove friend error:', error);
      return { error };
    }
  },

  // Get friend's movies
  getFriendMovies: async (friendId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_friend_movies', {
        friend_user_id: friendId
      });
      
      if (error) {
        console.error('Get friend movies error:', error);
        return { data: [], error };
      }
      
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Get friend movies error:', error);
      return { data: [], error };
    }
  },

  // Get friend's TV shows
  getFriendTVShows: async (friendId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_friend_tv_shows', {
        friend_user_id: friendId
      });
      
      if (error) {
        console.error('Get friend TV shows error:', error);
        return { data: [], error };
      }
      
      return { data: data || [], error: null };
    } catch (error) {
      console.error('Get friend TV shows error:', error);
      return { data: [], error };
    }
  },

  // Get accepted friends only
  getAcceptedFriends: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: { message: 'User not authenticated' } };
      }

      // Get accepted friendships
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });
      
      if (friendsError) {
        console.error('Get accepted friends error:', friendsError);
        return { data: [], error: friendsError };
      }
      
      if (!friendsData || friendsData.length === 0) {
        return { data: [], error: null };
      }

      // Get all unique user IDs we need emails for
      const userIds = new Set<string>();
      friendsData.forEach(friend => {
        userIds.add(friend.user_id);
        userIds.add(friend.friend_id);
      });

      // Get emails from public.users table
      const emailMap = new Map<string, string>();
      
      // Get emails from public.users table
      const { data: publicUsers, error: publicError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', Array.from(userIds));
      
      if (!publicError && publicUsers) {
        publicUsers.forEach(user => {
          if (user.email) {
            emailMap.set(user.id, user.email);
          }
        });
      }

      // Enrich friends data with emails
      const enrichedFriends = friendsData.map(friend => {
        const isCurrentUserRequester = friend.user_id === user.id;
        const otherUserId = isCurrentUserRequester ? friend.friend_id : friend.user_id;

        console.log("emailMap.get(user.id)", emailMap.get(user.id))
        const currentUserEmail = emailMap.get(user.id) || 'Unknown user';
        const otherUserEmail = emailMap.get(otherUserId) || 'Unknown user';
        
        return {
          ...friend,
          friend_email: otherUserEmail,
          requesting_email: isCurrentUserRequester ? currentUserEmail : otherUserEmail
        };
      });

      return { data: enrichedFriends, error: null };
    } catch (error) {
      console.error('Get accepted friends error:', error);
      return { data: [], error };
    }
  }
};