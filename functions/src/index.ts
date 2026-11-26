import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { GoogleGenAI, Type } from '@google/genai';
import { CARDS } from './cards.js';

initializeApp();
const db = getFirestore();

// Set with: firebase functions:secrets:set GEMINI_API_KEY
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
// Can be changed at deploy time without editing code.
const GEMINI_MODEL = defineString('GEMINI_MODEL', { default: 'gemini-3.8-flash' });

const CONSENT_VERSION = 3; // bump whenever the consent text in intro.ts changes

// ---------- Types (keep in sync with src/app/models.ts) ----------
interface Profile {
  age: number;
  gender: string;
  nationality: string; // ISO 3166-1 alpha-2
  countryOfResidence: string; // ISO 3166-1 alpha-2
  nativeLanguage: string; // ISO 639-1 or "other"
  education: string;
  occupation?: string;
  mood: number; // 1–5
  familiarity: string;
}

interface CardResponse {
  card: number; // 1–10
  text: string;
  reactionTimeMs: number | null; // card shown → first keystroke
  totalTimeMs: number; // card shown → next
  rotation: number; // 0 | 90 | 180 | 270
}

interface Reflection {
  favoriteCard: number; // 1–10
  hardestCard: number; // 1–10, most uncomfortable or got stuck
  style: 'shapes' | 'mix' | 'stories';
}

interface SubmitRequest {
  consent: boolean;
  profile: Profile;
  responses: CardResponse[];
  reflection: Reflection;
  locale?: string;
  uiLanguage?: string;
  device?: 'mobile' | 'desktop';
}

// ---------- Validation ----------
const GENDERS = ['female', 'male', 'non-binary', 'other', 'prefer-not-to-say'];
const EDUCATION = ['primary', 'secondary', 'vocational', 'bachelor', 'master', 'doctorate', 'prefer-not-to-say'];
const FAMILIARITY = ['never', 'heard', 'seen', 'taken'];
const STYLES = ['shapes', 'mix', 'stories'];

function bad(msg: string): never {
  throw new HttpsError('invalid-argument', msg);
}

function str(v: unknown, field: string, max: number, required = true): string {
  if (v == null || v === '') {
    if (required) bad(`${field} is required`);
    return '';
  }
  if (typeof v !== 'string' || v.length > max) bad(`${field} is invalid`);
  return v.trim();
}

function oneOf(v: unknown, field: string, allowed: string[]): string {
  if (typeof v !== 'string' || !allowed.includes(v)) bad(`${field} is invalid`);
  return v;
}

function int(v: unknown, field: string, min: number, max: number): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) bad(`${field} is invalid`);
  return v;
}

function validate(data: unknown): SubmitRequest {
  if (!data || typeof data !== 'object') bad('Missing payload');
  const d = data as Record<string, any>;
  if (d['consent'] !== true) bad('Consent is required');

  const p = d['profile'] ?? {};
  const profile: Profile = {
    age: int(p.age, 'age', 18, 120),
    gender: oneOf(p.gender, 'gender', GENDERS),
    nationality: str(p.nationality, 'nationality', 8),
    countryOfResidence: str(p.countryOfResidence, 'countryOfResidence', 8),
    nativeLanguage: str(p.nativeLanguage, 'nativeLanguage', 16),
    education: oneOf(p.education, 'education', EDUCATION),
    occupation: str(p.occupation, 'occupation', 100, false),
    mood: int(p.mood, 'mood', 1, 5),
    familiarity: oneOf(p.familiarity, 'familiarity', FAMILIARITY),
  };

  const r = d['responses'];
  if (!Array.isArray(r) || r.length !== CARDS.length) bad(`Exactly ${CARDS.length} responses are required`);
  const responses: CardResponse[] = r.map((x: any, i: number) => ({
    card: int(x?.card, `responses[${i}].card`, i + 1, i + 1),
    text: str(x?.text, `responses[${i}].text`, 1000),
    reactionTimeMs: x?.reactionTimeMs == null ? null : int(x.reactionTimeMs, 'reactionTimeMs', 0, 3_600_000),
    totalTimeMs: int(x?.totalTimeMs, 'totalTimeMs', 0, 3_600_000),
    rotation: int(x?.rotation, 'rotation', 0, 270),
  }));

  const f = d['reflection'] ?? {};
  const reflection: Reflection = {
    favoriteCard: int(f.favoriteCard, 'reflection.favoriteCard', 1, CARDS.length),
    hardestCard: int(f.hardestCard, 'reflection.hardestCard', 1, CARDS.length),
    style: oneOf(f.style, 'reflection.style', STYLES) as Reflection['style'],
  };

  return {
    consent: true,
    profile,
    responses,
    reflection,
    locale: str(d['locale'], 'locale', 35, false),
    uiLanguage: ['en', 'pt-BR', 'es'].includes(d['uiLanguage']) ? d['uiLanguage'] : 'en',
    device: d['device'] === 'mobile' ? 'mobile' : 'desktop',
  };
}

// ---------- Gemini ----------
const SYSTEM_PROMPT = `You interpret answers to an informal, online version of the Rorschach inkblot test.
This is for self-reflection and entertainment, NOT a clinical assessment.
Rules:
- Never diagnose, never name mental illnesses or disorders, never give scores that look clinical.
- Be warm, specific and grounded in what the person actually wrote. Quote their words when useful.
- Use classic Rorschach ideas (common vs. unusual answers, whole-blot vs. detail answers, movement, colour, the use of white space, rotating the card) as lenses, explained in plain language.
- Use the timing data. "Time to start typing" is the delay between the card appearing and the first keystroke; compare each card with the person's own average rather than with absolute numbers. A card that took much longer than usual (or was revisited, so total time is high) may have been harder or more evocative for them. Mention timing only where it adds something.
- Use the person's own reflection: their favourite card, the card that felt most uncomfortable or where they got stuck, and whether they felt they were spotting shapes or inventing stories. Compare how they saw themselves with what their answers and timings actually show, gently.
- Take demographics into account only when culturally relevant (e.g. a reference that is common in their country). Do not stereotype.
- If any answer suggests distress, self-harm or crisis, fill "wellbeingNote" with a short, kind suggestion to talk to someone they trust or a local support line. Otherwise leave it empty.
- Write the whole analysis in the output language named at the end of the request. Their native language, nationality and the language of their answers do NOT change it. When you quote their answers, quote them exactly as written, without translating them.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: 'A short, evocative title for the profile (max 8 words).' },
    summary: { type: Type.STRING, description: '2–3 paragraphs summarising the overall reading.' },
    selfPerception: {
      type: Type.STRING,
      description: 'One short paragraph on their reflection: why their favourite and hardest cards might stand out, and whether their answers match how they described their approach.',
    },
    traits: {
      type: Type.ARRAY,
      description: '3–5 traits or tendencies suggested by the answers.',
      items: {
        type: Type.OBJECT,
        properties: { name: { type: Type.STRING }, description: { type: Type.STRING } },
        required: ['name', 'description'],
      },
    },
    cards: {
      type: Type.ARRAY,
      description: 'One entry per card, in order.',
      items: {
        type: Type.OBJECT,
        properties: {
          card: { type: Type.INTEGER },
          interpretation: { type: Type.STRING, description: '1–3 sentences.' },
          isCommonResponse: { type: Type.BOOLEAN },
        },
        required: ['card', 'interpretation', 'isCommonResponse'],
      },
    },
    wellbeingNote: { type: Type.STRING },
  },
  required: ['headline', 'summary', 'selfPerception', 'traits', 'cards'],
};

const STYLE_LABELS: Record<Reflection['style'], string> = {
  shapes: 'mostly spotting obvious shapes',
  mix: 'a mix of spotting shapes and inventing stories',
  stories: 'mostly inventing stories around the shapes',
};

const secs = (ms: number) => (ms / 1000).toFixed(1) + 's';

const UI_LANGUAGE_NAMES: Record<string, string> = { en: 'English', 'pt-BR': 'Brazilian Portuguese', es: 'Spanish' };

function buildPrompt({ profile, responses, reflection, uiLanguage }: SubmitRequest): string {
  const typed = responses.filter((r) => r.reactionTimeMs != null);
  const avgReaction = typed.reduce((sum, r) => sum + r.reactionTimeMs!, 0) / (typed.length || 1);
  const avgTotal = responses.reduce((sum, r) => sum + r.totalTimeMs, 0) / responses.length;

  const cards = responses
    .map((r) => {
      const c = CARDS[r.card - 1];
      return [
        `Card ${r.card}: ${c.description}`,
        `  Common answers: ${c.commonResponses}`,
        `  Their answer: """${r.text}"""`,
        `  Time to start typing: ${r.reactionTimeMs == null ? 'n/a' : secs(r.reactionTimeMs)}, total time on card: ${secs(r.totalTimeMs)}, rotated: ${r.rotation}°`,
      ].join('\n');
    })
    .join('\n\n');

  return `About the person:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Nationality: ${profile.nationality}, lives in: ${profile.countryOfResidence}
- Native language: ${profile.nativeLanguage}
- Education: ${profile.education}${profile.occupation ? `\n- Occupation: ${profile.occupation}` : ''}
- Mood right now (1 = very low, 5 = very good): ${profile.mood}
- Prior familiarity with the Rorschach test: ${profile.familiarity}

Their answers:

${cards}

Timing averages for this person: ${secs(avgReaction)} to start typing, ${secs(avgTotal)} total per card.

Their reflection after the test:
- Favourite card: ${reflection.favoriteCard}
- Card that felt most uncomfortable or where they got stuck: ${reflection.hardestCard}
- How they describe their approach: ${STYLE_LABELS[reflection.style]}

Output language: ${UI_LANGUAGE_NAMES[uiLanguage ?? 'en']} (the language they chose for the website). Write every field of your response in ${UI_LANGUAGE_NAMES[uiLanguage ?? 'en']}.`;
}

// ---------- Function ----------
export const analyze = onCall(
  {
    secrets: [GEMINI_API_KEY],
    region: 'europe-west1',
    maxInstances: 10,
    timeoutSeconds: 120,
    memory: '512MiB',
    // Turn this on once App Check is set up in the web app (recommended before going public).
    enforceAppCheck: false,
  },
  async (request) => {
    const input = validate(request.data);
    const model = GEMINI_MODEL.value();

    // Save the submission first, so the data is kept even if Gemini fails.
    const ref = await db.collection('submissions').add({
      profile: input.profile,
      responses: input.responses,
      reflection: input.reflection,
      locale: input.locale || null,
      uiLanguage: input.uiLanguage,
      device: input.device,
      consentVersion: CONSENT_VERSION,
      createdAt: FieldValue.serverTimestamp(),
      status: 'pending',
    });

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });
      const res = await ai.models.generateContent({
        model,
        contents: buildPrompt(input),
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.8,
        },
      });

      const analysis = JSON.parse(res.text ?? '{}');
      const u = res.usageMetadata;
      const usage = {
        inputTokens: u?.promptTokenCount ?? null,
        outputTokens: u?.candidatesTokenCount ?? null,
        thinkingTokens: u?.thoughtsTokenCount ?? null,
        totalTokens: u?.totalTokenCount ?? null,
      };
      await ref.update({ analysis, model, usage, status: 'done', analyzedAt: FieldValue.serverTimestamp() });
      logger.info('Analysis done', { id: ref.id, model, ...usage });
      return { id: ref.id, analysis };
    } catch (err) {
      logger.error('Gemini analysis failed', { id: ref.id, detail: err instanceof Error ? err.message : String(err) });
      await ref.update({ status: 'error', error: String(err) });
      throw new HttpsError('internal', 'The analysis could not be generated. Please try again.');
    }
  },
);
