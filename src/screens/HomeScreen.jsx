import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Dimensions,
} from 'react-native';
import {
  getCommunityAlerts,
  subscribeToCommunityAlerts,
} from '../services/alertService';
import { useUser } from '../context/UserContext';

const { width } = Dimensions.get('window');
const farmImage = require('../assests/images/field.jpg');

const dashboardItems = [
  {
    icon: '🌿',
    title: 'Crop Doctor',
    subtitle: 'AI Disease Detection',
    action: 'cropDoctor',
    status: 'HEALTHY',
    statusColor: '#7eff8a',
    metric: '98%',
    metricLabel: 'Health Score',
    trend: '+2%',
    trendUp: true,
  },
  {
    icon: '🪣',
    title: 'Soil Health',
    subtitle: 'Nutrient Analysis',
    action: 'home',
    status: 'OPTIMAL',
    statusColor: '#7eff8a',
    metric: 'pH 6.8',
    metricLabel: 'Soil Quality',
    trend: 'Stable',
    trendUp: true,
  },
  {
    icon: '📅',
    title: 'Farm Planner',
    subtitle: 'Task Management',
    action: 'home',
    status: 'PENDING',
    statusColor: '#ffd966',
    metric: '3',
    metricLabel: 'Tasks Due',
    trend: 'Today',
    trendUp: false,
  },
  {
    icon: '🛒',
    title: 'Buyer Connect',
    subtitle: 'Market Linkage',
    action: 'home',
    status: 'ACTIVE',
    statusColor: '#7eff8a',
    metric: '12',
    metricLabel: 'Active Buyers',
    trend: '+5 new',
    trendUp: true,
  },
  {
    icon: '⚠️',
    title: 'Alert Center',
    subtitle: 'Community Warnings',
    action: 'alerts',
    status: 'URGENT',
    statusColor: '#ff6b6b',
    metric: '2',
    metricLabel: 'Active Alerts',
    trend: 'Nearby',
    trendUp: false,
  },
  {
    icon: '💰',
    title: 'Mandi Prices',
    subtitle: 'Live Market Rates',
    action: 'mandi',
    status: 'HIGH',
    statusColor: '#ffd966',
    metric: '₹2,450',
    metricLabel: 'Wheat/Quintal',
    trend: '+₹120',
    trendUp: true,
  },
];

const CROP_ICONS = {
  wheat: '🌾',
  rice: '🍚',
  cotton: '☁️',
  sugarcane: '🎋',
  maize: '🌽',
  soybean: '🫘',
  groundnut: '🥜',
  pulses: '🫛',
  vegetables: '🥬',
  fruits: '🍎',
  millets: '🌿',
  other: '🌱',
};

export default function HomeScreen({
  selectedLanguage,
  onCropDoctor,
  onMandi,
  onAlerts,
}) {
  const { user } = useUser();
  const [latestAlert, setLatestAlert] = useState(() => getCommunityAlerts()[0]);

  useEffect(() => {
    const unsubscribe = subscribeToCommunityAlerts(alerts => {
      setLatestAlert(alerts[0] || null);
    });
    return unsubscribe;
  }, []);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Dynamic stats based on user data
  const statsData = useMemo(() => [
    {
      label: 'Total Area',
      value: user.farmSize || '0',
      unit: 'Acres',
      icon: '🌾',
    },
    {
      label: 'Farm Type',
      value: user.farmType === 'irrigated' ? '💧' : user.farmType === 'rainfed' ? '🌧️' : '🔄',
      unit: user.farmType ? user.farmType.charAt(0).toUpperCase() + user.farmType.slice(1) : 'N/A',
      icon: '🏡',
    },
    {
      label: 'Crops',
      value: user.crops?.length || 0,
      unit: 'Types',
      icon: '🌱',
    },
  ], [user]);

  const handlePress = action => {
    if (action === 'cropDoctor') onCropDoctor();
    else if (action === 'mandi') onMandi();
    else if (action === 'alerts') onAlerts();
  };

  const voiceStatusColor =
    latestAlert?.severity === 'high'
      ? '#ff6b6b'
      : latestAlert?.severity === 'moderate'
      ? '#ffd966'
      : '#7eff8a';

  const voiceStatus =
    latestAlert?.severity === 'high'
      ? 'Red'
      : latestAlert?.severity === 'moderate'
      ? 'Yellow'
      : 'Green';

  return (
    <View style={styles.container}>
      <ImageBackground source={farmImage} style={styles.background} resizeMode="cover">
        {/* Overlays */}
        <View style={styles.overlayTop} />
        <View style={styles.overlayGradient} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>👨‍🌾</Text>
                </View>
                <View style={styles.onlineIndicator} />
              </View>
              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.headerName}>{user.name || 'Farmer'}</Text>
                <View style={styles.premiumBadge}>
                  <View style={styles.premiumIcon}>
                    <Text style={styles.premiumStar}>⭐</Text>
                  </View>
                  <Text style={styles.headerSub}>Premium Member</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton}>
                <Text style={styles.iconButtonText}>⚙️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bellButton}>
                <Text style={styles.bellIcon}>🔔</Text>
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>3</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            {statsData.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statUnit}>{stat.unit}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Voice Assistant Card */}
          <View style={styles.voiceCard}>
            <View style={styles.voiceCardGlow} />
            <View style={styles.voiceCardContent}>
              <View style={styles.voiceLeft}>
                <View style={styles.voiceMicContainer}>
                  <View style={styles.voiceMicPulse} />
                  <View style={styles.voiceMic}>
                    <Text style={styles.voiceMicIcon}>🎤</Text>
                  </View>
                </View>
              </View>
              <View style={styles.voiceCenter}>
                <View style={styles.voiceHeader}>
                  <View style={styles.aiTag}>
                    <Text style={styles.aiTagText}>AI ASSISTANT</Text>
                  </View>
                  <View style={styles.liveTag}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>LIVE</Text>
                  </View>
                </View>
                <Text style={styles.voiceMessage}>
                  "Farm status is{' '}
                  <Text style={[styles.voiceHighlight, { color: voiceStatusColor }]}>
                    {voiceStatus}
                  </Text>
                  . Tap to hear more."
                </Text>
              </View>
              <TouchableOpacity style={styles.voicePlayBtn}>
                <Text style={styles.voicePlayIcon}>▶</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dashboard Section */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Farm Dashboard</Text>
              <Text style={styles.sectionSubtitle}>Monitor & manage your farm</Text>
            </View>
            <TouchableOpacity style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View All</Text>
              <Text style={styles.viewAllArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Dashboard Grid */}
          <View style={styles.dashboardGrid}>
            {dashboardItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.dashboardCard}
                onPress={() => handlePress(item.action)}
                activeOpacity={0.85}
              >
                {/* Card Header */}
                <View style={styles.cardTop}>
                  <View style={[styles.cardIconBox, { borderColor: item.statusColor + '40' }]}>
                    <Text style={styles.cardIcon}>{item.icon}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: item.statusColor + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: item.statusColor }]} />
                    <Text style={[styles.statusLabel, { color: item.statusColor }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Card Info */}
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>

                {/* Metric Display */}
                <View style={styles.metricContainer}>
                  <View style={styles.metricLeft}>
                    <Text style={styles.metricValue}>{item.metric}</Text>
                    <Text style={styles.metricLabel}>{item.metricLabel}</Text>
                  </View>
                  <View style={[
                    styles.trendBadge,
                    { backgroundColor: item.trendUp ? 'rgba(126,255,138,0.15)' : 'rgba(255,217,102,0.15)' }
                  ]}>
                    <Text style={[
                      styles.trendText,
                      { color: item.trendUp ? '#7eff8a' : '#ffd966' }
                    ]}>
                      {item.trendUp ? '↑' : '•'} {item.trend}
                    </Text>
                  </View>
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  <Text style={styles.tapHint}>Tap to explore</Text>
                  <View style={styles.arrowCircle}>
                    <Text style={styles.arrowIcon}>→</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickSection}>
            <Text style={styles.quickTitle}>Quick Actions</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickScroll}
            >
              <TouchableOpacity style={styles.quickCard} onPress={onCropDoctor}>
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(126,255,138,0.15)' }]}>
                  <Text style={styles.quickIcon}>📸</Text>
                </View>
                <Text style={styles.quickLabel}>Scan{'\n'}Crop</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickCard} onPress={onAlerts}>
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(255,107,107,0.15)' }]}>
                  <Text style={styles.quickIcon}>🚨</Text>
                </View>
                <Text style={styles.quickLabel}>View{'\n'}Alerts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickCard} onPress={onMandi}>
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(255,217,102,0.15)' }]}>
                  <Text style={styles.quickIcon}>📊</Text>
                </View>
                <Text style={styles.quickLabel}>Check{'\n'}Prices</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickCard}>
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(100,181,246,0.15)' }]}>
                  <Text style={styles.quickIcon}>☁️</Text>
                </View>
                <Text style={styles.quickLabel}>Weather{'\n'}Forecast</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickCard}>
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(186,104,200,0.15)' }]}>
                  <Text style={styles.quickIcon}>📞</Text>
                </View>
                <Text style={styles.quickLabel}>Expert{'\n'}Help</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <View style={styles.bottomNavInner}>
            <TouchableOpacity style={styles.navTab}>
              <View style={styles.navTabActive}>
                <Text style={styles.navIcon}>🏠</Text>
              </View>
              <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navTab}>
              <Text style={styles.navIcon}>🌾</Text>
              <Text style={styles.navLabel}>Farm</Text>
            </TouchableOpacity>

            {/* Center FAB */}
            <View style={styles.fabContainer}>
              <TouchableOpacity style={styles.fab}>
                <View style={styles.fabInner}>
                  <Text style={styles.fabIcon}>🎤</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.fabLabel}>Ask AI</Text>
            </View>

            <TouchableOpacity style={styles.navTab} onPress={onMandi}>
              <Text style={styles.navIcon}>🏪</Text>
              <Text style={styles.navLabel}>Market</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navTab}>
              <Text style={styles.navIcon}>👤</Text>
              <Text style={styles.navLabel}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#0a1f12',
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 15, 8, 0.88)',
  },
  overlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(5, 20, 10, 0.4)',
  },
  scrollContent: {
    paddingBottom: 110,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(126, 255, 138, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(126, 255, 138, 0.3)',
  },
  avatarText: {
    fontSize: 26,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#7eff8a',
    borderWidth: 2,
    borderColor: 'rgba(10, 31, 18, 1)',
  },
  greeting: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  headerName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  premiumIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumStar: {
    fontSize: 10,
  },
  headerSub: {
    fontSize: 11,
    color: '#ffd700',
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconButtonText: {
    fontSize: 18,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bellIcon: {
    fontSize: 18,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(10, 31, 18, 1)',
  },
  notificationCount: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '800',
  },

  // Stats Row
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statIcon: {
    fontSize: 18,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  statUnit: {
    fontSize: 10,
    color: '#7eff8a',
    fontWeight: '700',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginTop: 4,
  },

  // Voice Card
  voiceCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(126, 255, 138, 0.2)',
  },
  voiceCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(47, 141, 65, 0.08)',
  },
  voiceCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  voiceLeft: {
    alignItems: 'center',
  },
  voiceMicContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceMicPulse: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(47, 141, 65, 0.2)',
  },
  voiceMic: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#2f8d41',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2f8d41',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  voiceMicIcon: {
    fontSize: 20,
  },
  voiceCenter: {
    flex: 1,
  },
  voiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  aiTag: {
    backgroundColor: 'rgba(126, 255, 138, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7eff8a',
    letterSpacing: 1,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff6b6b',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ff6b6b',
    letterSpacing: 0.5,
  },
  voiceMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    lineHeight: 20,
  },
  voiceHighlight: {
    fontWeight: '900',
  },
  voicePlayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  voicePlayIcon: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 2,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    marginTop: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  viewAllText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
  },
  viewAllArrow: {
    fontSize: 12,
    color: '#7eff8a',
    fontWeight: '700',
  },

  // Dashboard Grid
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
  },
  dashboardCard: {
    width: (width - 40) / 2,
    backgroundColor: 'rgba(12, 32, 20, 0.9)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  cardIcon: {
    fontSize: 24,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: '600',
    marginBottom: 14,
  },
  metricContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  metricLeft: {},
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
  },
  metricLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    marginTop: 2,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  tapHint: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '600',
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(126, 255, 138, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 12,
    color: '#7eff8a',
    fontWeight: '700',
  },

  // Quick Actions
  quickSection: {
    marginTop: 24,
    paddingLeft: 20,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 14,
  },
  quickScroll: {
    paddingRight: 20,
    gap: 12,
  },
  quickCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 14,
    width: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quickIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickIcon: {
    fontSize: 22,
  },
  quickLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Bottom Navigation
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  bottomNavInner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(8, 24, 14, 0.97)',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  navTab: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  navTabActive: {
    backgroundColor: 'rgba(126, 255, 138, 0.12)',
    padding: 8,
    borderRadius: 14,
    marginBottom: 4,
  },
  navIcon: {
    fontSize: 22,
  },
  navLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#7eff8a',
    fontWeight: '700',
  },
  fabContainer: {
    alignItems: 'center',
    marginTop: -32,
    marginHorizontal: 8,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#2f8d41',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2f8d41',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'rgba(8, 24, 14, 0.97)',
  },
  fabInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 26,
  },
  fabLabel: {
    fontSize: 10,
    color: '#7eff8a',
    fontWeight: '800',
    marginTop: 6,
  },
});
