import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
} from 'react-native';
import { BlurView } from 'expo-blur';

interface UpdateModalProps {
  visible: boolean;
  message: string;
  forceUpdate: boolean;
  onClose?: () => void;
}

const APP_STORE_URL = 'https://apps.apple.com/app/id6755926750';
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.watchbase.app';

export function UpdateModal({
  visible,
  message,
  forceUpdate,
  onClose,
}: UpdateModalProps) {
  const handleUpdate = () => {
    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    Linking.openURL(url);
  };

  const handleClose = () => {
    if (!forceUpdate && onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <BlurView intensity={80} style={styles.overlay} tint="dark">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.title}>Update Available</Text>
            <Text style={styles.message}>{message}</Text>

            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdate}
            >
              <Text style={styles.updateButtonText}>Update Now</Text>
            </TouchableOpacity>

            {!forceUpdate && (
              <TouchableOpacity
                style={styles.laterButton}
                onPress={handleClose}
              >
                <Text style={styles.laterButtonText}>Later</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  updateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 12,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  laterButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
  },
  laterButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
