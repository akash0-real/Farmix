import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/theme';

export default function SplashScreen() {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnim, opacityAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glowRing, { opacity: glowAnim }]} />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoBadge}>
          <Text style={styles.logoGlyph}>🌿</Text>
        </View>
        <Text style={styles.title}>FARMIX</Text>
        <View style={styles.pillTag}>
          <View style={styles.liveDot} />
          <Text style={styles.subtitle}>AI AGRICULTURAL ASSISTANT</Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>FOR THE INDIAN FARMER</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.ground,
  },
  glowRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  content: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: 'rgba(20, 42, 28, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    shadowColor: colors.emerald,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoGlyph: {
    fontSize: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  pillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emerald,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.inkSecondary,
    letterSpacing: 1.2,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.faint,
    letterSpacing: 1.5,
  },
});
