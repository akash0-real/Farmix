import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '../languages/uiText';

export default function MandiPricesScreen({ selectedLanguage }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t(selectedLanguage, 'mandiPricesTitle')}</Text>
      <Text style={styles.subtitle}>{t(selectedLanguage, 'liveMarketUpdates')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f3f5f4',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a223d',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#576577',
  },
});
