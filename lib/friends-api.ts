import { supabase } from './supabase';

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  friend_email?: string;
  friend_name?: string;
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
      .single();

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

    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        friend_user:users!friends_friend_id_fkey(email),
        requesting_user:users!friends_user_id_fkey(email)
      `)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    
    return { data, error };
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

    const { data, error } = await supabase
      .from('friends')
      .select(`
        *,
        friend_user:users!friends_friend_id_fkey(email),
        requesting_user:users!friends_user_id_fkey(email)
      `)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });
    
    return { data, error };
  }
};