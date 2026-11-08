import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme/theme';

const SEVERITY_CONFIG = {
  low: {
    color: colors.emerald,
    bg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.3)',
  },
  medium: {
    color: colors.gold,
    bg: 'rgba(251, 191, 36, 0.12)',
    border: 'rgba(251, 191, 36, 0.3)',
  },
  moderate: {
    color: colors.gold,
    bg: 'rgba(251, 191, 36, 0.12)',
    border: 'rgba(251, 191, 36, 0.3)',
  },
  high: {
    color: colors.coral,
    bg: 'rgba(248, 113, 113, 0.15)',
    border: 'rgba(248, 113, 113, 0.35)',
  },
  critical: {
    color: colors.coral,
    bg: 'rgba(248, 113, 113, 0.15)',
    border: 'rgba(248, 113, 113, 0.35)',
  },
};

export default function SeverityIndicator({ level = 'low' }) {
  const normalizedLevel = String(level || 'low').toLowerCase();
  const config = SEVERITY_CONFIG[normalizedLevel] || SEVERITY_CONFIG.low;

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      <View style={[styles.pulseDot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>
        {normalizedLevel.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
});
