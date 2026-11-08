import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../theme/theme';

export default function PriceTable({ rows = [] }) {
  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.headerCell]}>Crop</Text>
        <Text style={[styles.cell, styles.headerCell]}>Price</Text>
      </View>
      {rows.map(item => (
        <View style={styles.dataRow} key={item.crop}>
          <Text style={styles.cell}>{item.crop}</Text>
          <Text style={[styles.cell, styles.priceCell]}>{item.price}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  dataRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
  cell: {
    flex: 1,
    padding: 12,
    color: colors.inkSecondary,
    fontSize: 13,
  },
  headerCell: {
    fontWeight: '800',
    color: colors.emerald,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceCell: {
    color: colors.gold,
    fontWeight: '700',
  },
});
