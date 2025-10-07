import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Film, User } from 'lucide-react-native';
import { signUp, signIn } from '@/lib/supabase';

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async () => {
    console.log('handleAuth called, isLogin:', isLogin, 'email:', email, 'password length:', password.length);
    
    if (!email || !password) {
      console.log('Missing email or password');
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (!isLogin && !username.trim()) {
      Alert.alert('Hata', 'Lütfen kullanıcı adınızı girin');
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      console.log('Passwords do not match');
      Alert.alert('Hata', 'Şifreler eşleşmiyor');
      return;
    }

    if (password.length < 6) {
      console.log('Password too short');
      Alert.alert('Hata', 'Şifre en az 6 karakter olmalı');
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
        console.log('Full error object:', JSON.stringify(result.error, null, 2));
        
        let errorMessage = result.error.message;
        if (result.error.code === 'user_already_exists') {
          errorMessage = 'Bu e-posta adresi ile zaten kayıtlı bir hesap var. Giriş yapmayı deneyin.';
        } else if (result.error.message.includes('Invalid login credentials')) {
          errorMessage = 'E-posta veya şifre hatalı. Lütfen kontrol edin.';
        } else if (result.error.message.includes('Email not confirmed')) {
          errorMessage = 'E-posta adresinizi doğrulamanız gerekiyor.';
        } else if (result.error.message.includes('Password should be at least')) {
          errorMessage = 'Şifre en az 6 karakter olmalı.';
        } else if (result.error.message.includes('Invalid API key')) {
          errorMessage = 'Uygulama yapılandırma hatası. Lütfen daha sonra tekrar deneyin.';
        } else if (result.error.message.includes('API key')) {
          errorMessage = 'API anahtarı hatası. Lütfen uygulamayı yeniden başlatın.';
        }
        
        Alert.alert('Hata', errorMessage);
      } else {
        // Kayıt başarılı
        if (!isLogin) {
          // Signup successful
          console.log('Signup successful, showing success message');
          Alert.alert(
            'Kayıt Başarılı! 🎉', 
            'Hesabınız başarıyla oluşturuldu. Şimdi giriş yapabilirsiniz.',
            [
              {
                text: 'Giriş Yap',
                onPress: () => {
                  console.log('Switching to login mode');
                  setIsLogin(true);
                  setPassword('');
                  setConfirmPassword('');
                  setUsername('');
                }
              }
            ]
          );
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
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    } finally {
      console.log('Auth process finished');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={styles.gradient}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Film size={48} color="#6366F1" strokeWidth={1.5} />
              </View>
              <Text style={styles.title}>WatchBase / WatchTracker</Text>
              <Text style={styles.subtitle}>
                {isLogin ? 'Welcome back!' : 'Create your account'}
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
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
                    placeholder="Username"
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
                  placeholder="Password"
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

              {!isLogin && (
                <View style={styles.inputContainer}>
                  <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm password"
                    placeholderTextColor="#6B7280"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>
              )}

              {!isLogin && (
                <View style={styles.passwordRequirements}>
                  <Text style={styles.requirementsTitle}>Password requirements:</Text>
                  <Text style={styles.requirementText}>• At least 6 characters</Text>
                  <Text style={styles.requirementText}>• Mix of letters and numbers recommended</Text>
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
                    {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.switchButton}
                onPress={() => setIsLogin(!isLogin)}
              >
                <Text style={styles.switchText}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <Text style={styles.switchTextBold}>
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
});