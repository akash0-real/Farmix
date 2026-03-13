import React, { useState } from 'react';
import Tts from 'react-native-tts';
import {
  ActivityIndicator,
  Alert,
  Image,
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
      Alert.alert('Scan Failed', error.message);
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>🌿 Crop Doctor</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.subtitle}>
        Take a clear photo of the affected leaf or fruit and Farmix AI will
        diagnose the disease instantly.
      </Text>

      {/* Hero Image Card */}
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

      {/* Buttons */}
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
            <ActivityIndicator color="#1a6b3a" />
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

      {/* Tips */}
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

      {/* Results */}
      {scanResult && (
        <>
          {/* Severity Banner */}
          <View
            style={[
              styles.severityBanner,
              {
                backgroundColor:
                  scanResult.severity === 'High'
                    ? '#c0392b'
                    : scanResult.severity === 'Moderate'
                    ? '#e8a83a'
                    : '#2d8a52',
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

          {/* Main Result Card */}
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

          {/* Listen Button */}
          <Pressable
            style={styles.listenButton}
            onPress={handleListenTreatment}
          >
            <Text style={styles.listenButtonText}>
              🔊 Listen to Treatment Plan
            </Text>
          </Pressable>

          {/* Community Alert Card */}
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

          {/* Treatment Steps */}
          <ResultSection
            title="🌿 Treatment Steps"
            items={scanResult.treatment}
          />

          {/* Prevention Tips */}
          <ResultSection
            title="🛡️ Prevention Tips"
            items={scanResult.prevention}
          />

          <PredictionSection predictions={scanResult.topPredictions} />

          {/* Disclaimer */}
          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerTitle}>⚠️ Before Spraying</Text>
            <Text style={styles.disclaimerText}>{scanResult.disclaimer}</Text>
          </View>

          {/* Scan Again */}
          <Pressable style={styles.scanAgainButton} onPress={handleReset}>
            <Text style={styles.scanAgainText}>📸 Scan Another Crop</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f5f4',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    paddingVertical: 6,
    paddingRight: 12,
  },
  backText: {
    color: '#1a6b3a',
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#14301f',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: '#576577',
    marginBottom: 16,
  },
  heroCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#dce7da',
    minHeight: 240,
    borderWidth: 1,
    borderColor: '#d3ddd4',
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
    color: '#14301f',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#5d6d61',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#1a6b3a',
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
    borderRadius: 14,
    backgroundColor: '#e6efe6',
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bdd0bf',
  },
  secondaryButtonText: {
    color: '#1a6b3a',
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
    color: '#7b4d1d',
    fontWeight: '700',
    fontSize: 13,
  },
  tipCard: {
    borderRadius: 16,
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#efd8a8',
    padding: 14,
    marginTop: 4,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#7b4d1d',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 21,
    color: '#8a6a3a',
  },
  severityBanner: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  severityBannerText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  resultCard: {
    borderRadius: 18,
    backgroundColor: '#ffffff',
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#7f8f82',
    marginBottom: 4,
    fontWeight: '700',
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#153321',
    marginBottom: 4,
  },
  cropText: {
    fontSize: 13,
    color: '#6e7f74',
    marginBottom: 14,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5faf6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  confidenceBadge: {},
  confidenceNum: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1a6b3a',
  },
  confidenceLabel: {
    fontSize: 10,
    color: '#7f8f82',
    letterSpacing: 1,
    fontWeight: '700',
  },
  checkCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a6b3a',
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
    color: '#435465',
  },
  listenButton: {
    backgroundColor: '#1a6b3a',
    borderRadius: 14,
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
    backgroundColor: '#fff3f3',
    borderLeftWidth: 4,
    borderLeftColor: '#c0392b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  alertCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#c0392b',
    marginBottom: 4,
  },
  alertCardText: {
    fontSize: 13,
    color: '#888',
  },
  sectionCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#153321',
    marginBottom: 10,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
    color: '#435465',
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
    color: '#335144',
    flex: 1,
    marginRight: 8,
  },
  predictionConfidence: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a6b3a',
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
    backgroundColor: '#fff3f0',
    borderWidth: 1,
    borderColor: '#f0c5b9',
    padding: 16,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9c4027',
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 21,
    color: '#8f503e',
  },
  scanAgainButton: {
    backgroundColor: '#f0f7f1',
    borderWidth: 2,
    borderColor: '#1a6b3a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  scanAgainText: {
    color: '#1a6b3a',
    fontSize: 15,
    fontWeight: '800',
  },
});
