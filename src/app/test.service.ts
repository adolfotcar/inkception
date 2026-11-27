import { Injectable, inject, isDevMode, signal } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { ReCaptchaEnterpriseProvider, initializeAppCheck } from 'firebase/app-check';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseConfig, functionsRegion, recaptchaSiteKey, useEmulators } from './firebase.config';
import { I18n } from './i18n/i18n.service';
import { Analysis, CARD_COUNT, CardResponse, Profile, Reflection } from './models';

export type Step = 'intro' | 'profile' | 'cards' | 'reflection' | 'analyzing' | 'results';

interface AnalyzeRequest {
  consent: boolean;
  profile: Profile;
  responses: CardResponse[];
  reflection: Reflection;
  locale: string;
  uiLanguage: string;
  device: 'mobile' | 'desktop';
}

declare global {
  // eslint-disable-next-line no-var
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined;
}

function initFirebase(): FirebaseApp {
  const app = initializeApp(firebaseConfig);
  // On `ng serve` reCAPTCHA rejects localhost, so App Check uses a debug token instead.
  // The first run prints it in the browser console; register it once in
  // Firebase console → App Check → Apps → (web app) ⋮ → Manage debug tokens.
  if (isDevMode()) {
    globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
  return app;
}

const emptyResponses = (): CardResponse[] =>
  Array.from({ length: CARD_COUNT }, (_, i) => ({
    card: i + 1,
    text: '',
    reactionTimeMs: null,
    totalTimeMs: 0,
    rotation: 0,
  }));

@Injectable({ providedIn: 'root' })
export class TestService {
  private readonly i18n = inject(I18n);
  private readonly functions = getFunctions(initFirebase(), functionsRegion);
  private readonly analyzeFn = httpsCallable<AnalyzeRequest, { id: string; analysis: Analysis }>(
    this.functions,
    'analyze',
    { timeout: 150_000 },
  );

  readonly step = signal<Step>('intro');
  readonly consent = signal(false);
  readonly profile = signal<Profile | null>(null);
  readonly responses = signal<CardResponse[]>(emptyResponses());
  readonly reflection = signal<Reflection | null>(null);
  readonly analysis = signal<Analysis | null>(null);
  readonly submissionId = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  constructor() {
    if (isDevMode() && useEmulators) {
      connectFunctionsEmulator(this.functions, 'localhost', 5001);
    }
  }

  updateResponse(index: number, patch: Partial<CardResponse>) {
    this.responses.update((list) => list.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async submit() {
    const profile = this.profile();
    const reflection = this.reflection();
    if (!profile || !reflection) return;
    this.error.set(null);
    this.step.set('analyzing');
    try {
      const { data } = await this.analyzeFn({
        consent: this.consent(),
        profile,
        responses: this.responses().map((r) => ({ ...r, text: r.text.trim() })),
        reflection,
        locale: navigator.language,
        uiLanguage: this.i18n.lang(),
        device: matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop',
      });
      this.analysis.set(data.analysis);
      this.submissionId.set(data.id);
      this.step.set('results');
    } catch (e: any) {
      console.error(e);
      this.error.set(this.i18n.t('error.generic'));
      this.step.set('reflection');
    }
  }

  restart() {
    this.consent.set(false);
    this.profile.set(null);
    this.responses.set(emptyResponses());
    this.reflection.set(null);
    this.analysis.set(null);
    this.submissionId.set(null);
    this.error.set(null);
    this.step.set('intro');
  }
}
