import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const router = useRouter();

  useEffect(() => {
    // Handle deep links for password recovery
    const handleUrl = ({ url }: { url: string }) => {
      console.log('Deep link received:', url);

      // Check if this is a password recovery link
      if (url.includes('type=recovery') || url.includes('reset-password')) {
        console.log('Password recovery link detected');
        // Extract the access_token and refresh_token from URL
        const urlParams = new URL(url).hash.substring(1); // Remove the #
        const params = new URLSearchParams(urlParams);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken) {
          console.log('Setting session with tokens from URL');
          supabase.auth
            .setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            })
            .then(() => {
              router.replace('/reset-password');
            });
          return;
        }
      }

      // Normal authentication check for other cases
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      });
    };

    // Listen for incoming links
    const subscription = Linking.addEventListener('url', handleUrl);

    // Check initial URL on app launch
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl({ url });
      } else {
        // No initial URL, do normal auth check
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            router.replace('/(tabs)');
          } else {
            router.replace('/(auth)/login');
          }
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        presentation: 'card',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="splash" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="movie-detail" />
      <Stack.Screen name="omdb-movie-detail" />
      <Stack.Screen name="tv-show-detail" />
      <Stack.Screen name="list-detail" />
      <Stack.Screen name="friends" />
      <Stack.Screen name="friend-profile" />
      <Stack.Screen name="account-settings" />
      <Stack.Screen name="privacy-settings" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <RootLayoutNav />
      <StatusBar style="light" />
    </>
  );
}
