import React, { useState } from 'react';
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Film, User, X } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { signUp, signIn, resetPassword, signInWithGoogle } from '@/lib/supabase';

// Official multi-color Google "G" mark, rendered inline so it works offline.
function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleAuth = async () => {
    console.log(
      'handleAuth called, isLogin:',
      isLogin,
      'email:',
      email,
      'password length:',
      password.length,
    );

    if (!email || !password) {
      console.log('Missing email or password');
      Alert.alert(t('auth.error'), t('auth.fillAllFields'));
      return;
    }

    if (!isLogin && !username.trim()) {
      Alert.alert(t('auth.error'), t('auth.enterUsername'));
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      console.log('Passwords do not match');
      Alert.alert(t('auth.error'), t('auth.passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      console.log('Password too short');
      Alert.alert(t('auth.error'), t('auth.passwordMinLength'));
      return;
    }

    console.log('Starting auth process...');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        console.log('Attempting login...');
        result = await signIn(email, password);
      } else {
        console.log('Attempting signup...');
        result = await signUp(email, password, username.trim());
      }

      console.log('Auth result:', result);

      if (result.error) {
        console.log('Auth error:', result.error);

        // Debug: Log the full error object
        console.log(
          'Full error object:',
          JSON.stringify(result.error, null, 2),
        );

        let errorMessage = result.error.message;
        if (
          result.error.message?.includes('Network request failed') ||
          result.error.message?.includes('Failed to fetch') ||
          result.error.name === 'AuthRetryableFetchError'
        ) {
          errorMessage = t('auth.networkError');
        } else if (result.error.code === 'user_already_exists') {
          errorMessage = t('auth.userAlreadyExists');
        } else if (result.error.message.includes('Invalid login credentials')) {
          errorMessage = t('auth.invalidCredentials');
        } else if (result.error.message.includes('Email not confirmed')) {
          errorMessage = t('auth.emailNotConfirmed');
        } else if (
          result.error.message.includes('Password should be at least')
        ) {
          errorMessage = t('auth.passwordMinLength');
        } else if (result.error.message.includes('Invalid API key')) {
          errorMessage = t('auth.configError');
        } else if (result.error.message.includes('API key')) {
          errorMessage = t('auth.apiKeyError');
        }
        Alert.alert(t('auth.error'), errorMessage);
      } else {
        // Kayıt başarılı
        if (!isLogin) {
          // Signup successful
          console.log('Signup successful, showing success message');
          Alert.alert(t('auth.registrationSuccess'), t('auth.accountCreated'), [
            {
              text: t('auth.loginButton'),
              onPress: () => {
                console.log('Switching to login mode');
                setIsLogin(true);
                setPassword('');
                setConfirmPassword('');
                setUsername('');
              },
            },
          ]);
        }
        // Giriş başarılı
        else if (result.data && result.data.user) {
          // Login successful
          console.log('Login successful, navigating to tabs');
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.log('Catch error:', error);
      const message = error instanceof Error ? error.message : String(error);
      const isNetworkError =
        message.includes('Network request failed') ||
        message.includes('Failed to fetch') ||
        message.includes('network');
      Alert.alert(
        t('auth.error'),
        isNetworkError ? t('auth.networkError') : t('auth.unexpectedError'),
      );
    } finally {
      console.log('Auth process finished');
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();

      if (result.cancelled) {
        return; // User dismissed the account picker.
      }

      if (result.error) {
        console.log('Google auth error:', result.error);
        let errorMessage = result.error.message;
        if (
          result.error.message?.includes('Network request failed') ||
          result.error.message?.includes('Failed to fetch') ||
          result.error.message?.toLowerCase().includes('network')
        ) {
          errorMessage = t('auth.networkError');
        }
        Alert.alert(t('auth.error'), errorMessage);
      } else if (result.data && result.data.user) {
        console.log('Google login successful, navigating to tabs');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.log('Google auth catch error:', error);
      Alert.alert(t('auth.error'), t('auth.unexpectedError'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      Alert.alert(t('auth.error'), t('auth.invalidEmail'));
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await resetPassword(resetEmail);

      if (error) {
        Alert.alert(
          t('auth.error'),
          error.message || t('auth.failedToSendReset'),
        );
      } else {
        Alert.alert(t('auth.successTitle'), t('auth.resetEmailSent'), [
          {
            text: t('common.ok'),
            onPress: () => {
              setResetModalVisible(false);
              setResetEmail('');
            },
          },
        ]);
      }
    } catch (error) {
      console.log('Reset password error:', error);
      Alert.alert(t('auth.error'), t('auth.unexpectedError'));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <LinearGradient colors={['#1F2937', '#111827']} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Image
                source={require('@/assets/images/wb-logo-trns.png')}
                style={styles.logo}
                resizeMode="contain"
                accessible
                accessibilityLabel="WatchBase logo"
              />
              {/* <Text style={styles.title}>WatchBase</Text> */}
              <Text style={styles.subtitle}>
                {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.emailAddress')}
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {!isLogin && (
                <View style={styles.inputContainer}>
                  <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.username')}
                    placeholderTextColor="#6B7280"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.password')}
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              </View>

              {isLogin && (
                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => setResetModalVisible(true)}
                >
                  <Text style={styles.forgotPasswordText}>
                    {t('auth.forgotPassword')}
                  </Text>
                </TouchableOpacity>
              )}

              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.confirmPassword')}
                    placeholderTextColor="#6B7280"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>
              )}

              {!isLogin && (
                <View style={styles.passwordRequirements}>
                  <Text style={styles.requirementsTitle}>
                    {t('auth.passwordRequirements')}
                  </Text>
                  <Text style={styles.requirementText}>
                    {t('auth.atLeast6Chars')}
                  </Text>
                  <Text style={styles.requirementText}>
                    {t('auth.mixRecommended')}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleAuth}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>
                    {loading
                      ? t('auth.pleaseWait')
                      : isLogin
                        ? t('auth.signIn')
                        : t('auth.createAccountButton')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[
                  styles.googleButton,
                  (googleLoading || loading) && styles.buttonDisabled,
                ]}
                onPress={handleGoogleAuth}
                disabled={googleLoading || loading}
              >
                <GoogleLogo size={20} />
                <Text style={styles.googleButtonText}>
                  {googleLoading ? t('auth.pleaseWait') : t('auth.continueWithGoogle')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIsLogin(!isLogin)}
              >
                <Text style={styles.switchText}>
                  {isLogin
                    ? t('auth.dontHaveAccount')
                    : t('auth.alreadyHaveAccount')}
                  <Text style={styles.switchTextBold}>
                    {isLogin ? t('auth.signup') : t('auth.signIn')}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Password Reset Modal */}
        <Modal
          visible={resetModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setResetModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('auth.resetPassword')}</Text>
                <TouchableOpacity
                  onPress={() => setResetModalVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color="white" strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                {t('auth.resetPasswordDescription')}
              </Text>

              <View style={styles.inputContainer}>
                <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.emailAddress')}
                  placeholderTextColor="#6B7280"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[styles.button, resetLoading && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={resetLoading}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>
                    {resetLoading ? t('auth.sending') : t('auth.sendResetLink')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    // width: 100,
    // height: 100,
    // backgroundColor: 'rgba(99, 102, 241, 0.1)',
    // borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: 200,
    height: 150,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: 'white',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginHorizontal: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginLeft: 12,
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
  },
  switchTextBold: {
    color: '#6366F1',
    fontFamily: 'Inter-SemiBold',
  },
  passwordRequirements: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  requirementsTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6366F1',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: 'white',
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#9CA3AF',
    marginBottom: 24,
    lineHeight: 20,
  },
});
