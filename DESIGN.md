# Farmix Design System & Overhaul (Awwwards Caliber)

## Brand Identity & Point of View
Farmix is a voice-first, multilingual agricultural intelligence companion designed specifically for Indian farmers. Rather than generic SaaS tropes or harsh neon palettes, the overhauled design borrows its rules from the earthy, fertile world of Indian agriculture: deep fertile soil tones, luminous vitality greens, and warm harvest wheat gold.

### Concept Card
```
Idea:        A precision agricultural command center grounded in fertile earth and luminous intelligence
Metaphor:    Modern soil science meets hyper-local village camaraderie
Signature:   Floating frosted voice dock with concentric pulse ring and tactile diagnostic reticles
Emotion:     Confidence, dignity, and intuitive clarity under direct sunlight
Motion verb: Breathe, pulse, and settle with tactile spring feedback
Screenshot:  The Home Dashboard featuring live micro-climate, AI Crop Doctor, and real-time Mandi price tickers
```

---

## Art Direction System

### Palette Roles
- **Ground (`colors.ground`)**: `#08120b` (Deep fertile midnight forest)
- **Surfaces (`colors.surfaceCard`, `colors.surfaceElevated`)**: `rgba(18, 36, 25, 0.88)` / `#122317`
- **Borders (`colors.borderSubtle`, `colors.borderLight`)**: `rgba(255, 255, 255, 0.08)` to `0.14`
- **Ink (`colors.ink`)**: `#f4f7f4` (Crisp off-white, high AA contrast)
- **Muted (`colors.muted`)**: `#8e9f92`
- **Emerald Accent (`colors.emerald`)**: `#34d399` (Vitality, healthy crops, positive confirmation)
- **Gold Accent (`colors.gold`)**: `#fbbf24` (Harvest wheat, Mandi market pricing, rewards)
- **Coral Accent (`colors.coral`)**: `#f87171` (Disease warnings, urgent district alerts)
- **Sky Accent (`colors.sky`)**: `#38bdf8` (Micro-climate, weather, water irrigation)
- **Clay Accent (`colors.clay`)**: `#fb923c` (Soil analysis, NPK nutrients)

### Typography & Grid
- **Display / Hero**: 24-28px, Bold 800/900, tight tracking (`-0.4px` to `-0.8px`)
- **Headers**: 16-18px Semi-bold
- **Body**: 13-14px, leading 18-20px
- **Micro-labels**: 9-11px, Bold 800, letter-spaced `+0.5px` to `+1.0px`, uppercase
- **Border Radii**: 24px (Macro cards), 16px (Secondary modules), 9999px (Pills & floating FAB)

---

## Overhauled Experience Across All Screens

1. **Splash Screen ([SplashScreen.jsx](file:///home/akash/hackathon/Farmix/src/screens/SplashScreen.jsx))**:
   - Animated emerald glow aura and spring-scaled leaf insignia with tracked "AI AGRICULTURAL ASSISTANT" subtitle.
2. **Pre-Login Welcome ([PreLoginScreen.jsx](file:///home/akash/hackathon/Farmix/src/screens/PreLoginScreen.jsx))**:
   - Atmospheric cinematic overlays, elegant brand header, voice tag pill, frosted bottom glass sheet, and tactile primary CTA.
3. **Login & OTP ([LoginScreen.jsx](file:///home/akash/hackathon/Farmix/src/screens/LoginScreen.jsx))**:
   - Concentric pulse microphone button for voice phone input, styled `+91` country code input, clean language grid, and frosted language sheet modal.
4. **Onboarding Flow ([OnboardingNameScreen.jsx](file:///home/akash/hackathon/Farmix/src/screens/onboarding/OnboardingNameScreen.jsx), [OnboardingLocationScreen.jsx](file:///home/akash/hackathon/Farmix/src/screens/onboarding/OnboardingLocationScreen.jsx), [OnboardingFarmScreen.jsx](file:///home/akash/hackathon/Farmix/src/screens/onboarding/OnboardingFarmScreen.jsx))**:
   - Unified step indicator ribbons, styled multi-select crop chips, and irrigation mode cards.
5. **Home Command Center ([HomeScreen.jsx](file:///home/akash/hackathon/Farmix/src/screens/HomeScreen.jsx))**:
   - Avatar with active online dot, Quick Farm Stats ribbon, Micro-Climate card with audio narration, featured 2-column feature suite (Crop Doctor, Mandi Prices, Buyer Connect, Alert Radar, Peer Lessons, Soil Health), Gamified Impact tier card, and floating bottom navigation with center voice FAB.
6. **Crop Doctor Scanner ([CropDoctorScreen.jsx](file:///home/akash/hackathon/Farmix/src/screens/CropDoctorScreen.jsx))**:
   - Precision optical viewfinder with corner reticles, confidence level badge, diagnosis summary, audio treatment listener, prevention checklist, and alternative pathology predictions.
7. **Mandi Market Intelligence ([MandiPricesScreen.jsx](file:///home/akash/hackathon/Farmix/src/screens/MandiPricesScreen.jsx))**:
   - Live location ticker, Sell & Buy trading strategy tiles, elevated price cards ([MandiPriceCard.jsx](file:///home/akash/hackathon/Farmix/src/components/MandiPriceCard.jsx)), and institutional market intelligence modal with ranked tables and buy/sell signals.
8. **Buyer Direct Connect ([BuyerConnectScreen.jsx](file:///home/akash/hackathon/Farmix/src/screens/BuyerConnectScreen.jsx))**:
   - Transparent Profit Calculator showing gross yield minus transport logistics to compute guaranteed net in-hand earnings, alongside nearby verified buyer cards.
9. **Community Radar & Lessons ([CommunityAlertScreen.jsx](file:///home/akash/hackathon/Farmix/src/screens/CommunityAlertScreen.jsx), [CommunityLessonsScreen.jsx](file:///home/akash/hackathon/Farmix/src/screens/CommunityLessonsScreen.jsx))**:
   - Hyperlocal disease outbreak radius cards with trend pills, immediate action checklists, peer knowledge posts with "+10 Pts" badges, and author verification indicators.
10. **Soil & Govt Schemes ([SoilAnalysisScreen.jsx](file:///home/akash/hackathon/Farmix/src/screens/SoilAnalysisScreen.jsx), [GovtSchemesScreen.jsx](file:///home/akash/hackathon/Farmix/src/screens/GovtSchemesScreen.jsx))**:
    - Soil NPK/pH property indicators, crop compatibility lists, searchable subsidy database, and one-tap official helpline dialers.

