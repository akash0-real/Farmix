import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function PillarCard({ title, description, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d9e1dc',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a223d',
  },
  description: {
    marginTop: 6,
    fontSize: 14,
    color: '#576577',
  },
});
