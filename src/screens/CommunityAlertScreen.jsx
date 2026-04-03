import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  getCommunityAlerts,
  subscribeToCommunityAlerts,
} from '../services/alertService';
import { t } from '../languages/uiText';

export default function CommunityAlertScreen({ selectedLanguage, onBack }) {
  const [alerts, setAlerts] = useState(() => getCommunityAlerts());

  useEffect(() => {
    const unsubscribe = subscribeToCommunityAlerts(nextAlerts => {
      setAlerts(nextAlerts);
    });

    return unsubscribe;
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>{t(selectedLanguage, 'backArrow')}</Text>
        </Pressable>
      </View>
      <Text style={styles.title}>{t(selectedLanguage, 'communityAlerts')}</Text>
      <Text style={styles.subtitle}>
        {t(selectedLanguage, 'severityBasedAlerts')}
      </Text>

      {alerts.map(alert => (
        <View
          key={alert.id}
          style={[
            styles.card,
            alert.severity === 'high'
              ? styles.high
              : alert.severity === 'moderate'
                ? styles.moderate
                : styles.low,
          ]}
        >
          <Text style={styles.cardTitle}>{alert.title}</Text>
          <Text style={styles.cardMessage}>{alert.message}</Text>
          <Text style={styles.meta}>
            {t(selectedLanguage, 'severity')}: {alert.severity.toUpperCase()} | {t(selectedLanguage, 'radius')}: {alert.radiusKm} km
          </Text>
          <Text style={styles.meta}>
            {t(selectedLanguage, 'area')}: {alert.locationName} | {new Date(alert.createdAt).toLocaleString()}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f3f5f4',
  },
  content: {
    paddingBottom: 24,
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
    marginBottom: 14,
  },
  card: {
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  high: {
    borderLeftColor: '#c0392b',
  },
  moderate: {
    borderLeftColor: '#d68910',
  },
  low: {
    borderLeftColor: '#2d8a52',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a223d',
  },
  cardMessage: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: '#4f5b69',
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: '#6f7a89',
  },
});
