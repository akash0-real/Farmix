import AsyncStorage from '@react-native-async-storage/async-storage';

const LESSONS_KEY = '@farmix_community_lessons_v1';

const DEFAULT_LESSONS = [
  {
    id: 'lesson-default-1',
    authorId: 'demo-ramesh',
    farmerName: 'Ramesh',
    crop: 'wheat',
    locationName: 'Nashik, Maharashtra',
    problem: 'Leaves were turning yellow after 20 days.',
    tried: 'I reduced flooding and switched to alternate-day irrigation.',
    worked: 'Yellowing stopped in 5 days and growth recovered.',
    helpfulCount: 7,
    verifiedOutcome: true,
    createdAt: '2026-04-01T08:00:00.000Z',
  },
  {
    id: 'lesson-default-2',
    authorId: 'demo-sita',
    farmerName: 'Sita',
    crop: 'rice',
    locationName: 'Raipur, Chhattisgarh',
    problem: 'Brown spots appeared quickly after humid weather.',
    tried: 'Removed affected leaves and improved field airflow.',
    worked: 'Spread slowed down and new leaves remained healthy.',
    helpfulCount: 4,
    verifiedOutcome: true,
    createdAt: '2026-04-02T11:30:00.000Z',
  },
];

function sortByNewest(items) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

async function readLessons() {
  try {
    const raw = await AsyncStorage.getItem(LESSONS_KEY);
    if (!raw) {
      await AsyncStorage.setItem(LESSONS_KEY, JSON.stringify(DEFAULT_LESSONS));
      return sortByNewest(DEFAULT_LESSONS);
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      await AsyncStorage.setItem(LESSONS_KEY, JSON.stringify(DEFAULT_LESSONS));
      return sortByNewest(DEFAULT_LESSONS);
    }

    return sortByNewest(parsed);
  } catch (error) {
    console.error('Failed to read community lessons:', error);
    return sortByNewest(DEFAULT_LESSONS);
  }
}

async function writeLessons(lessons) {
  try {
    await AsyncStorage.setItem(LESSONS_KEY, JSON.stringify(lessons));
  } catch (error) {
    console.error('Failed to write community lessons:', error);
    throw new Error('Unable to save lesson right now.');
  }
}

export async function getCommunityLessons() {
  return readLessons();
}

export async function postCommunityLesson({
  authorId,
  farmerName,
  crop,
  locationName,
  problem,
  tried,
  worked,
}) {
  const lessons = await readLessons();
  const next = {
    id: `lesson-${Date.now()}`,
    authorId: authorId || 'unknown',
    farmerName: farmerName || 'Farmer',
    crop: crop || 'other',
    locationName: locationName || 'Your area',
    problem,
    tried,
    worked,
    helpfulCount: 0,
    verifiedOutcome: false,
    createdAt: new Date().toISOString(),
  };

  const updated = sortByNewest([next, ...lessons]);
  await writeLessons(updated);
  return next;
}

export async function markLessonHelpful(lessonId) {
  const lessons = await readLessons();
  const updated = lessons.map(lesson =>
    lesson.id === lessonId
      ? { ...lesson, helpfulCount: Number(lesson.helpfulCount || 0) + 1 }
      : lesson
  );

  await writeLessons(updated);
  return sortByNewest(updated);
}

export async function verifyLessonOutcome(lessonId, authorId) {
  const lessons = await readLessons();
  let didVerify = false;

  const updated = lessons.map(lesson => {
    if (lesson.id !== lessonId) return lesson;
    if (lesson.authorId !== authorId) return lesson;
    if (lesson.verifiedOutcome) return lesson;
    didVerify = true;
    return { ...lesson, verifiedOutcome: true };
  });

  if (didVerify) {
    await writeLessons(updated);
  }

  return { lessons: sortByNewest(updated), didVerify };
}
