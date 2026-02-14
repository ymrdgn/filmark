import { View, Text, Pressable, Alert, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import Purchases, { PURCHASE_TYPE } from 'react-native-purchases';

const REVENUECAT_ANDROID_API_KEY = 'goog_OitrfOHjHjTANEstwMDfCUFvayR';
const PRODUCT_ID = 'tip_coffee_1';

export default function BuyMeCoffee() {
  const [isReady, setIsReady] = useState(false);

  if (Platform.OS !== 'android') return null;

  useEffect(() => {
    (async () => {
      try {
        await Purchases.configure({ apiKey: REVENUECAT_ANDROID_API_KEY });
        setIsReady(true);
        console.log('[RC] configured');
      } catch (e) {
        console.warn('[RC] configure error', e);
        setIsReady(true);
      }
    })();
  }, []);

  const buyCoffee = async () => {
    try {
      console.log('[RC] Trying to fetch INAPP product:', PRODUCT_ID);

      // ✅ ÖNEMLİ: Ürün tipi INAPP olmalı (abonelik değil)
      // const products = await Purchases.getProducts([PRODUCT_ID]);

      const products = await Purchases.getProducts(
        [PRODUCT_ID],
        PURCHASE_TYPE.INAPP,
      );
      console.log(
        '[RC] getProducts(INAPP) result:',
        products.map((p) => p.identifier),
      );

      if (!products.length) {
        Alert.alert(
          '☕ Support WatchBase',
          'Product not found (INAPP). Check Play tester/install setup.',
        );
        return;
      }

      const { customerInfo } = await Purchases.purchaseStoreProduct(
        products[0],
      );

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
    }
  };

  if (!isReady) return null;

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
