import React, { useMemo, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { t } from '../languages/uiText';
import {
  estimateEarnings,
  formatLastActive,
  getNearbyBuyers,
} from '../services/buyerService';

const farmImage = require('../assests/images/field.jpg');

export default function BuyerConnectScreen({ selectedLanguage, onBack }) {
  const { user } = useUser();
  const [quantity, setQuantity] = useState('10');
  const [selectedBuyerId, setSelectedBuyerId] = useState(null);

  const buyers = useMemo(() => getNearbyBuyers(user), [user]);

  const selectedBuyer =
    buyers.find(b => b.id === selectedBuyerId) || buyers[0] || null;

  const earnings = useMemo(() => {
    if (!selectedBuyer) return { gross: 0, transport: 0, net: 0 };
    return estimateEarnings({
      quantityQuintal: quantity,
      pricePerQuintal: selectedBuyer.pricePerQuintal,
      distanceKm: selectedBuyer.distanceKm,
      transportCostPerKm: selectedBuyer.transportCostPerKm,
    });
  }, [quantity, selectedBuyer]);

  const bestBuyer = useMemo(
    () =>
      [...buyers].sort((a, b) => {
        const aNet = estimateEarnings({
          quantityQuintal: quantity,
          pricePerQuintal: a.pricePerQuintal,
          distanceKm: a.distanceKm,
          transportCostPerKm: a.transportCostPerKm,
        }).net;
        const bNet = estimateEarnings({
          quantityQuintal: quantity,
          pricePerQuintal: b.pricePerQuintal,
          distanceKm: b.distanceKm,
          transportCostPerKm: b.transportCostPerKm,
        }).net;
        return bNet - aNet;
      })[0] || null,
    [buyers, quantity]
  );

  return (
    <View style={styles.container}>
      <ImageBackground source={farmImage} style={styles.background} resizeMode="cover">
        <View style={styles.overlayTop} />
        <View style={styles.overlayGradient} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Pressable style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backText}>{t(selectedLanguage, 'backArrow')}</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>🛒 {t(selectedLanguage, 'sellerConnection')}</Text>
          <Text style={styles.subtitle}>{t(selectedLanguage, 'sellerConnectionSubtitle')}</Text>

          <View style={styles.calcCard}>
            <Text style={styles.cardTitle}>{t(selectedLanguage, 'transparentEarnings')}</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={quantity}
              onChangeText={setQuantity}
              placeholder={t(selectedLanguage, 'quantityPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.45)"
            />

            {selectedBuyer ? (
              <>
                <Text style={styles.calcLine}>
                  {t(selectedLanguage, 'selectedBuyer')}: {selectedBuyer.name}
                </Text>
                <Text style={styles.calcLine}>
                  {t(selectedLanguage, 'grossEarning')}: ₹{earnings.gross}
                </Text>
                <Text style={styles.calcLine}>
                  {t(selectedLanguage, 'transportCost')}: ₹{earnings.transport}
                </Text>
                <Text style={styles.netLine}>
                  {t(selectedLanguage, 'netEarning')}: ₹{earnings.net}
                </Text>
              </>
            ) : null}

            {bestBuyer && selectedBuyer && bestBuyer.id !== selectedBuyer.id ? (
              <Text style={styles.tipText}>
                {t(selectedLanguage, 'bestBuyerHint', { buyer: bestBuyer.name })}
              </Text>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>{t(selectedLanguage, 'nearbyBuyers')}</Text>

          {buyers.map((buyer, idx) => {
            const active = (selectedBuyer?.id || buyers[0]?.id) === buyer.id;
            const localEarnings = estimateEarnings({
              quantityQuintal: quantity,
              pricePerQuintal: buyer.pricePerQuintal,
              distanceKm: buyer.distanceKm,
              transportCostPerKm: buyer.transportCostPerKm,
            });

            return (
              <Pressable
                key={buyer.id}
                style={[styles.buyerCard, active && styles.buyerCardActive]}
                onPress={() => setSelectedBuyerId(buyer.id)}
              >
                <View style={styles.buyerTopRow}>
                  <Text style={styles.buyerName}>
                    {idx === 0 ? '🏆 ' : '📍 '}
                    {buyer.name}
                  </Text>
                  <Text style={styles.priceTag}>₹{buyer.pricePerQuintal}/{t(selectedLanguage, 'perQuintal')}</Text>
                </View>

                <Text style={styles.metaLine}>
                  {t(selectedLanguage, 'distance')}: {buyer.distanceKm} km | {t(selectedLanguage, 'rating')}: {buyer.rating}⭐
                </Text>
                <Text style={styles.metaLine}>
                  {t(selectedLanguage, 'successfulDeals')}: {buyer.successfulPurchases} | {t(selectedLanguage, 'lastActive')}: {formatLastActive(buyer.lastActive)}
                </Text>
                <Text style={styles.metaLine}>
                  {t(selectedLanguage, 'paymentMode')}: {buyer.paymentMode}
                </Text>
                <Text style={styles.metaLine}>
                  {t(selectedLanguage, 'pickupWindow')}: {buyer.pickupWindow}
                </Text>
                <Text style={styles.metaLine}>
                  {t(selectedLanguage, 'estimatedNet')}: ₹{localEarnings.net}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1f12',
  },
  background: {
    flex: 1,
    backgroundColor: '#0a1f12',
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 15, 8, 0.88)',
  },
  overlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(5, 20, 10, 0.4)',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  headerRow: {
    marginBottom: 10,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  backText: {
    color: '#dfffe4',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 12,
    color: 'rgba(255,255,255,0.76)',
    fontSize: 14,
    lineHeight: 20,
  },
  calcCard: {
    backgroundColor: 'rgba(255,217,102,0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,217,102,0.32)',
    padding: 12,
    marginBottom: 14,
  },
  cardTitle: {
    color: '#ffe8a6',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    fontSize: 13,
  },
  calcLine: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '700',
  },
  netLine: {
    color: '#d4ffd9',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '900',
  },
  tipText: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  buyerCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 12,
    marginBottom: 10,
  },
  buyerCardActive: {
    borderColor: 'rgba(126,255,138,0.45)',
    backgroundColor: 'rgba(126,255,138,0.12)',
  },
  buyerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  buyerName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    flex: 1,
  },
  priceTag: {
    color: '#d4ffd9',
    fontSize: 12,
    fontWeight: '900',
    backgroundColor: 'rgba(126,255,138,0.18)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaLine: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 18,
    fontWeight: '700',
  },
});
