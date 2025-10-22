import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/Toast';

type PrivacySettings = {
  profile_visibility: 'public' | 'friends' | 'private';
  show_activity: boolean;
  allow_friend_requests: boolean;
};

export default function PrivacySettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visibility: 'public',
    show_activity: true,
    allow_friend_requests: true,
  });
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_user_privacy_settings', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsData = data[0];
        setSettings({
          profile_visibility: settingsData.profile_visibility,
          show_activity: settingsData.show_activity,
          allow_friend_requests: settingsData.allow_friend_requests,
        });
      }
    } catch (error: any) {
      console.error('Privacy settings load error:', error);
      setToast({ visible: true, message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<PrivacySettings>) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updatedSettings = { ...settings, ...newSettings };

      const { error } = await supabase.rpc('update_user_privacy_settings', {
        p_user_id: user.id,
        p_profile_visibility: updatedSettings.profile_visibility,
        p_show_activity: updatedSettings.show_activity,
        p_allow_friend_requests: updatedSettings.allow_friend_requests
      });

      if (error) throw error;

      setSettings(updatedSettings);
      setToast({ visible: true, message: 'Settings saved', type: 'success' });
    } catch (error: any) {
      console.error('Privacy settings update error:', error);
      setToast({ visible: true, message: error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradient}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Privacy Settings</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Settings</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Visibility</Text>
            <Text style={styles.sectionDescription}>
              Control who can see your profile and activity
            </Text>

            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => updateSettings({ profile_visibility: 'public' })}
                disabled={saving}
              >
                <View style={styles.radio}>
                  {settings.profile_visibility === 'public' && <View style={styles.radioSelected} />}
                </View>
                <View style={styles.radioText}>
                  <Text style={styles.radioLabel}>Public</Text>
                  <Text style={styles.radioDescription}>Anyone can see your profile</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => updateSettings({ profile_visibility: 'friends' })}
                disabled={saving}
              >
                <View style={styles.radio}>
                  {settings.profile_visibility === 'friends' && <View style={styles.radioSelected} />}
                </View>
                <View style={styles.radioText}>
                  <Text style={styles.radioLabel}>Friends Only</Text>
                  <Text style={styles.radioDescription}>Only your friends can see your profile</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => updateSettings({ profile_visibility: 'private' })}
                disabled={saving}
              >
                <View style={styles.radio}>
                  {settings.profile_visibility === 'private' && <View style={styles.radioSelected} />}
                </View>
                <View style={styles.radioText}>
                  <Text style={styles.radioLabel}>Private</Text>
                  <Text style={styles.radioDescription}>Only you can see your profile</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity</Text>

            <View style={styles.switchOption}>
              <View style={styles.switchText}>
                <Text style={styles.switchLabel}>Show Activity</Text>
                <Text style={styles.switchDescription}>
                  Let others see what you're watching
                </Text>
              </View>
              <Switch
                value={settings.show_activity}
                onValueChange={(value) => updateSettings({ show_activity: value })}
                disabled={saving}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Friend Requests</Text>

            <View style={styles.switchOption}>
              <View style={styles.switchText}>
                <Text style={styles.switchLabel}>Allow Friend Requests</Text>
                <Text style={styles.switchDescription}>
                  Let other users send you friend requests
                </Text>
              </View>
              <Switch
                value={settings.allow_friend_requests}
                onValueChange={(value) => updateSettings({ allow_friend_requests: value })}
                disabled={saving}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </ScrollView>
      </LinearGradient>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  radioText: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  radioDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  switchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  switchText: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
