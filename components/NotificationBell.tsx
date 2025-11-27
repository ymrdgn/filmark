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

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadNotifications();
    subscribeToNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      console.log('🔔 Loading notifications...');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No user found');
        return;
      }

      console.log('👤 User ID:', user.id);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading notifications:', error);
        return;
      }

      console.log('🔔 Notifications loaded:', data?.length || 0);
      console.log('🔔 Notifications:', JSON.stringify(data, null, 2));

      if (data) {
        setNotifications(data);
        setUnreadCount(data.length);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const subscribeToNotifications = () => {
    console.log('🔔 Subscribing to notifications...');
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('🔔 Notification change detected:', payload);
          loadNotifications();
        }
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
      const { error } = await supabase
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
        'accepted'
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
    if (!notification.related_id) return;

    setProcessingId(notification.id);
    try {
      const { error } = await friendsApi.respondToRequest(
        notification.related_id,
        'rejected'
      );

      if (error) {
        console.error('Error rejecting friend request:', error);
        return;
      }

      await markAsRead(notification.id);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
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
