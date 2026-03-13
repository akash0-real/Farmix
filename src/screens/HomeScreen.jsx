import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  getCommunityAlerts,
  subscribeToCommunityAlerts,
} from '../services/alertService';

const pillars = [
  {
    icon: '📸',
    title: 'Crop Doctor',
    subtitle: 'Scan your crop for diseases',
    color: '#1a6b3a',
    action: 'cropDoctor',
  },
  {
    icon: '💰',
    title: 'Mandi Prices',
    subtitle: 'Live market prices near you',
    color: '#e8a83a',
    action: 'mandi',
  },
  {
    icon: '⚠️',
    title: 'Disease Alerts',
    subtitle: 'Community disease warnings',
    color: '#c0392b',
    action: 'alerts',
  },
  {
    icon: '🌱',
    title: 'Soil Check',
    subtitle: 'NPK & pH guidance',
    color: '#2d8a52',
    action: 'home',
  },
  {
    icon: '🛒',
    title: 'Buyer Match',
    subtitle: '0% commission direct sales',
    color: '#7a5230',
    action: 'home',
  },
  {
    icon: '📈',
    title: 'Smart Planner',
    subtitle: 'Best crop for your season',
    color: '#1a4a8a',
    action: 'home',
  },
];

export default function HomeScreen({
  selectedLanguage,
  onCropDoctor,
  onMandi,
  onAlerts,
}) {
  const [latestAlert, setLatestAlert] = useState(() => getCommunityAlerts()[0]);

  useEffect(() => {
    const unsubscribe = subscribeToCommunityAlerts(alerts => {
      setLatestAlert(alerts[0] || null);
    });

    return unsubscribe;
  }, []);

  const handlePress = action => {
    if (action === 'cropDoctor') onCropDoctor();
    else if (action === 'mandi') onMandi();
    else if (action === 'alerts') onAlerts();
  };

  const bannerTone = useMemo(() => {
    if (latestAlert?.severity === 'high') {
      return {
        bg: '#fff1ef',
        border: '#c0392b',
        title: '#c0392b',
      };
    }

    if (latestAlert?.severity === 'moderate') {
      return {
        bg: '#fff8ed',
        border: '#d68910',
        title: '#b9770e',
      };
    }

    return {
      bg: '#eef8f0',
      border: '#2d8a52',
      title: '#2d8a52',
    };
  }, [latestAlert?.severity]);

  const alertTitle = latestAlert
    ? latestAlert.type === 'disease'
      ? 'Disease Alert Nearby!'
      : latestAlert.title
    : 'No active alerts';

  const alertSubtitle = latestAlert
    ? latestAlert.type === 'disease'
      ? `${latestAlert.diseaseName} detected. Notify farms within ${latestAlert.radiusKm} km.`
      : latestAlert.message
    : 'Run Crop Doctor to generate community risk alerts.';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>🌿 Good Morning</Text>
          <Text style={styles.subGreeting}>
            What do you need help with today?
          </Text>
        </View>
        <TouchableOpacity style={styles.langBadge}>
          <Text style={styles.langText}>{selectedLanguage}</Text>
        </TouchableOpacity>
      </View>

      {/* Alert Banner */}
      <TouchableOpacity
        style={[
          styles.alertBanner,
          { backgroundColor: bannerTone.bg, borderLeftColor: bannerTone.border },
        ]}
        onPress={onAlerts}
      >
        <Text style={styles.alertIcon}>🚨</Text>
        <View style={styles.alertText}>
          <Text style={[styles.alertTitle, { color: bannerTone.title }]}>
            {alertTitle}
          </Text>
          <Text style={styles.alertSub}>{alertSubtitle}</Text>
        </View>
        <Text style={[styles.alertAction, { color: bannerTone.title }]}>View →</Text>
      </TouchableOpacity>

      {/* Pillars Grid */}
      <Text style={styles.sectionTitle}>Farm Tools</Text>
      <View style={styles.grid}>
        {pillars.map((p, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.card, { borderLeftColor: p.color }]}
            onPress={() => handlePress(p.action)}
            activeOpacity={0.8}
          >
            <Text style={styles.cardIcon}>{p.icon}</Text>
            <Text style={styles.cardTitle}>{p.title}</Text>
            <Text style={styles.cardSub}>{p.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>140M</Text>
          <Text style={styles.statLabel}>Farmers</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>0%</Text>
          <Text style={styles.statLabel}>Commission</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNum}>12+</Text>
          <Text style={styles.statLabel}>Languages</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f5f4',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0d3320',
  },
  subGreeting: {
    fontSize: 13,
    color: '#5a6b5a',
    marginTop: 2,
  },
  langBadge: {
    backgroundColor: '#1a6b3a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  langText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  alertBanner: {
    backgroundColor: '#fff3f3',
    borderLeftWidth: 4,
    borderLeftColor: '#c0392b',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  alertIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#c0392b',
  },
  alertSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  alertAction: {
    color: '#c0392b',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0d3320',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0d3320',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 11,
    color: '#888',
    lineHeight: 15,
  },
  statsRow: {
    backgroundColor: '#0d3320',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    color: '#7ec850',
  },
  statLabel: {
    fontSize: 11,
    color: '#a0c0a0',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#1a5c35',
  },
});
