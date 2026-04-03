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

const farmImage = require('../assests/images/field.jpg');

function ResultSection({ title, items, itemStyle }) {
  if (!items?.length) return null;
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, i) => (
        <Text key={i} style={[styles.listItem, itemStyle]}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

function PropertyBadge({ label, value, color }) {
  return (
    <View style={[styles.propertyBadge, color && { borderColor: color }]}>
      <Text style={styles.propertyLabel}>{label}</Text>
      <Text style={[styles.propertyValue, color && { color }]}>{value}</Text>
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
      Alert.alert(tt('soilCameraErrorTitle'), error.message);
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
      Alert.alert(tt('soilGalleryErrorTitle'), error.message);
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

      // Speak result summary
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
      Alert.alert(tt('soilAnalysisFailedTitle'), error.message);
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
          <View style={styles.header}>
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>{tt('backArrow')}</Text>
            </Pressable>
            <Text style={styles.title}>🌍 {tt('soilAnalysis')}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.subtitle}>{tt('soilAnalysisSubtitle')}</Text>

          <View style={styles.heroCard}>
            {capturedImage?.uri ? (
              <Image
                source={{ uri: capturedImage.uri }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🌍</Text>
                <Text style={styles.emptyTitle}>{tt('soilNoPhotoYet')}</Text>
                <Text style={styles.emptyText}>{tt('soilNoPhotoHint')}</Text>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={styles.primaryButton} onPress={handleCapture}>
              <Text style={styles.primaryButtonText}>
                {capturedImage ? `📷 ${tt('soilRetake')}` : `📷 ${tt('soilOpenCamera')}`}
              </Text>
            </Pressable>
            <Pressable style={styles.galleryButton} onPress={handlePickFromGallery}>
              <Text style={styles.galleryButtonText}>🖼️ {tt('soilGallery')}</Text>
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.analyzeButton,
              (!capturedImage || isAnalyzing) && styles.buttonDisabled,
            ]}
            onPress={handleAnalyze}
            disabled={!capturedImage || isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="#7eff8a" />
            ) : (
              <Text style={styles.analyzeButtonText}>🔬 {tt('soilAnalyze')}</Text>
            )}
          </Pressable>

          {capturedImage && !analysisResult && (
            <Pressable style={styles.resetLink} onPress={handleReset}>
              <Text style={styles.resetText}>{tt('soilClearPhoto')}</Text>
            </Pressable>
          )}

          {!analysisResult && (
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>📋 {tt('soilPhotoTips')}</Text>
              <Text style={styles.tipText}>• {tt('soilTip1')}</Text>
              <Text style={styles.tipText}>• {tt('soilTip2')}</Text>
              <Text style={styles.tipText}>• {tt('soilTip3')}</Text>
              <Text style={styles.tipText}>• {tt('soilTip4')}</Text>
            </View>
          )}

          {capturedImage && analysisResult && (
            <>
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

              {/* Soil Properties */}
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

              {/* Summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>📊 {tt('soilSummary')}</Text>
                <Text style={styles.summaryText}>{analysisResult.summary}</Text>
              </View>

              {/* Listen Button */}
              <Pressable style={styles.listenButton} onPress={handleListenResult}>
                <Text style={styles.listenButtonText}>
                  🔊 {tt('soilListenAnalysis')}
                </Text>
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
              <View style={styles.disclaimerCard}>
                <Text style={styles.disclaimerTitle}>⚠️ {tt('soilDisclaimer')}</Text>
                <Text style={styles.disclaimerText}>{analysisResult.disclaimer}</Text>
              </View>

              {/* Scan Another */}
              <Pressable style={styles.scanAgainButton} onPress={handleReset}>
                <Text style={styles.scanAgainText}>🌍 {tt('soilScanAnother')}</Text>
              </Pressable>
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
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 4,
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
    color: '#dfffe4',
    fontSize: 13,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 66,
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 14,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    minHeight: 240,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 280,
  },
  emptyState: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#2f8d41',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  galleryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  galleryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  analyzeButton: {
    backgroundColor: 'rgba(126,255,138,0.2)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(126,255,138,0.4)',
    marginBottom: 12,
  },
  analyzeButtonText: {
    color: '#7eff8a',
    fontSize: 16,
    fontWeight: '900',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  resetLink: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  resetText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  tipCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tipTitle: {
    color: '#ffe9a6',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  tipText: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  soilTypeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139,90,43,0.25)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,90,43,0.5)',
  },
  soilTypeIcon: {
    fontSize: 40,
    marginRight: 14,
  },
  soilTypeInfo: {
    flex: 1,
  },
  soilTypeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  soilTypeName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  confidenceBadge: {
    backgroundColor: 'rgba(126,255,138,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  confidenceText: {
    color: '#7eff8a',
    fontSize: 11,
    fontWeight: '800',
  },
  propertiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  propertyBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    minWidth: '30%',
    flexGrow: 1,
  },
  propertyLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  propertyValue: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 10,
  },
  summaryText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 22,
  },
  listenButton: {
    backgroundColor: 'rgba(126,255,138,0.16)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  listenButtonText: {
    color: '#dfffe4',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 10,
  },
  listItem: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
  bestCropItem: {
    color: '#7eff8a',
  },
  avoidCropItem: {
    color: '#ff9b9b',
  },
  disclaimerCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,217,102,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,217,102,0.25)',
  },
  disclaimerTitle: {
    color: '#ffd966',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 6,
  },
  disclaimerText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    lineHeight: 18,
  },
  scanAgainButton: {
    marginTop: 16,
    backgroundColor: '#2f8d41',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
});
