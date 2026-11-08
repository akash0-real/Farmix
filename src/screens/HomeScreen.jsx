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
import {
  destroyVoiceSession,
  parseVoiceCommand,
  startVoiceSession,
  stopVoiceSession,
} from '../services/voiceAssistantService';
import {
  formatBadge,
  getCurrentBadge,
  getNextBadge,
  getRewards,
} from '../services/rewardsService';
import { colors, radii, spacing } from '../theme/theme';

const farmImage = require('../assests/images/field.jpg');

export default function HomeScreen({
  selectedLanguage,
  onCropDoctor,
  onMandi,
  onAlerts,
  onCommunityLessons,
  onBuyerConnect,
  onSoilAnalysis,
  onGovtSchemes,
  onLogout,
}) {
  const { user } = useUser();
  const [latestAlert, setLatestAlert] = useState(() => getCommunityAlerts()[0]);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [isCommandListening, setIsCommandListening] = useState(false);
  const [lastVoiceText, setLastVoiceText] = useState('');
  const [lastVoiceActionKey, setLastVoiceActionKey] = useState('');
  const [rewards, setRewards] = useState(null);
  const lastSpokenAlertIdRef = useRef(null);

  useEffect(() => {
    const unsubscribe = subscribeToCommunityAlerts(alerts => {
      setLatestAlert(alerts[0] || null);
    });
    return () => {
      unsubscribe();
      destroyVoiceSession();
      Tts.stop();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadRewards = async () => {
      const data = await getRewards();
      if (isMounted) {
        setRewards(data);
      }
    };
    loadRewards();
    return () => {
      isMounted = false;
    };
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t(selectedLanguage, 'goodMorning');
    if (hour < 17) return t(selectedLanguage, 'goodAfternoon');
    return t(selectedLanguage, 'goodEvening');
  };

  const statsData = useMemo(() => [
    {
      label: t(selectedLanguage, 'totalArea'),
      value: user.farmSize || '0',
      unit: t(selectedLanguage, 'acres'),
      glyph: '🌾',
    },
    {
      label: t(selectedLanguage, 'farmType'),
      value: user.farmType === 'irrigated' ? '💧' : user.farmType === 'rainfed' ? '🌧️' : '🔄',
      unit: user.farmType ? t(selectedLanguage, user.farmType) : t(selectedLanguage, 'notAvailable'),
      glyph: '🏡',
    },
    {
      label: t(selectedLanguage, 'crops'),
      value: user.crops?.length || 0,
      unit: t(selectedLanguage, 'types'),
      glyph: '🌱',
    },
  ], [user, selectedLanguage]);

  const voiceStatus =
    latestAlert?.severity === 'high'
      ? t(selectedLanguage, 'statusRed')
      : latestAlert?.severity === 'moderate'
      ? t(selectedLanguage, 'statusYellow')
      : t(selectedLanguage, 'statusGreen');

  const currentBadge = rewards ? getCurrentBadge(Number(rewards.points || 0)) : null;
  const nextBadge = rewards ? getNextBadge(Number(rewards.points || 0)) : null;

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
      `${t(selectedLanguage, 'districtWatchTitle')}. ${t(selectedLanguage, 'districtWatchMessage', {
        location: latestAlert.locationName || t(selectedLanguage, 'yourArea'),
      })}`,
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

  const handleAskAiVoiceCommand = async () => {
    try {
      await startVoiceSession({
        locale: getTtsCode(selectedLanguage),
        autoStopMs: 6000,
        onStart: () => {
          setIsCommandListening(true);
        },
        onEnd: () => {
          setIsCommandListening(false);
        },
        onResults: transcript => {
          setLastVoiceText(transcript);
          const command = parseVoiceCommand(transcript);

          if (command === 'cropDoctor') {
            setLastVoiceActionKey('voiceActionScan');
            Tts.setDefaultLanguage(getTtsCode(selectedLanguage));
            Tts.stop();
            Tts.speak(t(selectedLanguage, 'voiceActionScan'));
            onCropDoctor?.();
            return;
          }
          if (command === 'soilAnalysis') {
            setLastVoiceActionKey('voiceActionSoil');
            Tts.setDefaultLanguage(getTtsCode(selectedLanguage));
            Tts.stop();
            Tts.speak(t(selectedLanguage, 'voiceActionSoil'));
            onSoilAnalysis?.();
            return;
          }
          if (command === 'mandi') {
            setLastVoiceActionKey('voiceActionMandi');
            Tts.setDefaultLanguage(getTtsCode(selectedLanguage));
            Tts.stop();
            Tts.speak(t(selectedLanguage, 'voiceActionMandi'));
            onMandi?.();
            return;
          }
          if (command === 'buyerConnect') {
            setLastVoiceActionKey('voiceActionBuyer');
            Tts.setDefaultLanguage(getTtsCode(selectedLanguage));
            Tts.stop();
            Tts.speak(t(selectedLanguage, 'voiceActionBuyer'));
            onBuyerConnect?.();
            return;
          }
          if (command === 'communityLessons') {
            setLastVoiceActionKey('voiceActionLessons');
            Tts.setDefaultLanguage(getTtsCode(selectedLanguage));
            Tts.stop();
            Tts.speak(t(selectedLanguage, 'voiceActionLessons'));
            onCommunityLessons?.();
            return;
          }
          if (command === 'alerts') {
            setLastVoiceActionKey('voiceActionAlerts');
            Tts.setDefaultLanguage(getTtsCode(selectedLanguage));
            Tts.stop();
            Tts.speak(t(selectedLanguage, 'voiceActionAlerts'));
            onAlerts?.();
            return;
          }
          if (command === 'weather') {
            setLastVoiceActionKey('voiceActionWeather');
            handleVoicePlay();
            return;
          }
          if (command === 'govtSchemes') {
            setLastVoiceActionKey('voiceActionSchemes');
            Tts.setDefaultLanguage(getTtsCode(selectedLanguage));
            Tts.stop();
            Tts.speak(t(selectedLanguage, 'voiceActionSchemes'));
            onGovtSchemes?.();
            return;
          }

          setLastVoiceActionKey('voiceCommandNotUnderstood');
          Tts.setDefaultLanguage(getTtsCode(selectedLanguage));
          Tts.stop();
          Tts.speak(t(selectedLanguage, 'voiceCommandNotUnderstood'));
        },
        onError: () => {
          setIsCommandListening(false);
          setLastVoiceActionKey('voiceInputFailedMessage');
          Tts.setDefaultLanguage(getTtsCode(selectedLanguage));
          Tts.stop();
          Tts.speak(t(selectedLanguage, 'voiceInputFailedMessage'));
        },
      });
    } catch (error) {
      setIsCommandListening(false);
      const message = error?.message ? String(error.message) : '';
      if (message.includes('VOICE_NATIVE_MISSING') || message.includes('VOICE_ENGINE_UNAVAILABLE')) {
        Alert.alert(
          t(selectedLanguage, 'voiceInputFailedTitle'),
          t(selectedLanguage, 'voiceBuildNotAvailable'),
        );
        return;
      }
      handleVoicePlay();
    }
  };

  const showComingSoon = () => {
    Alert.alert(t(selectedLanguage, 'comingSoonTitle'), t(selectedLanguage, 'comingSoonMessage'));
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={farmImage} style={styles.background} resizeMode="cover">
        {/* Layered atmospheric overlays */}
        <View style={styles.overlayTop} />
        <View style={styles.overlayGradient} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarGlyph}>🌾</Text>
                </View>
                <View style={styles.onlineDot} />
              </View>

              <View>
                <Text style={styles.greeting}>{getGreeting()}</Text>
                <Text style={styles.headerName}>
                  {user.name || t(selectedLanguage, 'farmerDefaultName')}
                </Text>
                <View style={styles.tierPill}>
                  <Text style={styles.tierStar}>★</Text>
                  <Text style={styles.tierLabel}>{t(selectedLanguage, 'premiumMember')}</Text>
                </View>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.actionCircle}
                onPress={onAlerts}
                activeOpacity={0.8}
              >
                <Text style={styles.circleIcon}>🔔</Text>
                <View style={styles.alertCountBadge}>
                  <Text style={styles.alertCountText}>3</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCircle}
                onPress={onLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.circleIcon}>🚪</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Farm Quick Stats Ribbon */}
          <View style={styles.statsRibbon}>
            {statsData.map((stat, i) => (
              <View key={i} style={styles.statTile}>
                <View style={styles.statTileHeader}>
                  <Text style={styles.statTileGlyph}>{stat.glyph}</Text>
                  <Text style={styles.statTileLabel}>{stat.label}</Text>
                </View>
                <View style={styles.statTileValueRow}>
                  <Text style={styles.statTileValue}>{stat.value}</Text>
                  <Text style={styles.statTileUnit}>{stat.unit}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Weather Widget */}
          <View style={styles.weatherCard}>
            <View style={styles.weatherHeaderRow}>
              <View style={styles.weatherLocationBox}>
                <Text style={styles.weatherBadgeLabel}>MICRO-CLIMATE</Text>
                <Text style={styles.weatherLocation}>
                  📍 {weather?.locationName || `${user.district || user.state || t(selectedLanguage, 'yourArea')}`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.listenWeatherBtn}
                onPress={handleVoicePlay}
                activeOpacity={0.8}
              >
                <Text style={styles.listenWeatherIcon}>🔊</Text>
              </TouchableOpacity>
            </View>

            {weatherLoading ? (
              <Text style={styles.weatherLoadingText}>{t(selectedLanguage, 'loadingWeather')}</Text>
            ) : weather ? (
              <>
                <View style={styles.weatherMainRow}>
                  <Text style={styles.weatherTemp}>
                    {Math.round(Number(weather.temperatureC))}°
                  </Text>
                  <View style={styles.weatherConditionBox}>
                    <Text style={styles.weatherCondition}>
                      {t(selectedLanguage, weather.conditionKey)}
                    </Text>
                    <Text style={styles.weatherFeelsLike}>
                      {t(selectedLanguage, 'feelsLike')}: {Math.round(Number(weather.feelsLikeC))}°C
                    </Text>
                  </View>
                </View>

                <View style={styles.weatherMetricsRow}>
                  <View style={styles.weatherMetric}>
                    <Text style={styles.metricLabel}>{t(selectedLanguage, 'humidity')}</Text>
                    <Text style={styles.metricValue}>{Math.round(Number(weather.humidity))}%</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.weatherMetric}>
                    <Text style={styles.metricLabel}>{t(selectedLanguage, 'wind')}</Text>
                    <Text style={styles.metricValue}>{Math.round(Number(weather.windKmh))} km/h</Text>
                  </View>
                  <View style={styles.metricDivider} />
                  <View style={styles.weatherMetric}>
                    <Text style={styles.metricLabel}>STATUS</Text>
                    <Text style={[styles.metricValue, { color: colors.emerald }]}>{voiceStatus}</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.weatherLoadingText}>{t(selectedLanguage, 'weatherUnavailable')}</Text>
            )}
          </View>

          {/* Critical District Watch Banner (if active) */}
          {isDistrictWatch && latestAlert ? (
            <View style={styles.districtWatchCard}>
              <View style={styles.watchHeader}>
                <View style={styles.watchDot} />
                <Text style={styles.watchHeading}>
                  {t(selectedLanguage, 'districtWatchTitle')}
                </Text>
              </View>
              <Text style={styles.watchBody}>
                {t(selectedLanguage, 'districtWatchMessage', {
                  location: latestAlert.locationName || t(selectedLanguage, 'yourArea'),
                })}
              </Text>
              <TouchableOpacity
                style={styles.watchActionBtn}
                onPress={onAlerts}
                activeOpacity={0.85}
              >
                <Text style={styles.watchActionText}>
                  {t(selectedLanguage, 'districtWatchAction')} →
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Live Voice Feed Banner */}
          {lastVoiceText ? (
            <View style={styles.voiceTranscriptCard}>
              <View style={styles.voiceTranscriptHeader}>
                <Text style={styles.voiceHeardBadge}>{t(selectedLanguage, 'voiceHeard')}</Text>
                {lastVoiceActionKey ? (
                  <Text style={styles.voiceActionChip}>
                    ✓ {t(selectedLanguage, lastVoiceActionKey)}
                  </Text>
                ) : null}
              </View>
              <Text style={styles.voiceTranscriptText}>"{lastVoiceText}"</Text>
            </View>
          ) : null}

          {/* Section: Command Modules */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>{t(selectedLanguage, 'farmDashboard')}</Text>
            <Text style={styles.sectionSubtitle}>{t(selectedLanguage, 'monitorFarm')}</Text>
          </View>

          {/* Featured Cards: Crop Doctor & Mandi Prices */}
          <View style={styles.featuredGrid}>
            {/* Crop Doctor Hero Card */}
            <TouchableOpacity
              style={[styles.featureHeroCard, { borderColor: 'rgba(52, 211, 153, 0.35)' }]}
              onPress={onCropDoctor}
              activeOpacity={0.88}
            >
              <View style={styles.cardHeaderTop}>
                <View style={[styles.iconPill, { backgroundColor: 'rgba(52, 211, 153, 0.15)' }]}>
                  <Text style={styles.iconGlyph}>📸</Text>
                </View>
                <View style={styles.tagPillEmerald}>
                  <Text style={styles.tagTextEmerald}>AI DIAGNOSIS</Text>
                </View>
              </View>

              <Text style={styles.heroCardTitle}>{t(selectedLanguage, 'cropDoctor')}</Text>
              <Text style={styles.heroCardSub}>{t(selectedLanguage, 'aiDiseaseDetection')}</Text>

              <View style={styles.cardFooterRow}>
                <Text style={styles.cardActionLink}>{t(selectedLanguage, 'scanCrop')}</Text>
                <Text style={styles.cardArrowEmerald}>→</Text>
              </View>
            </TouchableOpacity>

            {/* Mandi Prices Hero Card */}
            <TouchableOpacity
              style={[styles.featureHeroCard, { borderColor: 'rgba(251, 191, 36, 0.3)' }]}
              onPress={onMandi}
              activeOpacity={0.88}
            >
              <View style={styles.cardHeaderTop}>
                <View style={[styles.iconPill, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                  <Text style={styles.iconGlyph}>📈</Text>
                </View>
                <View style={styles.tagPillGold}>
                  <Text style={styles.tagTextGold}>LIVE MANDI</Text>
                </View>
              </View>

              <Text style={styles.heroCardTitle}>{t(selectedLanguage, 'mandiPrices')}</Text>
              <Text style={styles.heroCardSub}>{t(selectedLanguage, 'liveMarketRates')}</Text>

              <View style={styles.cardFooterRow}>
                <Text style={[styles.cardActionLink, { color: colors.gold }]}>
                  {t(selectedLanguage, 'checkPrices')}
                </Text>
                <Text style={[styles.cardArrowEmerald, { color: colors.gold }]}>→</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Secondary 2-Column Grid */}
          <View style={styles.twoColGrid}>
            {/* Buyer Direct Connect */}
            <TouchableOpacity
              style={styles.colCard}
              onPress={onBuyerConnect}
              activeOpacity={0.85}
            >
              <View style={[styles.colIconBox, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
                <Text style={styles.colIcon}>🛒</Text>
              </View>
              <Text style={styles.colTitle}>{t(selectedLanguage, 'sellerConnection')}</Text>
              <Text style={styles.colSub}>{t(selectedLanguage, 'sellerConnectionSubtitle')}</Text>
            </TouchableOpacity>

            {/* Community Alert Radar */}
            <TouchableOpacity
              style={styles.colCard}
              onPress={onAlerts}
              activeOpacity={0.85}
            >
              <View style={[styles.colIconBox, { backgroundColor: 'rgba(248, 113, 113, 0.15)' }]}>
                <Text style={styles.colIcon}>🚨</Text>
              </View>
              <Text style={styles.colTitle}>{t(selectedLanguage, 'alertCenter')}</Text>
              <Text style={styles.colSub}>{t(selectedLanguage, 'communityWarnings')}</Text>
            </TouchableOpacity>

            {/* Community Lessons Peer Network */}
            <TouchableOpacity
              style={styles.colCard}
              onPress={onCommunityLessons}
              activeOpacity={0.85}
            >
              <View style={[styles.colIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Text style={styles.colIcon}>🤝</Text>
              </View>
              <Text style={styles.colTitle}>{t(selectedLanguage, 'communityLessons')}</Text>
              <Text style={styles.colSub}>{t(selectedLanguage, 'communityLessonsSubtitle')}</Text>
            </TouchableOpacity>

            {/* Soil Health Analysis */}
            <TouchableOpacity
              style={styles.colCard}
              onPress={onSoilAnalysis}
              activeOpacity={0.85}
            >
              <View style={[styles.colIconBox, { backgroundColor: 'rgba(217, 119, 6, 0.15)' }]}>
                <Text style={styles.colIcon}>🌍</Text>
              </View>
              <Text style={styles.colTitle}>{t(selectedLanguage, 'soilAnalysis')}</Text>
              <Text style={styles.colSub}>{t(selectedLanguage, 'soilAnalysisSubtitle')}</Text>
            </TouchableOpacity>
          </View>

          {/* Full-Width Govt Schemes & Subsidies Card */}
          <TouchableOpacity
            style={styles.schemesFullCard}
            onPress={onGovtSchemes}
            activeOpacity={0.88}
          >
            <View style={styles.schemesIconWrap}>
              <Text style={styles.schemesGlyph}>🏛️</Text>
            </View>
            <View style={styles.schemesContent}>
              <View style={styles.schemesTag}>
                <Text style={styles.schemesTagText}>CENTRAL & STATE</Text>
              </View>
              <Text style={styles.schemesTitle}>{t(selectedLanguage, 'govtSchemes')}</Text>
              <Text style={styles.schemesSubtitle}>{t(selectedLanguage, 'govtSchemesSubtitle')}</Text>
            </View>
            <Text style={styles.schemesArrow}>→</Text>
          </TouchableOpacity>

          {/* Farmer Impact & Badges */}
          {rewards ? (
            <View style={styles.impactCard}>
              <View style={styles.impactTopRow}>
                <View style={styles.impactHeaderLeft}>
                  <Text style={styles.impactGlyph}>🏅</Text>
                  <View>
                    <Text style={styles.impactTitle}>{t(selectedLanguage, 'myImpact')}</Text>
                    <Text style={styles.impactBadgeText}>
                      {currentBadge ? formatBadge(currentBadge, selectedLanguage) : 'Farmer Starter'}
                    </Text>
                  </View>
                </View>
                <View style={styles.pointsPill}>
                  <Text style={styles.pointsNumber}>{rewards.points || 0}</Text>
                  <Text style={styles.pointsLabel}>PTS</Text>
                </View>
              </View>

              <View style={styles.impactStatsRow}>
                <View style={styles.impactStat}>
                  <Text style={styles.impactStatValue}>{rewards.lessonsPosted || 0}</Text>
                  <Text style={styles.impactStatLabel}>{t(selectedLanguage, 'lessonsPosted')}</Text>
                </View>
                <View style={styles.impactDivider} />
                <View style={styles.impactStat}>
                  <Text style={styles.impactStatValue}>{rewards.helpfulReceived || 0}</Text>
                  <Text style={styles.impactStatLabel}>{t(selectedLanguage, 'helpfulReceived')}</Text>
                </View>
                <View style={styles.impactDivider} />
                <View style={styles.impactStat}>
                  <Text style={styles.impactStatValue}>{rewards.verifiedOutcomes || 0}</Text>
                  <Text style={styles.impactStatLabel}>{t(selectedLanguage, 'verifiedOutcomes')}</Text>
                </View>
              </View>

              {nextBadge ? (
                <View style={styles.progressWrap}>
                  <View style={styles.progressBar}>
                    <View style={styles.progressFill} />
                  </View>
                  <Text style={styles.progressHint}>
                    {t(selectedLanguage, 'nextBadgeIn', { points: nextBadge.pointsNeeded })}
                  </Text>
                </View>
              ) : (
                <Text style={styles.progressHint}>{t(selectedLanguage, 'maxBadgeReached')}</Text>
              )}
            </View>
          ) : null}
        </ScrollView>

        {/* Floating Bottom Navigation Dock */}
        <View style={styles.bottomNav}>
          <View style={styles.bottomNavDock}>
            {/* Tab: Home */}
            <TouchableOpacity style={styles.dockTab} activeOpacity={0.8}>
              <View style={styles.activePillIndicator}>
                <Text style={styles.dockIconActive}>🏠</Text>
              </View>
              <Text style={styles.dockLabelActive}>{t(selectedLanguage, 'home')}</Text>
            </TouchableOpacity>

            {/* Tab: Crop Doctor */}
            <TouchableOpacity
              style={styles.dockTab}
              onPress={onCropDoctor}
              activeOpacity={0.8}
            >
              <Text style={styles.dockIcon}>🌿</Text>
              <Text style={styles.dockLabel}>{t(selectedLanguage, 'farm')}</Text>
            </TouchableOpacity>

            {/* Center Voice AI FAB */}
            <View style={styles.fabWrapper}>
              <TouchableOpacity
                style={[styles.voiceFab, isCommandListening && styles.voiceFabListening]}
                onPress={handleAskAiVoiceCommand}
                onLongPress={handleVoicePlay}
                activeOpacity={0.9}
              >
                <Text style={styles.voiceFabIcon}>🎙️</Text>
              </TouchableOpacity>
              <Text style={styles.fabPromptText}>
                {isCommandListening
                  ? t(selectedLanguage, 'voiceListeningNow')
                  : t(selectedLanguage, 'askAi')}
              </Text>
              {isCommandListening ? (
                <TouchableOpacity style={styles.stopPill} onPress={stopVoiceSession}>
                  <Text style={styles.stopPillText}>{t(selectedLanguage, 'voiceStopListening')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Tab: Market */}
            <TouchableOpacity
              style={styles.dockTab}
              onPress={onMandi}
              activeOpacity={0.8}
            >
              <Text style={styles.dockIcon}>🏪</Text>
              <Text style={styles.dockLabel}>{t(selectedLanguage, 'market')}</Text>
            </TouchableOpacity>

            {/* Tab: Profile */}
            <TouchableOpacity
              style={styles.dockTab}
              onPress={showComingSoon}
              activeOpacity={0.8}
            >
              <Text style={styles.dockIcon}>👤</Text>
              <Text style={styles.dockLabel}>{t(selectedLanguage, 'profile')}</Text>
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
    backgroundColor: colors.ground,
  },
  background: {
    flex: 1,
    backgroundColor: '#07130a',
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 14, 8, 0.88)',
  },
  overlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(5, 18, 9, 0.6)',
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    paddingBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  avatarGlyph: {
    fontSize: 22,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.emerald,
    borderWidth: 2,
    borderColor: '#07130a',
  },
  greeting: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  headerName: {
    fontSize: 18,
    color: colors.ink,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  tierStar: {
    color: colors.gold,
    fontSize: 10,
  },
  tierLabel: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionCircle: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  circleIcon: {
    fontSize: 16,
  },
  alertCountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.coral,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCountText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },

  // Stats Ribbon
  statsRibbon: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: 10,
    marginBottom: spacing.lg,
  },
  statTile: {
    flex: 1,
    backgroundColor: 'rgba(18, 36, 25, 0.8)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  statTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  statTileGlyph: {
    fontSize: 13,
  },
  statTileLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statTileValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statTileValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink,
  },
  statTileUnit: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
  },

  // Weather Card
  weatherCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: 'rgba(16, 34, 23, 0.88)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.2)',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  weatherHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  weatherLocationBox: {
    flex: 1,
  },
  weatherBadgeLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.emerald,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  weatherLocation: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  listenWeatherBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  listenWeatherIcon: {
    fontSize: 14,
  },
  weatherLoadingText: {
    color: colors.muted,
    fontSize: 13,
    paddingVertical: spacing.md,
  },
  weatherMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: spacing.md,
  },
  weatherTemp: {
    fontSize: 44,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
    lineHeight: 48,
  },
  weatherConditionBox: {
    flex: 1,
  },
  weatherCondition: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  weatherFeelsLike: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  weatherMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radii.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  weatherMetric: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.faint,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.inkSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // District Watch Banner
  districtWatchCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  watchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  watchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.coral,
  },
  watchHeading: {
    color: colors.coral,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  watchBody: {
    color: colors.inkSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  watchActionBtn: {
    backgroundColor: colors.coral,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
  },
  watchActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // Voice Transcript Card
  voiceTranscriptCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  voiceTranscriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  voiceHeardBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.emerald,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  voiceActionChip: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.emerald,
  },
  voiceTranscriptText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    fontStyle: 'italic',
  },

  // Section Titles
  sectionTitleRow: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },

  // Featured Cards Grid
  featuredGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    gap: 12,
    marginBottom: spacing.md,
  },
  featureHeroCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 36, 25, 0.88)',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
    minHeight: 160,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconPill: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 18,
  },
  tagPillEmerald: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  tagTextEmerald: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.emerald,
    letterSpacing: 0.5,
  },
  tagPillGold: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  tagTextGold: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 0.5,
  },
  heroCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  heroCardSub: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 15,
    marginTop: 3,
    marginBottom: spacing.md,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardActionLink: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.emerald,
    letterSpacing: 0.3,
  },
  cardArrowEmerald: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.emerald,
  },

  // 2-Column Grid
  twoColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: 12,
    marginBottom: spacing.md,
  },
  colCard: {
    width: '48%',
    backgroundColor: 'rgba(18, 36, 25, 0.75)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
  },
  colIconBox: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  colIcon: {
    fontSize: 16,
  },
  colTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  colSub: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 14,
  },

  // Full-Width Schemes Card
  schemesFullCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: spacing.lg,
  },
  schemesIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schemesGlyph: {
    fontSize: 22,
  },
  schemesContent: {
    flex: 1,
  },
  schemesTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  schemesTagText: {
    color: colors.sky,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  schemesTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  schemesSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  schemesArrow: {
    fontSize: 18,
    color: colors.sky,
    fontWeight: '800',
  },

  // Impact Card
  impactCard: {
    marginHorizontal: spacing.xl,
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  impactTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  impactHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  impactGlyph: {
    fontSize: 24,
  },
  impactTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  impactBadgeText: {
    fontSize: 12,
    color: colors.gold,
    fontWeight: '700',
  },
  pointsPill: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },
  pointsNumber: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: '900',
  },
  pointsLabel: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  impactStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radii.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  impactStat: {
    flex: 1,
    alignItems: 'center',
  },
  impactStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  impactStatLabel: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  impactDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressWrap: {
    gap: 6,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    width: '65%',
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  progressHint: {
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },

  // Bottom Navigation Dock
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  bottomNavDock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(8, 20, 12, 0.96)',
    borderRadius: radii.xl,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  dockTab: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  activePillIndicator: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginBottom: 2,
  },
  dockIcon: {
    fontSize: 18,
    opacity: 0.65,
  },
  dockIconActive: {
    fontSize: 18,
  },
  dockLabel: {
    fontSize: 10,
    color: colors.faint,
    fontWeight: '600',
    marginTop: 2,
  },
  dockLabelActive: {
    fontSize: 10,
    color: colors.emerald,
    fontWeight: '800',
    marginTop: 2,
  },
  fabWrapper: {
    alignItems: 'center',
    marginTop: -26,
    marginHorizontal: 4,
  },
  voiceFab: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: '#1b6334',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: 'rgba(52, 211, 153, 0.6)',
    shadowColor: colors.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  voiceFabListening: {
    backgroundColor: colors.coral,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: colors.coral,
  },
  voiceFabIcon: {
    fontSize: 22,
  },
  fabPromptText: {
    fontSize: 9,
    color: colors.emerald,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  stopPill: {
    marginTop: 4,
    backgroundColor: 'rgba(248, 113, 113, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  stopPillText: {
    color: '#ffd0d0',
    fontSize: 9,
    fontWeight: '800',
  },
});
