import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme/theme';

export default function AlertBadge({ text = 'Alert', type = 'info' }) {
  const isCritical = type === 'critical' || type === 'high';
  const isModerate = type === 'moderate' || type === 'medium';

  const badgeStyle = isCritical
    ? styles.critical
    : isModerate
    ? styles.moderate
    : styles.info;

  const textStyle = isCritical
    ? styles.criticalText
    : isModerate
    ? styles.moderateText
    : styles.infoText;

  return (
    <View style={[styles.badge, badgeStyle]}>
      <View style={[styles.dot, isCritical ? styles.criticalDot : isModerate ? styles.moderateDot : styles.infoDot]} />
      <Text style={[styles.text, textStyle]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  info: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderColor: 'rgba(52, 211, 153, 0.28)',
  },
  infoDot: {
    backgroundColor: colors.emerald,
  },
  infoText: {
    color: colors.emerald,
  },
  moderate: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  moderateDot: {
    backgroundColor: colors.gold,
  },
  moderateText: {
    color: colors.gold,
  },
  critical: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  criticalDot: {
    backgroundColor: colors.coral,
  },
  criticalText: {
    color: colors.coral,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
