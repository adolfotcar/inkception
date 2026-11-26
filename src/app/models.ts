// Keep in sync with functions/src/index.ts
export interface Profile {
  age: number;
  gender: string;
  nationality: string;
  countryOfResidence: string;
  nativeLanguage: string;
  education: string;
  occupation?: string;
  mood: number;
  familiarity: string;
}

export interface CardResponse {
  card: number;
  text: string;
  reactionTimeMs: number | null;
  totalTimeMs: number;
  rotation: number;
}

export type ResponseStyle = 'shapes' | 'mix' | 'stories';

export interface Reflection {
  favoriteCard: number; // 1–10
  hardestCard: number; // 1–10, most uncomfortable or where they got stuck
  style: ResponseStyle;
}

export interface Analysis {
  headline: string;
  summary: string;
  selfPerception: string;
  traits: { name: string; description: string }[];
  cards: { card: number; interpretation: string; isCommonResponse: boolean }[];
  wellbeingNote?: string;
}

export const CARD_COUNT = 10;
export const cardImage = (n: number) => `cards/card-${String(n).padStart(2, '0')}.jpg`;
