import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const farmImage =
  'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80';

export default function PreLoginScreen({ onGetStarted, onHaveAccount }) {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>F</Text>
          </View>
          <Text style={styles.brandText}>Farmix</Text>
        </View>
        <View style={styles.helpBadge}>
          <Text style={styles.helpText}>?</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <Image source={{ uri: farmImage }} style={styles.heroImage} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Voice Guided Assistant</Text>
        </View>
      </View>

      <Text style={styles.title}>Welcome to Farmix</Text>
      <Text style={styles.subtitle}>
        Your voice-powered farm assistant.{"\n"}
        <Text style={styles.greenText}>No typing needed.</Text> Just talk to your farm.
      </Text>

      <Pressable style={styles.primaryButton} onPress={onGetStarted}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={onHaveAccount}>
        <Text style={styles.secondaryButtonText}>I already have an account</Text>
      </Pressable>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>English</Text>
        <Text style={styles.metaText}>Audio Help</Text>
      </View>

      <Text style={styles.trustedText}>TRUSTED BY 10K+ FARMERS</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f3f5f4',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  headerRow: {
    marginTop: 8,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#2d8a3f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  brandText: {
    fontSize: 27,
    color: '#1a223d',
    fontWeight: '800',
  },
  helpBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#75829b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 7,
  },
  heroImage: {
    width: '100%',
    height: 300,
  },
  badge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 68, 64, 0.82)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#1a223d',
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#576577',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 22,
  },
  greenText: {
    color: '#2d8a3f',
    fontWeight: '800',
  },
  primaryButton: {
    backgroundColor: '#2f8d41',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#dce5dd',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 18,
  },
  secondaryButtonText: {
    color: '#2f8d41',
    fontSize: 20,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaText: {
    color: '#8290a4',
    fontSize: 16,
    fontWeight: '600',
  },
  trustedText: {
    color: '#a2a8b2',
    letterSpacing: 2,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
  },
});
