import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Bell, X, Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { friendsApi } from '@/lib/friends-api';

type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationUpdate =
  Database['public']['Tables']['notifications']['Update'];

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);
      await loadNotifications(user.id);
      subscribeToNotifications(user.id);
    }
  };

  const loadNotifications = async (currentUserId?: string) => {
    try {
      const userIdToUse = currentUserId || userId;
      if (!userIdToUse) {
        console.log('❌ No user ID available');
        return;
      }

      console.log('🔔 Loading notifications for user:', userIdToUse);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userIdToUse)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading notifications:', error);
        return;
      }

      console.log('🔔 Notifications loaded:', data?.length || 0);

      if (data) {
        setNotifications(data);
        setUnreadCount(data.length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const subscribeToNotifications = (currentUserId: string) => {
    console.log(
      '🔔 Subscribing to real-time notifications for user:',
      currentUserId,
    );

    const channel = supabase
      .channel(`notifications-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log('🔔 New notification received:', payload.new);
          const newNotification = payload.new as Notification;

          // Yeni bildirimi anında state'e ekle
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          console.log('🔔 Notification updated:', payload.new);
          const updatedNotification = payload.new as Notification;

          // Eğer bildirim okundu olarak işaretlendiyse, listeden çıkar
          if (updatedNotification.is_read) {
            setNotifications((prev) =>
              prev.filter((n) => n.id !== updatedNotification.id),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('🔔 Notification deleted:', payload.old);
          const deletedNotification = payload.old as Notification;

          // Notification'ı direkt sil (ID'ye göre kontrol et)
          setNotifications((prev) => {
            const filtered = prev.filter(
              (n) => n.id !== deletedNotification.id,
            );
            console.log(
              '🗑️ Filtered notifications from',
              prev.length,
              'to',
              filtered.length,
            );
            return filtered;
          });
          setUnreadCount((prev) => Math.max(0, prev - 1));
        },
      )
      .subscribe((status) => {
        console.log('🔔 Subscription status:', status);
      });

    return () => {
      console.log('🔔 Unsubscribing from notifications');
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleAcceptFriend = async (notification: Notification) => {
    if (!notification.related_id) return;

    setProcessingId(notification.id);
    try {
      const { error } = await friendsApi.respondToRequest(
        notification.related_id,
        'accepted',
      );

      if (error) {
        console.error('Error accepting friend request:', error);
        return;
      }

      await markAsRead(notification.id);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectFriend = async (notification: Notification) => {
    if (!notification.related_id) {
      console.warn('No related_id for notification:', notification.id);
      return;
    }

    console.log('🚀 handleRejectFriend called with:', {
      notificationId: notification.id,
      relatedId: notification.related_id,
    });

    setProcessingId(notification.id);

    // Bildirim UI'dan hemen sil (optimistic update)
    console.log('📍 Current notifications count before:', notifications.length);
    setNotifications((prev) => {
      const filtered = prev.filter((n) => {
        console.log('Checking notification:', n.id, 'vs', notification.id);
        return n.id !== notification.id;
      });
      console.log('📍 Filtered notifications count:', filtered.length);
      return filtered;
    });
    setUnreadCount((prev) => {
      const newCount = Math.max(0, prev - 1);
      console.log('📍 Unread count updated to:', newCount);
      return newCount;
    });

    try {
      console.log('🔄 Calling removeFriend with:', notification.related_id);
      // removeFriend'i çağır - hem friendship hem notification'ları siler
      const { error } = await friendsApi.removeFriend(notification.related_id);

      if (error) {
        console.error('❌ Error rejecting friend request:', error);
        // Hata varsa geri ekle
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        return;
      }

      console.log('✅ Friend request rejected and notifications deleted');
    } catch (error) {
      console.error('❌ Error rejecting friend request:', error);
      // Hata varsa geri ekle
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.bellContainer}
        onPress={() => setModalVisible(true)}
      >
        <Bell size={24} color="white" strokeWidth={2} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="white" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notificationsList}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No new notifications</Text>
                </View>
              ) : (
                notifications.map((notification) => (
                  <View key={notification.id} style={styles.notificationCard}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>
                        {notification.title}
                      </Text>
                    </View>
                    <Text style={styles.notificationMessage}>
                      {notification.message}
                    </Text>

                    {notification.type === 'friend_request' && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleAcceptFriend(notification)}
                          disabled={processingId !== null}
                        >
                          {processingId === notification.id ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <>
                              <Check size={18} color="white" strokeWidth={2} />
                              <Text style={styles.buttonText}>Accept</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={() => handleRejectFriend(notification)}
                          disabled={processingId !== null}
                        >
                          {processingId === notification.id ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <>
                              <X size={18} color="white" strokeWidth={2} />
                              <Text style={styles.buttonText}>Reject</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    {notification.type === 'friend_request_accepted' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.okButton]}
                        onPress={() => markAsRead(notification.id)}
                      >
                        <Check size={18} color="white" strokeWidth={2} />
                        <Text style={styles.buttonText}>OK</Text>
                      </TouchableOpacity>
                    )}

                    {notification.type === 'achievement_earned' && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.okButton]}
                        onPress={() => markAsRead(notification.id)}
                      >
                        <Check size={18} color="white" strokeWidth={2} />
                        <Text style={styles.buttonText}>OK</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    overflow: 'hidden',
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
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    padding: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  notificationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  notificationHeader: {
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  notificationMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  okButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});
