import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function AlertBadge({ text = 'Alert', type = 'info' }) {
  const isCritical = type === 'critical';

  return (
    <View style={[styles.badge, isCritical ? styles.critical : styles.info]}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  info: {
    backgroundColor: '#e0f0e4',
  },
  critical: {
    backgroundColor: '#ffe0db',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a223d',
  },
});
