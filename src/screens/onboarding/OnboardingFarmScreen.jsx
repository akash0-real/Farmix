import React, { useState, useEffect } from 'react';
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

const farmImage = require('../../assests/images/field.jpg');

const FARM_TYPES = [
  { id: 'irrigated', label: 'Irrigated', icon: '💧', desc: 'Canal/Well/Tube-well' },
  { id: 'rainfed', label: 'Rainfed', icon: '🌧️', desc: 'Depends on rainfall' },
  { id: 'mixed', label: 'Mixed', icon: '🔄', desc: 'Both irrigation & rain' },
];

const COMMON_CROPS = [
  { id: 'wheat', label: 'Wheat', icon: '🌾' },
  { id: 'rice', label: 'Rice', icon: '🍚' },
  { id: 'cotton', label: 'Cotton', icon: '☁️' },
  { id: 'sugarcane', label: 'Sugarcane', icon: '🎋' },
  { id: 'maize', label: 'Maize', icon: '🌽' },
  { id: 'soybean', label: 'Soybean', icon: '🫘' },
  { id: 'groundnut', label: 'Groundnut', icon: '🥜' },
  { id: 'pulses', label: 'Pulses', icon: '🫛' },
  { id: 'vegetables', label: 'Vegetables', icon: '🥬' },
  { id: 'fruits', label: 'Fruits', icon: '🍎' },
  { id: 'millets', label: 'Millets', icon: '🌿' },
  { id: 'other', label: 'Other', icon: '🌱' },
];

const FARM_MESSAGES = {
  English: "Almost done! Tell us about your farm size and what you grow.",
  Hindi: "Lagbhag ho gaya! Apne khet ka size aur fasal batayein.",
  Kannada: "Hogutiruva! Nimma tota size mattu bele heli.",
  Tamil: "Kitta mudinthuvittom! Ungal pannai alavum payirum sollungal.",
  Telugu: "Daaadapu ayyindi! Meeru polu size mariyu pantalu cheppandi.",
};

export default function OnboardingFarmScreen({ selectedLanguage, onComplete, onBack }) {
  const { finishOnboarding, onboardingData } = useUser();
  const [farmSize, setFarmSize] = useState(onboardingData.farmSize || '');
  const [farmType, setFarmType] = useState(onboardingData.farmType || '');
  const [selectedCrops, setSelectedCrops] = useState(onboardingData.crops || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const message = FARM_MESSAGES[selectedLanguage] || FARM_MESSAGES.English;
    setTimeout(() => {
      Tts.speak(message);
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
      setError('Please enter your farm size');
      return;
    }
    if (!farmType) {
      setError('Please select your farm type');
      return;
    }
    if (selectedCrops.length === 0) {
      setError('Please select at least one crop');
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

      Tts.speak("Setup complete! Welcome to Farmix.");
      setTimeout(() => onComplete(), 1000);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
      setLoading(false);
    }
  };

  const speakHelp = () => {
    const message = FARM_MESSAGES[selectedLanguage] || FARM_MESSAGES.English;
    Tts.stop();
    Tts.speak(message);
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
              <Text style={styles.progressText}>Step 3 of 3</Text>
            </View>

            {/* Glass Card */}
            <View style={styles.glassSheet}>
              <View style={styles.glassInner}>
                <View style={styles.handle} />

                {/* Icon */}
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>🌾</Text>
                </View>

                <Text style={styles.title}>Farm Details</Text>
                <Text style={styles.subtitle}>
                  Help us understand your farming to provide better recommendations.
                </Text>

                {/* Mic Button */}
                <Pressable style={styles.micButton} onPress={speakHelp}>
                  <Text style={styles.micIcon}>🎤</Text>
                  <Text style={styles.micText}>Tap to hear</Text>
                </Pressable>

                {/* Farm Size Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>FARM SIZE (ACRES)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 5.5"
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
                  <Text style={styles.inputLabel}>FARM TYPE</Text>
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
                  <Text style={styles.inputLabel}>PRIMARY CROPS (Select all that apply)</Text>
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
                    <Text style={styles.backButtonText}>← Back</Text>
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
                      <Text style={styles.completeButtonText}>Complete Setup ✓</Text>
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
