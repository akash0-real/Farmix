import { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import PreLoginScreen from './src/screens/PreLoginScreen';

type Screen = 'preLogin' | 'login';

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
        ) : (
          <LoginScreen
            selectedLanguage={selectedLanguage}
            onSelectLanguage={setSelectedLanguage}
            onBack={() => setScreen('preLogin')}
          />
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
