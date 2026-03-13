import { useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import PreLoginScreen from './src/screens/PreLoginScreen';
import AppNavigator from './src/navigation/AppNavigator';

type Screen = 'preLogin' | 'login' | 'app';

function App() {
  const [screen, setScreen] = useState<Screen>('preLogin');
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f5f4" />
      <SafeAreaView style={styles.safeArea}>
        {screen === 'preLogin' ? (
          <PreLoginScreen
            onGetStarted={() => setScreen('login')}
            onHaveAccount={() => setScreen('login')}
          />
        ) : screen === 'login' ? (
          <LoginScreen
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            onBack={() => setScreen('preLogin')}
            onLoginSuccess={() => setScreen('app')}
          />
        ) : (
          <AppNavigator selectedLanguage={selectedLanguage} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f5f4',
  },
});

export default App;
