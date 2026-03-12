import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const LANGUAGE_OPTIONS = [
  'English',
  'Hindi',
  'Kannada',
  'Tamil',
  'Telugu',
  'More...',
];

export default function LoginScreen({ selectedLanguage, onSelectLanguage, onBack }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
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

      <Text style={styles.voiceTitle}>Just say your name{"\n"}or phone number to begin.</Text>
      <Text style={styles.voiceSubtitle}>No typing required. Just speak naturally.</Text>

      <View style={styles.micOuter}>
        <View style={styles.micInner}>
          <Text style={styles.micText}>Mic</Text>
        </View>
      </View>

      <Pressable style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Speak to Login</Text>
      </Pressable>

      <Text style={styles.sectionLabel}>SELECT LANGUAGE</Text>
      <Text style={styles.selectedLanguageText}>Selected: {selectedLanguage}</Text>

      <View style={styles.languageGrid}>
        {LANGUAGE_OPTIONS.map(language => {
          const isSelected = selectedLanguage === language;
          return (
            <Pressable
              key={language}
              onPress={() => onSelectLanguage(language)}
              style={[styles.languageButton, isSelected && styles.languageButtonActive]}
            >
              <Text
                style={[
                  styles.languageButtonText,
                  isSelected && styles.languageButtonTextActive,
                ]}
              >
                {language}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.orLine} />
      </View>

      <Pressable style={styles.phoneButton}>
        <Text style={styles.phoneButtonText}>Login with Phone Number</Text>
      </Pressable>

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
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 18,
  },
  micOuter: {
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: '#d4dfd7',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  micText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: '#2f8d41',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 18,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  sectionLabel: {
    color: '#5d6880',
    fontSize: 14,
    letterSpacing: 2,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  selectedLanguageText: {
    color: '#5f6b7d',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '600',
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
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  orLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#dbe1e9',
  },
  orText: {
    marginHorizontal: 12,
    color: '#8b96a6',
    fontSize: 14,
    letterSpacing: 2,
    fontWeight: '800',
  },
  phoneButton: {
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#d2d8e0',
    backgroundColor: '#f7f8fa',
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 16,
  },
  phoneButtonText: {
    color: '#2b3953',
    fontSize: 18,
    fontWeight: '800',
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
