import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
  getCommunityLessons,
  markLessonHelpful,
  postCommunityLesson,
  verifyLessonOutcome,
} from '../services/communityLessonsService';
import {
  addHelpfulPoints,
  addLessonPoints,
  addVerifiedOutcomePoints,
} from '../services/rewardsService';
import { colors, radii, spacing } from '../theme/theme';

const farmImage = require('../assests/images/field.jpg');

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (error) {
    return '';
  }
}

export default function CommunityLessonsScreen({ selectedLanguage, onBack }) {
  const { user } = useUser();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [problem, setProblem] = useState('');
  const [tried, setTried] = useState('');
  const [worked, setWorked] = useState('');
  const [crop, setCrop] = useState(user.crops?.[0] || '');
  const [locationName, setLocationName] = useState(
    [user.district, user.state].filter(Boolean).join(', ') || ''
  );

  const loadLessons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCommunityLessons();
      setLessons(data || []);
    } catch (error) {
      Alert.alert(t(selectedLanguage, 'errorTitle'), t(selectedLanguage, 'lessonLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const cropLabel = useMemo(() => {
    if (!crop) return '';
    const label = t(selectedLanguage, crop);
    return label === crop ? crop : label;
  }, [crop, selectedLanguage]);

  const handlePost = async () => {
    if (!problem.trim() || !tried.trim() || !worked.trim()) {
      Alert.alert(t(selectedLanguage, 'errorTitle'), t(selectedLanguage, 'lessonValidation'));
      return;
    }

    setSubmitting(true);
    try {
      await postCommunityLesson({
        authorId: user.uid || 'unknown',
        farmerName: user.name || t(selectedLanguage, 'farmerDefaultName'),
        crop: crop || 'other',
        locationName: locationName || t(selectedLanguage, 'yourArea'),
        problem: problem.trim(),
        tried: tried.trim(),
        worked: worked.trim(),
      });
      await addLessonPoints();

      setProblem('');
      setTried('');
      setWorked('');
      Alert.alert(t(selectedLanguage, 'communityLessons'), t(selectedLanguage, 'lessonPostedSuccess'));
      await loadLessons();
    } catch (error) {
      Alert.alert(t(selectedLanguage, 'errorTitle'), error.message || t(selectedLanguage, 'saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async lessonId => {
    try {
      const updated = await markLessonHelpful(lessonId);
      setLessons(updated);
      await addHelpfulPoints();
    } catch (error) {
      Alert.alert(t(selectedLanguage, 'errorTitle'), t(selectedLanguage, 'saveFailed'));
    }
  };

  const handleVerifyOutcome = async lessonId => {
    try {
      const result = await verifyLessonOutcome(lessonId, user.uid || 'unknown');
      setLessons(result.lessons);
      if (result.didVerify) {
        await addVerifiedOutcomePoints();
        Alert.alert(
          t(selectedLanguage, 'communityLessons'),
          t(selectedLanguage, 'lessonVerifiedSuccess')
        );
      }
    } catch (error) {
      Alert.alert(t(selectedLanguage, 'errorTitle'), t(selectedLanguage, 'saveFailed'));
    }
  };

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
            <Text style={styles.title}>🤝 {t(selectedLanguage, 'communityLessons')}</Text>
            <Text style={styles.subtitle}>{t(selectedLanguage, 'communityLessonsSubtitle')}</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{t(selectedLanguage, 'shareYourLesson')}</Text>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>+10 POINTS</Text>
              </View>
            </View>

            <TextInput
              style={styles.input}
              placeholder={t(selectedLanguage, 'lessonCropPlaceholder')}
              placeholderTextColor={colors.faint}
              value={cropLabel}
              onChangeText={value => setCrop(String(value || '').trim().toLowerCase())}
            />

            <TextInput
              style={styles.input}
              placeholder={t(selectedLanguage, 'lessonLocationPlaceholder')}
              placeholderTextColor={colors.faint}
              value={locationName}
              onChangeText={setLocationName}
            />

            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder={t(selectedLanguage, 'lessonProblemPlaceholder')}
              placeholderTextColor={colors.faint}
              value={problem}
              onChangeText={setProblem}
              multiline
            />

            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder={t(selectedLanguage, 'lessonTriedPlaceholder')}
              placeholderTextColor={colors.faint}
              value={tried}
              onChangeText={setTried}
              multiline
            />

            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder={t(selectedLanguage, 'lessonWorkedPlaceholder')}
              placeholderTextColor={colors.faint}
              value={worked}
              onChangeText={setWorked}
              multiline
            />

            <Pressable
              style={({ pressed }) => [
                styles.postBtn,
                submitting && styles.postBtnDisabled,
                pressed && !submitting && { opacity: 0.9 },
              ]}
              onPress={handlePost}
              disabled={submitting}
            >
              <Text style={styles.postBtnText}>
                {submitting ? t(selectedLanguage, 'postingLesson') : t(selectedLanguage, 'postLesson')}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.listHeading}>{t(selectedLanguage, 'recentLessons')}</Text>

          {loading ? (
            <Text style={styles.helperText}>{t(selectedLanguage, 'mandiLoading')}</Text>
          ) : lessons.length === 0 ? (
            <Text style={styles.helperText}>{t(selectedLanguage, 'lessonNoData')}</Text>
          ) : (
            lessons.map(lesson => {
              const isAuthor = user.uid && lesson.authorId === user.uid;

              return (
                <View key={lesson.id} style={styles.lessonCard}>
                  <View style={styles.lessonTopRow}>
                    <View style={styles.authorRow}>
                      <View style={styles.authorAvatar}>
                        <Text style={styles.authorAvatarGlyph}>👨‍🌾</Text>
                      </View>
                      <View>
                        <Text style={styles.lessonFarmer}>{lesson.farmerName}</Text>
                        <Text style={styles.lessonMeta}>
                          📍 {lesson.locationName} · {formatDate(lesson.createdAt)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cropPill}>
                      <Text style={styles.cropPillText}>{t(selectedLanguage, lesson.crop)}</Text>
                    </View>
                  </View>

                  {/* Problem & Solution Blocks */}
                  <View style={styles.lessonBodyBox}>
                    <View style={styles.storyBlock}>
                      <Text style={styles.blockLabel}>PROBLEM FACED</Text>
                      <Text style={styles.blockText}>{lesson.problem}</Text>
                    </View>

                    <View style={styles.storyBlock}>
                      <Text style={styles.blockLabel}>WHAT WAS TRIED</Text>
                      <Text style={styles.blockText}>{lesson.tried}</Text>
                    </View>

                    <View style={[styles.storyBlock, styles.workedBlock]}>
                      <Text style={[styles.blockLabel, { color: colors.emerald }]}>
                        ✓ WHAT WORKED (PROVEN)
                      </Text>
                      <Text style={[styles.blockText, { color: '#ffffff' }]}>{lesson.worked}</Text>
                    </View>
                  </View>

                  {/* Actions & Verification */}
                  <View style={styles.lessonFooterRow}>
                    <Pressable
                      style={({ pressed }) => [styles.helpfulBtn, pressed && { opacity: 0.8 }]}
                      onPress={() => handleHelpful(lesson.id)}
                    >
                      <Text style={styles.helpfulBtnText}>
                        👍 {t(selectedLanguage, 'lessonHelpful')} ({lesson.helpfulCount || 0})
                      </Text>
                    </Pressable>

                    {lesson.verifiedByAuthor ? (
                      <View style={styles.verifiedOutcomeBadge}>
                        <Text style={styles.verifiedOutcomeText}>
                          ✓ {t(selectedLanguage, 'outcomeVerified')}
                        </Text>
                      </View>
                    ) : isAuthor ? (
                      <Pressable
                        style={({ pressed }) => [styles.verifyBtn, pressed && { opacity: 0.8 }]}
                        onPress={() => handleVerifyOutcome(lesson.id)}
                      >
                        <Text style={styles.verifyBtnText}>
                          ⭐ {t(selectedLanguage, 'verifyOutcome')}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
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
    fontSize: 13,
    color: colors.muted,
  },

  // Form Card
  formCard: {
    backgroundColor: 'rgba(18, 36, 25, 0.92)',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  pointsBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  pointsText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gold,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  multilineInput: {
    minHeight: 52,
    textAlignVertical: 'top',
  },
  postBtn: {
    backgroundColor: '#1b6334',
    borderRadius: radii.full,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  postBtnDisabled: {
    opacity: 0.5,
  },
  postBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  // Lessons Feed
  listHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  helperText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 20,
  },
  lessonCard: {
    backgroundColor: 'rgba(18, 36, 25, 0.85)',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  lessonTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  authorAvatarGlyph: {
    fontSize: 16,
  },
  lessonFarmer: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  lessonMeta: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  cropPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cropPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.emerald,
    textTransform: 'uppercase',
  },
  lessonBodyBox: {
    gap: 8,
    marginBottom: spacing.md,
  },
  storyBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radii.md,
    padding: 10,
  },
  workedBlock: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  blockLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.faint,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  blockText: {
    fontSize: 13,
    color: colors.inkSecondary,
    lineHeight: 18,
  },
  lessonFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  helpfulBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  helpfulBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkSecondary,
  },
  verifiedOutcomeBadge: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  verifiedOutcomeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.emerald,
    letterSpacing: 0.4,
  },
  verifyBtn: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  verifyBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.gold,
  },
});
