import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

  const sharedScreenProps =
    activeScreen === 'Home'
      ? {
          selectedLanguage,
          onCropDoctor: () => setActiveScreen('CropDoctor'),
          onMandi: () => setActiveScreen('MandiPrices'),
          onAlerts: () => setActiveScreen('CommunityAlert'),
        }
      : {};

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {Object.keys(SCREEN_MAP).map(screenName => (
          <Pressable
            key={screenName}
            onPress={() => setActiveScreen(screenName)}
            style={[styles.tab, activeScreen === screenName && styles.activeTab]}
          >
            <Text style={styles.tabText}>{screenName}</Text>
          </Pressable>
        ))}
      </View>
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
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
    backgroundColor: '#f3f5f4',
  },
  tab: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#dfe6e0',
  },
  activeTab: {
    backgroundColor: '#2f8d41',
  },
  tabText: {
    color: '#1a223d',
    fontWeight: '600',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
});
