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
} from 'react-native';
import Tts from 'react-native-tts';
import { useUser } from '../../context/UserContext';
import { t } from '../../languages/uiText';
import { getTtsCode } from '../../languages/languageConfig';
import {
  destroyVoiceSession,
  startVoiceSession,
} from '../../services/voiceAssistantService';
import { colors, radii, spacing } from '../../theme/theme';

const farmImage = require('../../assests/images/field.jpg');

export default function OnboardingNameScreen({ selectedLanguage, onNext }) {
  const { updateOnboardingData, onboardingData } = useUser();
  const [name, setName] = useState(onboardingData.name || '');
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);

  const speakInSelectedLanguage = (message) => {
    const ttsCode = getTtsCode(selectedLanguage);
    Tts.setDefaultLanguage(ttsCode);
    Tts.stop();
    Tts.speak(message);
  };

  const getWelcomeMessage = () => (
    `${t(selectedLanguage, 'onboardingNameTitle')} ${t(selectedLanguage, 'onboardingNameSubtitle')}`
  );

  useEffect(() => {
    const message = getWelcomeMessage();
    setTimeout(() => {
      speakInSelectedLanguage(message);
    }, 500);
    return () => Tts.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage]);

  useEffect(() => {
    return () => {
      destroyVoiceSession();
    };
  }, []);

  const handleContinue = () => {
    if (name.trim().length < 2) {
      setError(t(selectedLanguage, 'enterValidName'));
      return;
    }
    updateOnboardingData({ name: name.trim() });
    onNext();
  };

  const speakWelcome = () => {
    speakInSelectedLanguage(getWelcomeMessage());
  };

  const handleVoiceNameInput = async () => {
    try {
      await startVoiceSession({
        locale: getTtsCode(selectedLanguage),
        autoStopMs: 6000,
        onStart: () => setIsListening(true),
        onEnd: () => setIsListening(false),
        onResults: transcript => {
          const value = String(transcript || '').trim();
          if (value) {
            setName(value);
            setError('');
          }
        },
        onError: () => {
          setIsListening(false);
        },
      });
    } catch (error) {
      setIsListening(false);
    }
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
            {/* Progress Ribbon */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '33%' }]} />
              </View>
              <Text style={styles.progressText}>STEP 1 OF 3 · {t(selectedLanguage, 'nameStep')}</Text>
            </View>

            {/* Glass Card */}
            <View style={styles.glassSheet}>
              <View style={styles.glassInner}>
                <View style={styles.handle} />

                {/* Identity Icon */}
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>🌾</Text>
                </View>

                <Text style={styles.title}>{t(selectedLanguage, 'onboardingNameTitle')}</Text>
                <Text style={styles.subtitle}>
                  {t(selectedLanguage, 'onboardingNameSubtitle')}
                </Text>

                {/* Mic Voice Prompt */}
                <Pressable
                  style={[styles.micButton, isListening && styles.micButtonListening]}
                  onPress={speakWelcome}
                  onLongPress={handleVoiceNameInput}
                >
                  <Text style={styles.micIcon}>🎙️</Text>
                  <Text style={styles.micText}>
                    {isListening
                      ? t(selectedLanguage, 'voiceListeningNow')
                      : t(selectedLanguage, 'tapToHear')}
                  </Text>
                </Pressable>

                {/* Input Container */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t(selectedLanguage, 'yourName')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t(selectedLanguage, 'enterFullName')}
                    placeholderTextColor={colors.faint}
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      setError('');
                    }}
                    autoCapitalize="words"
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>

                {/* Continue CTA */}
                <Pressable
                  style={({ pressed }) => [
                    styles.continueButton,
                    pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                    !name.trim() && styles.continueButtonDisabled,
                  ]}
                  onPress={handleContinue}
                  disabled={!name.trim()}
                >
                  <Text style={styles.continueButtonText}>{t(selectedLanguage, 'continue')} →</Text>
                </Pressable>

                <Text style={styles.infoText}>
                  {t(selectedLanguage, 'onboardingInfo')}
                </Text>
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
    backgroundColor: colors.ground,
  },
  background: {
    flex: 1,
    backgroundColor: '#07130a',
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 14, 8, 0.45)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: 'rgba(5, 18, 9, 0.75)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 30,
  },
  progressContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.emerald,
    borderRadius: 2,
  },
  progressText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  glassSheet: {
    marginHorizontal: spacing.xl,
    borderRadius: radii.xl + 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: 'rgba(10, 24, 15, 0.94)',
  },
  glassInner: {
    paddingHorizontal: spacing.xxl,
    paddingTop: 16,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radii.full,
    alignSelf: 'center',
    marginBottom: spacing.xl,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  micButtonListening: {
    borderColor: colors.coral,
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  micIcon: {
    fontSize: 14,
  },
  micText: {
    color: colors.inkSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    color: colors.emerald,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
  },
  errorText: {
    color: colors.coral,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  continueButton: {
    backgroundColor: '#1b6334',
    paddingVertical: 15,
    borderRadius: radii.full,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    shadowColor: colors.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  continueButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  infoText: {
    color: colors.faint,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
