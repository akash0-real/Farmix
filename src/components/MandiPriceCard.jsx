import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme/theme';

export default function MandiPriceCard({ item, selectedLanguage, t }) {
  const modalPrice = Math.round(item.modalPrice || 0);
  const minPrice = Math.round(item.minPrice || 0);
  const maxPrice = Math.round(item.maxPrice || 0);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.cropInfo}>
          <Text style={styles.crop}>{item.crop}</Text>
          <Text style={styles.location}>
            {item.market} · {item.district}
          </Text>
        </View>
        <View style={styles.modalPill}>
          <Text style={styles.modalLabel}>{t(selectedLanguage, 'mandiModalPrice')}</Text>
          <Text style={styles.modalPrice}>₹{modalPrice.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.rangeItem}>
          <Text style={styles.rangeLabel}>{t(selectedLanguage, 'mandiMinPrice')}</Text>
          <Text style={styles.rangeValue}>₹{minPrice.toLocaleString()}</Text>
        </View>

        <View style={styles.rangeIndicator}>
          <View style={styles.rangeTrack}>
            <View style={styles.rangeFill} />
          </View>
        </View>

        <View style={styles.rangeItem}>
          <Text style={styles.rangeLabel}>{t(selectedLanguage, 'mandiMaxPrice')}</Text>
          <Text style={styles.rangeValue}>₹{maxPrice.toLocaleString()}</Text>
        </View>

        <View style={styles.unitBadge}>
          <Text style={styles.unitText}>{item.unit || 'Quintal'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cropInfo: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  crop: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  location: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 3,
  },
  modalPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  modalLabel: {
    color: colors.emerald,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  modalPrice: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rangeItem: {
    alignItems: 'flex-start',
  },
  rangeLabel: {
    color: colors.faint,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  rangeValue: {
    color: colors.inkSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  rangeIndicator: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  rangeTrack: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  rangeFill: {
    height: '100%',
    width: '60%',
    backgroundColor: colors.emerald,
    borderRadius: 2,
  },
  unitBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  unitText: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
