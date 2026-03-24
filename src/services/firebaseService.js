import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const USERS_COLLECTION = 'users';

/**
 * Get the current authenticated user's UID
 * @returns {string|null} User UID or null if not authenticated
 */
export function getCurrentUserUid() {
  const currentUser = auth().currentUser;
  return currentUser ? currentUser.uid : null;
}

/**
 * Get the current authenticated user's phone number
 * @returns {string|null} Phone number or null if not authenticated
 */
export function getCurrentUserPhone() {
  const currentUser = auth().currentUser;
  return currentUser ? currentUser.phoneNumber : null;
}

/**
 * Check if a user profile exists in Firestore
 * @param {string} uid - User's Firebase Auth UID
 * @returns {Promise<boolean>} True if profile exists
 */
export async function checkUserExists(uid) {
  try {
    const doc = await firestore().collection(USERS_COLLECTION).doc(uid).get();
    return doc.exists && doc.data()?.onboardingCompleted === true;
  } catch (error) {
    console.error('Error checking user exists:', error);
    return false;
  }
}

/**
 * Get user profile from Firestore
 * @param {string} uid - User's Firebase Auth UID
 * @returns {Promise<Object|null>} User profile or null if not found
 */
export async function getUserProfile(uid) {
  try {
    const doc = await firestore().collection(USERS_COLLECTION).doc(uid).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Failed to load user profile. Please try again.');
  }
}

/**
 * Save or update user profile in Firestore
 * @param {string} uid - User's Firebase Auth UID
 * @param {Object} data - Profile data to save
 * @returns {Promise<void>}
 */
export async function saveUserProfile(uid, data) {
  try {
    await firestore()
      .collection(USERS_COLLECTION)
      .doc(uid)
      .set(
        {
          ...data,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw new Error('Failed to save profile. Please try again.');
  }
}

/**
 * Complete user onboarding - save all profile data
 * @param {string} uid - User's Firebase Auth UID
 * @param {Object} profileData - Complete profile data
 * @returns {Promise<void>}
 */
export async function completeOnboarding(uid, profileData) {
  try {
    await firestore()
      .collection(USERS_COLLECTION)
      .doc(uid)
      .set(
        {
          ...profileData,
          onboardingCompleted: true,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
  } catch (error) {
    console.error('Error completing onboarding:', error);
    throw new Error('Failed to complete setup. Please try again.');
  }
}

/**
 * Send OTP to phone number using Firebase Auth
 * @param {string} phoneNumber - Phone number with country code (e.g., +919876543210)
 * @returns {Promise<Object>} Confirmation object for OTP verification
 */
export async function sendOtp(phoneNumber) {
  try {
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    return confirmation;
  } catch (error) {
    console.error('Error sending OTP:', error);
    if (error.code === 'auth/invalid-phone-number') {
      throw new Error('Invalid phone number. Please check and try again.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please try again later.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error. Please check your connection.');
    }
    throw new Error('Failed to send OTP. Please try again.');
  }
}

/**
 * Verify OTP code
 * @param {Object} confirmation - Confirmation object from sendOtp
 * @param {string} otpCode - 6-digit OTP code
 * @returns {Promise<Object>} User credential
 */
export async function verifyOtp(confirmation, otpCode) {
  try {
    const userCredential = await confirmation.confirm(otpCode);
    return userCredential;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    if (error.code === 'auth/invalid-verification-code') {
      throw new Error('Invalid OTP. Please check and try again.');
    } else if (error.code === 'auth/session-expired') {
      throw new Error('OTP expired. Please request a new one.');
    }
    throw new Error('Failed to verify OTP. Please try again.');
  }
}

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export async function signOut() {
  try {
    await auth().signOut();
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
  return auth().onAuthStateChanged(callback);
}
