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

  // ── Speak welcome on mount ──
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

  // ── OTP countdown timer ──
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

  // ── Send OTP using Firebase ──
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

  // ── Verify OTP using Firebase ──
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

  // ── Resend OTP ──
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

  const showMicPermissionSettingsPrompt = () => {
    Alert.alert(
      t(selectedLanguage, 'voiceInputFailedTitle'),
      'Microphone access is blocked. Please enable Microphone permission in App Settings.',
      [
        { text: t(selectedLanguage, 'cancel') || 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            Linking.openSettings();
          },
        },
      ],
    );
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
        onError: (event) => {
          const rawError =
            event?.error?.message ||
            event?.error ||
            event?.message ||
            '';
          const errorText = String(rawError).trim();
          if (
            errorText.includes('MIC_PERMISSION_DENIED') ||
            errorText.toLowerCase().includes('permission')
          ) {
            showMicPermissionSettingsPrompt();
            return;
          }
          Alert.alert(
            t(selectedLanguage, 'voiceInputFailedTitle'),
            errorText
              ? `${t(selectedLanguage, 'voiceInputFailedMessage')}\n\n${errorText}`
              : t(selectedLanguage, 'voiceInputFailedMessage'),
          );
        },
        onEnd: () => {
          setIsListening(false);
        },
      });
    } catch (error) {
      setIsListening(false);
      const message = error?.message ? String(error.message) : '';
      if (message.includes('VOICE_NATIVE_MISSING') || message.includes('VOICE_ENGINE_UNAVAILABLE')) {
        Alert.alert(
          t(selectedLanguage, 'voiceInputFailedTitle'),
          'Voice input is not available in this build yet. Please reinstall/rebuild the app and try again.',
        );
        return;
      }
      if (message.includes('MIC_PERMISSION_DENIED')) {
        showMicPermissionSettingsPrompt();
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
        {/* Overlays */}
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />
        <View style={styles.overlayDepth} />

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>F</Text>
            </View>
            <Text style={styles.brandText}>Farmix</Text>
          </View>
          <View style={styles.helpBadge}>
            <Text style={styles.helpText}>?</Text>
          </View>
        </View>

        {/* Floating Tag */}
        <View style={styles.floatingTag}>
          <Text style={styles.floatingTagIcon}>🔐</Text>
          <Text style={styles.floatingTagText}>{t(selectedLanguage, 'secureLogin')}</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Glass Card */}
          <View style={styles.glassSheet}>
            <View style={styles.glassInner}>
              <View style={styles.handle} />

              {step === 'phone' ? (
                <>
                  {/* Voice Welcome */}
                  <Text style={styles.voiceTitle}>
                    {GREETING_MESSAGES[selectedLanguage] || GREETING_MESSAGES.English} 👋
                  </Text>
                  <Text style={styles.voiceSubtitle}>
                    {t(selectedLanguage, 'enterPhoneToStart')}
                  </Text>

                  {/* Mic Button */}
                  <Pressable
                    style={[
                      styles.micOuter,
                      isListening && styles.micOuterListening,
                    ]}
                    onPress={handleVoicePhoneInput}
                    onLongPress={speakWelcome}
                  >
                    <View style={styles.micInner}>
                      <Text style={styles.micEmoji}>{isListening ? '🎙️' : '🎤'}</Text>
                    </View>
                  </Pressable>
                  <Text style={styles.micHint}>
                    {isListening
                      ? t(selectedLanguage, 'voiceListeningNow')
                      : t(selectedLanguage, 'tapMicHint')}
                  </Text>

                  {/* Phone Input */}
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
                      placeholderTextColor="rgba(255,255,255,0.5)"
                    />
                  </View>

                  {/* Send OTP Button */}
                  <Pressable
                    style={[styles.primaryButton, loading && styles.buttonDisabled]}
                    onPress={sendOtp}
                    disabled={loading || isListening}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.primaryButtonText}>{t(selectedLanguage, 'sendOtp')}</Text>
                    )}
                  </Pressable>

                  {/* Language Select */}
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
                    placeholderTextColor="rgba(255,255,255,0.5)"
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
                    style={[styles.primaryButton, loading && styles.buttonDisabled]}
                    onPress={verifyOtp}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.primaryButtonText}>{t(selectedLanguage, 'verifyOtp')}</Text>
                    )}
                  </Pressable>

                  {/* Timer + Resend */}
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

                  {/* Change Number */}
                  <Pressable
                    onPress={() => setStep('phone')}
                    style={styles.changeNumber}
                  >
                    <Text style={styles.changeNumberText}>{t(selectedLanguage, 'changeNumber')}</Text>
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
  },
  hero: {
    flex: 1,
    backgroundColor: '#0d3320',
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 20, 10, 0.2)',
  },
  overlayBottom: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 25, 12, 0.16)',
  },
  overlayDepth: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(5, 25, 12, 0.44)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2d8a3f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  brandText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  helpBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  helpText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  floatingTag: {
    position: 'absolute',
    top: 68,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 10,
  },
  floatingTagIcon: { fontSize: 12 },
  floatingTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
    marginTop: 40,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  glassSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    borderBottomWidth: 0,
  },
  glassInner: {
    backgroundColor: 'rgba(8, 28, 15, 0.78)',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 24,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  voiceTitle: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 10,
  },
  voiceSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 18,
    fontWeight: '500',
  },
  micOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(126, 255, 138, 0.28)',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  micOuterListening: {
    transform: [{ scale: 1.04 }],
  },
  micInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2f8d41',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#2f8d41',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  micEmoji: {
    fontSize: 42,
  },
  micHint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 20,
  },
  stopListeningBtn: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,107,107,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.4)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  stopListeningText: {
    color: '#ffd2d2',
    fontSize: 12,
    fontWeight: '700',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    marginBottom: 16,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.15)',
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#2f8d41',
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#2f8d41',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(150,255,150,0.25)',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    color: '#7eff8a',
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 20,
  },
  languageButton: {
    width: '48.2%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: '#7eff8a',
    backgroundColor: 'rgba(126, 255, 138, 0.15)',
  },
  languageButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '700',
  },
  languageButtonTextActive: {
    color: '#7eff8a',
  },
  otpTitle: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 29,
    fontWeight: '900',
    marginTop: 20,
    marginBottom: 10,
  },
  otpSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    fontSize: 15,
    marginBottom: 30,
    fontWeight: '500',
  },
  otpInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 18,
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 20,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  timerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
  },
  resendText: {
    color: '#7eff8a',
    fontSize: 13,
    fontWeight: '700',
  },
  resendDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  changeNumber: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  changeNumberText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '700',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(8, 28, 15, 0.95)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 34,
    maxHeight: '80%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalLanguageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  modalLanguageButton: {
    width: '48.2%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalLanguageButtonActive: {
    borderColor: '#7eff8a',
    backgroundColor: 'rgba(126, 255, 138, 0.15)',
  },
  modalLanguageNative: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalLanguageLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  modalCloseText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '700',
  },
});
