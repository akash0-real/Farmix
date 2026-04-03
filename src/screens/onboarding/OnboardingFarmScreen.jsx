import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Tts from 'react-native-tts';
import { useUser } from '../../context/UserContext';
import { t } from '../../languages/uiText';
import { getTtsCode } from '../../languages/languageConfig';

const farmImage = require('../../assests/images/field.jpg');

export default function OnboardingFarmScreen({ selectedLanguage, onComplete, onBack }) {
  const { finishOnboarding, onboardingData } = useUser();
  const [farmSize, setFarmSize] = useState(onboardingData.farmSize || '');
  const [farmType, setFarmType] = useState(onboardingData.farmType || '');
  const [selectedCrops, setSelectedCrops] = useState(onboardingData.crops || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const speakInSelectedLanguage = (message) => {
    const ttsCode = getTtsCode(selectedLanguage);
    Tts.setDefaultLanguage(ttsCode);
    Tts.stop();
    Tts.speak(message);
  };

  const getFarmMessage = () => (
    `${t(selectedLanguage, 'farmDetailsTitle')}. ${t(selectedLanguage, 'farmDetailsSubtitle')}`
  );

  // Translated farm types
  const FARM_TYPES = useMemo(() => [
    { id: 'irrigated', label: t(selectedLanguage, 'irrigated'), icon: '💧', desc: t(selectedLanguage, 'irrigatedDesc') },
    { id: 'rainfed', label: t(selectedLanguage, 'rainfed'), icon: '🌧️', desc: t(selectedLanguage, 'rainfedDesc') },
    { id: 'mixed', label: t(selectedLanguage, 'mixed'), icon: '🔄', desc: t(selectedLanguage, 'mixedDesc') },
  ], [selectedLanguage]);

  // Translated crops
  const COMMON_CROPS = useMemo(() => [
    { id: 'wheat', label: t(selectedLanguage, 'wheat'), icon: '🌾' },
    { id: 'rice', label: t(selectedLanguage, 'rice'), icon: '🍚' },
    { id: 'cotton', label: t(selectedLanguage, 'cotton'), icon: '☁️' },
    { id: 'sugarcane', label: t(selectedLanguage, 'sugarcane'), icon: '🎋' },
    { id: 'maize', label: t(selectedLanguage, 'maize'), icon: '🌽' },
    { id: 'soybean', label: t(selectedLanguage, 'soybean'), icon: '🫘' },
    { id: 'groundnut', label: t(selectedLanguage, 'groundnut'), icon: '🥜' },
    { id: 'pulses', label: t(selectedLanguage, 'pulses'), icon: '🫛' },
    { id: 'vegetables', label: t(selectedLanguage, 'vegetables'), icon: '🥬' },
    { id: 'fruits', label: t(selectedLanguage, 'fruits'), icon: '🍎' },
    { id: 'millets', label: t(selectedLanguage, 'millets'), icon: '🌿' },
    { id: 'other', label: t(selectedLanguage, 'other'), icon: '🌱' },
  ], [selectedLanguage]);

  useEffect(() => {
    const message = getFarmMessage();
    setTimeout(() => {
      speakInSelectedLanguage(message);
    }, 300);
    return () => Tts.stop();
  }, [selectedLanguage]);

  const toggleCrop = (cropId) => {
    setSelectedCrops(prev => {
      if (prev.includes(cropId)) {
        return prev.filter(id => id !== cropId);
      } else {
        return [...prev, cropId];
      }
    });
    setError('');
  };

  const handleComplete = async () => {
    if (!farmSize.trim()) {
      setError(t(selectedLanguage, 'enterFarmSize'));
      return;
    }
    if (!farmType) {
      setError(t(selectedLanguage, 'selectFarmType'));
      return;
    }
    if (selectedCrops.length === 0) {
      setError(t(selectedLanguage, 'selectOneCrop'));
      return;
    }

    setLoading(true);
    try {
      await finishOnboarding({
        farmSize: farmSize.trim(),
        farmType,
        crops: selectedCrops,
        language: selectedLanguage,
      });

      Tts.speak(t(selectedLanguage, 'setupComplete'));
      setTimeout(() => onComplete(), 1000);
    } catch (err) {
      setError(err.message || t(selectedLanguage, 'saveFailed'));
      setLoading(false);
    }
  };

  const speakHelp = () => {
    speakInSelectedLanguage(getFarmMessage());
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={farmImage} style={styles.background} resizeMode="cover">
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '100%' }]} />
              </View>
              <Text style={styles.progressText}>{t(selectedLanguage, 'farmStep')}</Text>
            </View>

            {/* Glass Card */}
            <View style={styles.glassSheet}>
              <View style={styles.glassInner}>
                <View style={styles.handle} />

                {/* Icon */}
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>🌾</Text>
                </View>

                <Text style={styles.title}>{t(selectedLanguage, 'farmDetailsTitle')}</Text>
                <Text style={styles.subtitle}>
                  {t(selectedLanguage, 'farmDetailsSubtitle')}
                </Text>

                {/* Mic Button */}
                <Pressable style={styles.micButton} onPress={speakHelp}>
                  <Text style={styles.micIcon}>🎤</Text>
                  <Text style={styles.micText}>{t(selectedLanguage, 'tapToHear')}</Text>
                </Pressable>

                {/* Farm Size Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t(selectedLanguage, 'farmSizeLabel')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t(selectedLanguage, 'farmSizePlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={farmSize}
                    onChangeText={(text) => {
                      setFarmSize(text);
                      setError('');
                    }}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Farm Type Selection */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t(selectedLanguage, 'farmTypeLabel')}</Text>
                  <View style={styles.farmTypeRow}>
                    {FARM_TYPES.map((type) => (
                      <Pressable
                        key={type.id}
                        style={[
                          styles.farmTypeCard,
                          farmType === type.id && styles.farmTypeCardActive,
                        ]}
                        onPress={() => {
                          setFarmType(type.id);
                          setError('');
                        }}
                      >
                        <Text style={styles.farmTypeIcon}>{type.icon}</Text>
                        <Text style={[
                          styles.farmTypeLabel,
                          farmType === type.id && styles.farmTypeLabelActive,
                        ]}>
                          {type.label}
                        </Text>
                        <Text style={styles.farmTypeDesc}>{type.desc}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Crops Selection */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t(selectedLanguage, 'cropsLabel')}</Text>
                  <View style={styles.cropsGrid}>
                    {COMMON_CROPS.map((crop) => {
                      const isSelected = selectedCrops.includes(crop.id);
                      return (
                        <Pressable
                          key={crop.id}
                          style={[
                            styles.cropChip,
                            isSelected && styles.cropChipActive,
                          ]}
                          onPress={() => toggleCrop(crop.id)}
                        >
                          <Text style={styles.cropIcon}>{crop.icon}</Text>
                          <Text style={[
                            styles.cropLabel,
                            isSelected && styles.cropLabelActive,
                          ]}>
                            {crop.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Buttons */}
                <View style={styles.buttonRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.backButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={onBack}
                    disabled={loading}
                  >
                    <Text style={styles.backButtonText}>{t(selectedLanguage, 'backArrow')}</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.completeButton,
                      pressed && styles.buttonPressed,
                      loading && styles.completeButtonLoading,
                    ]}
                    onPress={handleComplete}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.completeButtonText}>{t(selectedLanguage, 'completeSetup')}</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#0d3320',
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 20, 10, 0.75)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(5, 25, 12, 0.5)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 30,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#7eff8a',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },

  // Glass Sheet
  glassSheet: {
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  glassInner: {
    backgroundColor: 'rgba(8, 28, 15, 0.85)',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },

  // Icon
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(126, 255, 138, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(126, 255, 138, 0.25)',
  },
  icon: {
    fontSize: 28,
  },

  // Text
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
    paddingHorizontal: 10,
  },

  // Mic Button
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignSelf: 'center',
    marginBottom: 16,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  micIcon: {
    fontSize: 12,
  },
  micText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '600',
  },

  // Input
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#7eff8a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },

  // Farm Type
  farmTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  farmTypeCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  farmTypeCardActive: {
    backgroundColor: 'rgba(126, 255, 138, 0.12)',
    borderColor: 'rgba(126, 255, 138, 0.35)',
  },
  farmTypeIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  farmTypeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  farmTypeLabelActive: {
    color: '#7eff8a',
  },
  farmTypeDesc: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },

  // Crops Grid
  cropsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  cropChipActive: {
    backgroundColor: 'rgba(126, 255, 138, 0.15)',
    borderColor: 'rgba(126, 255, 138, 0.35)',
  },
  cropIcon: {
    fontSize: 14,
  },
  cropLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  cropLabelActive: {
    color: '#7eff8a',
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '700',
  },
  completeButton: {
    flex: 2,
    backgroundColor: '#2f8d41',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#2f8d41',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(126, 255, 138, 0.25)',
  },
  completeButtonLoading: {
    opacity: 0.8,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.9,
  },
});
