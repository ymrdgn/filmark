import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { UpdateModal } from '@/components/UpdateModal';
import { useVersionCheck } from '@/hooks/useVersionCheck';

export default function VersionTestScreen() {
  const [showModal, setShowModal] = useState(false);
  const { clearDismissedVersion } = useVersionCheck();

  const handleClearStorage = async () => {
    await clearDismissedVersion();
    Alert.alert(
      '✅ Success',
      'Session cleared! Now close and reopen the app to see the popup again.',
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Version Control Test</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.buttonText}>Test Update Modal</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.clearButton]}
        onPress={handleClearStorage}
      >
        <Text style={styles.buttonText}>🧹 Clear Session</Text>
      </TouchableOpacity>

      <Text style={styles.info}>
        After clicking "Later", to see the popup again:{'\n'}
        Clear session and restart the app.
      </Text>

      <UpdateModal
        visible={showModal}
        message="🎉 Test message! Update will be performed."
        forceUpdate={false}
        onClose={() => setShowModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    marginTop: 30,
    color: '#888',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});
