import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Tts from 'react-native-tts';
import { useUser } from '../../context/UserContext';
import { t } from '../../languages/uiText';
import { getTtsCode } from '../../languages/languageConfig';

const farmImage = require('../../assests/images/field.jpg');

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const STATE_TRANSLATIONS = {
  Hindi: {
    'Andhra Pradesh': 'आंध्र प्रदेश',
    'Arunachal Pradesh': 'अरुणाचल प्रदेश',
    Assam: 'असम',
    Bihar: 'बिहार',
    Chhattisgarh: 'छत्तीसगढ़',
    Goa: 'गोवा',
    Gujarat: 'गुजरात',
    Haryana: 'हरियाणा',
    'Himachal Pradesh': 'हिमाचल प्रदेश',
    Jharkhand: 'झारखंड',
    Karnataka: 'कर्नाटक',
    Kerala: 'केरल',
    'Madhya Pradesh': 'मध्य प्रदेश',
    Maharashtra: 'महाराष्ट्र',
    Manipur: 'मणिपुर',
    Meghalaya: 'मेघालय',
    Mizoram: 'मिजोरम',
    Nagaland: 'नागालैंड',
    Odisha: 'ओडिशा',
    Punjab: 'पंजाब',
    Rajasthan: 'राजस्थान',
    Sikkim: 'सिक्किम',
    'Tamil Nadu': 'तमिलनाडु',
    Telangana: 'तेलंगाना',
    Tripura: 'त्रिपुरा',
    'Uttar Pradesh': 'उत्तर प्रदेश',
    Uttarakhand: 'उत्तराखंड',
    'West Bengal': 'पश्चिम बंगाल',
  },
  Kannada: {
    'Andhra Pradesh': 'ಆಂಧ್ರ ಪ್ರದೇಶ',
    'Arunachal Pradesh': 'ಅರುಣಾಚಲ ಪ್ರದೇಶ',
    Assam: 'ಅಸ್ಸಾಂ',
    Bihar: 'ಬಿಹಾರ',
    Chhattisgarh: 'ಛತ್ತೀಸ್‌ಗಢ',
    Goa: 'ಗೋವಾ',
    Gujarat: 'ಗುಜರಾತ್',
    Haryana: 'ಹರಿಯಾಣ',
    'Himachal Pradesh': 'ಹಿಮಾಚಲ ಪ್ರದೇಶ',
    Jharkhand: 'ಝಾರ್ಖಂಡ್',
    Karnataka: 'ಕರ್ನಾಟಕ',
    Kerala: 'ಕೇರಳ',
    'Madhya Pradesh': 'ಮಧ್ಯ ಪ್ರದೇಶ',
    Maharashtra: 'ಮಹಾರಾಷ್ಟ್ರ',
    Manipur: 'ಮಣಿಪುರ',
    Meghalaya: 'ಮೆಘಾಲಯ',
    Mizoram: 'ಮಿಜೋರಾಂ',
    Nagaland: 'ನಾಗಾಲ್ಯಾಂಡ್',
    Odisha: 'ಒಡಿಶಾ',
    Punjab: 'ಪಂಜಾಬ್',
    Rajasthan: 'ರಾಜಸ್ಥಾನ್',
    Sikkim: 'ಸಿಕ್ಕಿಂ',
    'Tamil Nadu': 'ತಮಿಳುನಾಡು',
    Telangana: 'ತೆಲಂಗಾಣ',
    Tripura: 'ತ್ರಿಪುರಾ',
    'Uttar Pradesh': 'ಉತ್ತರ ಪ್ರದೇಶ',
    Uttarakhand: 'ಉತ್ತರಾಖಂಡ',
    'West Bengal': 'ಪಶ್ಚಿಮ ಬಂಗಾಳ',
  },
  Tamil: {
    'Andhra Pradesh': 'ஆந்திரப் பிரதேசம்',
    'Arunachal Pradesh': 'அருணாச்சலப் பிரதேசம்',
    Assam: 'அசாம்',
    Bihar: 'பீகார்',
    Chhattisgarh: 'சத்தீஸ்கர்',
    Goa: 'கோவா',
    Gujarat: 'குஜராத்',
    Haryana: 'ஹரியானா',
    'Himachal Pradesh': 'இமாச்சலப் பிரதேசம்',
    Jharkhand: 'ஜார்கண்ட்',
    Karnataka: 'கர்நாடகா',
    Kerala: 'கேரளா',
    'Madhya Pradesh': 'மத்தியப் பிரதேசம்',
    Maharashtra: 'மகாராஷ்டிரா',
    Manipur: 'மணிப்பூர்',
    Meghalaya: 'மேகாலயா',
    Mizoram: 'மிசோரம்',
    Nagaland: 'நாகாலாந்து',
    Odisha: 'ஒடிஷா',
    Punjab: 'பஞ்சாப்',
    Rajasthan: 'ராஜஸ்தான்',
    Sikkim: 'சிக்கிம்',
    'Tamil Nadu': 'தமிழ்நாடு',
    Telangana: 'தெலங்கானா',
    Tripura: 'திரிபுரா',
    'Uttar Pradesh': 'உத்தரப் பிரதேசம்',
    Uttarakhand: 'உத்தரகாண்ட்',
    'West Bengal': 'மேற்கு வங்காளம்',
  },
  Telugu: {
    'Andhra Pradesh': 'ఆంధ్ర ప్రదేశ్',
    'Arunachal Pradesh': 'అరుణాచల ప్రదేశ్',
    Assam: 'అస్సాం',
    Bihar: 'బీహార్',
    Chhattisgarh: 'ఛత్తీస్‌గఢ్',
    Goa: 'గోవా',
    Gujarat: 'గుజరాత్',
    Haryana: 'హర్యానా',
    'Himachal Pradesh': 'హిమాచల్ ప్రదేశ్',
    Jharkhand: 'ఝార్ఖండ్',
    Karnataka: 'కర్ణాటక',
    Kerala: 'కేరళ',
    'Madhya Pradesh': 'మధ్య ప్రదేశ్',
    Maharashtra: 'మహారాష్ట్ర',
    Manipur: 'మణిపూర్',
    Meghalaya: 'మేఘాలయ',
    Mizoram: 'మిజోరం',
    Nagaland: 'నాగాలాండ్',
    Odisha: 'ఒడిశా',
    Punjab: 'పంజాబ్',
    Rajasthan: 'రాజస్థాన్',
    Sikkim: 'సిక్కిం',
    'Tamil Nadu': 'తమిళనాడు',
    Telangana: 'తెలంగాణ',
    Tripura: 'త్రిపుర',
    'Uttar Pradesh': 'ఉత్తర ప్రదేశ్',
    Uttarakhand: 'ఉత్తరాఖండ్',
    'West Bengal': 'పశ్చిమ బెంగాల్',
  },
  Punjabi: {
    'Andhra Pradesh': 'ਆਂਧ੍ਰਾ ਪ੍ਰਦੇਸ਼',
    'Arunachal Pradesh': 'ਅਰੁਣਾਚਲ ਪ੍ਰਦੇਸ਼',
    Assam: 'ਅਸਾਮ',
    Bihar: 'ਬਿਹਾਰ',
    Chhattisgarh: 'ਛੱਤੀਸਗੜ੍ਹ',
    Goa: 'ਗੋਆ',
    Gujarat: 'ਗੁਜਰਾਤ',
    Haryana: 'ਹਰਿਆਣਾ',
    'Himachal Pradesh': 'ਹਿਮਾਚਲ ਪ੍ਰਦੇਸ਼',
    Jharkhand: 'ਝਾਰਖੰਡ',
    Karnataka: 'ਕਰਨਾਟਕ',
    Kerala: 'ਕੇਰਲ',
    'Madhya Pradesh': 'ਮੱਧ ਪ੍ਰਦੇਸ਼',
    Maharashtra: 'ਮਹਾਰਾਸ਼ਟਰ',
    Manipur: 'ਮਣਿਪੁਰ',
    Meghalaya: 'ਮੇਘਾਲਯਾ',
    Mizoram: 'ਮਿਜ਼ੋਰਮ',
    Nagaland: 'ਨਾਗਾਲੈਂਡ',
    Odisha: 'ਓਡੀਸ਼ਾ',
    Punjab: 'ਪੰਜਾਬ',
    Rajasthan: 'ਰਾਜਸਥਾਨ',
    Sikkim: 'ਸਿੱਕਿਮ',
    'Tamil Nadu': 'ਤਾਮਿਲਨਾਡੂ',
    Telangana: 'ਤੇਲੰਗਾਨਾ',
    Tripura: 'ਤ੍ਰਿਪੁਰਾ',
    'Uttar Pradesh': 'ਉੱਤਰ ਪ੍ਰਦੇਸ਼',
    Uttarakhand: 'ਉੱਤਰਾਖੰਡ',
    'West Bengal': 'ਪੱਛਮੀ ਬੰਗਾਲ',
  },
  Malayalam: {
    'Andhra Pradesh': 'ആന്ധ്ര പ്രദേശ്',
    'Arunachal Pradesh': 'അറുണാചൽ പ്രദേശ്',
    Assam: 'അസം',
    Bihar: 'ബിഹാർ',
    Chhattisgarh: 'ഛത്തീസ്ഗഡ്',
    Goa: 'ഗോവ',
    Gujarat: 'ഗുജറാത്ത്',
    Haryana: 'ഹരിയാന',
    'Himachal Pradesh': 'ഹിമാചൽ പ്രദേശ്',
    Jharkhand: 'ജാർഖണ്ഡ്',
    Karnataka: 'കർണാടക',
    Kerala: 'കേരളം',
    'Madhya Pradesh': 'മധ്യപ്രദേശ്',
    Maharashtra: 'മഹാരാഷ്ട്ര',
    Manipur: 'മണിപ്പൂർ',
    Meghalaya: 'മേഘാലയ',
    Mizoram: 'മിസോറം',
    Nagaland: 'നാഗാലാൻഡ്',
    Odisha: 'ഒഡീഷ',
    Punjab: 'പഞ്ചാബ്',
    Rajasthan: 'രാജസ്ഥാൻ',
    Sikkim: 'സിക്കിം',
    'Tamil Nadu': 'തമിഴ്നാട്',
    Telangana: 'തെലങ്കാന',
    Tripura: 'ത്രിപുര',
    'Uttar Pradesh': 'ഉത്തർപ്രദേശ്',
    Uttarakhand: 'ഉത്തരാഖണ്ഡ്',
    'West Bengal': 'പശ്ചിമ ബംഗാൾ',
  },
  Marathi: {
    'Andhra Pradesh': 'आंध्र प्रदेश',
    'Arunachal Pradesh': 'अरुणाचल प्रदेश',
    Assam: 'आसाम',
    Bihar: 'बिहार',
    Chhattisgarh: 'छत्तीसगड',
    Goa: 'गोवा',
    Gujarat: 'गुजरात',
    Haryana: 'हरियाणा',
    'Himachal Pradesh': 'हिमाचल प्रदेश',
    Jharkhand: 'झारखंड',
    Karnataka: 'कर्नाटक',
    Kerala: 'केरळ',
    'Madhya Pradesh': 'मध्य प्रदेश',
    Maharashtra: 'महाराष्ट्र',
    Manipur: 'मणिपूर',
    Meghalaya: 'मेघालय',
    Mizoram: 'मिझोराम',
    Nagaland: 'नागालँड',
    Odisha: 'ओडिशा',
    Punjab: 'पंजाब',
    Rajasthan: 'राजस्थान',
    Sikkim: 'सिक्कीम',
    'Tamil Nadu': 'तामिळनाडू',
    Telangana: 'तेलंगणा',
    Tripura: 'त्रिपुरा',
    'Uttar Pradesh': 'उत्तर प्रदेश',
    Uttarakhand: 'उत्तराखंड',
    'West Bengal': 'पश्चिम बंगाल',
  },
  Bengali: {
    'Andhra Pradesh': 'আন্ধ্র প্রদেশ',
    'Arunachal Pradesh': 'অরুণাচল প্রদেশ',
    Assam: 'অসম',
    Bihar: 'বিহার',
    Chhattisgarh: 'ছত্তীসগড়',
    Goa: 'গোয়া',
    Gujarat: 'গুজরাত',
    Haryana: 'হরিয়ানা',
    'Himachal Pradesh': 'হিমাচল প্রদেশ',
    Jharkhand: 'ঝাড়খণ্ড',
    Karnataka: 'কর্নাটক',
    Kerala: 'কেরল',
    'Madhya Pradesh': 'মধ্য প্রদেশ',
    Maharashtra: 'মহারাষ্ট্র',
    Manipur: 'মণিপুর',
    Meghalaya: 'মেঘালয়',
    Mizoram: 'মিজোরাম',
    Nagaland: 'নাগাল্যান্ড',
    Odisha: 'ওডিশা',
    Punjab: 'পাঞ্জাব',
    Rajasthan: 'রাজস্থান',
    Sikkim: 'সিক্কিম',
    'Tamil Nadu': 'তামিলনাড়ু',
    Telangana: 'তেলেঙ্গানা',
    Tripura: 'ত্রিপুরা',
    'Uttar Pradesh': 'উত্তর প্রদেশ',
    Uttarakhand: 'উত্তরাখণ্ড',
    'West Bengal': 'পশ্চিমবঙ্গ',
  },
  Gujarati: {
    'Andhra Pradesh': 'આંધ્ર પ્રદેશ',
    'Arunachal Pradesh': 'અરુણાચલ પ્રદેશ',
    Assam: 'આસામ',
    Bihar: 'બિહાર',
    Chhattisgarh: 'છત્તીસગઢ',
    Goa: 'ગોવા',
    Gujarat: 'ગુજરાત',
    Haryana: 'હરિયાણા',
    'Himachal Pradesh': 'હિમાચલ પ્રદેશ',
    Jharkhand: 'ઝારખંડ',
    Karnataka: 'કર્ણાટક',
    Kerala: 'કેરળ',
    'Madhya Pradesh': 'મધ્ય પ્રદેશ',
    Maharashtra: 'મહારાષ્ટ્ર',
    Manipur: 'મણિપુર',
    Meghalaya: 'મેઘાલય',
    Mizoram: 'મિઝોરમ',
    Nagaland: 'નાગાલેન્ડ',
    Odisha: 'ઓડિશા',
    Punjab: 'પંજાબ',
    Rajasthan: 'રાજસ્થાન',
    Sikkim: 'સિક્કિમ',
    'Tamil Nadu': 'તમિલનાડુ',
    Telangana: 'તેલંગાણા',
    Tripura: 'ત્રિપુરા',
    'Uttar Pradesh': 'ઉત્તર પ્રદેશ',
    Uttarakhand: 'ઉત્તરાખંડ',
    'West Bengal': 'પશ્ચિમ બંગાળ',
  },
  Odia: {
    'Andhra Pradesh': 'ଆନ୍ଧ୍ର ପ୍ରଦେଶ',
    'Arunachal Pradesh': 'ଅରୁଣାଚଳ ପ୍ରଦେଶ',
    Assam: 'ଅସମ',
    Bihar: 'ବିହାର',
    Chhattisgarh: 'ଛତିଶଗଡ଼',
    Goa: 'ଗୋଆ',
    Gujarat: 'ଗୁଜରାଟ',
    Haryana: 'ହରିୟାଣା',
    'Himachal Pradesh': 'ହିମାଚଳ ପ୍ରଦେଶ',
    Jharkhand: 'ଝାରଖଣ୍ଡ',
    Karnataka: 'କର୍ଣ୍ଣାଟକ',
    Kerala: 'କେରଳ',
    'Madhya Pradesh': 'ମଧ୍ୟ ପ୍ରଦେଶ',
    Maharashtra: 'ମହାରାଷ୍ଟ୍ର',
    Manipur: 'ମଣିପୁର',
    Meghalaya: 'ମେଘାଳୟ',
    Mizoram: 'ମିଜୋରମ',
    Nagaland: 'ନାଗାଲ୍ୟାଣ୍ଡ',
    Odisha: 'ଓଡ଼ିଶା',
    Punjab: 'ପଞ୍ଜାବ',
    Rajasthan: 'ରାଜସ୍ଥାନ',
    Sikkim: 'ସିକ୍କିମ',
    'Tamil Nadu': 'ତାମିଳନାଡୁ',
    Telangana: 'ତେଲେଙ୍ଗାନା',
    Tripura: 'ତ୍ରିପୁରା',
    'Uttar Pradesh': 'ଉତ୍ତର ପ୍ରଦେଶ',
    Uttarakhand: 'ଉତ୍ତରାଖଣ୍ଡ',
    'West Bengal': 'ପଶ୍ଚିମ ବଙ୍ଗ',
  },
  Assamese: {
    'Andhra Pradesh': 'আন্ধ্ৰ প্ৰদেশ',
    'Arunachal Pradesh': 'অৰুণাচল প্ৰদেশ',
    Assam: 'অসম',
    Bihar: 'বিহাৰ',
    Chhattisgarh: 'ছত্তীসগড়',
    Goa: 'গোৱা',
    Gujarat: 'গুজৰাট',
    Haryana: 'হাৰিয়ানা',
    'Himachal Pradesh': 'হিমাচল প্ৰদেশ',
    Jharkhand: 'ঝাৰখণ্ড',
    Karnataka: 'কৰ্ণাটক',
    Kerala: 'কেৰেলা',
    'Madhya Pradesh': 'মধ্য প্ৰদেশ',
    Maharashtra: 'মহাৰাষ্ট্ৰ',
    Manipur: 'মণিপুৰ',
    Meghalaya: 'মেঘালয়',
    Mizoram: 'মিজোৰাম',
    Nagaland: 'নাগালেণ্ড',
    Odisha: 'ওডিশা',
    Punjab: 'পাঞ্জাব',
    Rajasthan: 'ৰাজস্থান',
    Sikkim: 'ছিক্কিম',
    'Tamil Nadu': 'তামিলনাডু',
    Telangana: 'তেলেংগানা',
    Tripura: 'ত্ৰিপুৰা',
    'Uttar Pradesh': 'উত্তৰ প্ৰদেশ',
    Uttarakhand: 'উত্তৰাখণ্ড',
    'West Bengal': 'পশ্চিমবংগ',
  },
  Urdu: {
    'Andhra Pradesh': 'آندھرا پردیش',
    'Arunachal Pradesh': 'اروناچل پردیش',
    Assam: 'آسام',
    Bihar: 'بہار',
    Chhattisgarh: 'چھتیس گڑھ',
    Goa: 'گوا',
    Gujarat: 'گجرات',
    Haryana: 'ہریانہ',
    'Himachal Pradesh': 'ہماچل پردیش',
    Jharkhand: 'جھارکھنڈ',
    Karnataka: 'کرناٹک',
    Kerala: 'کیرالا',
    'Madhya Pradesh': 'مدھیہ پردیش',
    Maharashtra: 'مہاراشٹر',
    Manipur: 'منی پور',
    Meghalaya: 'میگھالیہ',
    Mizoram: 'میزورم',
    Nagaland: 'ناگالینڈ',
    Odisha: 'اوڈیشہ',
    Punjab: 'پنجاب',
    Rajasthan: 'راجستھان',
    Sikkim: 'سکم',
    'Tamil Nadu': 'تمل ناڈو',
    Telangana: 'تلنگانہ',
    Tripura: 'تریپورہ',
    'Uttar Pradesh': 'اتر پردیش',
    Uttarakhand: 'اتراکھنڈ',
    'West Bengal': 'مغربی بنگال',
  },
};

export default function OnboardingLocationScreen({ selectedLanguage, onNext, onBack }) {
  const { updateOnboardingData, onboardingData } = useUser();
  const [village, setVillage] = useState(onboardingData.village || '');
  const [district, setDistrict] = useState(onboardingData.district || '');
  const [state, setState] = useState(onboardingData.state || '');
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [error, setError] = useState('');

  const speakInSelectedLanguage = (message) => {
    const ttsCode = getTtsCode(selectedLanguage);
    Tts.setDefaultLanguage(ttsCode);
    Tts.stop();
    Tts.speak(message);
  };

  const getLocationMessage = () => (
    `${t(selectedLanguage, 'locationTitle')}. ${t(selectedLanguage, 'locationSubtitle')}`
  );

  const getLocalizedStateName = (stateName) => (
    STATE_TRANSLATIONS[selectedLanguage]?.[stateName] || stateName
  );

  useEffect(() => {
    const message = getLocationMessage();
    setTimeout(() => {
      speakInSelectedLanguage(message);
    }, 300);
    return () => Tts.stop();
  }, [selectedLanguage]);

  const handleContinue = () => {
    if (!village.trim() || !district.trim() || !state) {
      setError(t(selectedLanguage, 'fillLocationDetails'));
      return;
    }
    updateOnboardingData({
      village: village.trim(),
      district: district.trim(),
      state,
    });
    onNext();
  };

  const speakHelp = () => {
    speakInSelectedLanguage(getLocationMessage());
  };

  return (
    <View style={styles.container}>
      <ImageBackground source={farmImage} style={styles.background} resizeMode="cover">
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '66%' }]} />
              </View>
              <Text style={styles.progressText}>{t(selectedLanguage, 'locationStep')}</Text>
            </View>

            {/* Glass Card */}
            <View style={styles.glassSheet}>
              <View style={styles.glassInner}>
                <View style={styles.handle} />

                {/* Icon */}
                <View style={styles.iconContainer}>
                  <Text style={styles.icon}>📍</Text>
                </View>

                <Text style={styles.title}>{t(selectedLanguage, 'locationTitle')}</Text>
                <Text style={styles.subtitle}>
                  {t(selectedLanguage, 'locationSubtitle')}
                </Text>

                {/* Mic Button */}
                <Pressable style={styles.micButton} onPress={speakHelp}>
                  <Text style={styles.micIcon}>🎤</Text>
                  <Text style={styles.micText}>{t(selectedLanguage, 'tapToHear')}</Text>
                </Pressable>

                {/* Village Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t(selectedLanguage, 'villageLabel')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t(selectedLanguage, 'villagePlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={village}
                    onChangeText={(text) => {
                      setVillage(text);
                      setError('');
                    }}
                    autoCapitalize="words"
                  />
                </View>

                {/* District Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t(selectedLanguage, 'districtLabel')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t(selectedLanguage, 'districtPlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={district}
                    onChangeText={(text) => {
                      setDistrict(text);
                      setError('');
                    }}
                    autoCapitalize="words"
                  />
                </View>

                {/* State Picker */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t(selectedLanguage, 'stateLabel')}</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowStatePicker(true)}
                    activeOpacity={0.85}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={state ? styles.pickerText : styles.pickerPlaceholder}>
                      {state ? getLocalizedStateName(state) : t(selectedLanguage, 'statePlaceholder')}
                    </Text>
                    <Text style={styles.pickerArrow}>▼</Text>
                  </TouchableOpacity>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {/* Buttons */}
                <View style={styles.buttonRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.backButton,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={onBack}
                  >
                    <Text style={styles.backButtonText}>{t(selectedLanguage, 'backArrow')}</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.continueButton,
                      pressed && styles.buttonPressed,
                      (!village.trim() || !district.trim() || !state) && styles.continueButtonDisabled,
                    ]}
                    onPress={handleContinue}
                    disabled={!village.trim() || !district.trim() || !state}
                  >
                    <Text style={styles.continueButtonText}>{t(selectedLanguage, 'continue')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* State Picker Sheet */}
        {showStatePicker ? (
          <View style={styles.modalOverlay}>
            <Pressable
              style={styles.modalBackdrop}
              onPress={() => setShowStatePicker(false)}
            />
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{t(selectedLanguage, 'selectState')}</Text>
              <ScrollView
                style={styles.stateList}
                showsVerticalScrollIndicator={false}
              >
                {INDIAN_STATES.map(item => (
                  <Pressable
                    key={item}
                    style={[
                      styles.stateItem,
                      state === item && styles.stateItemActive,
                    ]}
                    onPress={() => {
                      setState(item);
                      setShowStatePicker(false);
                      setError('');
                    }}
                  >
                    <Text
                      style={[
                        styles.stateItemText,
                        state === item && styles.stateItemTextActive,
                      ]}
                    >
                      {getLocalizedStateName(item)}
                    </Text>
                    {state === item && <Text style={styles.checkMark}>✓</Text>}
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setShowStatePicker(false)}
              >
                <Text style={styles.modalCloseText}>{t(selectedLanguage, 'close')}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#0d3320',
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 20, 10, 0.75)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(5, 25, 12, 0.5)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#7eff8a',
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },

  // Glass Sheet
  glassSheet: {
    marginHorizontal: 20,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  glassInner: {
    backgroundColor: 'rgba(8, 28, 15, 0.85)',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 20,
  },

  // Icon
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 24,
    backgroundColor: 'rgba(126, 255, 138, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(126, 255, 138, 0.25)',
  },
  icon: {
    fontSize: 32,
  },

  // Text
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
    paddingHorizontal: 10,
  },

  // Mic Button
  micButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  micIcon: {
    fontSize: 14,
  },
  micText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },

  // Input
  inputContainer: {
    marginBottom: 14,
  },
  inputLabel: {
    color: '#7eff8a',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },

  // Picker
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pickerText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
  pickerArrow: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '700',
  },
  continueButton: {
    flex: 2,
    backgroundColor: '#2f8d41',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#2f8d41',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(126, 255, 138, 0.25)',
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.9,
  },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: 'rgba(8, 28, 15, 0.98)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
    maxHeight: '70%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  stateList: {
    maxHeight: 350,
  },
  stateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  stateItemActive: {
    backgroundColor: 'rgba(126, 255, 138, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(126, 255, 138, 0.3)',
  },
  stateItemText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  stateItemTextActive: {
    color: '#7eff8a',
  },
  checkMark: {
    color: '#7eff8a',
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  modalCloseText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontWeight: '700',
  },
});
