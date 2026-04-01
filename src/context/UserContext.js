import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getUserProfile,
  saveUserProfile,
  completeOnboarding,
  checkUserExists,
  getCurrentUserUid,
  onAuthStateChanged,
} from '../services/firebaseService';

const UserContext = createContext(null);

const DEFAULT_USER_STATE = {
  // Auth info
  uid: null,
  phoneNumber: null,

  // Profile info (collected during onboarding)
  name: '',
  village: '',
  district: '',
  state: '',
  farmSize: '',
  farmType: '', // 'irrigated' | 'rainfed' | 'mixed'
  crops: [],
  language: 'English',

  // Onboarding state
  onboardingCompleted: false,

  // Loading states
  isLoading: true,
  isAuthenticated: false,
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(DEFAULT_USER_STATE);
  const [onboardingData, setOnboardingData] = useState({
    name: '',
    village: '',
    district: '',
    state: '',
    farmSize: '',
    farmType: '',
    crops: [],
  });

  // Listen for auth state changes
  useEffect(() => {
    let isMounted = true;
    
    const unsubscribe = onAuthStateChanged(async (authUser) => {
      if (!isMounted) return;
      
      if (authUser) {
        // User is signed in
        setUser(prev => ({
          ...prev,
          uid: authUser.uid,
          phoneNumber: authUser.phoneNumber,
          isAuthenticated: true,
          isLoading: true,
        }));

        // Load profile from local storage
        try {
          const profile = await getUserProfile(authUser.uid);
          if (!isMounted) return;
          
          if (profile) {
            setUser(prev => ({
              ...prev,
              ...profile,
              isLoading: false,
            }));
          } else {
            setUser(prev => ({
              ...prev,
              isLoading: false,
              onboardingCompleted: false,
            }));
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
          if (isMounted) {
            setUser(prev => ({
              ...prev,
              isLoading: false,
            }));
          }
        }
      } else {
        // User is signed out
        setUser({
          ...DEFAULT_USER_STATE,
          isLoading: false,
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Update onboarding data (used during onboarding flow)
  const updateOnboardingData = (data) => {
    setOnboardingData(prev => ({
      ...prev,
      ...data,
    }));
  };

  // Complete onboarding and save to Firestore
  const finishOnboarding = async (finalData) => {
    const uid = user.uid;
    if (!uid) {
      throw new Error('User not authenticated');
    }

    const profileData = {
      ...onboardingData,
      ...finalData,
      phoneNumber: user.phoneNumber,
    };

    await completeOnboarding(uid, profileData);

    setUser(prev => ({
      ...prev,
      ...profileData,
      onboardingCompleted: true,
    }));

    // Clear onboarding data
    setOnboardingData({
      name: '',
      village: '',
      district: '',
      state: '',
      farmSize: '',
      farmType: '',
      crops: [],
    });
  };

  // Update user profile
  const updateProfile = async (data) => {
    const uid = user.uid;
    if (!uid) {
      throw new Error('User not authenticated');
    }

    await saveUserProfile(uid, data);

    setUser(prev => ({
      ...prev,
      ...data,
    }));
  };

  // Update language preference
  const setLanguage = async (language) => {
    setUser(prev => ({
      ...prev,
      language,
    }));

    if (user.uid) {
      try {
        await saveUserProfile(user.uid, { language });
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  };

  // Check if user needs onboarding
  const needsOnboarding = () => {
    return user.isAuthenticated && !user.onboardingCompleted && !user.isLoading;
  };

  // Reset user state (for sign out)
  const resetUser = () => {
    setUser(DEFAULT_USER_STATE);
    setOnboardingData({
      name: '',
      village: '',
      district: '',
      state: '',
      farmSize: '',
      farmType: '',
      crops: [],
    });
  };

  const value = {
    user,
    onboardingData,
    updateOnboardingData,
    finishOnboarding,
    updateProfile,
    setLanguage,
    needsOnboarding,
    resetUser,
    isLoading: user.isLoading,
    isAuthenticated: user.isAuthenticated,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default UserContext;
