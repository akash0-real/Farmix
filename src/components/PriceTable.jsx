import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
          <Text style={styles.cell}>{item.price}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: '#d9e1dc',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#e8f1ea',
  },
  dataRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eef2ef',
  },
  cell: {
    flex: 1,
    padding: 12,
    color: '#1a223d',
  },
  headerCell: {
    fontWeight: '700',
  },
});
