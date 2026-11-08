import React, { useEffect, useMemo, useState } from 'react';
import Tts from 'react-native-tts';
import {
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getCommunityAlerts,
  subscribeToCommunityAlerts,
} from '../services/alertService';
import { t } from '../languages/uiText';
import { getTtsCode } from '../languages/languageConfig';
import { translateAlerts } from '../services/translationService';
import { colors, radii, spacing } from '../theme/theme';

const farmImage = require('../assests/images/field.jpg');

function severityRank(value) {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'high') return 3;
  if (normalized === 'moderate') return 2;
  return 1;
}

function getTrend(recentScore, previousScore) {
  if (recentScore > previousScore * 1.2 && recentScore > 2) return 'rising';
  if (recentScore < previousScore * 0.8 && previousScore > 2) return 'falling';
  return 'stable';
}

function getActionChecklist(selectedLanguage, severity) {
  const normalized = String(severity || '').toLowerCase();

  if (normalized === 'high') {
    return [
      t(selectedLanguage, 'alertActionHigh1'),
      t(selectedLanguage, 'alertActionHigh2'),
      t(selectedLanguage, 'alertActionHigh3'),
    ];
  }

  if (normalized === 'moderate') {
    return [
      t(selectedLanguage, 'alertActionModerate1'),
      t(selectedLanguage, 'alertActionModerate2'),
      t(selectedLanguage, 'alertActionModerate3'),
    ];
  }

  return [
    t(selectedLanguage, 'alertActionLow1'),
    t(selectedLanguage, 'alertActionLow2'),
    t(selectedLanguage, 'alertActionLow3'),
  ];
}

function groupAlerts(alerts) {
  const groups = new Map();
  const now = Date.now();

  for (const alert of alerts) {
    const key = `${alert.type || 'general'}|${alert.diseaseName || alert.title}|${alert.locationName}`;
    const existing = groups.get(key);
    const reportCount = Number(alert.reportCount || 1);
    const confirmedCount = Number(alert.confirmedCount || 0);
    const ageMs = now - new Date(alert.createdAt).getTime();

    const score = reportCount * severityRank(alert.severity);
    const recentWindow = ageMs <= 1000 * 60 * 60 * 6 ? score : 0;
    const previousWindow =
      ageMs > 1000 * 60 * 60 * 6 && ageMs <= 1000 * 60 * 60 * 24 ? score : 0;

    if (!existing) {
      groups.set(key, {
        id: alert.id,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        radiusKm: alert.radiusKm,
        locationName: alert.locationName,
        createdAt: alert.createdAt,
        type: alert.type,
        reportCount,
        confirmedCount,
        recentScore: recentWindow,
        previousScore: previousWindow,
      });
      continue;
    }

    existing.reportCount += reportCount;
    existing.confirmedCount += confirmedCount;
    existing.recentScore += recentWindow;
    existing.previousScore += previousWindow;

    if (new Date(alert.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
      existing.createdAt = alert.createdAt;
      existing.message = alert.message;
    }

    if (severityRank(alert.severity) > severityRank(existing.severity)) {
      existing.severity = alert.severity;
      existing.radiusKm = alert.radiusKm;
    }
  }

  return [...groups.values()]
    .map(item => ({
      ...item,
      trend: getTrend(item.recentScore, item.previousScore),
    }))
    .sort((a, b) => {
      if (severityRank(b.severity) !== severityRank(a.severity)) {
        return severityRank(b.severity) - severityRank(a.severity);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export default function CommunityAlertScreen({ selectedLanguage, onBack }) {
  const [alerts, setAlerts] = useState(() => getCommunityAlerts());
  const [translatedAlerts, setTranslatedAlerts] = useState([]);
  const [checkedIds, setCheckedIds] = useState(() => new Set());

  useEffect(() => {
    const unsubscribe = subscribeToCommunityAlerts(nextAlerts => {
      setAlerts(nextAlerts);
    });

    return () => {
      unsubscribe();
      Tts.stop();
    };
  }, []);

  const groupedAlerts = useMemo(() => groupAlerts(alerts), [alerts]);

  useEffect(() => {
    const translateContent = async () => {
      if (groupedAlerts.length > 0) {
        const translated = await translateAlerts(groupedAlerts, selectedLanguage);
        setTranslatedAlerts(translated);
      } else {
        setTranslatedAlerts([]);
      }
    };
    translateContent();
  }, [groupedAlerts, selectedLanguage]);

  const speakAlert = alert => {
    const ttsCode = getTtsCode(selectedLanguage);
    Tts.setDefaultLanguage(ttsCode);
    Tts.stop();

    const checklist = getActionChecklist(selectedLanguage, alert.severity);
    const trendLabel = t(selectedLanguage, `alertTrend${String(alert.trend || 'stable').charAt(0).toUpperCase()}${String(alert.trend || 'stable').slice(1)}`);

    const speech = [
      `${alert.title}.`,
      `${alert.message}`,
      `${t(selectedLanguage, 'severity')}: ${alert.severity}.`,
      `${t(selectedLanguage, 'alertTrend')}: ${trendLabel}.`,
      `${t(selectedLanguage, 'alertFarmersReported', { count: alert.reportCount })}.`,
      `${t(selectedLanguage, 'alertDoNow')}: ${checklist.join('. ')}.`,
    ].join(' ');

    Tts.speak(speech);
  };

  const shareAlert = async alert => {
    const text = [
      `${alert.title}`,
      `${alert.message}`,
      `${t(selectedLanguage, 'severity')}: ${String(alert.severity).toUpperCase()}`,
      `${t(selectedLanguage, 'radius')}: ${alert.radiusKm} km`,
      `${t(selectedLanguage, 'area')}: ${alert.locationName}`,
    ].join('\n');
    await Share.share({ message: text });
  };

  const callExpert = async () => {
    try {
      await Linking.openURL('tel:18001801551');
    } catch (error) {
      // ignore call failures gracefully
    }
  };

  const markChecked = id => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={farmImage} style={styles.background} resizeMode="cover">
        <View style={styles.overlayTop} />
        <View style={styles.overlayGradient} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backText}>{t(selectedLanguage, 'backArrow')}</Text>
            </Pressable>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>🚨 {t(selectedLanguage, 'communityAlerts')}</Text>
            <Text style={styles.subtitle}>{t(selectedLanguage, 'severityBasedAlerts')}</Text>
          </View>

          {(translatedAlerts.length > 0 ? translatedAlerts : groupedAlerts).map(alert => {
            const severity = String(alert.severity || '').toLowerCase();
            const isChecked = checkedIds.has(alert.id);
            const trendTextKey =
              alert.trend === 'rising'
                ? 'alertTrendRising'
                : alert.trend === 'falling'
                ? 'alertTrendFalling'
                : 'alertTrendStable';

            const checklist = getActionChecklist(selectedLanguage, severity);

            const isHigh = severity === 'high';
            const isMod = severity === 'moderate';
            const accentColor = isHigh ? colors.coral : isMod ? colors.gold : colors.emerald;

            return (
              <View
                key={alert.id}
                style={[
                  styles.card,
                  {
                    borderColor: isHigh
                      ? 'rgba(248, 113, 113, 0.4)'
                      : isMod
                      ? 'rgba(251, 191, 36, 0.35)'
                      : 'rgba(52, 211, 153, 0.3)',
                  },
                ]}
              >
                {/* Outbreak Card Top */}
                <View style={styles.cardTop}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>{alert.title}</Text>
                    <View style={[styles.radiusPill, { borderColor: accentColor + '40' }]}>
                      <Text style={[styles.radiusText, { color: accentColor }]}>
                        {alert.radiusKm} KM RADIUS
                      </Text>
                    </View>
                  </View>

                  <View style={styles.badgeRow}>
                    <View style={styles.trendBadge}>
                      <View style={[styles.trendDot, { backgroundColor: accentColor }]} />
                      <Text style={styles.trendText}>{t(selectedLanguage, trendTextKey)}</Text>
                    </View>
                    <View style={styles.reportsBadge}>
                      <Text style={styles.reportsText}>
                        {t(selectedLanguage, 'alertFarmersReported', { count: alert.reportCount })}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.cardMessage}>{alert.message}</Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLocation}>📍 {alert.locationName}</Text>
                  <Text style={styles.metaTime}>
                    {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {/* Immediate Action Checklist */}
                <View style={styles.checklistCard}>
                  <Text style={styles.checklistTitle}>⚡ {t(selectedLanguage, 'alertDoNow')}</Text>
                  {checklist.map((step, idx) => (
                    <View key={`${alert.id}-step-${idx}`} style={styles.checklistItemRow}>
                      <View style={[styles.stepBullet, { backgroundColor: accentColor }]} />
                      <Text style={styles.checklistItemText}>{step}</Text>
                    </View>
                  ))}
                </View>

                {/* Action Buttons Row */}
                <View style={styles.actionsGrid}>
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
                    onPress={() => speakAlert(alert)}
                  >
                    <Text style={styles.actionText}>🔊 {t(selectedLanguage, 'alertHear')}</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.8 }]}
                    onPress={() => shareAlert(alert)}
                  >
                    <Text style={styles.actionText}>📤 {t(selectedLanguage, 'alertShare')}</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      isChecked && styles.checkedBtn,
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => markChecked(alert.id)}
                  >
                    <Text style={[styles.actionText, isChecked && { color: colors.emerald }]}>
                      {isChecked ? '✅ ' : '☑️ '}{t(selectedLanguage, 'alertMarkChecked')}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, styles.callBtn, pressed && { opacity: 0.8 }]}
                    onPress={callExpert}
                  >
                    <Text style={[styles.actionText, { color: colors.gold }]}>
                      📞 {t(selectedLanguage, 'alertCallExpert')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>
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
    height: '40%',
    backgroundColor: 'rgba(5, 18, 9, 0.6)',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 60,
  },
  headerRow: {
    marginBottom: spacing.md,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  backText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  titleSection: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.muted,
  },
  card: {
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(18, 36, 25, 0.88)',
    borderWidth: 1,
  },
  cardTop: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  radiusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  radiusText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  trendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trendText: {
    color: colors.inkSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  reportsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  reportsText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  cardMessage: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 19,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: spacing.md,
  },
  metaLocation: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  metaTime: {
    color: colors.faint,
    fontSize: 11,
  },

  // Immediate Action Checklist
  checklistCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radii.md,
    padding: 12,
    marginBottom: spacing.md,
  },
  checklistTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  checklistItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  stepBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 6,
  },
  checklistItemText: {
    flex: 1,
    color: colors.inkSecondary,
    fontSize: 12,
    lineHeight: 17,
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  checkedBtn: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  callBtn: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
});
