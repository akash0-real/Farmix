import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const COLORS = {
  low: '#4aa85b',
  medium: '#d49f2d',
  high: '#d34c3d',
};

export default function SeverityIndicator({ level = 'low' }) {
  const normalizedLevel = COLORS[level] ? level : 'low';

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: COLORS[normalizedLevel] }]} />
      <Text style={styles.text}>{normalizedLevel.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a223d',
  },
});
