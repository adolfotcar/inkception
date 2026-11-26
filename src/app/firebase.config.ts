// Firebase project `adolfotcar-home` (shared with other apps). Inkception uses the
// hosting site `inkception`, the functions codebase `inkception` and `submissions` in Firestore.
// Firebase web config. These values are NOT secret: they only identify your project.
// Get them from: Firebase console → Project settings → Your apps → Web app.
export const firebaseConfig = {
  apiKey: 'AIzaSyDH7WAiw9VJXBRIQ3fAssCl7x-QDTB8UN4',
  authDomain: 'adolfotcar-home.firebaseapp.com',
  projectId: 'adolfotcar-home',
  storageBucket: 'adolfotcar-home.firebasestorage.app',
  messagingSenderId: '562848027390',
  appId: '1:562848027390:web:bb31615edc5656ebb0cbaf',
};

// Must match `region` in functions/src/index.ts
export const functionsRegion = 'europe-west1';

// Set to true to call the local Functions emulator (port 5001) during `ng serve`.
// Needs `cd functions && npm run serve` running, which requires Java.
export const useEmulators = false;
