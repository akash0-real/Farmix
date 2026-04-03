import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Tts from 'react-native-tts';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { t } from '../languages/uiText';
import { getTtsCode } from '../languages/languageConfig';
import { useUser } from '../context/UserContext';
import { fetchMandiPrices } from '../services/mandiApi';
import { translateMandiItems } from '../services/translationService';
import MandiPriceCard from '../components/MandiPriceCard';

const farmImage = require('../assests/images/field.jpg');

export default function MandiPricesScreen({ selectedLanguage, onBack }) {
  const { user } = useUser();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPrices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchMandiPrices({
        state: user.state,
        district: user.district,
        crops: user.crops || [],
        limit: 12,
      });
      // Translate dynamic content if not English
      const translatedData = await translateMandiItems(data, selectedLanguage);
      setPrices(translatedData);
    } catch (err) {
      setError(err?.message || t(selectedLanguage, 'mandiErrorLoading'));
      setPrices([]);
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage, user.state, user.district, user.crops]);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  useEffect(() => {
    return () => {
      Tts.stop();
    };
  }, []);

  const speakSummary = () => {
    const ttsCode = getTtsCode(selectedLanguage);
    Tts.setDefaultLanguage(ttsCode);
    Tts.stop();

    if (!prices.length) {
      Tts.speak(t(selectedLanguage, 'mandiNoData'));
      return;
    }

    const top = prices[0];
    const spoken = t(selectedLanguage, 'mandiTtsSummary', {
      crop: top.crop,
      market: top.market,
      modal: Math.round(top.modalPrice),
      count: prices.length,
      district: user.district || '',
      state: user.state || '',
    });
    Tts.speak(spoken);
  };

  const locationLabel = useMemo(() => {
    if (user.district && user.state) {
      return `${user.district}, ${user.state}`;
    }
    return user.state || t(selectedLanguage, 'yourArea');
  }, [selectedLanguage, user.district, user.state]);

  return (
    <View style={styles.container}>
      <ImageBackground source={farmImage} style={styles.background} resizeMode="cover">
        <View style={styles.overlayTop} />
        <View style={styles.overlayGradient} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backText}>{t(selectedLanguage, 'backArrow')}</Text>
            </Pressable>
            <Pressable style={styles.listenBtn} onPress={speakSummary}>
              <Text style={styles.listenText}>🔊 {t(selectedLanguage, 'mandiListen')}</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>💰 {t(selectedLanguage, 'mandiPricesTitle')}</Text>
          <Text style={styles.subtitle}>{t(selectedLanguage, 'liveMarketUpdates')}</Text>

          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                📍 {t(selectedLanguage, 'mandiForLocation')}: {locationLabel}
              </Text>
            </View>
            <Pressable style={styles.refreshBtn} onPress={loadPrices} disabled={loading}>
              <Text style={styles.refreshText}>
                {loading ? t(selectedLanguage, 'mandiLoading') : t(selectedLanguage, 'mandiRefresh')}
              </Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#7eff8a" />
              <Text style={styles.loadingText}>{t(selectedLanguage, 'mandiLoading')}</Text>
            </View>
          ) : error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>{t(selectedLanguage, 'errorTitle')}</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryBtn} onPress={loadPrices}>
                <Text style={styles.retryText}>{t(selectedLanguage, 'mandiRetry')}</Text>
              </Pressable>
            </View>
          ) : prices.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t(selectedLanguage, 'mandiNoData')}</Text>
            </View>
          ) : (
            <>
              {prices.map((item, index) => (
                <MandiPriceCard
                  key={`${item.crop}-${item.market}-${index}`}
                  item={item}
                  selectedLanguage={selectedLanguage}
                  t={t}
                />
              ))}
            </>
          )}
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
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dfffe4',
  },
  listenBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(126,255,138,0.16)',
  },
  listenText: {
    color: '#dfffe4',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  chip: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  chipText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '700',
  },
  refreshBtn: {
    backgroundColor: '#2f8d41',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  refreshText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  loadingWrap: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '700',
  },
  errorCard: {
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.4)',
    backgroundColor: 'rgba(255,107,107,0.12)',
    padding: 14,
  },
  errorTitle: {
    color: '#ff9b9b',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 6,
  },
  errorText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 14,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    fontWeight: '700',
  },
});
