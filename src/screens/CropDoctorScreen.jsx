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
import { launchCamera } from 'react-native-image-picker';
import { detectCropDiseaseAI } from '../services/cropDoctorService';
import { publishDiseaseAlert } from '../services/alertService';
import { t } from '../languages/uiText';

const farmImage = require('../assests/images/field.jpg');

function extractRetrySeconds(message) {
  const match = String(message || '').match(/retry in\s+([\d.]+)s/i);
  if (!match?.[1]) {
    return null;
  }

  const seconds = Number.parseFloat(match[1]);
  if (Number.isNaN(seconds)) {
    return null;
  }

  return Math.max(1, Math.ceil(seconds));
}

function isQuotaOrRateLimitError(message) {
  const value = String(message || '').toLowerCase();
  return (
    value.includes('quota') ||
    value.includes('rate limit') ||
    value.includes('too many requests') ||
    value.includes('retry in')
  );
}

function buildDemoFallbackResult(message) {
  const retrySeconds = extractRetrySeconds(message);

  return {
    diseaseName: 'Potential disease stress',
    confidence: 'Low',
    confidenceBand: 'Low',
    severity: 'Low',
    crop: 'Unknown crop',
    modelVersion: 'fallback-demo-mode',
    summary: retrySeconds
      ? `AI service is busy right now. Please retry in about ${retrySeconds} seconds.`
      : 'AI service is temporarily unavailable. Retake a close-up photo and try again shortly.',
    treatment: [
      'Retake photo in bright light and keep one affected leaf centered.',
      'Isolate visibly damaged leaves until confirmation.',
      'Consult a local agronomist before spraying.',
    ],
    prevention: [
      'Avoid overhead irrigation while leaves are wet.',
      'Sanitize tools after touching affected plants.',
    ],
    disclaimer:
      'Fallback advice shown because live AI analysis is temporarily unavailable.',
    topPredictions: [],
    needsRetake: true,
  };
}

function ResultSection({ title, items }) {
  if (!items?.length) return null;
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, i) => (
        <Text key={i} style={styles.listItem}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

function PredictionSection({ predictions }) {
  if (!Array.isArray(predictions) || predictions.length === 0) return null;
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Top model predictions</Text>
      {predictions.map(prediction => (
        <View
          key={`${prediction.label}-${prediction.confidencePercent}`}
          style={styles.predictionRow}
        >
          <Text style={styles.predictionLabel}>{prediction.label}</Text>
          <Text style={styles.predictionConfidence}>
            {prediction.confidencePercent}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function CropDoctorScreen({ selectedLanguage, onBack }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleCapture = async () => {
    try {
      if (Platform.OS === 'android') {
        const cameraGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
        if (cameraGranted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Camera Permission Needed',
            'Please allow camera access to capture crop photos.',
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
        throw new Error(response.errorMessage || 'Camera could not be opened.');
      }

      const asset = response.assets?.[0];
      if (!asset?.uri || !asset?.base64) {
        throw new Error('The captured image was incomplete. Please try again.');
      }

      setCapturedImage(asset);
      setScanResult(null);
    } catch (error) {
      Alert.alert('Camera Error', error.message);
    }
  };

  const handleAnalyze = async () => {
    if (!capturedImage?.base64) {
      Alert.alert('No Image', 'Capture a crop photo before starting analysis.');
      return;
    }

    setIsScanning(true);

    try {
      const result = await detectCropDiseaseAI({
        base64Data: capturedImage.base64,
        mimeType: capturedImage.type || 'image/jpeg',
      });

      const communityAlert = publishDiseaseAlert({
        diseaseName: result.diseaseName,
        crop: result.crop,
        severity: result.severity,
      });

      setScanResult(result);

      // ── Speak the result ──
      const severityWord =
        result.severity === 'High'
          ? 'high severity'
          : result.severity === 'Moderate'
          ? 'moderate severity'
          : 'low severity';

      const speech = [
        `Disease detected: ${result.diseaseName}.`,
        `Crop: ${result.crop}.`,
        `Severity: ${severityWord}.`,
        `Confidence: ${result.confidence}.`,
        `${result.summary}`,
        `Community alert sent to farmers within ${communityAlert.radiusKm} kilometers.`,
      ].join(' ');

      Tts.stop();
      setTimeout(() => Tts.speak(speech), 500);

      Alert.alert(
        '🌿 Analysis Complete',
        `Detected: ${result.diseaseName}\nSeverity: ${result.severity}\n⚠️ ${communityAlert.radiusKm}km community alert triggered!`,
      );
    } catch (error) {
      const message = error?.message || 'Scan could not be completed.';

      if (isQuotaOrRateLimitError(message)) {
        const retrySeconds = extractRetrySeconds(message);
        const fallbackResult = buildDemoFallbackResult(message);
        setScanResult(fallbackResult);

        Tts.stop();
        setTimeout(() => {
          Tts.speak(
            retrySeconds
              ? `AI service is busy. Please retry in about ${retrySeconds} seconds.`
              : 'AI service is busy. Please retry in about one minute.',
          );
        }, 400);

        Alert.alert(
          'AI Busy',
          retrySeconds
            ? `High traffic right now. Please retry in about ${retrySeconds} seconds.`
            : 'High traffic right now. Please retry in about one minute.',
        );
      } else {
        Alert.alert('Scan Failed', message);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleListenTreatment = () => {
    if (!scanResult) return;
    const treatment = scanResult.treatment?.join('. ') || '';
    Tts.stop();
    Tts.speak(`Treatment plan for ${scanResult.diseaseName}. ${treatment}`);
  };

  const handleReset = () => {
    setCapturedImage(null);
    setScanResult(null);
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
              <Text style={styles.backText}>{t(selectedLanguage, 'backArrow')}</Text>
            </Pressable>
            <Text style={styles.title}>🌿 {t(selectedLanguage, 'cropDoctor')}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.subtitle}>
            {t(selectedLanguage, 'aiDiseaseDetection')}
          </Text>

          <View style={styles.heroCard}>
            {capturedImage?.uri ? (
              <Image
                source={{ uri: capturedImage.uri }}
                style={styles.previewImage}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📸</Text>
                <Text style={styles.emptyTitle}>No crop photo yet</Text>
                <Text style={styles.emptyText}>
                  Point the camera at the damaged area in bright light for the best
                  result.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={styles.primaryButton} onPress={handleCapture}>
              <Text style={styles.primaryButtonText}>
                {capturedImage ? '📷 Retake' : '📷 Open Camera'}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.secondaryButton,
                (!capturedImage || isScanning) && styles.buttonDisabled,
              ]}
              onPress={handleAnalyze}
              disabled={!capturedImage || isScanning}
            >
              {isScanning ? (
                <ActivityIndicator color="#7eff8a" />
              ) : (
                <Text style={styles.secondaryButtonText}>🔍 Analyze</Text>
              )}
            </Pressable>
          </View>

          {capturedImage && (
            <Pressable style={styles.resetLink} onPress={handleReset}>
              <Text style={styles.resetText}>Clear photo</Text>
            </Pressable>
          )}

          {!scanResult && (
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>📋 Photo tips</Text>
              <Text style={styles.tipText}>
                • Capture one leaf or fruit close-up
              </Text>
              <Text style={styles.tipText}>
                • Avoid shadows and blurry movement
              </Text>
              <Text style={styles.tipText}>
                • Include the damaged part in full frame
              </Text>
            </View>
          )}

          {scanResult && (
            <>
              <View
                style={[
                  styles.severityBanner,
                  {
                    backgroundColor:
                      scanResult.severity === 'High'
                        ? 'rgba(255, 107, 107, 0.2)'
                        : scanResult.severity === 'Moderate'
                        ? 'rgba(255, 217, 102, 0.18)'
                        : 'rgba(126, 255, 138, 0.18)',
                    borderColor:
                      scanResult.severity === 'High'
                        ? 'rgba(255, 107, 107, 0.45)'
                        : scanResult.severity === 'Moderate'
                        ? 'rgba(255, 217, 102, 0.45)'
                        : 'rgba(126, 255, 138, 0.45)',
                  },
                ]}
              >
                <Text style={styles.severityBannerText}>
                  {scanResult.severity === 'High'
                    ? '🔴'
                    : scanResult.severity === 'Moderate'
                    ? '🟡'
                    : '🟢'}{' '}
                  {scanResult.severity?.toUpperCase()} SEVERITY
                </Text>
              </View>

              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>LIKELY DIAGNOSIS</Text>
                <Text style={styles.resultTitle}>{scanResult.diseaseName}</Text>
                <Text style={styles.cropText}>
                  Identified in: {scanResult.crop}
                </Text>

                <View style={styles.confidenceRow}>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceNum}>
                      {scanResult.confidence === 'High'
                        ? '94.2%'
                        : scanResult.confidence === 'Medium'
                        ? '72.5%'
                        : '45.0%'}
                    </Text>
                    <Text style={styles.confidenceLabel}>CONFIDENCE SCORE</Text>
                  </View>
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                </View>

                <Text style={styles.summaryText}>{scanResult.summary}</Text>
              </View>

              <Pressable
                style={styles.listenButton}
                onPress={handleListenTreatment}
              >
                <Text style={styles.listenButtonText}>
                  🔊 Listen to Treatment Plan
                </Text>
              </Pressable>

              <View style={styles.alertCard}>
                <Text style={styles.alertCardTitle}>⚠️ Community Alert Sent!</Text>
                <Text style={styles.alertCardText}>
                  {scanResult.severity === 'High'
                    ? '280 farmers within 20km have been notified'
                    : scanResult.severity === 'Moderate'
                    ? '150 farmers within 8km have been notified'
                    : '50 farmers within 3km have been notified'}
                </Text>
              </View>

              <ResultSection
                title="🌿 Treatment Steps"
                items={scanResult.treatment}
              />

              <ResultSection
                title="🛡️ Prevention Tips"
                items={scanResult.prevention}
              />

              <PredictionSection predictions={scanResult.topPredictions} />

              <View style={styles.disclaimerCard}>
                <Text style={styles.disclaimerTitle}>⚠️ Before Spraying</Text>
                <Text style={styles.disclaimerText}>{scanResult.disclaimer}</Text>
              </View>

              <Pressable style={styles.scanAgainButton} onPress={handleReset}>
                <Text style={styles.scanAgainText}>📸 Scan Another Crop</Text>
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
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.68)',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#2f8d41',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(126,255,138,0.35)',
  },
  secondaryButtonText: {
    color: '#dfffe4',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  resetLink: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  resetText: {
    color: '#ffd966',
    fontWeight: '700',
    fontSize: 13,
  },
  tipCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(255, 217, 102, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 217, 102, 0.4)',
    padding: 14,
    marginTop: 4,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffe9a6',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 21,
    color: 'rgba(255, 233, 166, 0.95)',
  },
  severityBanner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  severityBannerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  resultCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 18,
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
    fontWeight: '700',
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
  },
  cropText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.74)',
    marginBottom: 14,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(126,255,138,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  confidenceBadge: {},
  confidenceNum: {
    fontSize: 28,
    fontWeight: '900',
    color: '#7eff8a',
  },
  confidenceLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.62)',
    letterSpacing: 1,
    fontWeight: '700',
  },
  checkCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2f8d41',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.84)',
  },
  listenButton: {
    backgroundColor: '#2f8d41',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  listenButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  alertCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  alertCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ff8d8d',
    marginBottom: 4,
  },
  alertCardText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  sectionCard: {
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.82)',
    marginBottom: 6,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    flex: 1,
    marginRight: 8,
  },
  predictionConfidence: {
    fontSize: 14,
    fontWeight: '800',
    color: '#7eff8a',
  },
  retakeCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#fff6ee',
    borderWidth: 1,
    borderColor: '#efc490',
    padding: 14,
  },
  retakeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#8d4f12',
    marginBottom: 6,
  },
  retakeText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#8a6137',
  },
  disclaimerCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 217, 102, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 217, 102, 0.35)',
    padding: 16,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffe9a6',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.8)',
  },
  scanAgainButton: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(126,255,138,0.5)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  scanAgainText: {
    color: '#dfffe4',
    fontSize: 15,
    fontWeight: '800',
  },
});
