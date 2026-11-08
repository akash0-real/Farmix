import React, { useState, useEffect, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Linking,
  Modal,
} from 'react-native';
import Tts from 'react-native-tts';
import { sendOtp as firebaseSendOtp, verifyOtp as firebaseVerifyOtp } from '../services/firebaseService';
import {
  LANGUAGE_OPTIONS,
  MORE_LANGUAGES,
  ALL_LANGUAGES,
  WELCOME_MESSAGES,
  OTP_SENT_MESSAGES,
  LOGIN_SUCCESS_MESSAGES,
  GREETING_MESSAGES,
  getTtsCode,
} from '../languages/languageConfig';
import { t } from '../languages/uiText';
import {
  detectLanguageFromTranscript,
  destroyVoiceSession,
  extractDigitsFromSpeech,
  startVoiceSession,
  stopVoiceSession,
} from '../services/voiceAssistantService';
import { colors, radii, spacing } from '../theme/theme';

const farmImage = require('../assests/images/field.jpg');

export default function LoginScreen({
  selectedLanguage,
  onSelectLanguage,
  onBack,
  onLoginSuccess,
}) {
  const [step, setStep] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [showMoreLanguages, setShowMoreLanguages] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const timerRef = useRef(null);

  const speakInSelectedLanguage = message => {
    const ttsCode = getTtsCode(selectedLanguage);
    Tts.setDefaultLanguage(ttsCode);
    Tts.stop();
    Tts.speak(message);
  };

  useEffect(() => {
    const ttsCode = getTtsCode(selectedLanguage);
    const message =
      WELCOME_MESSAGES[selectedLanguage] || WELCOME_MESSAGES.English;
    Tts.setDefaultLanguage(ttsCode);
    setTimeout(() => Tts.speak(message), 800);
    return () => Tts.stop();
  }, [selectedLanguage]);

  useEffect(() => {
    return () => {
      destroyVoiceSession();
    };
  }, []);

  useEffect(() => {
    if (step === 'otp') {
      setTimer(30);
      timerRef.current = setInterval(() => {
        setTimer(current => {
          if (current <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return current - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  const sendOtp = async () => {
    if (phoneNumber.length < 10) {
      Alert.alert(
        t(selectedLanguage, 'invalidNumberTitle'),
        t(selectedLanguage, 'invalidNumberMessage'),
      );
      return;
    }
    setLoading(true);
    try {
      const formattedNumber = '+91' + phoneNumber;
      const confirm = await firebaseSendOtp(formattedNumber);
      setConfirmation(confirm);
      setStep('otp');
      const message =
        OTP_SENT_MESSAGES[selectedLanguage] || OTP_SENT_MESSAGES.English;
      speakInSelectedLanguage(message);
    } catch (error) {
      Alert.alert(
        t(selectedLanguage, 'errorTitle'),
        error.message || t(selectedLanguage, 'sendOtpError')
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert(t(selectedLanguage, 'invalidOtpTitle'), t(selectedLanguage, 'invalidOtpMessage'));
      return;
    }
    if (!confirmation) {
      Alert.alert(t(selectedLanguage, 'errorTitle'), t(selectedLanguage, 'requestNewOtp'));
      setStep('phone');
      return;
    }
    setLoading(true);
    try {
      await firebaseVerifyOtp(confirmation, otp);
      const message =
        LOGIN_SUCCESS_MESSAGES[selectedLanguage] ||
        LOGIN_SUCCESS_MESSAGES.English;
      speakInSelectedLanguage(message);
      setTimeout(() => onLoginSuccess(), 1500);
    } catch (error) {
      Alert.alert(
        t(selectedLanguage, 'verificationFailed'),
        error.message || t(selectedLanguage, 'invalidOtpRetry')
      );
      setLoading(false);
    }
  };

  const resendOtp = () => {
    if (timer > 0) return;
    setOtp('');
    setConfirmation(null);
    sendOtp();
  };

  const speakWelcome = () => {
    const message =
      WELCOME_MESSAGES[selectedLanguage] || WELCOME_MESSAGES.English;
    speakInSelectedLanguage(message);
  };

  const handleLanguageSelect = label => {
    if (label === 'More...') {
      setShowMoreLanguages(true);
    } else {
      onSelectLanguage(label);
    }
  };

  const handleMoreLanguageSelect = label => {
    onSelectLanguage(label);
    setShowMoreLanguages(false);
  };

  const handleVoicePhoneInput = async () => {
    if (step !== 'phone') {
      return;
    }

    try {
      setIsListening(true);
      await startVoiceSession({
        locale: getTtsCode(selectedLanguage),
        autoStopMs: 7000,
        onResults: (transcript) => {
          const inferredLanguage = detectLanguageFromTranscript(transcript);
          if (inferredLanguage && inferredLanguage !== selectedLanguage) {
            onSelectLanguage(inferredLanguage);
          }

          const digits = extractDigitsFromSpeech(transcript);
          if (digits) {
            setPhoneNumber(digits);
            speakInSelectedLanguage(
              t(selectedLanguage, 'voiceNumberDetected', { number: digits }),
            );
          } else {
            Alert.alert(
              t(selectedLanguage, 'voiceInputFailedTitle'),
              t(selectedLanguage, 'voiceNumberNotDetected'),
            );
          }
        },
        onError: () => {
          setIsListening(false);
          Alert.alert(
            t(selectedLanguage, 'voiceInputFailedTitle'),
            t(selectedLanguage, 'voiceInputFailedMessage'),
          );
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
    } catch (error) {
      setIsListening(false);
      const message = error?.message ? String(error.message) : '';
      if (message.includes('VOICE_PERMISSION_BLOCKED') || message.includes('RECORD_AUDIO')) {
        Alert.alert(
          t(selectedLanguage, 'voiceInputFailedTitle'),
          t(selectedLanguage, 'micPermissionBlocked'),
          [
            { text: t(selectedLanguage, 'cancel'), style: 'cancel' },
            {
              text: t(selectedLanguage, 'openSettings'),
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return;
      }
      Alert.alert(
        t(selectedLanguage, 'voiceInputFailedTitle'),
        message
          ? `${t(selectedLanguage, 'voiceInputFailedMessage')}\n\n${message}`
          : t(selectedLanguage, 'voiceInputFailedMessage'),
      );
    }
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={farmImage} style={styles.hero} resizeMode="cover">
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoGlyph}>🌿</Text>
            </View>
            <Text style={styles.brandText}>Farmix</Text>
          </View>

          <View style={styles.floatingTag}>
            <Text style={styles.floatingTagIcon}>🔐</Text>
            <Text style={styles.floatingTagText}>{t(selectedLanguage, 'secureLogin')}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Glass Sheet */}
          <View style={styles.glassSheet}>
            <View style={styles.glassInner}>
              <View style={styles.handle} />

              {step === 'phone' ? (
                <>
                  <Text style={styles.voiceTitle}>
                    {GREETING_MESSAGES[selectedLanguage] || GREETING_MESSAGES.English} 👋
                  </Text>
                  <Text style={styles.voiceSubtitle}>
                    {t(selectedLanguage, 'enterPhoneToStart')}
                  </Text>

                  {/* Concentric Voice Mic Button */}
                  <Pressable
                    style={[
                      styles.micOuter,
                      isListening && styles.micOuterListening,
                    ]}
                    onPress={handleVoicePhoneInput}
                    onLongPress={speakWelcome}
                  >
                    <View style={[styles.micInner, isListening && styles.micInnerListening]}>
                      <Text style={styles.micEmoji}>{isListening ? '🎙️' : '🎤'}</Text>
                    </View>
                  </Pressable>
                  <Text style={styles.micHint}>
                    {isListening
                      ? t(selectedLanguage, 'voiceListeningNow')
                      : t(selectedLanguage, 'tapMicHint')}
                  </Text>

                  {/* Phone Input Row */}
                  <View style={styles.phoneInputRow}>
                    <View style={styles.countryCode}>
                      <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={styles.phoneInput}
                      placeholder={t(selectedLanguage, 'enterPhoneNumber')}
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      placeholderTextColor={colors.faint}
                    />
                  </View>

                  {/* Send OTP Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      loading && styles.buttonDisabled,
                      pressed && !loading && { opacity: 0.9, transform: [{ scale: 0.99 }] },
                    ]}
                    onPress={sendOtp}
                    disabled={loading || isListening}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>{t(selectedLanguage, 'sendOtp')} →</Text>
                    )}
                  </Pressable>

                  {/* Language Selection */}
                  <Text style={styles.sectionLabel}>{t(selectedLanguage, 'selectLanguage')}</Text>
                  <View style={styles.languageGrid}>
                    {LANGUAGE_OPTIONS.map(({ label, nativeLabel }) => {
                      const isSelected = selectedLanguage === label;
                      const isMoreSelected = label === 'More...' && MORE_LANGUAGES.some(l => l.label === selectedLanguage);
                      return (
                        <Pressable
                          key={label}
                          onPress={() => handleLanguageSelect(label)}
                          style={[
                            styles.languageButton,
                            (isSelected || isMoreSelected) && styles.languageButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.languageButtonText,
                              (isSelected || isMoreSelected) && styles.languageButtonTextActive,
                            ]}
                          >
                            {label === 'More...' && isMoreSelected
                              ? ALL_LANGUAGES.find(l => l.label === selectedLanguage)?.nativeLabel || selectedLanguage
                              : nativeLabel || label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : (
                <>
                  {/* OTP Screen */}
                  <Text style={styles.otpTitle}>{t(selectedLanguage, 'enterOtp')} 🔐</Text>
                  <Text style={styles.otpSubtitle}>
                    {t(selectedLanguage, 'sentToPhone', { phone: phoneNumber })}
                  </Text>

                  <TextInput
                    style={styles.otpInput}
                    placeholder="• • • • • •"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={setOtp}
                    placeholderTextColor={colors.faint}
                    textAlign="center"
                    letterSpacing={12}
                  />

                  {isListening ? (
                    <Pressable style={styles.stopListeningBtn} onPress={stopVoiceSession}>
                      <Text style={styles.stopListeningText}>
                        {t(selectedLanguage, 'voiceStopListening')}
                      </Text>
                    </Pressable>
                  ) : null}

                  {/* Verify Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryButton,
                      loading && styles.buttonDisabled,
                      pressed && !loading && { opacity: 0.9 },
                    ]}
                    onPress={verifyOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>{t(selectedLanguage, 'verifyOtp')} ✓</Text>
                    )}
                  </Pressable>

                  {/* Timer & Resend */}
                  <View style={styles.resendRow}>
                    <Text style={styles.timerText}>
                      {timer > 0 ? t(selectedLanguage, 'resendIn', { seconds: timer }) : ''}
                    </Text>
                    <Pressable onPress={resendOtp} disabled={timer > 0}>
                      <Text
                        style={[styles.resendText, timer > 0 && styles.resendDisabled]}
                      >
                        {t(selectedLanguage, 'resendOtp')}
                      </Text>
                    </Pressable>
                  </View>

                  <Pressable
                    onPress={() => setStep('phone')}
                    style={styles.changeNumber}
                  >
                    <Text style={styles.changeNumberText}>← {t(selectedLanguage, 'changeNumber')}</Text>
                  </Pressable>
                </>
              )}

              <Pressable onPress={onBack} style={styles.backButton}>
                <Text style={styles.backButtonText}>{t(selectedLanguage, 'back')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* More Languages Modal */}
        <Modal
          visible={showMoreLanguages}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMoreLanguages(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{t(selectedLanguage, 'selectLanguageTitle')}</Text>
              <Text style={styles.modalSubtitle}>{t(selectedLanguage, 'choosePreferredLanguage')}</Text>
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.modalLanguageGrid}>
                  {MORE_LANGUAGES.map(({ label, nativeLabel }) => {
                    const isSelected = selectedLanguage === label;
                    return (
                      <Pressable
                        key={label}
                        onPress={() => handleMoreLanguageSelect(label)}
                        style={[
                          styles.modalLanguageButton,
                          isSelected && styles.modalLanguageButtonActive,
                        ]}
                      >
                        <Text style={styles.modalLanguageNative}>{nativeLabel}</Text>
                        <Text style={styles.modalLanguageLabel}>{label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowMoreLanguages(false)}
              >
                <Text style={styles.modalCloseText}>{t(selectedLanguage, 'close')}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  hero: {
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 18,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlyph: {
    fontSize: 18,
  },
  brandText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  floatingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  floatingTagIcon: { fontSize: 11 },
  floatingTagText: {
    color: colors.inkSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    marginTop: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  glassSheet: {
    borderTopLeftRadius: radii.xl + 6,
    borderTopRightRadius: radii.xl + 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderBottomWidth: 0,
    backgroundColor: 'rgba(10, 24, 15, 0.94)',
  },
  glassInner: {
    paddingHorizontal: spacing.xxl,
    paddingTop: 12,
    paddingBottom: spacing.xxl,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  voiceTitle: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    marginTop: 4,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  voiceSubtitle: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 14,
    marginBottom: spacing.lg,
    fontWeight: '500',
  },

  // Concentric Mic Button
  micOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(52, 211, 153, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  micOuterListening: {
    borderColor: colors.coral,
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  micInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#1b6334',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    shadowColor: colors.emerald,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  micInnerListening: {
    backgroundColor: colors.coral,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: colors.coral,
  },
  micEmoji: {
    fontSize: 34,
  },
  micHint: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 11,
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  stopListeningBtn: {
    marginTop: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
    borderRadius: radii.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  stopListeningText: {
    color: '#ffd0d0',
    fontSize: 11,
    fontWeight: '700',
  },

  // Phone Input
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 1,
  },
  primaryButton: {
    backgroundColor: '#1b6334',
    paddingVertical: 14,
    borderRadius: radii.full,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    shadowColor: colors.emerald,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  sectionLabel: {
    color: colors.emerald,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
    marginBottom: spacing.md,
  },
  languageButton: {
    width: '48.5%',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 11,
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: colors.emerald,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  languageButtonText: {
    color: colors.inkSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  languageButtonTextActive: {
    color: colors.emerald,
  },

  // OTP
  otpTitle: {
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  otpSubtitle: {
    color: colors.muted,
    textAlign: 'center',
    fontSize: 14,
    marginBottom: spacing.xl,
  },
  otpInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: spacing.lg,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: 4,
  },
  timerText: {
    color: colors.muted,
    fontSize: 12,
  },
  resendText: {
    color: colors.emerald,
    fontSize: 12,
    fontWeight: '700',
  },
  resendDisabled: {
    color: colors.faint,
  },
  changeNumber: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  changeNumberText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0c1a11',
    borderTopLeftRadius: radii.xl + 6,
    borderTopRightRadius: radii.xl + 6,
    paddingHorizontal: spacing.xxl,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalScroll: {
    maxHeight: 280,
  },
  modalLanguageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  modalLanguageButton: {
    width: '48.5%',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalLanguageButtonActive: {
    borderColor: colors.emerald,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  modalLanguageNative: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalLanguageLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    borderRadius: radii.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  modalCloseText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
});
