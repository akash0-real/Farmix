import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MandiPriceCard({ item, selectedLanguage, t }) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.crop}>{item.crop}</Text>
        <View style={styles.modalPill}>
          <Text style={styles.modalText}>
            {t(selectedLanguage, 'mandiModalPrice')}: ₹{Math.round(item.modalPrice)}
          </Text>
        </View>
      </View>

      <Text style={styles.meta}>
        {t(selectedLanguage, 'mandiMarket')}: {item.market}
      </Text>
      <Text style={styles.meta}>
        {t(selectedLanguage, 'mandiDistrict')}: {item.district}, {item.state}
      </Text>

      <View style={styles.bottomRow}>
        <Text style={styles.value}>
          {t(selectedLanguage, 'mandiMinPrice')}: ₹{Math.round(item.minPrice)}
        </Text>
        <Text style={styles.value}>
          {t(selectedLanguage, 'mandiMaxPrice')}: ₹{Math.round(item.maxPrice)}
        </Text>
        <Text style={styles.unit}>{item.unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  crop: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  modalPill: {
    backgroundColor: 'rgba(126,255,138,0.15)',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  modalText: {
    color: '#dfffe4',
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    marginBottom: 3,
    fontWeight: '600',
  },
  bottomRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  value: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.09)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  unit: {
    color: '#ffd966',
    fontSize: 11,
    fontWeight: '800',
  },
});

