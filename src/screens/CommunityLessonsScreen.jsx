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

const farmImage = require('../assests/images/field.jpg');

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
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

          <Text style={styles.title}>🤝 {t(selectedLanguage, 'communityLessons')}</Text>
          <Text style={styles.subtitle}>{t(selectedLanguage, 'communityLessonsSubtitle')}</Text>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{t(selectedLanguage, 'shareYourLesson')}</Text>

            <TextInput
              style={styles.input}
              placeholder={t(selectedLanguage, 'lessonCropPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={cropLabel}
              onChangeText={value => setCrop(String(value || '').trim().toLowerCase())}
            />

            <TextInput
              style={styles.input}
              placeholder={t(selectedLanguage, 'lessonLocationPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={locationName}
              onChangeText={setLocationName}
            />

            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder={t(selectedLanguage, 'lessonProblemPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={problem}
              onChangeText={setProblem}
              multiline
            />

            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder={t(selectedLanguage, 'lessonTriedPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={tried}
              onChangeText={setTried}
              multiline
            />

            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder={t(selectedLanguage, 'lessonWorkedPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={worked}
              onChangeText={setWorked}
              multiline
            />

            <Pressable
              style={[styles.postBtn, submitting && styles.postBtnDisabled]}
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
            lessons.map(lesson => (
              <View key={lesson.id} style={styles.lessonCard}>
                <View style={styles.lessonTopRow}>
                  <Text style={styles.lessonFarmer}>{lesson.farmerName}</Text>
                  <Text style={styles.lessonMeta}>{formatDate(lesson.createdAt)}</Text>
                </View>

                <Text style={styles.lessonTag}>
                  🌾 {t(selectedLanguage, 'lessonCrop')}: {t(selectedLanguage, lesson.crop)}
                </Text>
                <Text style={styles.lessonTag}>
                  📍 {t(selectedLanguage, 'lessonLocation')}: {lesson.locationName}
                </Text>

                <Text style={styles.lessonLabel}>{t(selectedLanguage, 'lessonProblem')}</Text>
                <Text style={styles.lessonValue}>{lesson.problem}</Text>

                <Text style={styles.lessonLabel}>{t(selectedLanguage, 'lessonTried')}</Text>
                <Text style={styles.lessonValue}>{lesson.tried}</Text>

                <Text style={styles.lessonLabel}>{t(selectedLanguage, 'lessonWorked')}</Text>
                <Text style={styles.lessonValue}>{lesson.worked}</Text>

                {lesson.verifiedOutcome ? (
                  <Text style={styles.verifiedText}>✅ {t(selectedLanguage, 'lessonOutcomeVerified')}</Text>
                ) : lesson.authorId === (user.uid || 'unknown') ? (
                  <Pressable
                    style={[styles.helpfulBtn, styles.verifyBtn]}
                    onPress={() => handleVerifyOutcome(lesson.id)}
                  >
                    <Text style={styles.helpfulBtnText}>🧾 {t(selectedLanguage, 'verifyOutcome')}</Text>
                  </Pressable>
                ) : null}

                <Pressable style={styles.helpfulBtn} onPress={() => handleHelpful(lesson.id)}>
                  <Text style={styles.helpfulBtnText}>
                    👍 {t(selectedLanguage, 'lessonHelpful')} ({lesson.helpfulCount || 0})
                  </Text>
                </Pressable>
              </View>
            ))
          )}
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
    paddingBottom: 32,
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
    fontSize: 25,
    color: '#fff',
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.76)',
    fontSize: 14,
    marginBottom: 12,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 14,
  },
  formTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontSize: 13,
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  postBtn: {
    backgroundColor: 'rgba(126,255,138,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(126,255,138,0.35)',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  postBtnDisabled: {
    opacity: 0.7,
  },
  postBtnText: {
    color: '#d4ffd9',
    fontWeight: '800',
    fontSize: 13,
  },
  listHeading: {
    marginTop: 14,
    marginBottom: 8,
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  helperText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  lessonCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    marginBottom: 10,
  },
  lessonTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonFarmer: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  lessonMeta: {
    color: 'rgba(255,255,255,0.58)',
    fontSize: 11,
  },
  lessonTag: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  lessonLabel: {
    marginTop: 7,
    marginBottom: 3,
    color: '#c9ffd0',
    fontWeight: '700',
    fontSize: 12,
  },
  lessonValue: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    lineHeight: 19,
  },
  helpfulBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(126,255,138,0.16)',
    borderColor: 'rgba(126,255,138,0.35)',
    borderWidth: 1,
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  verifyBtn: {
    backgroundColor: 'rgba(102,178,255,0.16)',
    borderColor: 'rgba(102,178,255,0.35)',
    marginBottom: 8,
  },
  helpfulBtnText: {
    color: '#d4ffd9',
    fontWeight: '700',
    fontSize: 12,
  },
  verifiedText: {
    marginTop: 10,
    marginBottom: 6,
    color: '#9fd3ff',
    fontSize: 12,
    fontWeight: '700',
  },
});
