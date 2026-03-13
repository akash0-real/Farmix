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
} from 'react-native';
import Tts from 'react-native-tts';

const LANGUAGE_OPTIONS = [
  { label: 'English', ttsCode: 'en-IN' },
  { label: 'Hindi', ttsCode: 'hi-IN' },
  { label: 'Kannada', ttsCode: 'kn-IN' },
  { label: 'Tamil', ttsCode: 'ta-IN' },
  { label: 'Telugu', ttsCode: 'te-IN' },
  { label: 'More...', ttsCode: 'en-IN' },
];

const WELCOME_MESSAGES = {
  English: 'Welcome to Farmix. Please enter your phone number to continue.',
  Hindi: 'Farmix mein aapka swagat hai. Apna phone number darj karein.',
  Kannada: 'Farmix ge swagata. Nimage phone number needi.',
  Tamil: 'Farmix il ungalai varaverkiren. Ungal phone number kodungal.',
  Telugu: 'Farmix ki swaagatam. Meeru phone number ivvandi.',
};

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
  const timerRef = useRef(null);

  // ── Speak welcome on mount ──
  useEffect(() => {
    const selected = LANGUAGE_OPTIONS.find(l => l.label === selectedLanguage);
    const ttsCode = selected?.ttsCode || 'en-IN';
    const message =
      WELCOME_MESSAGES[selectedLanguage] || WELCOME_MESSAGES.English;
    Tts.setDefaultLanguage(ttsCode);
    setTimeout(() => Tts.speak(message), 800);
    return () => Tts.stop();
  }, [selectedLanguage]);

  // ── OTP countdown timer ──
  useEffect(() => {
    if (step === 'otp') {
      setTimer(30);
      timerRef.current = setInterval(() => {
        setTimer(t => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  // ── Send OTP (Demo mode) ──
  const sendOtp = () => {
    if (phoneNumber.length < 10) {
      Alert.alert(
        'Invalid Number',
        'Please enter a valid 10 digit phone number',
      );
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      Tts.speak('OTP sent successfully. Please enter the code.');
    }, 1500);
  };

  // ── Verify OTP (Demo mode) ──
  const verifyOtp = () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6 digit OTP');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (otp === '324666') {
        Tts.speak('Login successful. Welcome to Farmix!');
        setTimeout(() => onLoginSuccess(), 1500);
      } else {
        Alert.alert('Wrong OTP', 'Hint: use 123456');
      }
    }, 1500);
  };

  // ── Resend OTP ──
  const resendOtp = () => {
    if (timer > 0) return;
    setOtp('');
    sendOtp();
  };

  const speakWelcome = () => {
    const message =
      WELCOME_MESSAGES[selectedLanguage] || WELCOME_MESSAGES.English;
    Tts.speak(message);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
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

      {step === 'phone' ? (
        <>
          {/* Voice Welcome */}
          <Text style={styles.voiceTitle}>
            {selectedLanguage === 'Hindi'
              ? 'नमस्ते 👋'
              : selectedLanguage === 'Kannada'
              ? 'ನಮಸ್ಕಾರ 👋'
              : selectedLanguage === 'Tamil'
              ? 'வணக்கம் 👋'
              : selectedLanguage === 'Telugu'
              ? 'నమస్కారం 👋'
              : 'Welcome 👋'}
          </Text>
          <Text style={styles.voiceSubtitle}>
            Enter your phone number to get started
          </Text>

          {/* Mic Button */}
          <Pressable style={styles.micOuter} onPress={speakWelcome}>
            <View style={styles.micInner}>
              <Text style={styles.micEmoji}>🎤</Text>
            </View>
          </Pressable>
          <Text style={styles.micHint}>Tap mic to hear instructions</Text>

          {/* Phone Input */}
          <View style={styles.phoneInputRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              maxLength={10}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholderTextColor="#aaa"
            />
          </View>

          {/* Send OTP Button */}
          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={sendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Send OTP →</Text>
            )}
          </Pressable>

          {/* Language Select */}
          <Text style={styles.sectionLabel}>SELECT LANGUAGE</Text>
          <View style={styles.languageGrid}>
            {LANGUAGE_OPTIONS.map(({ label }) => {
              const isSelected = selectedLanguage === label;
              return (
                <Pressable
                  key={label}
                  onPress={() => onSelectLanguage(label)}
                  style={[
                    styles.languageButton,
                    isSelected && styles.languageButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.languageButtonText,
                      isSelected && styles.languageButtonTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <>
          {/* OTP Screen */}
          <Text style={styles.otpTitle}>Enter OTP 🔐</Text>
          <Text style={styles.otpSubtitle}>Sent to +91 {phoneNumber}</Text>

          <TextInput
            style={styles.otpInput}
            placeholder="• • • • • •"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
            placeholderTextColor="#aaa"
            textAlign="center"
            letterSpacing={12}
          />

          {/* Verify Button */}
          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={verifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryButtonText}>Verify OTP ✓</Text>
            )}
          </Pressable>

          {/* Timer + Resend */}
          <View style={styles.resendRow}>
            <Text style={styles.timerText}>
              {timer > 0 ? `Resend in ${timer}s` : ''}
            </Text>
            <Pressable onPress={resendOtp} disabled={timer > 0}>
              <Text
                style={[styles.resendText, timer > 0 && styles.resendDisabled]}
              >
                Resend OTP
              </Text>
            </Pressable>
          </View>

          {/* Change Number */}
          <Pressable
            onPress={() => setStep('phone')}
            style={styles.changeNumber}
          >
            <Text style={styles.changeNumberText}>← Change Number</Text>
          </Pressable>
        </>
      )}

      <Pressable onPress={onBack} style={styles.backButton}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f5f4',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerRow: {
    marginTop: 8,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#2d8a3f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  brandText: {
    fontSize: 27,
    color: '#1a223d',
    fontWeight: '800',
  },
  helpBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#75829b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  voiceTitle: {
    color: '#1a223d',
    textAlign: 'center',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 10,
  },
  voiceSubtitle: {
    color: '#5f6b7d',
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 18,
    fontWeight: '500',
  },
  micOuter: {
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: '#d4dfd7',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  micInner: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#2f8d41',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#f7f9f8',
  },
  micEmoji: {
    fontSize: 48,
  },
  micHint: {
    textAlign: 'center',
    color: '#888',
    fontSize: 13,
    marginBottom: 20,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d2d8e0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#f0f4f1',
    borderRightWidth: 2,
    borderRightColor: '#d2d8e0',
  },
  countryCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a223d',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 18,
    color: '#1a223d',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#2f8d41',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#aaa',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionLabel: {
    color: '#5d6880',
    fontSize: 14,
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
    borderWidth: 2,
    borderColor: '#d2d8e0',
    backgroundColor: '#f7f8fa',
    paddingVertical: 12,
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: '#379247',
    backgroundColor: '#e5efe7',
  },
  languageButtonText: {
    color: '#5e6676',
    fontSize: 17,
    fontWeight: '700',
  },
  languageButtonTextActive: {
    color: '#2f8d41',
  },
  otpTitle: {
    color: '#1a223d',
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 40,
    marginBottom: 10,
  },
  otpSubtitle: {
    color: '#5f6b7d',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 30,
    fontWeight: '500',
  },
  otpInput: {
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#2f8d41',
    paddingVertical: 18,
    fontSize: 32,
    fontWeight: '800',
    color: '#1a223d',
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
    color: '#888',
    fontSize: 14,
  },
  resendText: {
    color: '#2f8d41',
    fontSize: 14,
    fontWeight: '700',
  },
  resendDisabled: {
    color: '#aaa',
  },
  changeNumber: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  changeNumberText: {
    color: '#5f6b7d',
    fontSize: 15,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: '#5f6b7d',
    fontSize: 16,
    fontWeight: '700',
  },
});
