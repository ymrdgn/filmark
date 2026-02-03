import { View, Text, Pressable, Alert, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

// RevenueCat API Keys - https://app.revenuecat.com adresinden al
const REVENUECAT_ANDROID_API_KEY = 'test_fIYaCxqVOKoQCJXVwporNONAUQM';
const REVENUECAT_IOS_API_KEY = 'test_fIYaCxqVOKoQCJXVwporNONAUQM'; // Aynı key iOS için de kullanılabilir

const PRODUCT_ID = 'tip_coffee_1'; // Google Play Console'daki ürün ID'si

export default function BuyMeCoffee() {
  const [isReady, setIsReady] = useState(false);
  const [coffeePackage, setCoffeePackage] = useState<PurchasesPackage | null>(
    null,
  );

  useEffect(() => {
    const initPurchases = async () => {
      try {
        const apiKey =
          Platform.OS === 'android'
            ? REVENUECAT_ANDROID_API_KEY
            : REVENUECAT_IOS_API_KEY;

        if (apiKey.includes('YOUR_')) {
          console.warn('RevenueCat API key not configured');
          setIsReady(true);
          return;
        }

        await Purchases.configure({ apiKey });

        // Get available products - offerings olmasa da devam et
        try {
          const offerings = await Purchases.getOfferings();
          if (
            offerings.current &&
            offerings.current.availablePackages.length > 0
          ) {
            const pkg =
              offerings.current.availablePackages.find(
                (p) => p.product.identifier === PRODUCT_ID,
              ) || offerings.current.availablePackages[0];
            setCoffeePackage(pkg);
          }
        } catch (offeringsError) {
          console.warn(
            'Could not fetch offerings (this is OK for testing):',
            offeringsError,
          );
        }

        setIsReady(true);
      } catch (error) {
        console.warn('RevenueCat init failed:', error);
        setIsReady(true);
      }
    };

    initPurchases();
  }, []);

  const buyCoffee = async () => {
    if (!coffeePackage) {
      Alert.alert(
        '☕ Support WatchBase',
        'In-app purchases are not available right now. Please try again later.',
      );
      return;
    }

    try {
      const { customerInfo } = await Purchases.purchasePackage(coffeePackage);
      console.log('Purchase successful:', customerInfo);
      Alert.alert(
        '💜 Thank you!',
        'Thanks for supporting WatchBase! Your support means a lot.',
      );
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase error:', error);
        Alert.alert('Error', 'Failed to complete purchase. Please try again.');
      }
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <View style={{ marginTop: 24 }}>
      <Pressable
        onPress={buyCoffee}
        style={{
          backgroundColor: '#FF813F',
          padding: 14,
          borderRadius: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>
          ☕ Buy me a coffee
        </Text>
      </Pressable>
    </View>
  );
}
