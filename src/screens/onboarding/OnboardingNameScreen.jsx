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

const farmImage = require('../../assests/images/field.jpg');

const WELCOME_MESSAGES = {
  English: "Welcome to Farmix! Let's set up your profile. Please enter your name.",
  Hindi: "Farmix mein aapka swagat hai! Aapki profile set karein. Kripya apna naam darj karein.",
  Kannada: "Farmix ge swagata! Nimma profile set maadi. Dayavittu nimma hesaru haaki.",
  Tamil: "Farmix il varaverpom! Ungal profile amaikkalaam. Ungal peyarai uLLidavum.",
  Telugu: "Farmix ki swaagatam! Meeru profile set cheyandi. Dayachesi meeru peru ivvandi.",
  Punjabi: "Farmix vich tuhadaa svaagat hai! Profile set karo. Apna naam daao.",
  Malayalam: "Farmix il swagatham! Profile set cheyyaam. Dayavayi ningalude peru nalkuka.",
  Marathi: "Farmix madhe swagat! Profile set kara. Tumcha naav dya.",
  Bengali: "Farmix e swagatam! Profile set korun. Apnar naam din.",
  Gujarati: "Farmix ma swagatam! Profile set karo. Tamaru naam aapo.",
  Odia: "Farmix re swagatam! Profile set karantu. Aapnanka naama diyantu.",
  Assamese: "Farmix at swaagotom! Profile set koruk. Apunar naam diyok.",
  Urdu: "Farmix mein khush aamdeed! Profile set karein. Apna naam darj karein.",
};

export default function OnboardingNameScreen({ selectedLanguage, onNext }) {
  const { updateOnboardingData, onboardingData } = useUser();
  const [name, setName] = useState(onboardingData.name || '');
  const [error, setError] = useState('');

  useEffect(() => {
    const message = WELCOME_MESSAGES[selectedLanguage] || WELCOME_MESSAGES.English;
    setTimeout(() => {
      Tts.speak(message);
    }, 500);
    return () => Tts.stop();
  }, [selectedLanguage]);

  const handleContinue = () => {
    if (name.trim().length < 2) {
      setError(t(selectedLanguage, 'enterValidName'));
      return;
    }
    updateOnboardingData({ name: name.trim() });
    onNext();
  };

  const speakWelcome = () => {
    const message = WELCOME_MESSAGES[selectedLanguage] || WELCOME_MESSAGES.English;
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
                <View style={[styles.progressFill, { width: '33%' }]} />
              </View>
              <Text style={styles.progressText}>{t(selectedLanguage, 'nameStep')}</Text>
            </View>

            {/* Glass Card */}
            <View style={styles.glassSheet}>
              <View style={styles.glassInner}>
                <View style={styles.handle} />

                {/* Icon */}
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>👋</Text>
                </View>

                <Text style={styles.title}>{t(selectedLanguage, 'onboardingNameTitle')}</Text>
                <Text style={styles.subtitle}>
                  {t(selectedLanguage, 'onboardingNameSubtitle')}
                </Text>

                {/* Mic Button */}
                <Pressable style={styles.micButton} onPress={speakWelcome}>
                  <Text style={styles.micIcon}>🎤</Text>
                  <Text style={styles.micText}>{t(selectedLanguage, 'tapToHear')}</Text>
                </Pressable>

                {/* Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t(selectedLanguage, 'yourName')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t(selectedLanguage, 'enterFullName')}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      setError('');
                    }}
                    autoCapitalize="words"
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>

                {/* Continue Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.continueButton,
                    pressed && styles.continueButtonPressed,
                    !name.trim() && styles.continueButtonDisabled,
                  ]}
                  onPress={handleContinue}
                  disabled={!name.trim()}
                >
                  <Text style={styles.continueButtonText}>{t(selectedLanguage, 'continue')}</Text>
                </Pressable>

                {/* Info Text */}
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
    justifyContent: 'center',
    paddingVertical: 40,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Icon
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: 'rgba(126, 255, 138, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(126, 255, 138, 0.25)',
  },
  icon: {
    fontSize: 32,
  },

  // Text
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 10,
  },

  // Mic Button
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  micIcon: {
    fontSize: 16,
  },
  micText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },

  // Input
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#7eff8a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 17,
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },

  // Button
  continueButton: {
    backgroundColor: '#2f8d41',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2f8d41',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(126, 255, 138, 0.25)',
  },
  continueButtonPressed: {
    opacity: 0.9,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },

  // Info
  infoText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
});
