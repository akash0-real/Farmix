export const LANGUAGE_OPTIONS = [
  { label: 'English', nativeLabel: 'English', ttsCode: 'en-IN' },
  { label: 'Hindi', nativeLabel: 'हिन्दी', ttsCode: 'hi-IN' },
  { label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', ttsCode: 'kn-IN' },
  { label: 'Tamil', nativeLabel: 'தமிழ்', ttsCode: 'ta-IN' },
  { label: 'Telugu', nativeLabel: 'తెలుగు', ttsCode: 'te-IN' },
  { label: 'More...', ttsCode: 'en-IN' },
];

export const MORE_LANGUAGES = [
  { label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ', ttsCode: 'pa-IN' },
  { label: 'Malayalam', nativeLabel: 'മലയാളം', ttsCode: 'ml-IN' },
  { label: 'Marathi', nativeLabel: 'मराठी', ttsCode: 'mr-IN' },
  { label: 'Bengali', nativeLabel: 'বাংলা', ttsCode: 'bn-IN' },
  { label: 'Gujarati', nativeLabel: 'ગુજરાતી', ttsCode: 'gu-IN' },
  { label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ', ttsCode: 'or-IN' },
  { label: 'Assamese', nativeLabel: 'অসমীয়া', ttsCode: 'as-IN' },
  { label: 'Urdu', nativeLabel: 'اردو', ttsCode: 'ur-IN' },
];

export const ALL_LANGUAGES = [
  ...LANGUAGE_OPTIONS.filter(item => item.label !== 'More...'),
  ...MORE_LANGUAGES,
];

export const WELCOME_MESSAGES = {
  English: 'Welcome to Farmix. Please enter your phone number to continue.',
  Hindi: 'Farmix mein aapka swagat hai. Apna phone number darj karein.',
  Kannada: 'Farmix ge swagata. Nimma phone number needi.',
  Tamil: 'Farmix il ungalai varaverkiren. Ungal phone number kodungal.',
  Telugu: 'Farmix ki swaagatam. Meeru phone number ivvandi.',
  Punjabi: 'Farmix vich tuhadaa svaagat hai. Apna phone number daao.',
  Malayalam: 'Farmix il swagatham. Ningalude phone number nalkuka.',
  Marathi: 'Farmix madhe aapla swagat aahe. Tumcha phone number dya.',
  Bengali: 'Farmix e apnake swagatam. Apnar phone number din.',
  Gujarati: 'Farmix ma tamaru swagatam chhe. Tamaro phone number apo.',
  Odia: 'Farmix re aapnanka swagatam. Aapnanka phone number diyantu.',
  Assamese: 'Farmix at apunaake swaagotom. Apunar phone number diyok.',
  Urdu: 'Farmix mein khush aamdeed. Apna phone number darj karein.',
};

export const OTP_SENT_MESSAGES = {
  English: 'OTP sent successfully. Please enter the code.',
  Hindi: 'OTP safalta se bheja gaya. Kripya code darj karein.',
  Kannada: 'OTP yashasviyagi kaliside. Dayavittu code namoodisi.',
  Tamil: 'OTP vettrikaramaga anuppappattathu. Dayavuseythu code ullidavum.',
  Telugu: 'OTP vijayavantanga pampabadindi. Dayachesi code ivvandi.',
  Punjabi: 'OTP safalta naal bhejiya gaya. Kirpa karke code daao.',
  Malayalam: 'OTP vijayakaramaayi ayachu. Dayavayi code nalkuka.',
  Marathi: 'OTP yashsvi pathavla. Krupaya code dya.',
  Bengali: 'OTP safol bhabe pathano hoyeche. Dayakore code din.',
  Gujarati: 'OTP safalta thi mokalay. Maherbani karke code apo.',
  Odia: 'OTP safala re pathagala. Dayakari code diyantu.',
  Assamese: 'OTP safal bhabe pathanoo hol. Anugraha kori code diyok.',
  Urdu: 'OTP kamyabi se bheja gaya. Meherbani karke code darj karein.',
};

export const LOGIN_SUCCESS_MESSAGES = {
  English: 'Login successful. Welcome to Farmix!',
  Hindi: 'Login safal raha. Farmix mein aapka swagat hai!',
  Kannada: 'Login yashasvi. Farmix ge swagata!',
  Tamil: 'Login vettri. Farmix il ungalai varaverkiren!',
  Telugu: 'Login vijayavantam. Farmix ki swaagatam!',
  Punjabi: 'Login safal. Farmix vich tuhadaa svaagat hai!',
  Malayalam: 'Login vijayakaram. Farmix il swagatham!',
  Marathi: 'Login yashsvi. Farmix madhe aapla swagat!',
  Bengali: 'Login safol. Farmix e apnake swagatam!',
  Gujarati: 'Login safal. Farmix ma tamaru swagatam!',
  Odia: 'Login safal. Farmix re aapnanka swagatam!',
  Assamese: 'Login safal. Farmix at swaagotom!',
  Urdu: 'Login kamyab. Farmix mein khush aamdeed!',
};

export const GREETING_MESSAGES = {
  English: 'Welcome',
  Hindi: 'नमस्ते',
  Kannada: 'ನಮಸ್ಕಾರ',
  Tamil: 'வணக்கம்',
  Telugu: 'నమస్కారం',
  Punjabi: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
  Malayalam: 'നമസ്കാരം',
  Marathi: 'नमस्कार',
  Bengali: 'নমস্কার',
  Gujarati: 'નમસ્તે',
  Odia: 'ନମସ୍କାର',
  Assamese: 'নমস্কাৰ',
  Urdu: 'السلام علیکم',
};

export function getTtsCode(language) {
  return ALL_LANGUAGES.find(item => item.label === language)?.ttsCode || 'en-IN';
}
