import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Bookmark, Compass, Users, ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

const ONBOARDING_KEY = 'onboarding_completed';

type Slide = {
  key: string;
  icon: (size: number, color: string) => React.ReactNode;
  titleKey: string;
  descKey: string;
};

const slides: Slide[] = [
  {
    key: 'track',
    icon: (s, c) => <Bookmark size={s} color={c} strokeWidth={1.6} />,
    titleKey: 'onboarding.trackTitle',
    descKey: 'onboarding.trackDesc',
  },
  {
    key: 'discover',
    icon: (s, c) => <Compass size={s} color={c} strokeWidth={1.6} />,
    titleKey: 'onboarding.discoverTitle',
    descKey: 'onboarding.discoverDesc',
  },
  {
    key: 'share',
    icon: (s, c) => <Users size={s} color={c} strokeWidth={1.6} />,
    titleKey: 'onboarding.shareTitle',
    descKey: 'onboarding.shareDesc',
  },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const finish = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    } catch {}
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/(auth)/login');
    }
  };

  const next = () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      finish();
    }
  };

  const isLast = index === slides.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={finish}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skip}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      <Animated.FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll },
        )}
        scrollEventThrottle={16}
        renderItem={({ item, index: i }) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [24, 0, 24],
            extrapolate: 'clamp',
          });
          return (
            <View style={styles.slide}>
              <Animated.View
                style={[
                  styles.iconWrap,
                  { opacity, transform: [{ translateY }] },
                ]}
              >
                <LinearGradient
                  colors={['rgba(99,102,241,0.18)', 'rgba(139,92,246,0.10)']}
                  style={styles.iconBg}
                >
                  {item.icon(56, '#A5B4FC')}
                </LinearGradient>
              </Animated.View>
              <Animated.Text
                style={[styles.title, { opacity, transform: [{ translateY }] }]}
              >
                {t(item.titleKey)}
              </Animated.Text>
              <Animated.Text
                style={[styles.desc, { opacity, transform: [{ translateY }] }]}
              >
                {t(item.descKey)}
              </Animated.Text>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={next}
          style={styles.cta}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaInner}
          >
            <Text style={styles.ctaText}>
              {isLast ? t('onboarding.getStarted') : t('onboarding.next')}
            </Text>
            <ArrowRight size={18} color="white" strokeWidth={2.4} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  skip: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#9CA3AF',
  },
  slide: {
    width,
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginBottom: 40,
  },
  iconBg: {
    width: 128,
    height: 128,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    color: 'white',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  desc: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
  },
  cta: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  ctaText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: 'white',
  },
});
