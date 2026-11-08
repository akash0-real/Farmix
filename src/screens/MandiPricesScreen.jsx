import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Tts from 'react-native-tts';
import {
  ActivityIndicator,
  ImageBackground,
  Modal,
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
import { cacheMandiPrices, getCachedMandiPrices, formatTimeAgo } from '../services/offlineCache';
import { analyzePrices, formatPrice } from '../services/priceAnalysisService';
import MandiPriceCard from '../components/MandiPriceCard';
import { colors, radii, spacing } from '../theme/theme';

const farmImage = require('../assests/images/field.jpg');

export default function MandiPricesScreen({ selectedLanguage, onBack }) {
  const { user } = useUser();
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analyzingPrices, setAnalyzingPrices] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('sell'); // 'sell' or 'buy'

  const loadPrices = useCallback(async () => {
    setLoading(true);
    setError('');
    setIsOffline(false);

    try {
      const data = await fetchMandiPrices({
        state: user.state,
        district: user.district,
        crops: user.crops || [],
        limit: 12,
      });
      const translatedData = await translateMandiItems(data, selectedLanguage);
      setPrices(translatedData);
      setLastSync(Date.now());
      cacheMandiPrices(translatedData);
    } catch (err) {
      const cached = await getCachedMandiPrices();
      if (cached?.data?.length > 0) {
        setPrices(cached.data);
        setIsOffline(true);
        setLastSync(Date.now() - cached.age);
        setError('');
      } else {
        setError(err?.message || t(selectedLanguage, 'mandiErrorLoading'));
        setPrices([]);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage, user.state, user.district, user.crops]);

  const handleAnalyze = async (mode = 'sell') => {
    if (prices.length === 0) return;
    setAnalysisMode(mode);
    setShowAnalysis(true);
    setAnalyzingPrices(true);
    try {
      const result = await analyzePrices(prices, user, selectedLanguage, mode);
      setAnalysis(result);
    } catch (err) {
      setAnalysis({ error: err.message });
    } finally {
      setAnalyzingPrices(false);
    }
  };

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
          {/* Header Row */}
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backText}>{t(selectedLanguage, 'backArrow')}</Text>
            </Pressable>
            <Pressable style={styles.listenBtn} onPress={speakSummary}>
              <Text style={styles.listenText}>🔊 {t(selectedLanguage, 'mandiListen')}</Text>
            </Pressable>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>📈 {t(selectedLanguage, 'mandiPricesTitle')}</Text>
            <Text style={styles.subtitle}>{t(selectedLanguage, 'liveMarketUpdates')}</Text>
          </View>

          {/* Offline Banner */}
          {isOffline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineIcon}>📴</Text>
              <View style={styles.offlineInfo}>
                <Text style={styles.offlineText}>{t(selectedLanguage, 'offlineMode')}</Text>
                <Text style={styles.offlineSync}>
                  {t(selectedLanguage, 'lastSync')}: {formatTimeAgo(lastSync)}
                </Text>
              </View>
            </View>
          )}

          {/* Location & Refresh Strip */}
          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText} numberOfLines={1}>
                📍 {t(selectedLanguage, 'mandiForLocation')}: {locationLabel}
              </Text>
            </View>
            <Pressable style={styles.refreshBtn} onPress={loadPrices} disabled={loading}>
              <Text style={styles.refreshText}>
                {loading ? t(selectedLanguage, 'mandiLoading') : `↻ ${t(selectedLanguage, 'mandiRefresh')}`}
              </Text>
            </Pressable>
          </View>

          {/* Market Intelligence CTA Tiles (Sell vs Buy) */}
          {prices.length > 0 && !loading && (
            <View style={styles.analysisBtnsRow}>
              {/* Sell Analysis */}
              <Pressable
                style={({ pressed }) => [styles.analyzeCard, styles.sellCard, pressed && { opacity: 0.85 }]}
                onPress={() => handleAnalyze('sell')}
              >
                <View style={styles.analyzeTop}>
                  <Text style={styles.analyzeIcon}>💰</Text>
                  <View style={styles.signalBadgeGreen}>
                    <Text style={styles.signalBadgeText}>SELL STRATEGY</Text>
                  </View>
                </View>
                <Text style={styles.analyzeCardTitle}>{t(selectedLanguage, 'sellAnalysis')}</Text>
                <Text style={styles.analyzeCardSubtitle}>{t(selectedLanguage, 'sellAnalysisHint')}</Text>
              </Pressable>

              {/* Buy Analysis */}
              <Pressable
                style={({ pressed }) => [styles.analyzeCard, styles.buyCard, pressed && { opacity: 0.85 }]}
                onPress={() => handleAnalyze('buy')}
              >
                <View style={styles.analyzeTop}>
                  <Text style={styles.analyzeIcon}>🛒</Text>
                  <View style={styles.signalBadgeBlue}>
                    <Text style={styles.signalBadgeText}>INPUT SOURCING</Text>
                  </View>
                </View>
                <Text style={styles.analyzeCardTitle}>{t(selectedLanguage, 'buyAnalysis')}</Text>
                <Text style={styles.analyzeCardSubtitle}>{t(selectedLanguage, 'buyAnalysisHint')}</Text>
              </Pressable>
            </View>
          )}

          {/* Loading / Error / Empty / Price List */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.emerald} />
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
            <View style={styles.priceList}>
              {prices.map((item, index) => (
                <MandiPriceCard
                  key={`${item.crop}-${item.market}-${index}`}
                  item={item}
                  selectedLanguage={selectedLanguage}
                  t={t}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </ImageBackground>

      {/* Price Intelligence Modal */}
      <Modal
        visible={showAnalysis}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnalysis(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {analysisMode === 'buy' ? '🛒' : '💰'} {t(selectedLanguage, analysisMode === 'buy' ? 'buyAnalysis' : 'sellAnalysis')}
                </Text>
                <Text style={styles.modalSubHeader}>
                  {analysisMode === 'buy' ? t(selectedLanguage, 'buyModeDesc') : t(selectedLanguage, 'sellModeDesc')}
                </Text>
              </View>
              <Pressable style={styles.modalClose} onPress={() => setShowAnalysis(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {analyzingPrices ? (
                <View style={styles.analysisLoading}>
                  <ActivityIndicator size="large" color={colors.emerald} />
                  <Text style={styles.analysisLoadingText}>{t(selectedLanguage, 'analyzingPrices')}</Text>
                </View>
              ) : analysis ? (
                <>
                  {/* Summary Card */}
                  <View style={styles.analysisCard}>
                    <Text style={styles.analysisCardTitle}>📋 {t(selectedLanguage, 'analysisSummary')}</Text>
                    <Text style={styles.analysisCardText}>{analysis.summary}</Text>
                  </View>

                  {/* Best Market Card */}
                  {analysis.bestMarket && (
                    <View
                      style={[
                        styles.analysisCard,
                        analysisMode === 'buy' ? styles.cheapestMarketCard : styles.bestMarketCard,
                      ]}
                    >
                      <Text style={styles.bestMarketLabel}>
                        {analysisMode === 'buy' ? '💸' : '🏆'} {t(selectedLanguage, analysisMode === 'buy' ? 'cheapestMarket' : 'bestMarket')}
                      </Text>
                      <Text style={styles.bestMarketName}>{analysis.bestMarket.market}</Text>
                      <Text style={styles.bestMarketPrice}>{formatPrice(analysis.bestMarket.price)}</Text>
                      <Text style={styles.bestMarketCrop}>{analysis.bestMarket.crop}</Text>
                      {analysisMode === 'buy' && analysis.worstMarket && (
                        <Text style={styles.savingsText}>
                          💰 {t(selectedLanguage, 'savingsVs')} {analysis.worstMarket.market}: ₹{analysis.worstMarket.price - analysis.bestMarket.price}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Price Range Meter */}
                  {analysis.priceRange && (
                    <View style={styles.priceRangeRow}>
                      <View style={styles.priceRangeBox}>
                        <Text style={styles.priceRangeLabel}>{t(selectedLanguage, 'minPrice')}</Text>
                        <Text style={styles.priceRangeValue}>{formatPrice(analysis.priceRange.min)}</Text>
                      </View>
                      <View style={styles.priceRangeDivider} />
                      <View style={styles.priceRangeBox}>
                        <Text style={styles.priceRangeLabel}>{t(selectedLanguage, 'avgPrice')}</Text>
                        <Text style={[styles.priceRangeValue, styles.avgPriceValue]}>
                          {formatPrice(analysis.avgPrice)}
                        </Text>
                      </View>
                      <View style={styles.priceRangeDivider} />
                      <View style={styles.priceRangeBox}>
                        <Text style={styles.priceRangeLabel}>{t(selectedLanguage, 'maxPrice')}</Text>
                        <Text style={styles.priceRangeValue}>{formatPrice(analysis.priceRange.max)}</Text>
                      </View>
                    </View>
                  )}

                  {/* AI Recommendation */}
                  {analysis.recommendation && (
                    <View style={[styles.analysisCard, styles.recommendationCard]}>
                      <Text style={styles.recommendationLabel}>💡 {t(selectedLanguage, 'recommendation')}</Text>
                      <Text style={styles.recommendationText}>{analysis.recommendation}</Text>
                    </View>
                  )}

                  {/* Sell/Buy Action Signal */}
                  {(analysis.sellSignal || analysis.buySignal) && (
                    <View
                      style={[
                        styles.sellSignalCard,
                        (analysis.sellSignal === 'SELL_NOW' || analysis.buySignal === 'BUY_NOW') && styles.sellSignalGreen,
                        (analysis.sellSignal === 'HOLD' || analysis.buySignal === 'HOLD') && styles.sellSignalYellow,
                        (analysis.sellSignal === 'WAIT' || analysis.buySignal === 'WAIT') && styles.sellSignalRed,
                      ]}
                    >
                      <Text style={styles.sellSignalText}>
                        {(analysis.sellSignal === 'SELL_NOW' || analysis.buySignal === 'BUY_NOW') ? '✅ ' :
                         (analysis.sellSignal === 'HOLD' || analysis.buySignal === 'HOLD') ? '⏸️ ' : '⏳ '}
                        {(analysis.sellSignal || analysis.buySignal || '').replace('_', ' ')}
                      </Text>
                    </View>
                  )}

                  {/* Ranked Markets Table */}
                  {analysis.rankedMarkets && analysis.rankedMarkets.length > 0 && (
                    <View style={styles.analysisCard}>
                      <Text style={styles.analysisCardTitle}>📊 {t(selectedLanguage, 'marketRanking')}</Text>
                      <Text style={styles.rankingSubtitle}>
                        {t(selectedLanguage, analysisMode === 'buy' ? 'lowestToHighest' : 'highestToLowest')}
                      </Text>
                      {analysis.rankedMarkets.map((market, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.rankedMarketRow,
                            idx === 0 && styles.topRankedMarket,
                          ]}
                        >
                          <View style={styles.rankBadge}>
                            <Text style={styles.rankNumber}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </Text>
                          </View>
                          <View style={styles.rankedMarketInfo}>
                            <Text style={styles.rankedMarketName}>{market.market}</Text>
                            <Text style={styles.rankedMarketCrop}>{market.crop}</Text>
                          </View>
                          <Text style={[styles.rankedMarketPrice, idx === 0 && styles.topPrice]}>
                            {formatPrice(market.price)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Tips */}
                  {analysis.tips && analysis.tips.length > 0 && (
                    <View style={styles.analysisCard}>
                      <Text style={styles.analysisCardTitle}>💬 {t(selectedLanguage, 'priceTips')}</Text>
                      {analysis.tips.map((tip, idx) => (
                        <Text key={idx} style={styles.tipItem}>• {tip}</Text>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.analysisError}>{t(selectedLanguage, 'analysisError')}</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  listenBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.28)',
  },
  listenText: {
    color: colors.emerald,
    fontSize: 12,
    fontWeight: '800',
  },
  titleSection: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: colors.muted,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.lg,
  },
  chip: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radii.md,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  chipText: {
    color: colors.inkSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  refreshBtn: {
    backgroundColor: '#1b6334',
    borderRadius: radii.md,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  refreshText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 10,
  },
  offlineIcon: {
    fontSize: 20,
  },
  offlineInfo: {
    flex: 1,
  },
  offlineText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
  },
  offlineSync: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },

  // Analysis Cards Row
  analysisBtnsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.lg,
  },
  analyzeCard: {
    flex: 1,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  sellCard: {
    backgroundColor: 'rgba(18, 36, 25, 0.88)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  buyCard: {
    backgroundColor: 'rgba(18, 36, 25, 0.88)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  analyzeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  analyzeIcon: {
    fontSize: 20,
  },
  signalBadgeGreen: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  signalBadgeBlue: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  signalBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: colors.inkSecondary,
    letterSpacing: 0.5,
  },
  analyzeCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  analyzeCardSubtitle: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },

  // Loading & State Wrappers
  loadingWrap: {
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
    padding: spacing.lg,
    marginTop: 10,
  },
  errorTitle: {
    color: colors.coral,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  errorText: {
    color: colors.inkSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  retryBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.md,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },
  priceList: {
    gap: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0c1a11',
    borderTopLeftRadius: radii.xl + 6,
    borderTopRightRadius: radii.xl + 6,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  modalSubHeader: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 3,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalScroll: {
    marginBottom: spacing.lg,
  },
  analysisLoading: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 12,
  },
  analysisLoadingText: {
    color: colors.muted,
    fontSize: 13,
  },
  analysisCard: {
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  analysisCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  analysisCardText: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 19,
  },
  bestMarketCard: {
    borderColor: 'rgba(52, 211, 153, 0.35)',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  cheapestMarketCard: {
    borderColor: 'rgba(56, 189, 248, 0.35)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  bestMarketLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.emerald,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bestMarketName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 3,
  },
  bestMarketPrice: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.gold,
    marginTop: 2,
  },
  bestMarketCrop: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  savingsText: {
    fontSize: 12,
    color: colors.emerald,
    fontWeight: '700',
    marginTop: 6,
  },

  // Price Range Meter
  priceRangeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radii.md,
    padding: 12,
    marginBottom: spacing.md,
  },
  priceRangeBox: {
    flex: 1,
    alignItems: 'center',
  },
  priceRangeLabel: {
    fontSize: 10,
    color: colors.faint,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceRangeValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.inkSecondary,
    marginTop: 3,
  },
  avgPriceValue: {
    color: colors.gold,
  },
  priceRangeDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // Recommendation Card
  recommendationCard: {
    borderColor: 'rgba(251, 191, 36, 0.3)',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  recommendationLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
  },

  // Signal Card
  sellSignalCard: {
    padding: 12,
    borderRadius: radii.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  sellSignalGreen: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  sellSignalYellow: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  sellSignalRed: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  sellSignalText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },

  // Ranked Markets
  rankingSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 8,
  },
  rankedMarketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  topRankedMarket: {
    backgroundColor: 'rgba(52, 211, 153, 0.06)',
    borderRadius: radii.sm,
    paddingHorizontal: 6,
  },
  rankBadge: {
    width: 28,
  },
  rankNumber: {
    fontSize: 14,
  },
  rankedMarketInfo: {
    flex: 1,
  },
  rankedMarketName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  rankedMarketCrop: {
    fontSize: 11,
    color: colors.muted,
  },
  rankedMarketPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.inkSecondary,
  },
  topPrice: {
    color: colors.gold,
  },
  tipItem: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  analysisError: {
    color: colors.coral,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
});
