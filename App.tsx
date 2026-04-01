import { useState, useEffect } from 'react';
import { StatusBar, StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import PreLoginScreen from './src/screens/PreLoginScreen';
import AppNavigator from './src/navigation/AppNavigator';
import OnboardingNameScreen from './src/screens/onboarding/OnboardingNameScreen';
import OnboardingLocationScreen from './src/screens/onboarding/OnboardingLocationScreen';
import OnboardingFarmScreen from './src/screens/onboarding/OnboardingFarmScreen';
import { UserProvider, useUser } from './src/context/UserContext';

type Screen = 'preLogin' | 'login' | 'onboarding1' | 'onboarding2' | 'onboarding3' | 'app';

function AppContent() {
  const { user, isLoading, isAuthenticated, setLanguage } = useUser();
  const [screen, setScreen] = useState<Screen>('preLogin');
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  // Handle auth state changes
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        if (user.onboardingCompleted) {
          setScreen('app');
          // Use user's preferred language if available
          if (user.language) {
            setSelectedLanguage(user.language);
          }
        } else {
          setScreen('onboarding1');
        }
      }
    }
  }, [isLoading, isAuthenticated, user.onboardingCompleted, user.language]);

  useEffect(() => {
    if (isAuthenticated && user.language !== selectedLanguage) {
      setLanguage(selectedLanguage);
    }
  }, [isAuthenticated, selectedLanguage, setLanguage, user.language]);

  // Show loading screen while checking auth state
  if (isLoading && isAuthenticated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2f8d41" />
      </View>
    );
  }

  const handleLoginSuccess = () => {
    // After login, the auth state listener in UserContext will
    // automatically update and trigger the useEffect above
    // which will navigate to onboarding or app based on profile status
  };

  const handleOnboardingComplete = () => {
    setScreen('app');
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView style={styles.safeArea}>
        {screen === 'preLogin' ? (
          <PreLoginScreen
            selectedLanguage={selectedLanguage}
            onGetStarted={() => setScreen('login')}
            onHaveAccount={() => setScreen('login')}
          />
        ) : screen === 'login' ? (
          <LoginScreen
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            onBack={() => setScreen('preLogin')}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : screen === 'onboarding1' ? (
          <OnboardingNameScreen
            selectedLanguage={selectedLanguage}
            onNext={() => setScreen('onboarding2')}
          />
        ) : screen === 'onboarding2' ? (
          <OnboardingLocationScreen
            selectedLanguage={selectedLanguage}
            onNext={() => setScreen('onboarding3')}
            onBack={() => setScreen('onboarding1')}
          />
        ) : screen === 'onboarding3' ? (
          <OnboardingFarmScreen
            selectedLanguage={selectedLanguage}
            onComplete={handleOnboardingComplete}
            onBack={() => setScreen('onboarding2')}
          />
        ) : (
          <AppNavigator selectedLanguage={selectedLanguage} />
        )}
      </SafeAreaView>
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d3320',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d3320',
  },
});

export default App;
