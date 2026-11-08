import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { t } from '../languages/uiText';
import { colors, radii, spacing } from '../theme/theme';

const farmImage = require('../assests/images/field.jpg');

export default function PreLoginScreen({ selectedLanguage, onGetStarted, onHaveAccount }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <ImageBackground source={farmImage} style={styles.hero} resizeMode="cover">
        {/* Cinematic gradient overlays */}
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoGlyph}>🌿</Text>
            </View>
            <View>
              <Text style={styles.logoName}>Farmix</Text>
              <Text style={styles.logoTagline}>AI Agriculture</Text>
            </View>
          </View>

          <View style={styles.floatingTag}>
            <Text style={styles.floatingTagIcon}>🎙️</Text>
            <Text style={styles.floatingTagText}>{t(selectedLanguage, 'voiceGuidedAssistant')}</Text>
          </View>
        </View>

        {/* Hero text */}
        <View style={styles.heroCenter}>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{t(selectedLanguage, 'aiPowered')}</Text>
          </View>
          <Text style={styles.heroTitle}>{t(selectedLanguage, 'heroTitle')}</Text>
          <Text style={styles.heroSub}>{t(selectedLanguage, 'heroSub')}</Text>
        </View>

        {/* Glass bottom sheet */}
        <Animated.View
          style={[
            styles.glassSheet,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.glassInner}>
            <View style={styles.handle} />

            <View style={styles.trustRow}>
              <View style={styles.trustDot} />
              <Text style={styles.trustText}>{t(selectedLanguage, 'trustedBy')}</Text>
              <View style={styles.trustDot} />
            </View>

            <Text style={styles.title}>{t(selectedLanguage, 'welcomeToFarmix')} 🌱</Text>
            <Text style={styles.subtitle}>{t(selectedLanguage, 'noTypingNeeded')}</Text>

            <View style={styles.pillRow}>
              {[t(selectedLanguage, 'pillLanguages'), t(selectedLanguage, 'pillOffline'), t(selectedLanguage, 'pillAI')].map(
                p => (
                  <View key={p} style={styles.pill}>
                    <Text style={styles.pillText}>{p}</Text>
                  </View>
                ),
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              ]}
              onPress={onGetStarted}
            >
              <Text style={styles.primaryButtonText}>{t(selectedLanguage, 'getStarted')}</Text>
              <Text style={styles.buttonArrow}>→</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && { opacity: 0.8 },
              ]}
              onPress={onHaveAccount}
            >
              <Text style={styles.secondaryButtonText}>
                {t(selectedLanguage, 'haveAccount')}
              </Text>
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{selectedLanguage || 'English'}</Text>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>{t(selectedLanguage, 'audioHelp')}</Text>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>{t(selectedLanguage, 'privacy')}</Text>
            </View>
          </View>
        </Animated.View>
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
    backgroundColor: '#0a1d12',
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 14, 8, 0.45)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(4, 14, 8, 0.75)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 18,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlyph: {
    fontSize: 20,
  },
  logoName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  logoTagline: {
    color: colors.emerald,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  floatingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  floatingTagIcon: {
    fontSize: 13,
  },
  floatingTagText: {
    color: colors.inkSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  heroCenter: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingBottom: 28,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    marginBottom: spacing.md,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emerald,
  },
  liveText: {
    color: colors.emerald,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 46,
    letterSpacing: -0.8,
    marginBottom: spacing.sm,
  },
  heroSub: {
    color: colors.inkSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
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
    marginBottom: spacing.lg,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  trustDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.emerald,
  },
  trustText: {
    color: colors.emerald,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.lg,
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pillText: {
    color: colors.inkSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#1b6334',
    paddingVertical: 15,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
    shadowColor: colors.emerald,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  buttonArrow: {
    color: colors.emerald,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 13,
    borderRadius: radii.full,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  secondaryButtonText: {
    color: colors.inkSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  footerText: {
    color: colors.faint,
    fontSize: 11,
    fontWeight: '600',
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});
