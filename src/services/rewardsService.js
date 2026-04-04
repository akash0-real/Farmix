/**
 * Rewards Service - Gamification system for community engagement
 * Points model:
 * - +10 for posting a lesson
 * - +5 when your content is marked helpful
 * - +20 for posting verified outcome update
 * - +2 for confirming community alerts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const REWARDS_KEY = '@farmix_rewards';

// Badge thresholds
export const BADGE_LEVELS = {
  NONE: { min: 0, name: 'Beginner', nameHi: 'शुरुआती', icon: '🌱' },
  HELPER: { min: 25, name: 'Helper', nameHi: 'सहायक', icon: '🤝' },
  GUIDE: { min: 75, name: 'Guide', nameHi: 'मार्गदर्शक', icon: '🧭' },
  CHAMPION: { min: 150, name: 'Community Champion', nameHi: 'समुदाय चैंपियन', icon: '🏆' },
};

// Points values
export const POINTS = {
  POST_LESSON: 10,
  MARKED_HELPFUL: 5,
  VERIFIED_UPDATE: 20,
  CONFIRM_ALERT: 2,
};

/**
 * Get user's current rewards data
 */
export async function getRewards() {
  try {
    const data = await AsyncStorage.getItem(REWARDS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return {
      points: 0,
      lessonsPosted: 0,
      helpfulReceived: 0,
      verifiedOutcomes: 0,
      alertsConfirmed: 0,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error('Error getting rewards:', error);
    return { points: 0, lessonsPosted: 0, helpfulReceived: 0, verifiedOutcomes: 0, alertsConfirmed: 0 };
  }
}

/**
 * Save rewards data
 */
async function saveRewards(rewards) {
  try {
    rewards.lastUpdated = Date.now();
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(rewards));
    return rewards;
  } catch (error) {
    console.error('Error saving rewards:', error);
    return rewards;
  }
}

/**
 * Add points for posting a lesson
 */
export async function addLessonPoints() {
  const rewards = await getRewards();
  rewards.points += POINTS.POST_LESSON;
  rewards.lessonsPosted += 1;
  return saveRewards(rewards);
}

/**
 * Add points when content is marked helpful
 */
export async function addHelpfulPoints() {
  const rewards = await getRewards();
  rewards.points += POINTS.MARKED_HELPFUL;
  rewards.helpfulReceived += 1;
  return saveRewards(rewards);
}

/**
 * Add points when farmer posts verified outcome
 */
export async function addVerifiedOutcomePoints() {
  const rewards = await getRewards();
  rewards.points += POINTS.VERIFIED_UPDATE;
  rewards.verifiedOutcomes = Number(rewards.verifiedOutcomes || 0) + 1;
  return saveRewards(rewards);
}

/**
 * Add points for confirming an alert
 */
export async function addAlertConfirmPoints() {
  const rewards = await getRewards();
  rewards.points += POINTS.CONFIRM_ALERT;
  rewards.alertsConfirmed += 1;
  return saveRewards(rewards);
}

/**
 * Get current badge based on points
 */
export function getCurrentBadge(points) {
  if (points >= BADGE_LEVELS.CHAMPION.min) return BADGE_LEVELS.CHAMPION;
  if (points >= BADGE_LEVELS.GUIDE.min) return BADGE_LEVELS.GUIDE;
  if (points >= BADGE_LEVELS.HELPER.min) return BADGE_LEVELS.HELPER;
  return BADGE_LEVELS.NONE;
}

/**
 * Get next badge and points needed
 */
export function getNextBadge(points) {
  if (points >= BADGE_LEVELS.CHAMPION.min) return null; // Max level
  if (points >= BADGE_LEVELS.GUIDE.min) {
    return { badge: BADGE_LEVELS.CHAMPION, pointsNeeded: BADGE_LEVELS.CHAMPION.min - points };
  }
  if (points >= BADGE_LEVELS.HELPER.min) {
    return { badge: BADGE_LEVELS.GUIDE, pointsNeeded: BADGE_LEVELS.GUIDE.min - points };
  }
  return { badge: BADGE_LEVELS.HELPER, pointsNeeded: BADGE_LEVELS.HELPER.min - points };
}

/**
 * Format badge for display
 */
export function formatBadge(badge, language = 'English') {
  const name = language === 'Hindi' ? badge.nameHi : badge.name;
  return `${badge.icon} ${name}`;
}
