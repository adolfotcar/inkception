import { Injectable, computed, effect, signal } from '@angular/core';
import { en, TKey } from './en';
import { es } from './es';
import { ptBR } from './pt-BR';

export const LANGS = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'pt-BR', label: 'PT', name: 'Português' },
  { code: 'es', label: 'ES', name: 'Español' },
] as const;
export type Lang = (typeof LANGS)[number]['code'];

const DICTS: Record<Lang, Record<TKey, string>> = { en, 'pt-BR': ptBR, es };
const STORAGE_KEY = 'inkception.lang';

function detect(): Lang {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && saved in DICTS) return saved as Lang;
  for (const l of navigator.languages ?? [navigator.language]) {
    const base = l.toLowerCase().split('-')[0];
    if (base === 'pt') return 'pt-BR';
    if (base === 'es') return 'es';
    if (base === 'en') return 'en';
  }
  return 'en';
}

@Injectable({ providedIn: 'root' })
export class I18n {
  readonly lang = signal<Lang>(detect());
  private readonly dict = computed(() => DICTS[this.lang()]);

  constructor() {
    effect(() => {
      const lang = this.lang();
      document.documentElement.lang = lang;
      document.title = this.t('meta.title');
      localStorage.setItem(STORAGE_KEY, lang);
    });
  }

  /** Translate a key. `{name}` placeholders are replaced from `params`. */
  t(key: TKey | string, params?: Record<string, string | number>): string {
    let text = this.dict()[key as TKey] ?? en[key as TKey] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{${k}}`, String(v));
    return text;
  }
}
