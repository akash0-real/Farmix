import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, spacing } from '../theme/theme';

export default function PillarCard({ title, description, onPress }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  description: {
    marginTop: 6,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
});
