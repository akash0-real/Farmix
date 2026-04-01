// Firebase backend removed - using mock authentication with hardcoded OTP
// TODO: Re-enable Firebase when ready

let AsyncStorage = null;
const memoryStore = {};

try {
  const asyncStorageModule = require('@react-native-async-storage/async-storage');
  AsyncStorage = asyncStorageModule?.default || asyncStorageModule;
} catch (error) {
  console.warn(
    'AsyncStorage native module is unavailable. Falling back to in-memory storage (data resets on app restart).',
    error?.message || error
  );
}

const storage = AsyncStorage || {
  async getItem(key) {
    return Object.prototype.hasOwnProperty.call(memoryStore, key)
      ? memoryStore[key]
      : null;
  },
  async setItem(key, value) {
    memoryStore[key] = value;
  },
  async removeItem(key) {
    delete memoryStore[key];
  },
};

const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  AUTH_STATE: 'auth_state',
};

// Hardcoded OTP for testing
const HARDCODED_OTP = '547333';

// In-memory auth state
let currentUser = null;
let authStateListeners = [];

/**
 * Get the current authenticated user's UID
 * @returns {string|null} User UID or null if not authenticated
 */
export function getCurrentUserUid() {
  return currentUser ? currentUser.uid : null;
}

/**
 * Get the current authenticated user's phone number
 * @returns {string|null} Phone number or null if not authenticated
 */
export function getCurrentUserPhone() {
  return currentUser ? currentUser.phoneNumber : null;
}

/**
 * Check if a user profile exists
 * @param {string} uid - User's UID
 * @returns {Promise<boolean>} True if profile exists
 */
export async function checkUserExists(uid) {
  try {
    const profile = await storage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (profile) {
      const parsed = JSON.parse(profile);
      return parsed.onboardingCompleted === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking user exists:', error);
    return false;
  }
}

/**
 * Get user profile from local storage
 * @param {string} uid - User's UID
 * @returns {Promise<Object|null>} User profile or null if not found
 */
export async function getUserProfile(uid) {
  try {
    const profile = await storage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (profile) {
      return JSON.parse(profile);
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to load user profile. Please try again.');
  }
}

/**
 * Save or update user profile in local storage
 * @param {string} uid - User's UID
 * @param {Object} data - Profile data to save
 * @returns {Promise<void>}
 */
export async function saveUserProfile(uid, data) {
  try {
    const existing = await storage.getItem(STORAGE_KEYS.USER_PROFILE);
    const existingData = existing ? JSON.parse(existing) : {};
    const updatedProfile = {
      ...existingData,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    await storage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw new Error('Failed to save profile. Please try again.');
  }
}

/**
 * Complete user onboarding - save all profile data
 * @param {string} uid - User's UID
 * @param {Object} profileData - Complete profile data
 * @returns {Promise<void>}
 */
export async function completeOnboarding(uid, profileData) {
  try {
    const profile = {
      ...profileData,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await storage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error completing onboarding:', error);
    throw new Error('Failed to complete setup. Please try again.');
  }
}

/**
 * Send OTP to phone number (mock - always succeeds)
 * @param {string} phoneNumber - Phone number with country code (e.g., +919876543210)
 * @returns {Promise<Object>} Confirmation object for OTP verification
 */
export async function sendOtp(phoneNumber) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return a mock confirmation object
  return {
    phoneNumber,
    verificationId: 'mock-verification-id-' + Date.now(),
  };
}

/**
 * Verify OTP code (checks against hardcoded OTP: 547333)
 * @param {Object} confirmation - Confirmation object from sendOtp
 * @param {string} otpCode - 6-digit OTP code
 * @returns {Promise<Object>} User credential
 */
export async function verifyOtp(confirmation, otpCode) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check against hardcoded OTP
  if (otpCode !== HARDCODED_OTP) {
    throw new Error('Invalid OTP. Please check and try again.');
  }
  
  // Create mock user
  const phoneNumber = confirmation.phoneNumber;
  const uid = 'user-' + phoneNumber.replace(/\D/g, '');
  
  currentUser = {
    uid,
    phoneNumber,
  };
  
  // Save auth state
  await storage.setItem(STORAGE_KEYS.AUTH_STATE, JSON.stringify(currentUser));
  
  // Notify listeners
  authStateListeners.forEach(callback => callback(currentUser));
  
  return { user: currentUser };
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function signOut() {
  try {
    currentUser = null;
    await storage.removeItem(STORAGE_KEYS.AUTH_STATE);
    // Notify listeners
    authStateListeners.forEach(callback => callback(null));
  } catch (error) {
    console.error('Error signing out:', error);
    throw new Error('Failed to sign out. Please try again.');
  }
}

/**
 * Listen for auth state changes
 * @param {Function} callback - Callback function receiving user object
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChanged(callback) {
  let isSubscribed = true;
  authStateListeners.push(callback);
  
  // Check for existing auth state on startup
  storage.getItem(STORAGE_KEYS.AUTH_STATE)
    .then(authState => {
      if (!isSubscribed) return; // Don't call if already unsubscribed
      if (authState) {
        try {
          currentUser = JSON.parse(authState);
          callback(currentUser);
        } catch (e) {
          callback(null);
        }
      } else {
        callback(null);
      }
    })
    .catch(() => {
      if (isSubscribed) {
        callback(null);
      }
    });
  
  // Return unsubscribe function
  return () => {
    isSubscribed = false;
    authStateListeners = authStateListeners.filter(cb => cb !== callback);
  };
}
