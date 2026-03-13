import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {
  getCommunityAlerts,
  subscribeToCommunityAlerts,
} from '../services/alertService';

const pillars = [
  {
    icon: '🌿',
    title: 'Crop Doctor',
    subtitle: "Say 'Check Crops'",
    color: '#2d8a52',
    action: 'cropDoctor',
    status: 'HEALTHY',
    statusColor: '#2d8a52',
    barColor: '#2d8a52',
    barWidth: '100%',
  },
  {
    icon: '🪣',
    title: 'Soil',
    subtitle: "Say 'Soil Status'",
    color: '#2d8a52',
    action: 'home',
    status: 'OPTIMAL',
    statusColor: '#2d8a52',
    barColor: '#2d8a52',
    barWidth: '90%',
  },
  {
    icon: '📅',
    title: 'Planner',
    subtitle: "Say 'Show Planner'",
    color: '#e8a83a',
    action: 'home',
    status: 'ACTION NEEDED',
    statusColor: '#e8a83a',
    barColor: '#e8a83a',
    barWidth: '60%',
  },
  {
    icon: '🛒',
    title: 'Buyer',
    subtitle: "Say 'Go to Market'",
    color: '#2d8a52',
    action: 'home',
    status: 'ACTIVE',
    statusColor: '#2d8a52',
    barColor: '#2d8a52',
    barWidth: '80%',
  },
  {
    icon: '⚠️',
    title: 'Alerts',
    subtitle: "Say 'View Alerts'",
    color: '#c0392b',
    action: 'alerts',
    status: 'CRITICAL',
    statusColor: '#c0392b',
    barColor: '#c0392b',
    barWidth: '95%',
  },
  {
    icon: '💰',
    title: 'Price',
    subtitle: "Say 'Check Price'",
    color: '#e8a83a',
    action: 'mandi',
    status: 'HIGH',
    statusColor: '#e8a83a',
    barColor: '#e8a83a',
    barWidth: '75%',
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

  const voiceStatusColor =
    latestAlert?.severity === 'high'
      ? '#c0392b'
      : latestAlert?.severity === 'moderate'
      ? '#e8a83a'
      : '#2d8a52';

  const voiceStatus =
    latestAlert?.severity === 'high'
      ? 'Red'
      : latestAlert?.severity === 'moderate'
      ? 'Yellow'
      : 'Green';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👨‍🌾</Text>
            </View>
            <View>
              <Text style={styles.headerName}>Hello, Farmer Rajesh</Text>
              <Text style={styles.headerSub}>Farmix Premium</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellButton}>
            <Text style={styles.bellIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Voice Assistant Banner */}
        <View style={styles.voiceBanner}>
          <View style={styles.voiceMicSmall}>
            <Text style={styles.voiceMicIcon}>🎤</Text>
          </View>
          <View style={styles.voiceBannerText}>
            <Text style={styles.voiceBannerLabel}>Voice Assistant</Text>
            <Text style={styles.voiceBannerMsg}>
              "Your farm status is{' '}
              <Text
                style={[styles.voiceStatusWord, { color: voiceStatusColor }]}
              >
                {voiceStatus}
              </Text>{' '}
              today."
            </Text>
          </View>
          <TouchableOpacity style={styles.listenButton}>
            <Text style={styles.listenText}>Listen</Text>
          </TouchableOpacity>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {pillars.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={styles.card}
              onPress={() => handlePress(p.action)}
              activeOpacity={0.85}
            >
              {/* Icon Circle */}
              <View
                style={[styles.iconCircle, { backgroundColor: p.color + '18' }]}
              >
                <Text style={styles.cardIcon}>{p.icon}</Text>
              </View>

              <Text style={styles.cardTitle}>{p.title}</Text>
              <Text style={styles.cardSubtitle}>{p.subtitle}</Text>

              {/* Progress Bar */}
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    { width: p.barWidth, backgroundColor: p.barColor },
                  ]}
                />
              </View>

              {/* Status */}
              <Text style={[styles.statusText, { color: p.statusColor }]}>
                STATUS: {p.status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Ask AI Button */}
      <View style={styles.bottomBar}>
        {/* Nav Items */}
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, styles.navActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🌾</Text>
          <Text style={styles.navLabel}>Farm</Text>
        </TouchableOpacity>

        {/* Center FAB */}
        <TouchableOpacity style={styles.fab}>
          <Text style={styles.fabMic}>🎤</Text>
          <Text style={styles.fabLabel}>Ask AI</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏪</Text>
          <Text style={styles.navLabel}>Market</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7f5',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#d4ead9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a223d',
  },
  headerSub: {
    fontSize: 12,
    color: '#2d8a52',
    fontWeight: '600',
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eef2ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    fontSize: 18,
  },

  // Voice Banner
  voiceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef8f1',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#c8e6d0',
  },
  voiceMicSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2d8a52',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceMicIcon: {
    fontSize: 16,
  },
  voiceBannerText: {
    flex: 1,
  },
  voiceBannerLabel: {
    fontSize: 11,
    color: '#5a7a5a',
    fontWeight: '700',
    marginBottom: 2,
  },
  voiceBannerMsg: {
    fontSize: 13,
    color: '#1a223d',
    fontWeight: '600',
  },
  voiceStatusWord: {
    fontWeight: '800',
  },
  listenButton: {
    backgroundColor: '#2d8a52',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  listenText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 10,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    width: '47%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a223d',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#8a9aaa',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  barBg: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginBottom: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 20,
  },
  navLabel: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 2,
    fontWeight: '600',
  },
  navActive: {
    color: '#2d8a52',
  },
  fab: {
    backgroundColor: '#2d8a52',
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    shadowColor: '#2d8a52',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  fabMic: {
    fontSize: 22,
  },
  fabLabel: {
    fontSize: 9,
    color: 'white',
    fontWeight: '700',
    marginTop: 1,
  },
});
