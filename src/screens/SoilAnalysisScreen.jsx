import React, { useState } from 'react';
import Tts from 'react-native-tts';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { analyzeSoil, getSoilTypeIcon, getMoistureColor, getPhColor } from '../services/soilAnalysisService';
import { t } from '../languages/uiText';
import { getTtsCode } from '../languages/languageConfig';
import { colors, radii, spacing } from '../theme/theme';

const farmImage = require('../assests/images/field.jpg');

function ResultSection({ title, items, itemStyle }) {
  if (!items?.length) return null;
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.listItemRow}>
          <View style={styles.listBullet} />
          <Text style={[styles.listItemText, itemStyle]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function PropertyBadge({ label, value, color }) {
  return (
    <View style={[styles.propertyBadge, color && { borderColor: color }]}>
      <Text style={styles.propertyLabel}>{label}</Text>
      <Text style={[styles.propertyValue, color && { color }]}>{value || '—'}</Text>
    </View>
  );
}

export default function SoilAnalysisScreen({ selectedLanguage, onBack }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const tt = (key, params = {}) => t(selectedLanguage, key, params);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  const handleCapture = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          tt('soilCameraPermissionTitle'),
          tt('soilCameraPermissionMessage')
        );
        return;
      }

      const response = await launchCamera({
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.8,
        includeBase64: true,
        saveToPhotos: false,
      });

      if (response.didCancel) return;
      if (response.errorCode) {
        throw new Error(response.errorMessage || tt('soilCameraOpenFailed'));
      }

      const asset = response.assets?.[0];
      if (!asset?.uri || !asset?.base64) {
        throw new Error(tt('soilImageIncomplete'));
      }

      setCapturedImage(asset);
      setAnalysisResult(null);
    } catch (error) {
      Alert.alert(tt('soilCameraErrorTitle'), error?.message || tt('soilCameraOpenFailed'));
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
      });

      if (response.didCancel) return;
      if (response.errorCode) {
        throw new Error(response.errorMessage || tt('soilGalleryOpenFailed'));
      }

      const asset = response.assets?.[0];
      if (!asset?.uri || !asset?.base64) {
        throw new Error(tt('soilImageIncomplete'));
      }

      setCapturedImage(asset);
      setAnalysisResult(null);
    } catch (error) {
      Alert.alert(tt('soilGalleryErrorTitle'), error?.message || tt('soilGalleryOpenFailed'));
    }
  };

  const handleAnalyze = async () => {
    if (!capturedImage?.base64) {
      Alert.alert(tt('soilNoImageTitle'), tt('soilNoImageMessage'));
      return;
    }

    setAnalysisResult(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeSoil({
        base64Data: capturedImage.base64,
        mimeType: capturedImage.type || 'image/jpeg',
        language: selectedLanguage,
      });

      setAnalysisResult(result);

      const ttsCode = getTtsCode(selectedLanguage);
      Tts.setDefaultLanguage(ttsCode);
      Tts.stop();

      const speech = [
        `${tt('soilTypeDetected')}: ${result.soilType}.`,
        result.summary,
        result.bestCrops?.length
          ? `${tt('soilBestCrops')}: ${result.bestCrops.slice(0, 3).join(', ')}.`
          : '',
      ].join(' ');

      setTimeout(() => Tts.speak(speech), 500);

    } catch (error) {
      Alert.alert(tt('soilAnalysisFailedTitle'), error?.message || tt('saveFailed'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleListenResult = () => {
    if (!analysisResult) return;

    const ttsCode = getTtsCode(selectedLanguage);
    Tts.setDefaultLanguage(ttsCode);
    Tts.stop();

    const speech = [
      `${tt('soilType')}: ${analysisResult.soilType}.`,
      `${tt('soilTexture')}: ${analysisResult.texture}.`,
      `${tt('soilMoisture')}: ${analysisResult.moisture}.`,
      `${tt('soilPh')}: ${analysisResult.phEstimate}.`,
      analysisResult.summary,
      analysisResult.bestCrops?.length
        ? `${tt('soilBestCrops')}: ${analysisResult.bestCrops.join(', ')}.`
        : '',
      analysisResult.improvements?.length
        ? `${tt('soilImprovements')}: ${analysisResult.improvements.join('. ')}.`
        : '',
    ].join(' ');

    Tts.speak(speech);
  };

  const handleReset = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    Tts.stop();
  };

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
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>{tt('backArrow')}</Text>
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.title}>🌍 {tt('soilAnalysis')}</Text>
              <Text style={styles.subtitle}>{tt('soilAnalysisSubtitle')}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Scanner Viewfinder Box */}
          <View style={styles.scannerCard}>
            {capturedImage?.uri ? (
              <View style={styles.imagePreviewWrap}>
                <Image source={{ uri: capturedImage.uri }} style={styles.previewImage} />
                <View style={styles.scannerReticleTL} />
                <View style={styles.scannerReticleTR} />
                <View style={styles.scannerReticleBL} />
                <View style={styles.scannerReticleBR} />
              </View>
            ) : (
              <View style={styles.emptyScanner}>
                <View style={styles.scannerReticleTL} />
                <View style={styles.scannerReticleTR} />
                <View style={styles.scannerReticleBL} />
                <View style={styles.scannerReticleBR} />
                <View style={styles.emptyIconCircle}>
                  <Text style={styles.emptyGlyph}>🌍</Text>
                </View>
                <Text style={styles.emptyTitle}>{tt('soilNoPhotoYet')}</Text>
                <Text style={styles.emptyHint}>{tt('soilNoPhotoHint')}</Text>
              </View>
            )}
          </View>

          {/* Actions Row */}
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.85 }]}
              onPress={handleCapture}
            >
              <Text style={styles.captureBtnText}>
                {capturedImage ? `📷 ${tt('soilRetake')}` : `📷 ${tt('soilOpenCamera')}`}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.galleryBtn, pressed && { opacity: 0.85 }]}
              onPress={handlePickFromGallery}
            >
              <Text style={styles.galleryBtnText}>🖼️ {tt('soilGallery')}</Text>
            </Pressable>
          </View>

          {/* Analyze Primary CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.analyzeBtn,
              (!capturedImage || isAnalyzing) && styles.btnDisabled,
              pressed && capturedImage && !isAnalyzing && { opacity: 0.9 },
            ]}
            onPress={handleAnalyze}
            disabled={!capturedImage || isAnalyzing}
          >
            {isAnalyzing ? (
              <View style={styles.analyzingRow}>
                <ActivityIndicator color="#ffffff" />
                <Text style={styles.analyzingText}>Analyzing Soil Composition...</Text>
              </View>
            ) : (
              <Text style={styles.analyzeBtnText}>⚡ {tt('soilAnalyze')}</Text>
            )}
          </Pressable>

          {capturedImage && !analysisResult && (
            <Pressable style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>{tt('soilClearPhoto')}</Text>
            </Pressable>
          )}

          {/* Tips Card */}
          {!analysisResult && (
            <View style={styles.tipCard}>
              <Text style={styles.tipHeading}>📋 {tt('soilPhotoTips')}</Text>
              <Text style={styles.tipRow}>• {tt('soilTip1')}</Text>
              <Text style={styles.tipRow}>• {tt('soilTip2')}</Text>
              <Text style={styles.tipRow}>• {tt('soilTip3')}</Text>
              <Text style={styles.tipRow}>• {tt('soilTip4')}</Text>
            </View>
          )}

          {/* Results Panel */}
          {capturedImage && analysisResult && (
            <View style={styles.reportWrap}>
              {/* Soil Type Banner */}
              <View style={styles.soilTypeBanner}>
                <Text style={styles.soilTypeIcon}>
                  {getSoilTypeIcon(analysisResult.soilType)}
                </Text>
                <View style={styles.soilTypeInfo}>
                  <Text style={styles.soilTypeLabel}>{tt('soilTypeDetected')}</Text>
                  <Text style={styles.soilTypeName}>{analysisResult.soilType}</Text>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>
                    {analysisResult.confidence} {tt('soilConfidence')}
                  </Text>
                </View>
              </View>

              {/* Soil Properties Grid */}
              <View style={styles.propertiesGrid}>
                <PropertyBadge
                  label={tt('soilColor')}
                  value={analysisResult.soilColor}
                />
                <PropertyBadge
                  label={tt('soilTexture')}
                  value={analysisResult.texture}
                />
                <PropertyBadge
                  label={tt('soilMoisture')}
                  value={analysisResult.moisture}
                  color={getMoistureColor(analysisResult.moisture)}
                />
                <PropertyBadge
                  label={tt('soilPh')}
                  value={analysisResult.phEstimate}
                  color={getPhColor(analysisResult.phEstimate)}
                />
                <PropertyBadge
                  label={tt('soilOrganicMatter')}
                  value={analysisResult.organicMatter}
                />
              </View>

              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>📊 {tt('soilSummary')}</Text>
                <Text style={styles.summaryText}>{analysisResult.summary}</Text>
              </View>

              {/* Listen Button */}
              <Pressable
                style={({ pressed }) => [styles.listenBtn, pressed && { opacity: 0.85 }]}
                onPress={handleListenResult}
              >
                <Text style={styles.listenBtnText}>🔊 {tt('soilListenAnalysis')}</Text>
              </Pressable>

              {/* Best Crops */}
              <ResultSection
                title={`✅ ${tt('soilBestCrops')}`}
                items={analysisResult.bestCrops}
                itemStyle={styles.bestCropItem}
              />

              {/* Crops to Avoid */}
              {analysisResult.avoidCrops?.length > 0 && (
                <ResultSection
                  title={`⚠️ ${tt('soilAvoidCrops')}`}
                  items={analysisResult.avoidCrops}
                  itemStyle={styles.avoidCropItem}
                />
              )}

              {/* Improvements */}
              <ResultSection
                title={`🛠️ ${tt('soilImprovements')}`}
                items={analysisResult.improvements}
              />

              {/* Seasonal Tips */}
              <ResultSection
                title={`📅 ${tt('soilSeasonalTips')}`}
                items={analysisResult.seasonalTips}
              />

              {/* Disclaimer */}
              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerTitle}>⚠️ {tt('soilDisclaimer')}</Text>
                <Text style={styles.disclaimerText}>{analysisResult.disclaimer}</Text>
              </View>

              {/* Scan Another */}
              <Pressable style={styles.scanAgainBtn} onPress={handleReset}>
                <Text style={styles.scanAgainText}>🌍 {tt('soilScanAnother')}</Text>
              </Pressable>
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: 4,
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
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  headerSpacer: {
    width: 44,
  },

  // Scanner Viewfinder
  scannerCard: {
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    overflow: 'hidden',
    marginBottom: spacing.lg,
    minHeight: 240,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreviewWrap: {
    width: '100%',
    height: 260,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emptyScanner: {
    alignItems: 'center',
    padding: spacing.xxl,
    width: '100%',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  emptyGlyph: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4,
  },
  emptyHint: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },

  // Reticles
  scannerReticleTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: colors.clay,
  },
  scannerReticleTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.clay,
  },
  scannerReticleBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: colors.clay,
  },
  scannerReticleBR: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.clay,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },
  captureBtn: {
    flex: 1,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.35)',
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnText: {
    color: colors.clay,
    fontSize: 13,
    fontWeight: '800',
  },
  galleryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryBtnText: {
    color: colors.inkSecondary,
    fontSize: 13,
    fontWeight: '700',
  },

  analyzeBtn: {
    backgroundColor: '#9a4c16',
    borderRadius: radii.full,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.45)',
    shadowColor: colors.clay,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  btnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowOpacity: 0,
    elevation: 0,
  },
  analyzeBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  analyzingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analyzingText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  resetBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: spacing.md,
  },
  resetBtnText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Tips
  tipCard: {
    backgroundColor: 'rgba(18, 36, 25, 0.75)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.lg,
  },
  tipHeading: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  tipRow: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },

  // Report
  reportWrap: {
    marginTop: spacing.md,
  },
  soilTypeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.35)',
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: 12,
  },
  soilTypeIcon: {
    fontSize: 28,
  },
  soilTypeInfo: {
    flex: 1,
  },
  soilTypeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.clay,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  soilTypeName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.inkSecondary,
  },

  // Properties Grid
  propertiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  propertyBadge: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    alignItems: 'center',
  },
  propertyLabel: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  propertyValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 19,
  },

  // Audio Listen
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderRadius: radii.full,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    marginBottom: spacing.md,
  },
  listenBtnText: {
    color: colors.emerald,
    fontSize: 13,
    fontWeight: '800',
  },

  // Section
  sectionCard: {
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: spacing.md,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  listBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emerald,
    marginTop: 6,
  },
  listItemText: {
    flex: 1,
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 19,
  },
  bestCropItem: {
    color: colors.emerald,
    fontWeight: '700',
  },
  avoidCropItem: {
    color: colors.coral,
  },

  // Disclaimer
  disclaimerBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.gold,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 16,
  },

  // Scan Again
  scanAgainBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radii.full,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  scanAgainText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
});
