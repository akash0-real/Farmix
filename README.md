# Farmix

Farmix is a voice-first, multilingual mobile assistant for Indian farmers. It supports the full loop from crop issue detection to community knowledge sharing and buyer-side income decisions.

## Demo Video

https://github.com/user-attachments/assets/a24a04d6-4fc9-4137-b89b-6057340c010e

## Screenshots

<img width="869" height="974" alt="swappy-20260401-140058" src="https://github.com/user-attachments/assets/20fa4d24-ee1b-41bb-b09f-225a170885ea" />

<img width="869" height="974" alt="swappy-20260401-140109" src="https://github.com/user-attachments/assets/a469d9d1-0e11-4787-a5c1-8c35509c89c3" />

<img width="869" height="974" alt="swappy-20260401-140122" src="https://github.com/user-attachments/assets/510cc350-4811-4a0e-868a-a1c69ad85430" />

## Problem Statement

Farmers often face three connected problems:
1. Disease detection happens late, causing avoidable yield loss.
2. Advisory is hard to access in local languages and field conditions.
3. Income decisions are opaque due to unclear buyer trust and net earnings.

## What We Built

### 1) Voice-First Multilingual Experience
- End-to-end flow is designed for low-typing usage.
- Language selection from login drives UI text and speech behavior.
- English + Hindi are fully translated for core app journeys.
- Other supported languages use translated keys where available and English fallback for missing keys.

### 2) Crop Doctor (AI + Offline Fallback)
- Farmer captures crop image (camera/gallery).
- App runs online diagnosis flow and returns disease, severity, confidence, treatment, and prevention.
- If online analysis fails (quota/rate-limit/network), app gracefully falls back and still gives actionable guidance.
- Can trigger community alert radius by severity.

### 3) Severity-Based Community Alerts
- Alerts are grouped by disease/location and sorted by severity + recency.
- Severity mapping for actionable radius:
  - Low -> 3 km
  - Moderate -> 8 km
  - High -> 20 km
- Farmers can listen, share, mark checked, and call expert.

### 4) Community Lessons Feed (Peer Learning)
- Farmers can post:
  - Problem faced
  - What they tried
  - What worked
  - Crop + location
- Other farmers can mark lessons as Helpful.
- Enables practical “learn from past mistakes” sharing.

### 5) Rewards & Positive Reinforcement
- Gamified contribution model:
  - +10 points for posting a lesson
  - +5 points when a lesson is marked helpful
  - +20 points when outcome is verified by author
  - +2 points for alert confirmation flows
- Badges and progress are shown in Home under **My Impact**.

### 6) Seller Connection (Nearby Buyers + Transparent Earnings)
- Shows nearby buyer cards with trust signals:
  - Rating
  - Successful deals
  - Last active
  - Payment mode
  - Pickup window
- Earnings calculator shows:
  - Gross earning
  - Transport cost
  - Net earning
- Suggests better buyer when higher net return is available.

### 7) Govt Schemes + Mandi Insights
- Scheme discovery with category filtering and detail cards.
- Mandi pricing with analysis support (sell/buy perspectives).

## How Features Work (Flow)

### Login + Profile Persistence
- OTP login flow authenticates user.
- Onboarding collects name, location, farm profile.
- Profile data is stored per user ID, so after logout/login the same farmer does not need to re-enter onboarding data.

### Language Behavior
- `selectedLanguage` is set at login and stored in user profile.
- UI text uses centralized `t(language, key)` translation lookup.
- English is fallback for unknown/missing keys.

### Community Lessons + Rewards Integration
- Posting lesson writes to local lesson store and adds reward points.
- Helpful action increments lesson helpful count and rewards.
- Verify outcome is author-only and awards bonus points.
- Home Impact card reads reward totals and badge level.

### Seller Connection Earnings Logic
- Buyers are filtered by user district/state/crops (with fallback list).
- Net earning formula:
  - `gross = quantityQuintal * pricePerQuintal`
  - `transport = distanceKm * transportCostPerKm`
  - `net = gross - transport`

## Tech Stack

- React Native
- JavaScript
- Gemini API (online AI flows)
- AsyncStorage (local persistence)
- Jest
- ESLint

## Current Architecture Notes

- Prototype is local-first for demo robustness.
- Some modules currently use static/mock datasets for hackathon reliability.
- API-ready structure is maintained so services can be replaced with live backends.

## Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Add local secrets (do not commit)

Create `src/config/localSecrets.js`:

```js
module.exports = {
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',
};
```

Sample file: `src/config/localSecrets.example.js`

### 3) Run app

```bash
npm start
npm run android
```

### 4) Run tests

```bash
npm test -- --watchAll=false
```

## Demo Credentials / Notes

- OTP is currently mocked for prototype mode.
- Demo OTP code: `547333`

## Future Roadmap

1. Replace local datasets with live buyer and mandi APIs.
2. Add production auth + backend role model (farmer/buyer/admin).
3. Add transaction verification and trust scoring with proof artifacts.
4. Add logistics API integration for real transport/ETA costing.
5. Expand full native translation quality for all supported languages.

## Project Status

Hackathon prototype with production-ready direction.
