import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';

const { height } = Dimensions.get('window');

const farmImage =
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80';

export default function PreLoginScreen({ onGetStarted, onHaveAccount }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: farmImage }}
        style={styles.hero}
        resizeMode="cover"
      >
        {/* Overlays */}
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>F</Text>
            </View>
            <Text style={styles.logoName}>Farmix</Text>
          </View>
          <View style={styles.helpBadge}>
            <Text style={styles.helpText}>?</Text>
          </View>
        </View>

        {/* AI tag top right */}
        <View style={styles.floatingTag}>
          <Text style={styles.floatingTagIcon}>🎤</Text>
          <Text style={styles.floatingTagText}>Voice Guided Assistant</Text>
        </View>

        {/* Hero text — takes remaining space above sheet */}
        <View style={styles.heroCenter}>
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>AI POWERED</Text>
          </View>
          <Text style={styles.heroTitle}>Your Farm,{'\n'}Your Voice.</Text>
          <Text style={styles.heroSub}>
            Speak in your language. Farm smarter.
          </Text>
        </View>

        {/* Glass bottom sheet — fixed height */}
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
              <Text style={styles.trustText}>
                TRUSTED BY 10K+ FARMERS ACROSS INDIA
              </Text>
              <View style={styles.trustDot} />
            </View>

            <Text style={styles.title}>Welcome to Farmix 🌿</Text>

            <Text style={styles.subtitle}>
              No typing needed. <Text style={styles.highlight}>Just talk</Text>{' '}
              to your farm assistant.
            </Text>

            <View style={styles.pillRow}>
              {['🌾 12+ Languages', '📡 Offline Mode', '🤖 Gemini AI'].map(
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
                pressed && { opacity: 0.88 },
              ]}
              onPress={onGetStarted}
            >
              <Text style={styles.primaryButtonText}>Get Started →</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && { opacity: 0.75 },
              ]}
              onPress={onHaveAccount}
            >
              <Text style={styles.secondaryButtonText}>
                I already have an account
              </Text>
            </Pressable>

            <View style={styles.footer}>
              <Text style={styles.footerText}>English</Text>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>Audio Help</Text>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>Privacy</Text>
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
  },
  hero: {
    flex: 1,
    // Fallback background if image fails to load
    backgroundColor: '#0d3320',
  },

  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 20, 10, 0.3)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(5, 25, 12, 0.6)',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  logoRow: {
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
  logoLetter: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  logoName: {
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
  },
  floatingTagIcon: { fontSize: 12 },
  floatingTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Hero center — sits between topbar and glass sheet
  heroCenter: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(45,138,63,0.35)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(150,255,150,0.3)',
    marginBottom: 14,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7eff8a',
  },
  liveText: {
    color: '#7eff8a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 52,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    textAlign: 'center',
  },

  // ── GLASS SHEET ─────────────────────────────────
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
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  trustDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7eff8a',
  },
  trustText: {
    color: '#7eff8a',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 14,
    paddingHorizontal: 10,
  },
  highlight: {
    color: '#7eff8a',
    fontWeight: '800',
  },

  pillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  pillText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
  },

  primaryButton: {
    backgroundColor: '#2f8d41',
    paddingVertical: 15,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#2f8d41',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(150,255,150,0.25)',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '700',
  },

  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  footerText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  footerDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
