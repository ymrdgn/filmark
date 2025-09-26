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

  // Alternative search using RPC (if you have the function)
  searchUsersByEmailRPC: async (email: string) => {
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

    // First get the friends relationships
    const { data: friendsData, error: friendsError } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    
    if (friendsError) return { data: null, error: friendsError };
    if (!friendsData) return { data: [], error: null };

    // Get user emails for each friend relationship
    const enrichedFriends = await Promise.all(
      friendsData.map(async (friend) => {
        const friendUserId = friend.user_id === user.id ? friend.friend_id : friend.user_id;
        const requestingUserId = friend.user_id;
        
        // Get friend user email - try users table first, then auth.users
        const { data: friendUser, error: friendError } = await supabase
          .from('users')
          .select('email')
          .eq('id', friendUserId)
          .maybeSingle();
          
        let friendEmail = friendUser?.email;
        
        // Get requesting user email - try users table first, then auth.users
        const { data: requestingUser, error: requestingError } = await supabase
          .from('users')
          .select('email')
          .eq('id', requestingUserId)
          .maybeSingle();

        let requestingEmail = requestingUser?.email;
        
        return {
          ...friend,
          friend_email: friendEmail || 'Unknown user',
          requesting_email: requestingEmail || 'Unknown user'
        };
      })
    );

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

    // First get the friends relationships
    const { data: friendsData, error: friendsError } = await supabase
      .from('friends')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });
    
    if (friendsError) return { data: null, error: friendsError };
    if (!friendsData) return { data: [], error: null };

    // Get user emails for each friend relationship
    const enrichedFriends = await Promise.all(
      friendsData.map(async (friend) => {
        const friendUserId = friend.user_id === user.id ? friend.friend_id : friend.user_id;
        const requestingUserId = friend.user_id;
        
        console.log('Accepted friends - Getting emails:', { friendUserId, requestingUserId });
        
        // Get friend user email - try users table first, then auth.users
        const { data: friendUser } = await supabase
          .from('users')
          .select('email')
          .eq('id', friendUserId)
          .maybeSingle();
          
        const friendEmail = friendUser?.email;
          
        // Get requesting user email - try users table first, then auth.users
        const { data: requestingUser } = await supabase
          .from('users')
          .select('email')
          .eq('id', requestingUserId)
          .maybeSingle();

        const requestingEmail = requestingUser?.email;

        return {
          ...friend,
          friend_email: friendEmail || 'User email not available',
          requesting_email: requestingEmail || 'User email not available'
        };
      })
    );

    return { data: enrichedFriends, error: null };
  }
};