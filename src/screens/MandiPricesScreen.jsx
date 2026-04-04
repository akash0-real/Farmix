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
      // Translate dynamic content if not English
      const translatedData = await translateMandiItems(data, selectedLanguage);
      setPrices(translatedData);
      setLastSync(Date.now());
      // Cache for offline use
      cacheMandiPrices(translatedData);
    } catch (err) {
      // Try to load from cache
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

          {/* Price Analysis Buttons - Sell & Buy */}
          {prices.length > 0 && !loading && (
            <View style={styles.analysisBtnsRow}>
              {/* Sell Analysis - Find highest prices */}
              <Pressable 
                style={[styles.analyzeBtn, styles.sellAnalyzeBtn]} 
                onPress={() => handleAnalyze('sell')}
              >
                <Text style={styles.analyzeBtnIcon}>💰</Text>
                <View style={styles.analyzeBtnContent}>
                  <Text style={styles.analyzeBtnTitle}>{t(selectedLanguage, 'sellAnalysis')}</Text>
                  <Text style={styles.analyzeBtnSubtitle}>{t(selectedLanguage, 'sellAnalysisHint')}</Text>
                </View>
              </Pressable>

              {/* Buy Analysis - Find cheapest prices */}
              <Pressable 
                style={[styles.analyzeBtn, styles.buyAnalyzeBtn]} 
                onPress={() => handleAnalyze('buy')}
              >
                <Text style={styles.analyzeBtnIcon}>🛒</Text>
                <View style={styles.analyzeBtnContent}>
                  <Text style={styles.analyzeBtnTitle}>{t(selectedLanguage, 'buyAnalysis')}</Text>
                  <Text style={styles.analyzeBtnSubtitle}>{t(selectedLanguage, 'buyAnalysisHint')}</Text>
                </View>
              </Pressable>
            </View>
          )}

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

      {/* Price Analysis Modal */}
      <Modal
        visible={showAnalysis}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAnalysis(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {analysisMode === 'buy' ? '🛒' : '💰'} {t(selectedLanguage, analysisMode === 'buy' ? 'buyAnalysis' : 'sellAnalysis')}
              </Text>
              <Pressable style={styles.modalClose} onPress={() => setShowAnalysis(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            {/* Mode Indicator */}
            <View style={[
              styles.modeIndicator,
              analysisMode === 'buy' ? styles.buyModeIndicator : styles.sellModeIndicator
            ]}>
              <Text style={styles.modeIndicatorText}>
                {analysisMode === 'buy' 
                  ? t(selectedLanguage, 'buyModeDesc') 
                  : t(selectedLanguage, 'sellModeDesc')}
              </Text>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {analyzingPrices ? (
                <View style={styles.analysisLoading}>
                  <ActivityIndicator size="large" color="#7eff8a" />
                  <Text style={styles.analysisLoadingText}>{t(selectedLanguage, 'analyzingPrices')}</Text>
                </View>
              ) : analysis ? (
                <>
                  {/* Summary Card */}
                  <View style={styles.analysisCard}>
                    <Text style={styles.analysisCardTitle}>📋 {t(selectedLanguage, 'analysisSummary')}</Text>
                    <Text style={styles.analysisCardText}>{analysis.summary}</Text>
                  </View>

                  {/* Best Market - changes based on mode */}
                  {analysis.bestMarket && (
                    <View style={[
                      styles.analysisCard, 
                      analysisMode === 'buy' ? styles.cheapestMarketCard : styles.bestMarketCard
                    ]}>
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

                  {/* Price Range */}
                  {analysis.priceRange && (
                    <View style={styles.priceRangeRow}>
                      <View style={styles.priceRangeBox}>
                        <Text style={styles.priceRangeLabel}>{t(selectedLanguage, 'minPrice')}</Text>
                        <Text style={styles.priceRangeValue}>{formatPrice(analysis.priceRange.min)}</Text>
                      </View>
                      <View style={styles.priceRangeDivider} />
                      <View style={styles.priceRangeBox}>
                        <Text style={styles.priceRangeLabel}>{t(selectedLanguage, 'avgPrice')}</Text>
                        <Text style={[styles.priceRangeValue, styles.avgPriceValue]}>{formatPrice(analysis.avgPrice)}</Text>
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

                  {/* Sell/Buy Signal based on mode */}
                  {(analysis.sellSignal || analysis.buySignal) && (
                    <View style={[
                      styles.sellSignalCard,
                      (analysis.sellSignal === 'SELL_NOW' || analysis.buySignal === 'BUY_NOW') && styles.sellSignalGreen,
                      (analysis.sellSignal === 'HOLD' || analysis.buySignal === 'HOLD') && styles.sellSignalYellow,
                      (analysis.sellSignal === 'WAIT' || analysis.buySignal === 'WAIT') && styles.sellSignalRed,
                    ]}>
                      <Text style={styles.sellSignalText}>
                        {(analysis.sellSignal === 'SELL_NOW' || analysis.buySignal === 'BUY_NOW') ? '✅ ' : 
                         (analysis.sellSignal === 'HOLD' || analysis.buySignal === 'HOLD') ? '⏸️ ' : '⏳ '}
                        {(analysis.sellSignal || analysis.buySignal || '').replace('_', ' ')}
                      </Text>
                    </View>
                  )}

                  {/* Ranked Markets */}
                  {analysis.rankedMarkets && analysis.rankedMarkets.length > 0 && (
                    <View style={styles.analysisCard}>
                      <Text style={styles.analysisCardTitle}>📊 {t(selectedLanguage, 'marketRanking')}</Text>
                      <Text style={styles.rankingSubtitle}>
                        {t(selectedLanguage, analysisMode === 'buy' ? 'lowestToHighest' : 'highestToLowest')}
                      </Text>
                      {analysis.rankedMarkets.map((market, idx) => (
                        <View key={idx} style={[
                          styles.rankedMarketRow,
                          idx === 0 && (analysisMode === 'buy' ? styles.topRankedMarketBuy : styles.topRankedMarket),
                          idx === analysis.rankedMarkets.length - 1 && styles.lastRankedMarket,
                        ]}>
                          <View style={styles.rankBadge}>
                            <Text style={[styles.rankNumber, idx === 0 && styles.topRankNumber]}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                            </Text>
                          </View>
                          <View style={styles.rankedMarketInfo}>
                            <Text style={styles.rankedMarketName}>{market.market}</Text>
                            <Text style={styles.rankedMarketCrop}>{market.crop}</Text>
                          </View>
                          <Text style={[
                            styles.rankedMarketPrice,
                            idx === 0 && styles.topPrice,
                            idx === analysis.rankedMarkets.length - 1 && styles.lowPrice,
                          ]}>
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

                  {/* Crop Summaries */}
                  {analysis.cropSummaries && analysis.cropSummaries.length > 0 && (
                    <View style={styles.analysisCard}>
                      <Text style={styles.analysisCardTitle}>🌾 {t(selectedLanguage, 'cropWiseAnalysis')}</Text>
                      {analysis.cropSummaries.slice(0, 5).map((crop, idx) => (
                        <View key={idx} style={styles.cropSummaryRow}>
                          <Text style={styles.cropSummaryName}>{crop.crop}</Text>
                          <Text style={styles.cropSummaryPrice}>{formatPrice(crop.avgPrice)}</Text>
                        </View>
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,217,102,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,217,102,0.3)',
    padding: 12,
    marginBottom: 12,
  },
  offlineIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  offlineInfo: {
    flex: 1,
  },
  offlineText: {
    color: '#ffd966',
    fontSize: 13,
    fontWeight: '800',
  },
  offlineSync: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
  },
  // Price Analysis Buttons Row
  analysisBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  analyzeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(126,255,138,0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(126,255,138,0.3)',
    padding: 12,
  },
  sellAnalyzeBtn: {
    backgroundColor: 'rgba(126,255,138,0.12)',
    borderColor: 'rgba(126,255,138,0.3)',
  },
  buyAnalyzeBtn: {
    backgroundColor: 'rgba(102,178,255,0.12)',
    borderColor: 'rgba(102,178,255,0.3)',
  },
  analyzeBtnIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  analyzeBtnContent: {
    flex: 1,
  },
  analyzeBtnTitle: {
    color: '#7eff8a',
    fontSize: 14,
    fontWeight: '800',
  },
  analyzeBtnSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 10,
    marginTop: 2,
  },
  analyzeBtnArrow: {
    color: '#7eff8a',
    fontSize: 20,
    fontWeight: '800',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f2818',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(126,255,138,0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modeIndicator: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  sellModeIndicator: {
    backgroundColor: 'rgba(126,255,138,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(126,255,138,0.3)',
  },
  buyModeIndicator: {
    backgroundColor: 'rgba(102,178,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(102,178,255,0.3)',
  },
  modeIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  modalScroll: {
    padding: 16,
  },
  analysisLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  analysisLoadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 12,
  },
  analysisCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    marginBottom: 12,
  },
  analysisCardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  analysisCardText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 20,
  },
  bestMarketCard: {
    backgroundColor: 'rgba(126,255,138,0.1)',
    borderColor: 'rgba(126,255,138,0.3)',
    alignItems: 'center',
    paddingVertical: 20,
  },
  cheapestMarketCard: {
    backgroundColor: 'rgba(102,178,255,0.1)',
    borderColor: 'rgba(102,178,255,0.3)',
    alignItems: 'center',
    paddingVertical: 20,
  },
  bestMarketLabel: {
    color: '#7eff8a',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  bestMarketName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  bestMarketPrice: {
    color: '#7eff8a',
    fontSize: 28,
    fontWeight: '900',
    marginVertical: 4,
  },
  bestMarketCrop: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  savingsText: {
    color: '#66b2ff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    backgroundColor: 'rgba(102,178,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceRangeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 12,
    overflow: 'hidden',
  },
  priceRangeBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  priceRangeDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  priceRangeLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceRangeValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  avgPriceValue: {
    color: '#ffd966',
  },
  recommendationCard: {
    backgroundColor: 'rgba(255,217,102,0.1)',
    borderColor: 'rgba(255,217,102,0.3)',
  },
  recommendationLabel: {
    color: '#ffd966',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  recommendationText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
  },
  sellSignalCard: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  sellSignalGreen: {
    backgroundColor: 'rgba(126,255,138,0.2)',
  },
  sellSignalYellow: {
    backgroundColor: 'rgba(255,217,102,0.2)',
  },
  sellSignalRed: {
    backgroundColor: 'rgba(255,107,107,0.2)',
  },
  sellSignalText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  tipItem: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 22,
    marginTop: 4,
  },
  cropSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  cropSummaryName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
  },
  cropSummaryPrice: {
    color: '#7eff8a',
    fontSize: 14,
    fontWeight: '800',
  },
  analysisError: {
    color: 'rgba(255,107,107,0.9)',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  // Ranked Markets Styles
  rankingSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginBottom: 12,
    marginTop: -4,
  },
  rankedMarketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  topRankedMarket: {
    backgroundColor: 'rgba(126,255,138,0.1)',
    borderRadius: 10,
    marginBottom: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
  },
  topRankedMarketBuy: {
    backgroundColor: 'rgba(102,178,255,0.15)',
    borderRadius: 10,
    marginBottom: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
  },
  lastRankedMarket: {
    backgroundColor: 'rgba(255,107,107,0.1)',
    borderRadius: 10,
    marginTop: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
  },
  rankBadge: {
    width: 36,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
  },
  topRankNumber: {
    fontSize: 18,
  },
  rankedMarketInfo: {
    flex: 1,
    marginLeft: 8,
  },
  rankedMarketName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  rankedMarketCrop: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  rankedMarketPrice: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  topPrice: {
    color: '#7eff8a',
    fontSize: 17,
  },
  lowPrice: {
    color: '#ff6b6b',
  },
});
