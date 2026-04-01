# Farmix

Farmix is a voice-first mobile assistant for small and marginal farmers in India. It helps farmers detect crop disease early, trigger community alerts, and take faster on-field decisions with minimal typing.

## Demo Video

https://github.com/user-attachments/assets/a24a04d6-4fc9-4137-b89b-6057340c010e

## ScreenShots

<img width="869" height="974" alt="swappy-20260401-140058" src="https://github.com/user-attachments/assets/20fa4d24-ee1b-41bb-b09f-225a170885ea" />


<img width="869" height="974" alt="swappy-20260401-140109" src="https://github.com/user-attachments/assets/a469d9d1-0e11-4787-a5c1-8c35509c89c3" />

<img width="869" height="974" alt="swappy-20260401-140122" src="https://github.com/user-attachments/assets/510cc350-4811-4a0e-868a-a1c69ad85430" />


## Problem Statement

Indian farmers commonly face three connected issues:
1. Late disease detection leads to avoidable crop loss.
2. Expert advisory is often inaccessible in local languages.
3. Decision delays reduce farmer income and resilience.

Most digital tools assume typing fluency, strong connectivity, and high app familiarity, which creates adoption barriers in rural regions.

## What We Built

### 1. Crop Doctor (AI Disease Screening)
- Capture crop images using the phone camera.
- Analyze disease likelihood using Gemini.
- Return severity, summary, treatment steps, and prevention tips.

### 2. Severity-Based Community Alerts
- Publish alerts after disease screening.
- Auto-map alert radius by severity:
  - `Low` -> `3 km`
  - `Moderate` -> `8 km`
  - `High` -> `20 km`

### 3. Voice-First Experience
- Text-to-speech guidance for onboarding and key interactions.
- Multi-language voice flow for rural accessibility.

### 4. OTP-Based Onboarding
- Lightweight login flow for first-time users.
- Mobile-first UX with minimal friction.

### 5. Demo-Safe Failure Handling
- Quota/rate-limit failures are handled gracefully.
- User sees clear fallback guidance instead of raw API errors.

## Current Prototype Scope

Implemented screens and modules:
- Screens: Home, Crop Doctor, Community Alerts, Mandi Prices, Login, Pre-Login, Splash.
- Services: AI diagnosis, community alert publishing, mandi pricing.
- Quality setup: Jest tests and CI workflows for lint/test/build.

## Accessibility and Inclusivity

Farmix is designed for practical rural usage:
1. Voice prompts to reduce typing dependence.
2. Local-language guidance for better adoption.
3. Large touch targets and simple navigation.
4. Action-oriented advisory text.

## Tech Stack

- React Native
- JavaScript
- Gemini API
- Jest
- GitHub Actions (lint/test/build)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Add local secrets (do not commit)

Create `src/config/localSecrets.js`:

```js
module.exports = {
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY',
};
```

Sample file: `src/config/localSecrets.example.js`

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

Farmix aims to reduce avoidable crop loss through earlier disease action and community-level risk sharing. Its voice-first and local-language design lowers digital barriers for farmers with limited formal digital literacy.

## Future Roadmap

1. Secure production backend for AI calls and key management.
2. Real GPS-based alert targeting and district-level risk heatmaps.
3. Offline-first advisory cache with deferred sync.
4. Improved model reliability via hybrid classifier + LLM pipeline.
5. Buyer matching and expert escalation integrations.

## Project Status

Prototype / PoC for hackathon submission.
