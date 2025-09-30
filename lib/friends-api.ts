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
  // Search users by email
  searchUsersByEmail: async (email: string) => {
    try {
      const { data, error } = await supabase.rpc('search_users_by_email', {
        search_email: email
      });
      
      return { data: data || [], error };
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
      
      return { data, error };
    } catch (error) {
      console.error('Send friend request error:', error);
      return { data: null, error };
    }
  },

  // Get all friends (accepted, pending, etc.)
  getFriends: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], error: { message: 'User not authenticated' } };
      }

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

      const enrichedFriends = await Promise.all(
        friendsData.map(async (friend) => {
          try {
            // Determine who is the friend (not current user)
            const friendUserId = friend.user_id === user.id ? friend.friend_id : friend.user_id;
            const requestingUserId = friend.user_id; // Who sent the request
            
            console.log('Processing friend relationship:', {
              friendshipId: friend.id,
              currentUserId: user.id,
              friendUserId,
              requestingUserId,
              status: friend.status
            });
            
            // Get friend's email (the other person)
            const { data: friendUserData, error: friendError } = await supabase
              .from('users')
              .select('email')
              .eq('id', friendUserId)
              .maybeSingle();
            
            // Get requesting user's email
            const { data: requestingUserData, error: requestingError } = await supabase
              .from('users')
              .select('email')
              .eq('id', requestingUserId)
              .maybeSingle();
            
            if (friendError) {
              console.error('Error fetching friend user data:', friendError);
            }
            
            if (requestingError) {
              console.error('Error fetching requesting user data:', requestingError);
            }
            
            console.log('Email data:', {
              friendEmail: friendUserData?.email,
              requestingEmail: requestingUserData?.email
            });
            
            return {
              ...friend,
              friend_email: friendUserData?.email || 'Unknown user',
              requesting_email: requestingUserData?.email || 'Unknown user'
            };
          } catch (error) {
            console.error('Error enriching friend data:', error);
            return {
              ...friend,
              friend_email: 'Unknown user',
              requesting_email: 'Unknown user'
            };
          }
        })
      );

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
      
      return { data, error };
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
      
      return { error };
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
      
      return { data: data || [], error };
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
      
      return { data: data || [], error };
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

      const enrichedFriends = await Promise.all(
        friendsData.map(async (friend) => {
          try {
            const isCurrentUserRequester = friend.user_id === user.id;
            const otherUserId = isCurrentUserRequester ? friend.friend_id : friend.user_id;
            
            const { data: currentUserData } = await supabase
              .from('users')
              .select('email')
              .eq('id', user.id)
              .maybeSingle();
            
            const { data: otherUserData } = await supabase
              .from('users')
              .select('email')
              .eq('id', otherUserId)
              .maybeSingle();
            
            return {
              ...friend,
              friend_email: otherUserData?.email || 'Unknown user',
              requesting_email: isCurrentUserRequester 
                ? (currentUserData?.email || 'Unknown user')
                : (otherUserData?.email || 'Unknown user')
            };
          } catch (error) {
            console.error('Error enriching accepted friend data:', error);
            return {
              ...friend,
              friend_email: 'Unknown user',
              requesting_email: 'Unknown user'
            };
          }
        })
      );

      return { data: enrichedFriends, error: null };
    } catch (error) {
      console.error('Get accepted friends error:', error);
      return { data: [], error };
    }
  }
};