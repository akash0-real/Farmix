import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
} from 'react-native';
import Tts from 'react-native-tts';
import {
  getCommunityAlerts,
  subscribeToCommunityAlerts,
} from '../services/alertService';
import { fetchWeatherByLocation } from '../services/weatherService';
import { useUser } from '../context/UserContext';
import { t } from '../languages/uiText';
import { getTtsCode } from '../languages/languageConfig';
import Tts from 'react-native-tts';
import { getTtsCode } from '../languages/languageConfig';

const farmImage = require('../assests/images/field.jpg');

export default function HomeScreen({
  selectedLanguage,
  onCropDoctor,
  onMandi,
  onAlerts,
}) {
  const { user } = useUser();
  const [latestAlert, setLatestAlert] = useState(() => getCommunityAlerts()[0]);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const lastSpokenAlertIdRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToCommunityAlerts(alerts => {
      setLatestAlert(alerts[0] || null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadWeather = async () => {
      if (!user.state && !user.district && !user.village) {
        if (isMounted) {
          setWeather(null);
        }
        return;
      }

      setWeatherLoading(true);
      try {
        const weatherData = await fetchWeatherByLocation({
          village: user.village,
          district: user.district,
          state: user.state,
        });

        if (isMounted) {
          setWeather(weatherData);
        }
      } catch (error) {
        if (isMounted) {
          setWeather(null);
        }
      } finally {
        if (isMounted) {
          setWeatherLoading(false);
        }
      }
    };

    loadWeather();

    return () => {
      isMounted = false;
    };
  }, [user.village, user.district, user.state]);

  // Get greeting based on time of day with translation
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t(selectedLanguage, 'goodMorning');
    if (hour < 17) return t(selectedLanguage, 'goodAfternoon');
    return t(selectedLanguage, 'goodEvening');
  };

  // Dynamic stats based on user data with translations
  const statsData = useMemo(() => [
    {
      label: t(selectedLanguage, 'totalArea'),
      value: user.farmSize || '0',
      unit: t(selectedLanguage, 'acres'),
      icon: '🌾',
    },
    {
      label: t(selectedLanguage, 'farmType'),
      value: user.farmType === 'irrigated' ? '💧' : user.farmType === 'rainfed' ? '🌧️' : '🔄',
      unit: user.farmType ? user.farmType.charAt(0).toUpperCase() + user.farmType.slice(1) : 'N/A',
      icon: '🏡',
    },
    {
      label: t(selectedLanguage, 'crops'),
      value: user.crops?.length || 0,
      unit: t(selectedLanguage, 'types'),
      icon: '🌱',
    },
  ], [user, selectedLanguage]);

  // Simplified dashboard - only 3 essential features
  const dashboardItems = useMemo(() => [
    {
      icon: '🌿',
      title: t(selectedLanguage, 'cropDoctor'),
      subtitle: t(selectedLanguage, 'aiDiseaseDetection'),
      action: 'cropDoctor',
      color: '#7eff8a',
    },
    {
      icon: '💰',
      title: t(selectedLanguage, 'mandiPrices'),
      subtitle: t(selectedLanguage, 'liveMarketRates'),
      action: 'mandi',
      color: '#ffd966',
    },
    {
      icon: '⚠️',
      title: t(selectedLanguage, 'alertCenter'),
      subtitle: t(selectedLanguage, 'communityWarnings'),
      action: 'alerts',
      color: '#ff6b6b',
    },
  ], [selectedLanguage]);

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

  const isDistrictWatch = Boolean(
    latestAlert &&
      String(latestAlert.severity).toLowerCase() === 'high' &&
      Number(latestAlert.reportCount || 1) >= 5,
  );

  useEffect(() => {
    if (!isDistrictWatch || !latestAlert?.id) {
      return;
    }

    if (lastSpokenAlertIdRef.current === latestAlert.id) {
      return;
    }

    lastSpokenAlertIdRef.current = latestAlert.id;
    const ttsCode = getTtsCode(selectedLanguage);
    Tts.setDefaultLanguage(ttsCode);
    Tts.stop();
    Tts.speak(
      t(selectedLanguage, 'districtWatchVoice', {
        location: latestAlert.locationName || t(selectedLanguage, 'yourArea'),
      }),
    );
  }, [isDistrictWatch, latestAlert, selectedLanguage]);

  const handleVoicePlay = () => {
    const ttsCode = getTtsCode(selectedLanguage);
    Tts.setDefaultLanguage(ttsCode);
    Tts.stop();

    const speech = [
      `${t(selectedLanguage, 'farmStatusIs')} ${voiceStatus}.`,
      latestAlert?.message || '',
      weather
        ? `${t(selectedLanguage, 'weatherNow')}: ${Math.round(Number(weather.temperatureC))} degree. ${t(selectedLanguage, weather.conditionKey)}.`
        : '',
    ]
      .filter(Boolean)
      .join(' ');

    Tts.speak(speech);
  };

  const showComingSoon = () => {
    Alert.alert('Coming Soon', 'This feature will be available in the next update.');
  };

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
                  <Text style={styles.headerSub}>{t(selectedLanguage, 'premiumMember')}</Text>
                </View>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton} onPress={showComingSoon}>
                <Text style={styles.iconButtonText}>⚙️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bellButton} onPress={onAlerts}>
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

          {/* Weather Card */}
          <View style={styles.weatherCard}>
            <View style={styles.weatherCardGlow} />
            <View style={styles.weatherHeader}>
              <Text style={styles.weatherTitle}>{t(selectedLanguage, 'weatherNow')}</Text>
              <Text style={styles.weatherLocation}>
                📍 {weather?.locationName || `${user.district || user.state || t(selectedLanguage, 'yourArea')}`}
              </Text>
            </View>

            {weatherLoading ? (
              <Text style={styles.weatherLoading}>{t(selectedLanguage, 'loadingWeather')}</Text>
            ) : weather ? (
              <>
                <View style={styles.weatherMainRow}>
                  <Text style={styles.weatherTemp}>
                    {Math.round(Number(weather.temperatureC))}°C
                  </Text>
                  <Text style={styles.weatherCondition}>
                    {t(selectedLanguage, weather.conditionKey)}
                  </Text>
                </View>
                <View style={styles.weatherMetaRow}>
                  <Text style={styles.weatherMeta}>
                    {t(selectedLanguage, 'feelsLike')}: {Math.round(Number(weather.feelsLikeC))}°C
                  </Text>
                  <Text style={styles.weatherMeta}>
                    {t(selectedLanguage, 'humidity')}: {Math.round(Number(weather.humidity))}%
                  </Text>
                  <Text style={styles.weatherMeta}>
                    {t(selectedLanguage, 'wind')}: {Math.round(Number(weather.windKmh))} km/h
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.weatherLoading}>{t(selectedLanguage, 'weatherUnavailable')}</Text>
            )}
          </View>

          {isDistrictWatch ? (
            <View style={styles.watchCard}>
              <Text style={styles.watchTitle}>🚨 {t(selectedLanguage, 'districtWatchTitle')}</Text>
              <Text style={styles.watchText}>
                {t(selectedLanguage, 'districtWatchMessage', {
                  location: latestAlert.locationName || t(selectedLanguage, 'yourArea'),
                })}
              </Text>
              <TouchableOpacity style={styles.watchBtn} onPress={onAlerts}>
                <Text style={styles.watchBtnText}>{t(selectedLanguage, 'districtWatchAction')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}

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
                    <Text style={styles.aiTagText}>{t(selectedLanguage, 'aiAssistant')}</Text>
                  </View>
                  <View style={styles.liveTag}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>{t(selectedLanguage, 'live')}</Text>
                  </View>
                </View>
                <Text style={styles.voiceMessage}>
                  "{t(selectedLanguage, 'farmStatusIs')}{' '}
                  <Text style={[styles.voiceHighlight, { color: voiceStatusColor }]}>
                    {voiceStatus}
                  </Text>
                  . {t(selectedLanguage, 'tapToHearMore')}"
                </Text>
              </View>
              <TouchableOpacity style={styles.voicePlayBtn} onPress={handleVoicePlay}>
                <Text style={styles.voicePlayIcon}>▶</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dashboard Section - Simplified */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t(selectedLanguage, 'farmDashboard')}</Text>
              <Text style={styles.sectionSubtitle}>{t(selectedLanguage, 'monitorFarm')}</Text>
            </View>
          </View>

          {/* Simplified Dashboard - 3 Large Cards */}
          <View style={styles.simpleDashboard}>
            {dashboardItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.simpleCard, { borderLeftColor: item.color }]}
                onPress={() => handlePress(item.action)}
                activeOpacity={0.85}
              >
                <View style={[styles.simpleIconBox, { backgroundColor: item.color + '20' }]}>
                  <Text style={styles.simpleIcon}>{item.icon}</Text>
                </View>
                <View style={styles.simpleCardContent}>
                  <Text style={styles.simpleCardTitle}>{item.title}</Text>
                  <Text style={styles.simpleCardSubtitle}>{item.subtitle}</Text>
                </View>
                <View style={styles.simpleArrow}>
                  <Text style={styles.simpleArrowText}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Actions - Simplified */}
          <View style={styles.quickSection}>
            <Text style={styles.quickTitle}>{t(selectedLanguage, 'quickActions')}</Text>
            <View style={styles.quickGrid}>
              <TouchableOpacity style={styles.quickCard} onPress={onCropDoctor}>
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(126,255,138,0.15)' }]}>
                  <Text style={styles.quickIcon}>📸</Text>
                </View>
                <Text style={styles.quickLabel}>{t(selectedLanguage, 'scanCrop')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickCard} onPress={onAlerts}>
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(255,107,107,0.15)' }]}>
                  <Text style={styles.quickIcon}>🚨</Text>
                </View>
                <Text style={styles.quickLabel}>{t(selectedLanguage, 'viewAlerts')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickCard} onPress={onMandi}>
                <View style={[styles.quickIconBox, { backgroundColor: 'rgba(255,217,102,0.15)' }]}>
                  <Text style={styles.quickIcon}>📊</Text>
                </View>
                <Text style={styles.quickLabel}>{t(selectedLanguage, 'checkPrices')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <View style={styles.bottomNavInner}>
            <TouchableOpacity style={styles.navTab}>
              <View style={styles.navTabActive}>
                <Text style={styles.navIcon}>🏠</Text>
              </View>
              <Text style={[styles.navLabel, styles.navLabelActive]}>{t(selectedLanguage, 'home')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navTab} onPress={onCropDoctor}>
              <Text style={styles.navIcon}>🌾</Text>
              <Text style={styles.navLabel}>{t(selectedLanguage, 'farm')}</Text>
            </TouchableOpacity>

            {/* Center FAB */}
            <View style={styles.fabContainer}>
              <TouchableOpacity style={styles.fab} onPress={handleVoicePlay}>
                <View style={styles.fabInner}>
                  <Text style={styles.fabIcon}>🎤</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.fabLabel}>{t(selectedLanguage, 'askAi')}</Text>
            </View>

            <TouchableOpacity style={styles.navTab} onPress={onMandi}>
              <Text style={styles.navIcon}>🏪</Text>
              <Text style={styles.navLabel}>{t(selectedLanguage, 'market')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navTab} onPress={showComingSoon}>
              <Text style={styles.navIcon}>👤</Text>
              <Text style={styles.navLabel}>{t(selectedLanguage, 'profile')}</Text>
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

  // Weather Card
  weatherCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(126, 255, 138, 0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 14,
  },
  weatherCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(47, 141, 65, 0.08)',
  },
  weatherHeader: {
    marginBottom: 10,
  },
  weatherTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7eff8a',
    letterSpacing: 0.8,
  },
  weatherLocation: {
    marginTop: 4,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  weatherLoading: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  weatherMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weatherTemp: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 38,
  },
  weatherCondition: {
    fontSize: 14,
    fontWeight: '800',
    color: '#dfffe4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(126,255,138,0.12)',
  },
  weatherMetaRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  weatherMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  watchCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,107,107,0.5)',
    backgroundColor: 'rgba(255,107,107,0.14)',
    padding: 14,
  },
  watchTitle: {
    color: '#ffb3b3',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 6,
  },
  watchText: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  watchBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 9,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  watchBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
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

  // Simplified Dashboard - Large Cards
  simpleDashboard: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  simpleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 32, 20, 0.9)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderLeftWidth: 4,
  },
  simpleIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  simpleIcon: {
    fontSize: 32,
  },
  simpleCardContent: {
    flex: 1,
  },
  simpleCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  simpleCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
  },
  simpleArrow: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(126, 255, 138, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleArrowText: {
    fontSize: 18,
    color: '#7eff8a',
    fontWeight: '700',
  },

  // Quick Actions - Grid Layout
  quickSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 14,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quickIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickIcon: {
    fontSize: 26,
  },
  quickLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
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
