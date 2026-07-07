import {
  View,
  Text,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const REVENUECAT_ANDROID_API_KEY = 'goog_OitrfOHjHjTANEstwMDfCUFvayR';
const REVENUECAT_IOS_API_KEY = 'appl_AvTKTRupBHzTXSYiOmhxAIlmvLa';
const COFFEE_PACKAGE_ID = 'coffee';

export default function BuyMeCoffee() {
  const { t } = useTranslation();
  const configuredRef = useRef(false);
  const [loading, setLoading] = useState(false);

  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return null;

  const buyCoffee = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const Purchases = (await import('react-native-purchases')).default;

      if (!configuredRef.current) {
        const apiKey =
          Platform.OS === 'ios'
            ? REVENUECAT_IOS_API_KEY
            : REVENUECAT_ANDROID_API_KEY;
        await Purchases.configure({ apiKey });
        configuredRef.current = true;
        console.log('[RC] configured');
      }

      const offerings = await Purchases.getOfferings();
      console.log(
        '[RC] offerings:',
        offerings.current?.availablePackages.map((p) => ({
          packageId: p.identifier,
          productId: p.product.identifier,
        })),
      );

      const coffeePackage = offerings.current?.availablePackages.find(
        (p) => p.identifier === COFFEE_PACKAGE_ID,
      );

      if (!coffeePackage) {
        Alert.alert(
          '☕ Support WatchBase',
          'Coffee package not found. Check RevenueCat offering setup.',
        );
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage(coffeePackage);

      Alert.alert('💜 Thank you!', 'Thanks for supporting WatchBase!');
      console.log('[RC] purchase ok', customerInfo);
    } catch (error: any) {
      console.warn('[RC] purchase error', error);
      if (!error?.userCancelled) {
        Alert.alert(
          '☕ Support WatchBase',
          'In-app purchases are not available right now. Please try again later.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ marginTop: 24 }}>
      <Pressable
        onPress={buyCoffee}
        disabled={loading}
        style={{
          backgroundColor: '#FF813F',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading && <ActivityIndicator size="small" color="white" />}
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
          ☕ {t('profile.buyMeACoffee')}
        </Text>
      </Pressable>
    </View>
  );
}
