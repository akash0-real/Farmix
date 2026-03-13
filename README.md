# Farmix

Farmix is a voice-first mobile assistant built for small and marginal farmers in India. It helps farmers detect crop disease early, receive community risk alerts, and make faster field decisions with low typing effort.

## Demo Video

Place your demo file here: `videos/farmix-demo.mp4`

Demo file link: [Watch demo](videos/farmix-demo.mp4)

External link (optional): `https://youtube.com/shorts/D0LuQDIDKiw?feature=share`

## Problem Statement

Indian farmers face three connected problems:
1. Late disease detection causes major crop loss.
2. Reliable advisory is often inaccessible in local languages.
3. Small farmers lose income due to delayed decisions and weak market linkage.

In many villages, digital tools are hard to use because they assume fluent typing, stable internet, and technical familiarity.

## What We Built

Farmix prototype focuses on practical, high-impact workflows:

1. Crop Doctor (AI image diagnosis)
- Capture crop photo from camera.
- Analyze disease likelihood using Gemini.
- Return severity, summary, treatment, and prevention steps.

2. Severity-Based Community Alerts
- Every disease scan can publish a nearby community alert.
- Alert radius is based on severity:
  - Low: 3 km
  - Moderate: 8 km
  - High: 20 km

3. Voice-First Interaction
- Login and guidance flow uses text-to-speech.
- Language-aware voice prompts are supported in major Indian languages.

4. OTP-Based Simple Access
- Mobile-first onboarding with OTP-style flow.
- Designed for first-time smartphone users.

5. Demo-Safe Error Handling
- Quota/rate-limit failures now degrade gracefully.
- App shows user-friendly fallback guidance instead of raw technical errors.

## Current Prototype Scope

Implemented screens and modules include:
- Home, Crop Doctor, Community Alerts, Mandi Prices, Login, Pre-Login, Splash
- Services for AI analysis and alert publishing
- Basic test suite + CI workflow split (lint/test/build)

## Accessibility and Inclusivity

Farmix is designed for rural usability:
1. Voice support to reduce typing dependence.
2. Local-language guidance for higher adoption.
3. Simple UI structure with large touch targets.
4. Advisory-first content with practical next actions.

## Tech Stack

- React Native
- JavaScript
- Gemini API (image + advisory)
- Jest for tests
- GitHub Actions for CI (lint/test/build)

## Repo Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure local secrets (do not commit)

Create `src/config/localSecrets.js`:

```js
module.exports = {
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',
};
```

A sample file exists at `src/config/localSecrets.example.js`.

### 3. Run app

```bash
npm start
npm run android
```

### 4. Run tests

```bash
npm test -- --watchAll=false
```

## Impact on Farmers and Rural Livelihood

Farmix aims to reduce avoidable crop loss by enabling earlier disease action and community-level risk sharing. It lowers the barrier to digital advisory through voice and local-language support, making technology usable for farmers with low digital literacy.

## Future Roadmap

1. Production Backend for Key Safety
- Move all model calls behind a secure backend.
- Remove direct API access from mobile client.

2. Real Geo-Based Alert Broadcasting
- Replace static radius logic with true GPS distance filtering.
- Add district-level outbreak heatmaps.

3. Offline and Low-Network Mode
- Local caching of advisories and multilingual audio packs.
- Deferred sync when network returns.

4. Better Model Reliability
- Ensemble with disease-specific classifier + LLM explanation layer.
- Confidence calibration and false-positive control.

5. Farmer Network Integrations
- Nearby buyer matching and mandi trend recommendations.
- Link with agri-extension experts for escalation.

## Project Status

Prototype / PoC for hackathon submission.

## Team Note

This README is structured to support hackathon evaluation fields: problem, solution, impact, inclusivity, and roadmap.
