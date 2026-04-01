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
  Modal,
  FlatList,
} from 'react-native';
import Tts from 'react-native-tts';
import { useUser } from '../../context/UserContext';
import { t } from '../../languages/uiText';

const farmImage = require('../../assests/images/field.jpg');

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const LOCATION_MESSAGES = {
  English: "Great! Now tell us where your farm is located.",
  Hindi: "Bahut badhiya! Ab humein batayein aapka khet kahan hai.",
  Kannada: "Chennaagide! Nimma tota yellide anta heli.",
  Tamil: "Nalla! Ungal pannai enga irukkirathu endra sollungal.",
  Telugu: "Bagundi! Meeru polu ekkada undo cheppandi.",
};

export default function OnboardingLocationScreen({ selectedLanguage, onNext, onBack }) {
  const { updateOnboardingData, onboardingData } = useUser();
  const [village, setVillage] = useState(onboardingData.village || '');
  const [district, setDistrict] = useState(onboardingData.district || '');
  const [state, setState] = useState(onboardingData.state || '');
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const message = LOCATION_MESSAGES[selectedLanguage] || LOCATION_MESSAGES.English;
    setTimeout(() => {
      Tts.speak(message);
    }, 300);
    return () => Tts.stop();
  }, [selectedLanguage]);

  const handleContinue = () => {
    if (!village.trim() || !district.trim() || !state) {
      setError(t(selectedLanguage, 'fillLocationDetails'));
      return;
    }
    updateOnboardingData({
      village: village.trim(),
      district: district.trim(),
      state,
    });
    onNext();
  };

  const speakHelp = () => {
    const message = LOCATION_MESSAGES[selectedLanguage] || LOCATION_MESSAGES.English;
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
                <View style={[styles.progressFill, { width: '66%' }]} />
              </View>
              <Text style={styles.progressText}>{t(selectedLanguage, 'locationStep')}</Text>
            </View>

            {/* Glass Card */}
            <View style={styles.glassSheet}>
              <View style={styles.glassInner}>
                <View style={styles.handle} />

                {/* Icon */}
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>📍</Text>
                </View>

                <Text style={styles.title}>{t(selectedLanguage, 'locationTitle')}</Text>
                <Text style={styles.subtitle}>
                  {t(selectedLanguage, 'locationSubtitle')}
                </Text>

                {/* Mic Button */}
                <Pressable style={styles.micButton} onPress={speakHelp}>
                  <Text style={styles.micIcon}>🎤</Text>
                  <Text style={styles.micText}>{t(selectedLanguage, 'tapToHear')}</Text>
                </Pressable>

                {/* Village Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t(selectedLanguage, 'villageLabel')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t(selectedLanguage, 'villagePlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={village}
                    onChangeText={(text) => {
                      setVillage(text);
                      setError('');
                    }}
                    autoCapitalize="words"
                  />
                </View>

                {/* District Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t(selectedLanguage, 'districtLabel')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t(selectedLanguage, 'districtPlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={district}
                    onChangeText={(text) => {
                      setDistrict(text);
                      setError('');
                    }}
                    autoCapitalize="words"
                  />
                </View>

                {/* State Picker */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t(selectedLanguage, 'stateLabel')}</Text>
                  <Pressable
                    style={styles.pickerButton}
                    onPress={() => setShowStatePicker(true)}
                  >
                    <Text style={state ? styles.pickerText : styles.pickerPlaceholder}>
                      {state || t(selectedLanguage, 'statePlaceholder')}
                    </Text>
                    <Text style={styles.pickerArrow}>▼</Text>
                  </Pressable>
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
                  >
                    <Text style={styles.backButtonText}>{t(selectedLanguage, 'backArrow')}</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.continueButton,
                      pressed && styles.buttonPressed,
                      (!village.trim() || !district.trim() || !state) && styles.continueButtonDisabled,
                    ]}
                    onPress={handleContinue}
                    disabled={!village.trim() || !district.trim() || !state}
                  >
                    <Text style={styles.continueButtonText}>{t(selectedLanguage, 'continue')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* State Picker Modal */}
        <Modal
          visible={showStatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowStatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{t(selectedLanguage, 'selectState')}</Text>
              <FlatList
                data={INDIAN_STATES}
                keyExtractor={(item) => item}
                style={styles.stateList}
                renderItem={({ item }) => (
                  <Pressable
                    style={[
                      styles.stateItem,
                      state === item && styles.stateItemActive,
                    ]}
                    onPress={() => {
                      setState(item);
                      setShowStatePicker(false);
                      setError('');
                    }}
                  >
                    <Text
                      style={[
                        styles.stateItemText,
                        state === item && styles.stateItemTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {state === item && <Text style={styles.checkMark}>✓</Text>}
                  </Pressable>
                )}
              />
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowStatePicker(false)}
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
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
    paddingHorizontal: 10,
  },

  // Mic Button
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  micIcon: {
    fontSize: 14,
  },
  micText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },

  // Input
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#7eff8a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
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

  // Picker
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pickerText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  pickerArrow: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
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
    fontSize: 15,
    fontWeight: '700',
  },
  continueButton: {
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
  continueButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.9,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(8, 28, 15, 0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '70%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  stateList: {
    maxHeight: 350,
  },
  stateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  stateItemActive: {
    backgroundColor: 'rgba(126, 255, 138, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(126, 255, 138, 0.3)',
  },
  stateItemText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  stateItemTextActive: {
    color: '#7eff8a',
  },
  checkMark: {
    color: '#7eff8a',
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  modalCloseText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '700',
  },
});
