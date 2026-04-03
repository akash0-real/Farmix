import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../languages/uiText';

export default function MandiPricesScreen({ selectedLanguage, onBack }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>{t(selectedLanguage, 'backArrow')}</Text>
        </Pressable>
      </View>
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
  headerRow: {
    marginBottom: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#e8eeea',
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a6b3a',
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
