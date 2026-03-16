import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VersionInfo {
  platform: string;
  minimum_version: string;
  current_version: string;
  force_update: boolean;
  update_message: string;
}

interface UseVersionCheckReturn {
  showUpdateModal: boolean;
  updateMessage: string;
  forceUpdate: boolean;
  closeModal: () => void;
  clearDismissedVersion: () => Promise<void>; // Test için
}

const DISMISSED_VERSION_KEY = '@dismissed_update_version';
const SESSION_DISMISSED_KEY = '@session_dismissed'; // Session için

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

export function useVersionCheck(): UseVersionCheckReturn {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [sessionDismissed, setSessionDismissed] = useState(false); // Session için

  useEffect(() => {
    // UNCOMMENT BELOW FOR TESTING - Forces popup to show
    // setShowUpdateModal(true);
    // setUpdateMessage('🧪 TEST MODE: Popup zorla gösteriliyor!');
    // setForceUpdate(false);

    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      // Eğer bu session'da zaten "Daha Sonra" dediyse, tekrar gösterme
      if (sessionDismissed) {
        console.log('⏭️ [Version Check] Already dismissed in this session');
        return;
      }

      // Get current app version from app.json
      const currentVersion = Constants.expoConfig?.version || '1.0.0';
      const platform = Platform.OS;

      console.log('🔍 [Version Check] Started');
      console.log('📱 [Version Check] Platform:', platform);
      console.log('📦 [Version Check] Current App Version:', currentVersion);

      // Fetch version info from Supabase
      const { data, error } = await supabase
        .from('app_version')
        .select('*')
        .eq('platform', platform)
        .single();

      if (error) {
        console.error('❌ [Version Check] Error fetching version info:', error);
        return;
      }

      if (!data) {
        console.log('⚠️ [Version Check] No version data found');
        return;
      }

      const versionInfo = data as VersionInfo;
      console.log(
        '🎯 [Version Check] Minimum Required:',
        versionInfo.minimum_version,
      );
      console.log(
        '🎯 [Version Check] Current in DB:',
        versionInfo.current_version,
      );
      console.log('🔒 [Version Check] Force Update:', versionInfo.force_update);

      // Compare versions
      const comparison = compareVersions(
        currentVersion,
        versionInfo.minimum_version,
      );
      console.log(
        '📊 [Version Check] Comparison Result:',
        comparison,
        '(negative = needs update)',
      );

      // If current version is older than minimum required version
      if (comparison < 0) {
        console.log('🚨 [Version Check] App is outdated!');
        console.log('✅ [Version Check] SHOWING UPDATE MODAL');

        setUpdateMessage(
          versionInfo.update_message ||
            'New features and improvements are available. Please update the app.',
        );
        setForceUpdate(versionInfo.force_update);
        setShowUpdateModal(true);
      } else {
        console.log('✅ [Version Check] App is up to date!');
      }
    } catch (error) {
      console.error('💥 [Version Check] Unexpected error:', error);
    }
  };

  const closeModal = () => {
    if (!forceUpdate) {
      // Sadece bu session için kaydet (app kapatılınca sıfırlanır)
      setSessionDismissed(true);
      setShowUpdateModal(false);
      console.log('⏭️ [Version Check] User dismissed popup for this session');
      console.log(
        'ℹ️  [Version Check] Popup will show again when app restarts',
      );
    }
  };

  // TEST: Session state'ini temizlemek için
  const clearDismissedVersion = async () => {
    try {
      setSessionDismissed(false);
      await AsyncStorage.removeItem(DISMISSED_VERSION_KEY);
      console.log('🧹 [Version Check] Session state cleared!');
    } catch (error) {
      console.error('Error clearing dismissed version:', error);
    }
  };

  return {
    showUpdateModal,
    updateMessage,
    forceUpdate,
    closeModal,
    clearDismissedVersion, // Test için
  };
}
