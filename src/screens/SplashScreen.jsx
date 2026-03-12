import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Farmix</Text>
      <Text style={styles.subtitle}>Empowering Rural Growth</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f5f4',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a223d',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#576577',
  },
});
