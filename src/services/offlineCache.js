/**
 * Offline Cache Service
 * Caches mandi prices, weather, and alerts for offline access
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  MANDI_PRICES: '@farmix_mandi_prices',
  WEATHER: '@farmix_weather',
  ALERTS: '@farmix_alerts',
  LAST_SYNC: '@farmix_last_sync',
};

const CACHE_EXPIRY = {
  MANDI_PRICES: 6 * 60 * 60 * 1000, // 6 hours
  WEATHER: 1 * 60 * 60 * 1000, // 1 hour
  ALERTS: 30 * 60 * 1000, // 30 minutes
};

/**
 * Save data to cache with timestamp
 */
export async function cacheData(key, data) {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
    return true;
  } catch (error) {
    console.warn('Cache save failed:', error);
    return false;
  }
}

/**
 * Get cached data if not expired
 */
export async function getCachedData(key, maxAge) {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > maxAge) {
      return { data, isStale: true, age };
    }

    return { data, isStale: false, age };
  } catch (error) {
    console.warn('Cache read failed:', error);
    return null;
  }
}

/**
 * Cache mandi prices
 */
export async function cacheMandiPrices(prices) {
  return cacheData(CACHE_KEYS.MANDI_PRICES, prices);
}

/**
 * Get cached mandi prices
 */
export async function getCachedMandiPrices() {
  return getCachedData(CACHE_KEYS.MANDI_PRICES, CACHE_EXPIRY.MANDI_PRICES);
}

/**
 * Cache weather data
 */
export async function cacheWeather(weather) {
  return cacheData(CACHE_KEYS.WEATHER, weather);
}

/**
 * Get cached weather
 */
export async function getCachedWeather() {
  return getCachedData(CACHE_KEYS.WEATHER, CACHE_EXPIRY.WEATHER);
}

/**
 * Cache alerts
 */
export async function cacheAlerts(alerts) {
  return cacheData(CACHE_KEYS.ALERTS, alerts);
}

/**
 * Get cached alerts
 */
export async function getCachedAlerts() {
  return getCachedData(CACHE_KEYS.ALERTS, CACHE_EXPIRY.ALERTS);
}

/**
 * Get last sync info
 */
export async function getLastSyncInfo() {
  try {
    const [mandi, weather, alerts] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEYS.MANDI_PRICES),
      AsyncStorage.getItem(CACHE_KEYS.WEATHER),
      AsyncStorage.getItem(CACHE_KEYS.ALERTS),
    ]);

    const parseTime = (cached) => {
      if (!cached) return null;
      try {
        return JSON.parse(cached).timestamp;
      } catch {
        return null;
      }
    };

    return {
      mandiPrices: parseTime(mandi),
      weather: parseTime(weather),
      alerts: parseTime(alerts),
    };
  } catch (error) {
    return { mandiPrices: null, weather: null, alerts: null };
  }
}

/**
 * Format time ago string
 */
export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Never';

  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

/**
 * Clear all cached data
 */
export async function clearAllCache() {
  try {
    await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
    return true;
  } catch (error) {
    console.warn('Cache clear failed:', error);
    return false;
  }
}

/**
 * Check if device is online (basic check)
 */
export function isOnline() {
  // In React Native, you'd use NetInfo here
  // For now, return true and let fetch failures trigger offline mode
  return true;
}

/**
 * Get cache size estimate
 */
export async function getCacheSize() {
  try {
    const keys = Object.values(CACHE_KEYS);
    const items = await AsyncStorage.multiGet(keys);
    let totalSize = 0;
    items.forEach(([, value]) => {
      if (value) totalSize += value.length;
    });
    return totalSize;
  } catch {
    return 0;
  }
}
