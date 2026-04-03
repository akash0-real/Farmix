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

  // Translate alerts when language changes or alerts update
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

          <Text style={styles.title}>🚨 {t(selectedLanguage, 'communityAlerts')}</Text>
          <Text style={styles.subtitle}>{t(selectedLanguage, 'severityBasedAlerts')}</Text>

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

            return (
              <View
                key={alert.id}
                style={[
                  styles.card,
                  severity === 'high'
                    ? styles.high
                    : severity === 'moderate'
                    ? styles.moderate
                    : styles.low,
                ]}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{alert.title}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.trendBadge}>
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
                <Text style={styles.meta}>
                  {t(selectedLanguage, 'severity')}: {String(alert.severity).toUpperCase()} | {t(selectedLanguage, 'radius')}: {alert.radiusKm} km
                </Text>
                <Text style={styles.meta}>
                  {t(selectedLanguage, 'area')}: {alert.locationName} | {new Date(alert.createdAt).toLocaleString()}
                </Text>

                <View style={styles.checklistCard}>
                  <Text style={styles.checklistTitle}>{t(selectedLanguage, 'alertDoNow')}</Text>
                  {checklist.map((step, idx) => (
                    <Text key={`${alert.id}-step-${idx}`} style={styles.checklistItem}>
                      • {step}
                    </Text>
                  ))}
                </View>

                <View style={styles.actionsRow}>
                  <Pressable style={styles.actionBtn} onPress={() => speakAlert(alert)}>
                    <Text style={styles.actionText}>🔊 {t(selectedLanguage, 'alertHear')}</Text>
                  </Pressable>
                  <Pressable style={styles.actionBtn} onPress={() => shareAlert(alert)}>
                    <Text style={styles.actionText}>📤 {t(selectedLanguage, 'alertShare')}</Text>
                  </Pressable>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    style={[styles.actionBtn, isChecked && styles.checkedBtn]}
                    onPress={() => markChecked(alert.id)}
                  >
                    <Text style={styles.actionText}>
                      {isChecked ? '✅' : '☑️'} {t(selectedLanguage, 'alertMarkChecked')}
                    </Text>
                  </Pressable>
                  <Pressable style={styles.actionBtn} onPress={callExpert}>
                    <Text style={styles.actionText}>📞 {t(selectedLanguage, 'alertCallExpert')}</Text>
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
    backgroundColor: '#0a1f12',
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  headerRow: {
    marginBottom: 10,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  backText: {
    color: '#dfffe4',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 12,
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  card: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  high: {
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  moderate: {
    borderLeftWidth: 4,
    borderLeftColor: '#ffd966',
  },
  low: {
    borderLeftWidth: 4,
    borderLeftColor: '#7eff8a',
  },
  cardTop: {
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  trendText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  reportsBadge: {
    backgroundColor: 'rgba(126,255,138,0.15)',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  reportsText: {
    color: '#dfffe4',
    fontSize: 11,
    fontWeight: '800',
  },
  cardMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.86)',
    marginBottom: 6,
  },
  meta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.62)',
    marginBottom: 3,
  },
  checklistCard: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 10,
  },
  checklistTitle: {
    color: '#ffe9a6',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
  },
  checklistItem: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 2,
  },
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBtn: {
    backgroundColor: 'rgba(126,255,138,0.2)',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});
