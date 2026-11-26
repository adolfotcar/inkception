# The Inkblot Test

An Angular app that collects a short anonymous profile, shows the 10 Rorschach plates, asks three reflection questions, and sends the answers to Gemini for an interpretation. Every submission is saved in Firestore for later analysis.

## How it works

```
Angular app ──(callable)──▶ Cloud Function `analyze` ──▶ Gemini API
                                    │
                                    └──▶ Firestore `submissions/{id}`
```

- The Gemini API key lives only in the Cloud Function (as a Secret Manager secret), never in the browser.
- Firestore rules block all browser access. Only the function writes, and you read the data in the console or export it.
- The submission is saved **before** Gemini is called, so you keep the data even if the analysis fails (`status: "error"`).

## Setup

1. **Create a Firebase project** in the [Firebase console](https://console.firebase.google.com). Upgrade it to the **Blaze** plan, which Cloud Functions require (the free tier allowance still applies).
2. **Create Firestore** (Build → Firestore Database) in your preferred region.
3. **Add a Web app** (Project settings → Your apps) and paste its config into `src/app/firebase.config.ts`.
4. Put your project ID in `.firebaserc`.
5. **Get a Gemini API key** from [Google AI Studio](https://aistudio.google.com/apikey) and store it:
   ```bash
   firebase login
   firebase functions:secrets:set GEMINI_API_KEY
   ```
6. Deploy:
   ```bash
   npm run build
   firebase deploy
   ```
   Before deploying, set `useEmulators = false` in `src/app/firebase.config.ts`, or leave it on: it only applies in dev builds.

## Local development

```bash
# Emulators need Java 21+. For a local key, create functions/.secret.local containing: GEMINI_API_KEY=...
cd functions && npm run serve      # functions + Firestore emulators, UI at http://localhost:4000
npm start                          # in another terminal: http://localhost:4200
```

## Data saved per submission

| Field | Notes |
|---|---|
| `profile` | age, gender, nationality, countryOfResidence, nativeLanguage, education, occupation, mood (1–5), familiarity |
| `responses[]` | `text`, `reactionTimeMs` (card shown → first keystroke), `totalTimeMs`, `rotation` |
| `reflection` | `favoriteCard`, `hardestCard` (most uncomfortable / got stuck), `style` (`shapes` \| `mix` \| `stories`) |
| `analysis` | Gemini's structured output (headline, summary, selfPerception, traits, per-card) |
| `locale`, `device`, `model`, `consentVersion`, `createdAt`, `status` | context for analysis |

For analysis at scale, install the **Stream Firestore to BigQuery** extension.

## Configuration

- **Model:** `GEMINI_MODEL` parameter (default `gemini-3.8-flash`); `firebase deploy` will prompt for it, or set it in `functions/.env`.
- **Region:** `europe-west1` in both `functions/src/index.ts` and `src/app/firebase.config.ts`.
- **Card images:** `public/cards/card-01.jpg` … `card-10.jpg` (the 1921 plates from Wikimedia Commons, public domain). If you swap them out, update the descriptions in `functions/src/cards.ts`.

## Before going public

- Turn on **App Check** (reCAPTCHA Enterprise) in the web app and set `enforceAppCheck: true` in the function, so bots can't drain your Gemini quota.
- Write a short privacy notice. Nationality and gender together with free text can count as personal data under GDPR, even without names.
