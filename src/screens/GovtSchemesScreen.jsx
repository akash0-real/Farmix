import React, { useEffect, useMemo, useState } from 'react';
import {
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GOVT_SCHEMES, SCHEME_CATEGORIES } from '../services/govtSchemes';
import { t } from '../languages/uiText';
import { translateGovtSchemes } from '../services/translationService';
import { colors, radii, spacing } from '../theme/theme';

const farmImage = require('../assests/images/field.jpg');

function SchemeCard({ scheme, selectedLanguage, categoryLabel, onApply, onCall }) {
  const [expanded, setExpanded] = useState(false);
  const category = SCHEME_CATEGORIES[scheme.category] || {};

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { borderLeftColor: category.color || colors.emerald },
        pressed && { opacity: 0.95 },
      ]}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.schemeIconBox}>
          <Text style={styles.schemeIcon}>{scheme.icon}</Text>
        </View>
        <View style={styles.schemeInfo}>
          <Text style={styles.schemeName}>{scheme.name}</Text>
          <Text style={styles.schemeFullName}>{scheme.fullName}</Text>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: (category.color || colors.emerald) + '18' }]}>
          <Text style={[styles.categoryText, { color: category.color || colors.emerald }]}>
            {categoryLabel}
          </Text>
        </View>
      </View>

      <View style={styles.benefitBox}>
        <Text style={styles.benefitLabel}>{t(selectedLanguage, 'schemeBenefit')}</Text>
        <Text style={styles.benefitText}>{scheme.benefit}</Text>
      </View>

      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ {t(selectedLanguage, 'schemeEligibility')}</Text>
            {scheme.eligibility.map((item, i) => (
              <View key={i} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.listItem}>{item}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 {t(selectedLanguage, 'schemeDocuments')}</Text>
            <Text style={styles.docsText}>{scheme.documents.join(', ')}</Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [styles.applyBtn, pressed && { opacity: 0.85 }]}
              onPress={() => onApply(scheme.applyUrl)}
            >
              <Text style={styles.applyText}>🌐 {t(selectedLanguage, 'schemeApplyOnline')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.85 }]}
              onPress={() => onCall(scheme.helpline)}
            >
              <Text style={styles.callText}>📞 {scheme.helpline}</Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={styles.expandRow}>
        <Text style={styles.expandHint}>
          {expanded ? '▲ ' + t(selectedLanguage, 'schemeTapLess') : '▼ ' + t(selectedLanguage, 'schemeTapMore')}
        </Text>
      </View>
    </Pressable>
  );
}

export default function GovtSchemesScreen({ selectedLanguage, onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [translatedSchemes, setTranslatedSchemes] = useState(GOVT_SCHEMES);

  useEffect(() => {
    let isMounted = true;

    const translateContent = async () => {
      const localized = await translateGovtSchemes(GOVT_SCHEMES, selectedLanguage);
      if (isMounted) {
        setTranslatedSchemes(localized);
      }
    };

    translateContent();
    return () => {
      isMounted = false;
    };
  }, [selectedLanguage]);

  const filteredSchemes = useMemo(() => {
    let schemes = translatedSchemes;

    if (selectedCategory) {
      schemes = schemes.filter(s => s.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      schemes = schemes.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.fullName.toLowerCase().includes(q) ||
        s.benefit.toLowerCase().includes(q)
      );
    }

    return schemes;
  }, [searchQuery, selectedCategory, translatedSchemes]);

  const handleApply = async (url) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      // Handle error silently
    }
  };

  const handleCall = async (number) => {
    try {
      await Linking.openURL(`tel:${number}`);
    } catch (error) {
      // Handle error silently
    }
  };

  const categories = Object.entries(SCHEME_CATEGORIES);
  const categoryLabelKeyMap = {
    income: 'schemeCategoryIncome',
    insurance: 'schemeCategoryInsurance',
    credit: 'schemeCategoryCredit',
    advisory: 'schemeCategoryAdvisory',
    pension: 'schemeCategoryPension',
    irrigation: 'schemeCategoryIrrigation',
    market: 'schemeCategoryMarket',
    infrastructure: 'schemeCategoryInfrastructure',
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={farmImage} style={styles.background} resizeMode="cover">
        <View style={styles.overlayTop} />
        <View style={styles.overlayGradient} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>{t(selectedLanguage, 'backArrow')}</Text>
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.title}>🏛️ {t(selectedLanguage, 'govtSchemes')}</Text>
              <Text style={styles.subtitle}>{t(selectedLanguage, 'govtSchemesSubtitle')}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t(selectedLanguage, 'schemeSearch')}
              placeholderTextColor={colors.faint}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            <Pressable
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  !selectedCategory && styles.categoryChipTextActive,
                ]}
              >
                {t(selectedLanguage, 'schemeAll')}
              </Text>
            </Pressable>

            {categories.map(([key, cat]) => {
              const labelKey = categoryLabelKeyMap[key] || 'schemeAll';
              const label = t(selectedLanguage, labelKey);
              const isActive = selectedCategory === key;

              return (
                <Pressable
                  key={key}
                  style={[
                    styles.categoryChip,
                    isActive && { backgroundColor: (cat.color || colors.emerald) + '25', borderColor: cat.color },
                  ]}
                  onPress={() => setSelectedCategory(isActive ? null : key)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryChipText,
                      isActive && { color: cat.color || colors.emerald, fontWeight: '800' },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Schemes Count */}
          <View style={styles.countRow}>
            <Text style={styles.countText}>
              {filteredSchemes.length} {t(selectedLanguage, 'govtSchemes')} Available
            </Text>
          </View>

          {/* Schemes List */}
          {filteredSchemes.map((scheme) => {
            const labelKey = categoryLabelKeyMap[scheme.category] || 'schemeAll';
            const categoryLabel = t(selectedLanguage, labelKey);

            return (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                selectedLanguage={selectedLanguage}
                categoryLabel={categoryLabel}
                onApply={handleApply}
                onCall={handleCall}
              />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: 4,
  },
  backBtn: {
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
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  headerSpacer: {
    width: 44,
  },

  // Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    marginBottom: spacing.md,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    paddingVertical: 10,
  },

  // Category Filters
  categoriesScroll: {
    marginBottom: spacing.md,
  },
  categoriesContent: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: radii.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
    borderColor: colors.emerald,
  },
  categoryIcon: {
    fontSize: 12,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkSecondary,
  },
  categoryChipTextActive: {
    color: colors.emerald,
    fontWeight: '800',
  },
  countRow: {
    marginBottom: spacing.md,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Scheme Card
  card: {
    backgroundColor: 'rgba(18, 36, 25, 0.88)',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 4,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: spacing.md,
  },
  schemeIconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schemeIcon: {
    fontSize: 18,
  },
  schemeInfo: {
    flex: 1,
  },
  schemeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  schemeFullName: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  benefitBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radii.md,
    padding: 10,
    marginBottom: 6,
  },
  benefitLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.emerald,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  benefitText: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 18,
  },

  // Expanded
  expandedContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.emerald,
    marginTop: 6,
  },
  listItem: {
    flex: 1,
    fontSize: 12,
    color: colors.inkSecondary,
    lineHeight: 17,
  },
  docsText: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.sm,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: '#1b6334',
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  applyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  callBtn: {
    flex: 1,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  callText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '800',
  },
  expandRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  expandHint: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '700',
  },
});
