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
    const { data, error } = await supabase.rpc('search_users_by_email', {
      search_email: email
    });
    
    return { data, error };
  },

  // Send friend request
  sendFriendRequest: async (friendId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

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
  },

  // Get all friends (accepted, pending, etc.)
  getFriends: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: friendsData, error: friendsError } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    
    if (friendsError) return { data: null, error: friendsError };
    if (!friendsData) return { data: [], error: null };

    const enrichedFriends = await Promise.all(
      friendsData.map(async (friend) => {
        // Current user is the one who sent the request if user_id matches
        const isCurrentUserRequester = friend.user_id === user.id;
        
        // Get the other person's ID (the friend)
        const otherUserId = isCurrentUserRequester ? friend.friend_id : friend.user_id;
        
        // Get current user's email
        const { data: currentUserData, error: currentUserError } = await supabase
          .from('users')
          .select('email')
          .eq('id', user.id)
          .maybeSingle();
        
        // Get other user's email
        const { data: otherUserData, error: otherUserError } = await supabase
          .from('users')
          .select('email')
          .eq('id', otherUserId)
          .maybeSingle();
        
        console.log('Friend relationship:', {
          friendshipId: friend.id,
          currentUserId: user.id,
          otherUserId,
          isCurrentUserRequester,
          currentUserEmail: currentUserData?.email,
          otherUserEmail: otherUserData?.email,
          currentUserError,
          otherUserError
        });
        
        return {
          ...friend,
          // friend_email is always the other person's email
          friend_email: otherUserData?.email || 'Unknown user',
          // requesting_email is the person who sent the request
          requesting_email: isCurrentUserRequester 
            ? (currentUserData?.email || 'Unknown user')
            : (otherUserData?.email || 'Unknown user')
        };
      })
    );

    console.log('Final enriched friends:', enrichedFriends);
    return { data: enrichedFriends, error: null };
  },

  // Accept friend request
  acceptFriendRequest: async (friendshipId: string) => {
    const { data, error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
      .select()
      .single();
    
    return { data, error };
  },

  // Reject/Remove friend
  removeFriend: async (friendshipId: string) => {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId);
    
    return { error };
  },

  // Get friend's movies
  getFriendMovies: async (friendId: string) => {
    const { data, error } = await supabase.rpc('get_friend_movies', {
      friend_user_id: friendId
    });
    
    return { data, error };
  },

  // Get friend's TV shows
  getFriendTVShows: async (friendId: string) => {
    const { data, error } = await supabase.rpc('get_friend_tv_shows', {
      friend_user_id: friendId
    });
    
    return { data, error };
  },

  // Get accepted friends only
  getAcceptedFriends: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: friendsData, error: friendsError } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });
    
    if (friendsError) return { data: null, error: friendsError };
    if (!friendsData) return { data: [], error: null };

    const enrichedFriends = await Promise.all(
      friendsData.map(async (friend) => {
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
      })
    );

    return { data: enrichedFriends, error: null };
  }
};