import React, { useState } from 'react';
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
  if (!items?.length) {
    return null;
  }

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map(item => (
        <Text key={`${title}-${item}`} style={styles.listItem}>
          • {item}
        </Text>
      ))}
    </View>
  );
}

function PredictionSection({ predictions }) {
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return null;
  }

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

export default function CropDoctorScreen() {
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

      if (response.didCancel) {
        return;
      }

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
      Alert.alert(
        'Analysis Complete',
        `Detected: ${result.diseaseName} (${result.confidence}). Community alert radius: ${communityAlert.radiusKm} km.`,
      );
    } catch (error) {
      Alert.alert('Scan Failed', error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setScanResult(null);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Crop Doctor</Text>
      <Text style={styles.subtitle}>
        Take a clear photo of the affected leaf or fruit and Farmix will screen
        it for possible disease signs.
      </Text>

      <View style={styles.configCard}>
        <Text style={styles.configTitle}>Demo mode enabled</Text>
        <Text style={styles.configText}>
          Crop Doctor uses a built-in Gemini key for this prototype build.
        </Text>
      </View>

      <View style={styles.heroCard}>
        {capturedImage?.uri ? (
          <Image source={{ uri: capturedImage.uri }} style={styles.previewImage} />
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
            {capturedImage ? 'Retake Photo' : 'Open Camera'}
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
            <Text style={styles.secondaryButtonText}>Analyze Disease</Text>
          )}
        </Pressable>
      </View>

      {capturedImage ? (
        <Pressable style={styles.resetLink} onPress={handleReset}>
          <Text style={styles.resetText}>Clear photo</Text>
        </Pressable>
      ) : null}

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>Photo tips</Text>
        <Text style={styles.tipText}>• Capture one leaf or fruit close-up</Text>
        <Text style={styles.tipText}>• Avoid shadows and blurry movement</Text>
        <Text style={styles.tipText}>• Include the damaged part in full frame</Text>
      </View>

      {scanResult ? (
        <>
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.resultLabel}>Likely diagnosis</Text>
                <Text style={styles.resultTitle}>{scanResult.diseaseName}</Text>
              </View>
              <View style={styles.badgeColumn}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{scanResult.confidence}</Text>
                </View>
                <Text style={styles.bandText}>{scanResult.confidenceBand}</Text>
                <Text style={styles.severityText}>
                  Severity: {scanResult.severity}
                </Text>
              </View>
            </View>

            <Text style={styles.cropText}>Crop: {scanResult.crop}</Text>
            <Text style={styles.modelText}>
              Model: {scanResult.modelVersion || 'unknown'}
            </Text>
            <Text style={styles.summaryText}>{scanResult.summary}</Text>
          </View>

          {scanResult.needsRetake ? (
            <View style={styles.retakeCard}>
              <Text style={styles.retakeTitle}>Low confidence result</Text>
              <Text style={styles.retakeText}>
                Retake the photo in brighter light and keep one affected leaf in
                full focus before treatment.
              </Text>
            </View>
          ) : null}

          <PredictionSection predictions={scanResult.topPredictions} />

          <ResultSection title="Treatment steps" items={scanResult.treatment} />
          <ResultSection title="Prevention tips" items={scanResult.prevention} />

          <View style={styles.disclaimerCard}>
            <Text style={styles.disclaimerTitle}>Before spraying</Text>
            <Text style={styles.disclaimerText}>{scanResult.disclaimer}</Text>
          </View>
        </>
      ) : null}
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
    paddingBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#14301f',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    color: '#576577',
  },
  heroCard: {
    marginTop: 18,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#dce7da',
    minHeight: 260,
    borderWidth: 1,
    borderColor: '#d3ddd4',
  },
  previewImage: {
    width: '100%',
    height: 300,
  },
  emptyState: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 38,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#14301f',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#5d6d61',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  resetText: {
    color: '#7b4d1d',
    fontWeight: '700',
  },
  tipCard: {
    marginTop: 18,
    borderRadius: 16,
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#efd8a8',
    padding: 14,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#7b4d1d',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#8a6a3a',
  },
  configCard: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dde4',
    padding: 14,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#26364a',
    marginBottom: 6,
  },
  configText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#586b82',
    marginBottom: 10,
  },
  resultCard: {
    marginTop: 20,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    padding: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#7f8f82',
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#153321',
  },
  badgeColumn: {
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: '#e2f0e4',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    color: '#1a6b3a',
    fontWeight: '800',
  },
  severityText: {
    marginTop: 8,
    fontSize: 12,
    color: '#576577',
  },
  bandText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '700',
    color: '#1a6b3a',
  },
  cropText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#355542',
  },
  modelText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6e7f74',
  },
  summaryText: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#435465',
  },
  sectionCard: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#153321',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 21,
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
    marginTop: 14,
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
    marginTop: 14,
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
});
