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
  getNearbyBuyers,
} from '../services/buyerService';
import { colors, radii, spacing } from '../theme/theme';

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

          <View style={styles.titleSection}>
            <Text style={styles.title}>🛒 {t(selectedLanguage, 'sellerConnection')}</Text>
            <Text style={styles.subtitle}>{t(selectedLanguage, 'sellerConnectionSubtitle')}</Text>
          </View>

          {/* Transparent Profit Calculator */}
          <View style={styles.calcCard}>
            <View style={styles.calcHeader}>
              <Text style={styles.cardTitle}>📊 {t(selectedLanguage, 'transparentEarnings')}</Text>
              <View style={styles.cropBadge}>
                <Text style={styles.cropBadgeText}>{user.crops?.[0] || 'Produce'}</Text>
              </View>
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.inputPrefix}>QUANTITY (QUINTAL)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={quantity}
                onChangeText={setQuantity}
                placeholder={t(selectedLanguage, 'quantityPlaceholder')}
                placeholderTextColor={colors.faint}
              />
            </View>

            {selectedBuyer ? (
              <View style={styles.calcMetricsBox}>
                <View style={styles.calcLineRow}>
                  <Text style={styles.calcLineLabel}>{t(selectedLanguage, 'selectedBuyer')}</Text>
                  <Text style={styles.calcLineValue}>{selectedBuyer.name}</Text>
                </View>

                <View style={styles.calcLineRow}>
                  <Text style={styles.calcLineLabel}>{t(selectedLanguage, 'grossEarning')}</Text>
                  <Text style={styles.calcLineValue}>₹{earnings.gross.toLocaleString()}</Text>
                </View>

                <View style={styles.calcLineRow}>
                  <Text style={styles.calcLineLabel}>{t(selectedLanguage, 'transportCost')}</Text>
                  <Text style={[styles.calcLineValue, { color: colors.coral }]}>
                    - ₹{earnings.transport.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.netProfitRow}>
                  <View>
                    <Text style={styles.netProfitLabel}>FINAL NET IN-HAND</Text>
                    <Text style={styles.netEarningValue}>₹{earnings.net.toLocaleString()}</Text>
                  </View>
                  <View style={styles.verifiedDealBadge}>
                    <Text style={styles.verifiedDealText}>PROFIT OPTIMIZED</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {bestBuyer && selectedBuyer && bestBuyer.id !== selectedBuyer.id ? (
              <View style={styles.recommendationBox}>
                <Text style={styles.tipText}>
                  💡 {t(selectedLanguage, 'bestBuyerHint', { buyer: bestBuyer.name })}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.sectionTitle}>{t(selectedLanguage, 'nearbyBuyers')}</Text>

          {/* Buyer Cards */}
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
                style={({ pressed }) => [
                  styles.buyerCard,
                  active && styles.buyerCardActive,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={() => setSelectedBuyerId(buyer.id)}
              >
                <View style={styles.buyerTopRow}>
                  <View style={styles.buyerNameWrap}>
                    <Text style={styles.buyerName}>
                      {idx === 0 ? '🏆 ' : '📍 '}
                      {buyer.name}
                    </Text>
                    <View style={styles.trustBadgeRow}>
                      <Text style={styles.ratingBadge}>★ {buyer.rating}</Text>
                      <Text style={styles.dealCount}>
                        {buyer.successfulPurchases} {t(selectedLanguage, 'successfulDeals')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.pricePill}>
                    <Text style={styles.priceNumber}>₹{buyer.pricePerQuintal}</Text>
                    <Text style={styles.priceUnit}>/{t(selectedLanguage, 'perQuintal')}</Text>
                  </View>
                </View>

                <View style={styles.buyerDetailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t(selectedLanguage, 'distance')}</Text>
                    <Text style={styles.detailValue}>{buyer.distanceKm} km</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t(selectedLanguage, 'paymentMode')}</Text>
                    <Text style={styles.detailValue}>{buyer.paymentMode}</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>{t(selectedLanguage, 'pickupWindow')}</Text>
                    <Text style={styles.detailValue}>{buyer.pickupWindow}</Text>
                  </View>
                </View>

                <View style={styles.cardFooterNet}>
                  <Text style={styles.estNetLabel}>{t(selectedLanguage, 'estimatedNet')}:</Text>
                  <Text style={styles.estNetValue}>₹{localEarnings.net.toLocaleString()}</Text>
                </View>
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
    backgroundColor: colors.ground,
  },
  background: {
    flex: 1,
    backgroundColor: '#07130a',
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 14, 8, 0.88)',
  },
  overlayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(5, 18, 9, 0.6)',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: 60,
  },
  headerRow: {
    marginBottom: spacing.md,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  backText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  titleSection: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },

  // Calculator Card
  calcCard: {
    backgroundColor: 'rgba(18, 36, 25, 0.92)',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  calcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  cropBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  cropBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.emerald,
    textTransform: 'uppercase',
  },
  inputWrap: {
    marginBottom: spacing.md,
  },
  inputPrefix: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  calcMetricsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radii.md,
    padding: 12,
  },
  calcLineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  calcLineLabel: {
    fontSize: 12,
    color: colors.muted,
  },
  calcLineValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 8,
  },
  netProfitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  netProfitLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.emerald,
    letterSpacing: 0.8,
  },
  netEarningValue: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.emerald,
    letterSpacing: -0.4,
  },
  verifiedDealBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  verifiedDealText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.emerald,
    letterSpacing: 0.5,
  },
  recommendationBox: {
    marginTop: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: radii.md,
    padding: 10,
  },
  tipText: {
    fontSize: 11,
    color: colors.gold,
    lineHeight: 16,
    fontWeight: '600',
  },

  // Buyers Section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  buyerCard: {
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  buyerCardActive: {
    borderColor: colors.emerald,
    borderWidth: 1.5,
    backgroundColor: 'rgba(20, 42, 29, 0.95)',
  },
  buyerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  buyerNameWrap: {
    flex: 1,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  ratingBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.gold,
  },
  dealCount: {
    fontSize: 11,
    color: colors.muted,
  },
  pricePill: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'flex-end',
  },
  priceNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.gold,
  },
  priceUnit: {
    fontSize: 9,
    color: colors.gold,
    fontWeight: '700',
  },
  buyerDetailsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radii.md,
    padding: 10,
    marginBottom: spacing.md,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 9,
    color: colors.faint,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkSecondary,
    marginTop: 2,
  },
  cardFooterNet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  estNetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
  },
  estNetValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.emerald,
  },
});
