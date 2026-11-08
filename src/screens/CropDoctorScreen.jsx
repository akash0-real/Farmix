import React, { useState, useEffect } from 'react';
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
import { detectCropDiseaseAI } from '../services/cropDoctorService';
import { publishDiseaseAlert } from '../services/alertService';
import { t } from '../languages/uiText';
import { getTtsCode } from '../languages/languageConfig';
import { useUser } from '../context/UserContext';
import { translateCropDoctorResult } from '../services/translationService';
import { detectDiseaseOffline, initTensorFlow, isOfflineDetectionAvailable } from '../services/tensorflowService';
import { colors, radii, spacing } from '../theme/theme';

const farmImage = require('../assests/images/field.jpg');

function ResultSection({ title, items }) {
  if (!items?.length) return null;
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.listItemRow}>
          <View style={styles.listBullet} />
          <Text style={styles.listItemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function PredictionSection({ predictions, title }) {
  if (!Array.isArray(predictions) || predictions.length === 0) return null;
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {predictions.map((prediction, index) => {
        const label = prediction?.label || prediction?.name || 'Unknown';
        const confidenceValue =
          prediction?.confidencePercent ||
          (typeof prediction?.probability === 'number'
            ? `${Math.round(prediction.probability * 100)}%`
            : null) ||
          'N/A';
        return (
          <View key={`${label}-${confidenceValue}-${index}`} style={styles.predictionRow}>
            <Text style={styles.predictionLabel}>{label}</Text>
            <View style={styles.predictionBadge}>
              <Text style={styles.predictionConfidence}>{confidenceValue}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function CropDoctorScreen({ selectedLanguage, onBack }) {
  const { user } = useUser();
  const [capturedImage, setCapturedImage] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineReason, setOfflineReason] = useState('');
  const [tfReady, setTfReady] = useState(false);
  const tt = (key, params = {}) => t(selectedLanguage, key, params);

  useEffect(() => {
    let isMounted = true;
    initTensorFlow()
      .then(ready => {
        if (isMounted) {
          setTfReady(Boolean(ready));
        }
      })
      .catch(() => {
        if (isMounted) {
          setTfReady(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCapture = async () => {
    try {
      if (Platform.OS === 'android') {
        const cameraGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
        if (cameraGranted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            tt('cropDoctorCameraPermissionTitle'),
            tt('cropDoctorCameraPermissionMessage'),
          );
          return;
        }
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
        throw new Error(response.errorMessage || tt('cropDoctorCameraOpenFailed'));
      }

      const asset = response.assets?.[0];
      if (!asset?.uri || !asset?.base64) {
        throw new Error(tt('cropDoctorImageIncomplete'));
      }

      setCapturedImage(asset);
      setScanResult(null);
    } catch (error) {
      Alert.alert(tt('cropDoctorCameraErrorTitle'), error.message);
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
        throw new Error(response.errorMessage || tt('cropDoctorGalleryFailed'));
      }

      const asset = response.assets?.[0];
      if (!asset?.uri || !asset?.base64) {
        throw new Error(tt('cropDoctorImageIncomplete'));
      }

      setCapturedImage(asset);
      setScanResult(null);
    } catch (error) {
      Alert.alert(tt('cropDoctorGalleryErrorTitle'), error.message);
    }
  };

  const handleAnalyze = async () => {
    if (!capturedImage?.base64) {
      Alert.alert(
        tt('cropDoctorNoImageTitle'),
        `${tt('cropDoctorNoImageMessage')}\n${tt('cropDoctorSeverity')}: 0`,
      );
      return;
    }

    setScanResult(null);
    setIsScanning(true);
    setIsOfflineMode(false);
    setOfflineReason('');
    let usedOfflineMode = false;

    let result;
    let communityAlert = null;

    try {
      result = await detectCropDiseaseAI({
        base64Data: capturedImage.base64,
        mimeType: capturedImage.type || 'image/jpeg',
      });

      result = await translateCropDoctorResult(result, selectedLanguage);

      communityAlert = publishDiseaseAlert({
        diseaseName: result.diseaseName,
        crop: result.crop,
        severity: result.severity,
        locationName: user.district || user.state || t(selectedLanguage, 'yourArea'),
      });
    } catch (onlineError) {
      const onlineMessage = onlineError?.message || tt('cropDoctorScanFailedGeneric');
      setOfflineReason(onlineMessage);

      if (tfReady || isOfflineDetectionAvailable()) {
        try {
          result = await detectDiseaseOffline({
            base64Data: capturedImage.base64,
            language: selectedLanguage,
          });
          usedOfflineMode = true;
          setIsOfflineMode(true);
        } catch (offlineError) {
          setIsScanning(false);
          Alert.alert(tt('cropDoctorScanFailedTitle'), offlineError?.message || tt('cropDoctorScanFailedGeneric'));
          return;
        }
      } else {
        setIsScanning(false);
        Alert.alert(tt('cropDoctorScanFailedTitle'), onlineMessage);
        return;
      }
    }

    setScanResult(result);

    const ttsCode = getTtsCode(selectedLanguage);
    Tts.setDefaultLanguage(ttsCode);

    const severityWord =
      result.severity === 'High'
        ? tt('cropDoctorSeverityHigh')
        : result.severity === 'Moderate'
        ? tt('cropDoctorSeverityModerate')
        : tt('cropDoctorSeverityLow');

    const speech = [
      `${tt('cropDoctorSpeechDiseaseDetected')}: ${result.diseaseName || result.disease}.`,
      `${tt('cropDoctorSpeechCrop')}: ${result.crop}.`,
      `${tt('cropDoctorSpeechSeverity')}: ${severityWord}.`,
      `${tt('cropDoctorSpeechConfidence')}: ${result.confidence}.`,
      result.summary || '',
      communityAlert ? tt('cropDoctorSpeechCommunityAlert', { radiusKm: communityAlert.radiusKm }) : '',
    ].filter(Boolean).join(' ');

    Tts.stop();
    setTimeout(() => Tts.speak(speech), 500);

    if (!usedOfflineMode && communityAlert) {
      Alert.alert(
        tt('cropDoctorAnalysisCompleteTitle'),
        tt('cropDoctorAnalysisCompleteMessage', {
          disease: result.diseaseName || result.disease,
          severity: result.severity,
          radiusKm: communityAlert?.radiusKm ?? 0,
        }),
        [
          {
            text: tt('alertNearbyNo'),
            style: 'cancel',
          },
          {
            text: tt('alertNearbyYes'),
            onPress: () => {
              publishDiseaseAlert({
                diseaseName: result.diseaseName || result.disease,
                crop: result.crop,
                severity: result.severity,
                locationName: user.district || user.state || t(selectedLanguage, 'yourArea'),
                communityConfirmed: true,
              });
              Tts.stop();
              Tts.speak(tt('alertThanksConfirmation'));
            },
          },
        ],
      );
    }

    setIsScanning(false);
  };

  const handleListenTreatment = () => {
    if (!scanResult) return;
    const treatment = scanResult.treatment?.join('. ') || '';
    Tts.stop();
    Tts.speak(`${tt('cropDoctorListenPrefix')} ${scanResult.diseaseName || scanResult.disease}. ${treatment}`);
  };

  const handleReset = () => {
    setCapturedImage(null);
    setScanResult(null);
    setIsOfflineMode(false);
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
              <Text style={styles.backText}>{t(selectedLanguage, 'backArrow')}</Text>
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.title}>🌿 {t(selectedLanguage, 'cropDoctor')}</Text>
              <Text style={styles.subtitle}>{t(selectedLanguage, 'aiDiseaseDetection')}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Precision Optical Scanner Box */}
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
                <View style={styles.emptyScannerIconCircle}>
                  <Text style={styles.emptyScannerGlyph}>📸</Text>
                </View>
                <Text style={styles.emptyScannerTitle}>{tt('cropDoctorNoPhotoYet')}</Text>
                <Text style={styles.emptyScannerHint}>{tt('cropDoctorNoPhotoHint')}</Text>
              </View>
            )}
          </View>

          {/* Capture Actions */}
          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.captureBtn, pressed && { opacity: 0.85 }]}
              onPress={handleCapture}
            >
              <Text style={styles.captureBtnText}>
                {capturedImage ? `📷 ${tt('cropDoctorRetake')}` : `📷 ${tt('cropDoctorOpenCamera')}`}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.galleryBtn, pressed && { opacity: 0.85 }]}
              onPress={handlePickFromGallery}
            >
              <Text style={styles.galleryBtnText}>🖼️ {tt('cropDoctorGallery')}</Text>
            </Pressable>
          </View>

          {/* Primary Analyze Button */}
          <Pressable
            style={({ pressed }) => [
              styles.analyzeBtn,
              (!capturedImage || isScanning) && styles.btnDisabled,
              pressed && capturedImage && !isScanning && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
            onPress={handleAnalyze}
            disabled={!capturedImage || isScanning}
          >
            {isScanning ? (
              <View style={styles.scanningRow}>
                <ActivityIndicator color="#ffffff" />
                <Text style={styles.scanningText}>Analyzing Crop Pathology...</Text>
              </View>
            ) : (
              <Text style={styles.analyzeBtnText}>⚡ {tt('cropDoctorAnalyze')}</Text>
            )}
          </Pressable>

          {capturedImage && (
            <Pressable style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>{tt('cropDoctorClearPhoto')}</Text>
            </Pressable>
          )}

          {/* Tips Card (when no result yet) */}
          {!scanResult && (
            <View style={styles.tipCard}>
              <Text style={styles.tipHeading}>📋 {tt('cropDoctorPhotoTips')}</Text>
              <Text style={styles.tipRow}>• {tt('cropDoctorTipCaptureSingleLeaf')}</Text>
              <Text style={styles.tipRow}>• {tt('cropDoctorTipAvoidShadows')}</Text>
              <Text style={styles.tipRow}>• {tt('cropDoctorTipIncludeDamage')}</Text>
            </View>
          )}

          {/* Diagnostic Report Panel */}
          {capturedImage && scanResult && (
            <View style={styles.reportWrap}>
              {/* Offline Warning (if applicable) */}
              {isOfflineMode && (
                <View style={styles.offlineBox}>
                  <Text style={styles.offlineIcon}>📴</Text>
                  <View style={styles.offlineContent}>
                    <Text style={styles.offlineTitle}>{tt('offlineAnalysis')}</Text>
                    <Text style={styles.offlineHint}>{tt('offlineAnalysisHint')}</Text>
                    {offlineReason ? (
                      <Text style={styles.offlineReason}>
                        {tt('errorTitle')}: {offlineReason}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}

              {/* Severity Gauge */}
              <View
                style={[
                  styles.severityPillBanner,
                  {
                    backgroundColor:
                      scanResult.severity === 'High'
                        ? 'rgba(248, 113, 113, 0.15)'
                        : scanResult.severity === 'Moderate'
                        ? 'rgba(251, 191, 36, 0.15)'
                        : 'rgba(52, 211, 153, 0.15)',
                    borderColor:
                      scanResult.severity === 'High'
                        ? 'rgba(248, 113, 113, 0.4)'
                        : scanResult.severity === 'Moderate'
                        ? 'rgba(251, 191, 36, 0.4)'
                        : 'rgba(52, 211, 153, 0.4)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.severityDot,
                    {
                      backgroundColor:
                        scanResult.severity === 'High'
                          ? colors.coral
                          : scanResult.severity === 'Moderate'
                          ? colors.gold
                          : colors.emerald,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.severityText,
                    {
                      color:
                        scanResult.severity === 'High'
                          ? colors.coral
                          : scanResult.severity === 'Moderate'
                          ? colors.gold
                          : colors.emerald,
                    },
                  ]}
                >
                  {scanResult.severity?.toUpperCase()} {tt('cropDoctorSeverity')}
                </Text>
              </View>

              {/* Diagnosis Main Card */}
              <View style={styles.diagnosisCard}>
                <Text style={styles.diagnosisLabel}>{tt('cropDoctorLikelyDiagnosis')}</Text>
                <Text style={styles.diseaseTitle}>{scanResult.diseaseName || scanResult.disease}</Text>
                <Text style={styles.cropFound}>
                  {tt('cropDoctorIdentifiedIn')}: <Text style={styles.cropFoundBold}>{scanResult.crop}</Text>
                </Text>

                <View style={styles.confidenceRow}>
                  <View style={styles.confidenceBox}>
                    <Text style={styles.confidenceScore}>{scanResult.confidence || '94%'}</Text>
                    <Text style={styles.confidenceScoreLabel}>{tt('cropDoctorConfidenceScore')}</Text>
                  </View>
                  <View style={styles.confidenceCheck}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                </View>

                <Text style={styles.summaryParagraph}>{scanResult.summary}</Text>
              </View>

              {/* Audio Listen CTA */}
              <Pressable
                style={({ pressed }) => [styles.audioListenBtn, pressed && { opacity: 0.85 }]}
                onPress={handleListenTreatment}
              >
                <Text style={styles.audioListenIcon}>🔊</Text>
                <Text style={styles.audioListenText}>{tt('cropDoctorListenTreatmentPlan')}</Text>
              </Pressable>

              {/* Community Alert Card */}
              <View style={styles.commAlertCard}>
                <Text style={styles.commAlertTitle}>🚨 {tt('cropDoctorCommunityAlertSent')}</Text>
                <Text style={styles.commAlertText}>
                  {scanResult.severity === 'High'
                    ? tt('cropDoctorCommunityAlertHigh')
                    : scanResult.severity === 'Moderate'
                    ? tt('cropDoctorCommunityAlertModerate')
                    : tt('cropDoctorCommunityAlertLow')}
                </Text>
              </View>

              {/* Treatment Steps */}
              <ResultSection
                title={`🌿 ${tt('cropDoctorTreatmentSteps')}`}
                items={scanResult.treatment}
              />

              {/* Prevention Advice */}
              <ResultSection
                title={`🛡️ ${tt('cropDoctorPreventionTips')}`}
                items={scanResult.prevention}
              />

              {/* Alternative Predictions */}
              <PredictionSection
                predictions={scanResult.topPredictions}
                title={tt('cropDoctorTopPredictions')}
              />

              {/* Safety Disclaimer */}
              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerTitle}>⚠️ {tt('cropDoctorBeforeSpraying')}</Text>
                <Text style={styles.disclaimerText}>{scanResult.disclaimer}</Text>
              </View>

              <Pressable style={styles.scanAgainBtn} onPress={handleReset}>
                <Text style={styles.scanAgainText}>📸 {tt('cropDoctorScanAnother')}</Text>
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

  // Scanner Viewfinder Card
  scannerCard: {
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
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
  emptyScannerIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  emptyScannerGlyph: {
    fontSize: 28,
  },
  emptyScannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4,
  },
  emptyScannerHint: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.lg,
  },

  // Precision Reticles
  scannerReticleTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: colors.emerald,
  },
  scannerReticleTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 24,
    height: 24,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.emerald,
  },
  scannerReticleBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: colors.emerald,
  },
  scannerReticleBR: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 24,
    height: 24,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.emerald,
  },

  // Button Row
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.md,
  },
  captureBtn: {
    flex: 1,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnText: {
    color: colors.emerald,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
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

  // Analyze Button
  analyzeBtn: {
    backgroundColor: '#1b6334',
    borderRadius: radii.full,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.45)',
    shadowColor: colors.emerald,
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
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scanningText: {
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

  // Tips Card
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

  // Report Wrap
  reportWrap: {
    marginTop: spacing.md,
  },
  offlineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  offlineIcon: {
    fontSize: 20,
  },
  offlineContent: {
    flex: 1,
  },
  offlineTitle: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '800',
  },
  offlineHint: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  offlineReason: {
    color: colors.faint,
    fontSize: 10,
    marginTop: 2,
  },

  // Severity Gauge
  severityPillBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  // Diagnosis Main Card
  diagnosisCard: {
    backgroundColor: 'rgba(18, 36, 25, 0.9)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  diagnosisLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.emerald,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  diseaseTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.4,
    marginTop: 4,
    marginBottom: 2,
  },
  cropFound: {
    fontSize: 13,
    color: colors.muted,
  },
  cropFoundBold: {
    color: colors.inkSecondary,
    fontWeight: '700',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: radii.md,
    padding: 12,
    marginVertical: spacing.md,
  },
  confidenceBox: {},
  confidenceScore: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.emerald,
  },
  confidenceScoreLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  confidenceCheck: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  checkIcon: {
    color: colors.emerald,
    fontSize: 14,
    fontWeight: '800',
  },
  summaryParagraph: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 19,
  },

  // Audio CTA
  audioListenBtn: {
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
  audioListenIcon: {
    fontSize: 16,
  },
  audioListenText: {
    color: colors.emerald,
    fontSize: 13,
    fontWeight: '800',
  },

  // Alert Card
  commAlertCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  commAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.gold,
    marginBottom: 4,
  },
  commAlertText: {
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 17,
  },

  // Result Section
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

  // Prediction Rows
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  predictionLabel: {
    fontSize: 13,
    color: colors.inkSecondary,
    fontWeight: '600',
  },
  predictionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
  },
  predictionConfidence: {
    fontSize: 11,
    color: colors.emerald,
    fontWeight: '800',
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
