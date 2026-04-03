import React, { useState, useMemo } from 'react';
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

const farmImage = require('../assests/images/field.jpg');

function SchemeCard({ scheme, selectedLanguage, onApply, onCall }) {
  const [expanded, setExpanded] = useState(false);
  const category = SCHEME_CATEGORIES[scheme.category] || {};

  return (
    <Pressable 
      style={[styles.card, { borderLeftColor: category.color || '#7eff8a' }]}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.schemeIcon}>{scheme.icon}</Text>
        <View style={styles.schemeInfo}>
          <Text style={styles.schemeName}>{scheme.name}</Text>
          <Text style={styles.schemeFullName}>{scheme.fullName}</Text>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: (category.color || '#7eff8a') + '25' }]}>
          <Text style={[styles.categoryText, { color: category.color }]}>{category.label}</Text>
        </View>
      </View>

      <View style={styles.benefitBox}>
        <Text style={styles.benefitLabel}>{t(selectedLanguage, 'schemeBenefit')}</Text>
        <Text style={styles.benefitText}>{scheme.benefit}</Text>
      </View>

      {expanded && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ {t(selectedLanguage, 'schemeEligibility')}</Text>
            {scheme.eligibility.map((item, i) => (
              <Text key={i} style={styles.listItem}>• {item}</Text>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 {t(selectedLanguage, 'schemeDocuments')}</Text>
            <Text style={styles.docsText}>{scheme.documents.join(', ')}</Text>
          </View>

          <View style={styles.actionsRow}>
            <Pressable 
              style={styles.applyBtn}
              onPress={() => onApply(scheme.applyUrl)}
            >
              <Text style={styles.applyText}>🌐 {t(selectedLanguage, 'schemeApplyOnline')}</Text>
            </Pressable>
            <Pressable 
              style={styles.callBtn}
              onPress={() => onCall(scheme.helpline)}
            >
              <Text style={styles.callText}>📞 {scheme.helpline}</Text>
            </Pressable>
          </View>
        </>
      )}

      <Text style={styles.expandHint}>
        {expanded ? '▲ ' + t(selectedLanguage, 'schemeTapLess') : '▼ ' + t(selectedLanguage, 'schemeTapMore')}
      </Text>
    </Pressable>
  );
}

export default function GovtSchemesScreen({ selectedLanguage, onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const filteredSchemes = useMemo(() => {
    let schemes = GOVT_SCHEMES;
    
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
  }, [searchQuery, selectedCategory]);

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
          <View style={styles.header}>
            <Pressable onPress={onBack} style={styles.backBtn}>
              <Text style={styles.backText}>{t(selectedLanguage, 'backArrow')}</Text>
            </Pressable>
            <Text style={styles.title}>🏛️ {t(selectedLanguage, 'govtSchemes')}</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Text style={styles.subtitle}>{t(selectedLanguage, 'govtSchemesSubtitle')}</Text>

          {/* Search Bar */}
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t(selectedLanguage, 'schemeSearch')}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Category Filters */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            <Pressable
              style={[
                styles.categoryChip,
                !selectedCategory && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextActive
              ]}>
                {t(selectedLanguage, 'schemeAll')}
              </Text>
            </Pressable>
            {categories.map(([key, { label, color }]) => (
              <Pressable
                key={key}
                style={[
                  styles.categoryChip,
                  selectedCategory === key && { backgroundColor: color + '30', borderColor: color }
                ]}
                onPress={() => setSelectedCategory(selectedCategory === key ? null : key)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === key && { color }
                ]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Schemes Count */}
          <Text style={styles.countText}>
            {t(selectedLanguage, 'schemeShowing', { count: filteredSchemes.length })}
          </Text>

          {/* Scheme Cards */}
          {filteredSchemes.map(scheme => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              selectedLanguage={selectedLanguage}
              onApply={handleApply}
              onCall={handleCall}
            />
          ))}

          {filteredSchemes.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t(selectedLanguage, 'schemeNoResults')}</Text>
            </View>
          )}

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>💡 {t(selectedLanguage, 'schemeTip')}</Text>
            <Text style={styles.infoText}>{t(selectedLanguage, 'schemeTipText')}</Text>
          </View>
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
    padding: 18,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 4,
  },
  backBtn: {
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
  headerSpacer: {
    width: 66,
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
  },
  categoriesScroll: {
    marginBottom: 12,
  },
  categoriesContent: {
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(126,255,138,0.2)',
    borderColor: '#7eff8a',
  },
  categoryChipText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: '#7eff8a',
  },
  countText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  schemeIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  schemeInfo: {
    flex: 1,
  },
  schemeName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  schemeFullName: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 2,
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
  },
  benefitBox: {
    backgroundColor: 'rgba(126,255,138,0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  benefitLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  benefitText: {
    color: '#7eff8a',
    fontSize: 14,
    fontWeight: '800',
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  listItem: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 20,
  },
  docsText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  applyBtn: {
    flex: 1,
    backgroundColor: '#2f8d41',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  callBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  callText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  expandHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: 'rgba(77,171,247,0.1)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(77,171,247,0.3)',
    marginTop: 8,
  },
  infoTitle: {
    color: '#4dabf7',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  infoText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 18,
  },
});
