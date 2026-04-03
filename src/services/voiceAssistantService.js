import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

let Voice = null;
try {
  // eslint-disable-next-line global-require
  const voiceModule = require('@react-native-voice/voice');
  Voice = voiceModule?.default || voiceModule;
} catch (error) {
  Voice = null;
}

function hasNativeVoiceModule() {
  return Boolean(NativeModules?.Voice);
}

export async function isVoiceRecognitionAvailable() {
  if (!Voice || !hasNativeVoiceModule() || typeof Voice.isAvailable !== 'function') {
    return false;
  }

  try {
    const available = await Voice.isAvailable();
    return Boolean(available);
  } catch (error) {
    return false;
  }
}

const NUMBER_WORDS = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  oh: '0',
  o: '0',
  nil: '0',
  ek: '1',
  do: '2',
  teen: '3',
  char: '4',
  chaar: '4',
  paanch: '5',
  panch: '5',
  cheh: '6',
  chhe: '6',
  saat: '7',
  sat: '7',
  aath: '8',
  ath: '8',
  nau: '9',
};

const DIGIT_CHAR_MAP = {
  '०': '0',
  '१': '1',
  '२': '2',
  '३': '3',
  '४': '4',
  '५': '5',
  '६': '6',
  '७': '7',
  '८': '8',
  '९': '9',
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
  '૦': '0',
  '૧': '1',
  '૨': '2',
  '૩': '3',
  '૪': '4',
  '૫': '5',
  '૬': '6',
  '૭': '7',
  '૮': '8',
  '૯': '9',
};

const LANGUAGE_HINTS = [
  { language: 'Hindi', regex: /[\u0900-\u097F]/ },
  { language: 'Kannada', regex: /[\u0C80-\u0CFF]/ },
  { language: 'Tamil', regex: /[\u0B80-\u0BFF]/ },
  { language: 'Telugu', regex: /[\u0C00-\u0C7F]/ },
  { language: 'Punjabi', regex: /[\u0A00-\u0A7F]/ },
  { language: 'Malayalam', regex: /[\u0D00-\u0D7F]/ },
  { language: 'Marathi', regex: /[\u0900-\u097F]/ },
  { language: 'Bengali', regex: /[\u0980-\u09FF]/ },
  { language: 'Gujarati', regex: /[\u0A80-\u0AFF]/ },
  { language: 'Odia', regex: /[\u0B00-\u0B7F]/ },
  { language: 'Assamese', regex: /[\u0980-\u09FF]/ },
  { language: 'Urdu', regex: /[\u0600-\u06FF]/ },
];

const COMMAND_PATTERNS = {
  cropDoctor: /(crop doctor|scan|disease|doctor|फसल डॉक्टर|ಸ್ಕ್ಯಾನ್|டாக்டர்|డాక్టర్)/i,
  soilAnalysis: /(soil|soil test|soil analysis|मिट्टी|माटी|ಮಣ್ಣು|மண்|నేల)/i,
  mandi: /(mandi|price|market|भाव|मंडी|ಬೆಲೆ|விலை|ధర)/i,
  alerts: /(alert|warning|risk|अलर्ट|चेतावनी|ಎಚ್ಚರಿಕೆ|அலர்ட்|అలర్ట్)/i,
  weather: /(weather|rain|temperature|मौसम|ಹವಾಮಾನ|வானிலை|వాతావరణ)/i,
  govtSchemes: /(scheme|yojana|pm kisan|government|सरकारी योजना|ಯೋಜನೆ|திட்டம்|పథకం)/i,
};

export function normalizeText(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[\s,.-]+/g, ' ')
    .trim();
}

export function detectLanguageFromTranscript(transcript) {
  const text = String(transcript || '');
  if (!text) return null;

  const match = LANGUAGE_HINTS.find(item => item.regex.test(text));
  return match?.language || null;
}

export function extractDigitsFromSpeech(transcript) {
  const raw = String(transcript || '');
  if (!raw) return '';

  const mappedChars = raw
    .split('')
    .map(ch => DIGIT_CHAR_MAP[ch] || ch)
    .join('');

  const directDigits = mappedChars.replace(/\D/g, '');

  const tokens = normalizeText(mappedChars).split(' ');
  const tokenDigits = tokens
    .map(token => (Object.prototype.hasOwnProperty.call(NUMBER_WORDS, token) ? NUMBER_WORDS[token] : ''))
    .join('');

  const combined = `${directDigits}${tokenDigits}`.replace(/\D/g, '');
  return combined.slice(0, 10);
}

export function parseVoiceCommand(transcript) {
  const text = String(transcript || '');
  if (!text) return null;

  const key = Object.keys(COMMAND_PATTERNS).find(command =>
    COMMAND_PATTERNS[command].test(text),
  );
  return key || null;
}

export async function startVoiceSession({
  locale = 'en-IN',
  onResults,
  onError,
  onStart,
  onEnd,
  autoStopMs = 9000,
}) {
  if (!Voice || !hasNativeVoiceModule()) {
    throw new Error('VOICE_NATIVE_MISSING');
  }

  const isAvailable = await isVoiceRecognitionAvailable();
  if (!isAvailable) {
    throw new Error('VOICE_ENGINE_UNAVAILABLE');
  }

  if (Platform.OS === 'android') {
    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    if (!hasPermission) {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message:
            'Farmix needs microphone access to hear your voice input for phone number and commands.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
          buttonNeutral: 'Ask Later',
        },
      );
      if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new Error(`MIC_PERMISSION_DENIED:${permission}`);
      }
    }
  }

  Voice.onSpeechStart = () => {
    if (typeof onStart === 'function') onStart();
  };
  Voice.onSpeechEnd = () => {
    if (typeof onEnd === 'function') onEnd();
  };
  Voice.onSpeechError = event => {
    if (typeof onError === 'function') onError(event);
  };
  Voice.onSpeechResults = event => {
    const value = event?.value?.[0] || '';
    if (typeof onResults === 'function') onResults(value, event?.value || []);
  };

  try {
    await Voice.start(locale);
  } catch (primaryError) {
    // Fallback for devices where selected locale STT is unavailable.
    if (locale !== 'en-IN') {
      await Voice.start('en-IN');
    } else {
      throw primaryError;
    }
  }

  if (autoStopMs > 0) {
    setTimeout(async () => {
      try {
        await Voice.stop();
      } catch (error) {
        // ignore stop race conditions
      }
    }, autoStopMs);
  }
}

export async function stopVoiceSession() {
  if (!Voice) {
    return;
  }
  try {
    await Voice.stop();
  } catch (error) {
    // ignore
  }
}

export async function destroyVoiceSession() {
  if (!Voice) {
    return;
  }
  try {
    await Voice.destroy();
  } catch (error) {
    // ignore
  }
  Voice.removeAllListeners();
}
