import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import CropDoctorScreen from '../screens/CropDoctorScreen';
import MandiPricesScreen from '../screens/MandiPricesScreen';
import CommunityAlertScreen from '../screens/CommunityAlertScreen';

const SCREEN_MAP = {
  Splash: SplashScreen,
  Home: HomeScreen,
  CropDoctor: CropDoctorScreen,
  MandiPrices: MandiPricesScreen,
  CommunityAlert: CommunityAlertScreen,
};

export default function AppNavigator({ selectedLanguage }) {
  const [activeScreen, setActiveScreen] = useState('Home');
  const ActiveComponent = SCREEN_MAP[activeScreen] || HomeScreen;

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeScreen !== 'Home') {
        setActiveScreen('Home');
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [activeScreen]);

  const sharedScreenProps =
    activeScreen === 'Home'
      ? {
          selectedLanguage,
          onCropDoctor: () => setActiveScreen('CropDoctor'),
          onMandi: () => setActiveScreen('MandiPrices'),
          onAlerts: () => setActiveScreen('CommunityAlert'),
        }
      : {
          selectedLanguage,
          onBack: () => setActiveScreen('Home'),
        };
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActiveComponent {...sharedScreenProps} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f5f4',
  },
  content: {
    flex: 1,
  },
});
