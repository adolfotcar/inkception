import { Component, computed, effect, inject, signal } from '@angular/core';
import { I18n } from '../i18n/i18n.service';
import { CARD_COUNT, cardImage } from '../models';
import { TestService } from '../test.service';

@Component({
  selector: 'app-cards',
  template: `
    <section class="panel cards">
      <div class="progress" role="progressbar" [attr.aria-valuenow]="index() + 1" aria-valuemin="1" [attr.aria-valuemax]="total">
        <div class="bar" [style.width.%]="((index() + 1) / total) * 100"></div>
      </div>
      <p class="muted center">{{ i18n.t('cards.progress', { n: index() + 1, total: total }) }}</p>

      <div class="blot">
        <img [src]="image()" [alt]="i18n.t('cards.alt', { n: index() + 1 })" [style.transform]="'rotate(' + current().rotation + 'deg)'" />
      </div>
      <div class="center">
        <button class="ghost" type="button" (click)="rotate()" [title]="i18n.t('cards.rotateTitle')">{{ i18n.t('cards.rotate') }}</button>
      </div>

      <label class="answer">{{ i18n.t('cards.question') }}
        <textarea
          rows="4"
          maxlength="1000"
          [placeholder]="i18n.t('cards.placeholder')"
          [value]="current().text"
          (input)="onInput($any($event.target).value)"
        ></textarea>
      </label>

      <div class="actions">
        <button type="button" (click)="go(-1)">{{ i18n.t('common.back') }}</button>
        @if (isLast()) {
          <button class="primary" type="button" [disabled]="!allAnswered()" (click)="finish()">{{ i18n.t('common.continue') }}</button>
        } @else {
          <button class="primary" type="button" [disabled]="!current().text.trim()" (click)="go(1)">{{ i18n.t('cards.next') }}</button>
        }
      </div>
      @if (isLast() && !allAnswered()) {
        <p class="muted center">{{ i18n.t('cards.answerAll') }}</p>
      }
    </section>
  `,
})
export class CardsStep {
  protected readonly test = inject(TestService);
  protected readonly i18n = inject(I18n);
  protected readonly total = CARD_COUNT;
  protected readonly index = signal(0);
  protected readonly current = computed(() => this.test.responses()[this.index()]);
  protected readonly image = computed(() => cardImage(this.index() + 1));
  protected readonly isLast = computed(() => this.index() === CARD_COUNT - 1);
  protected readonly allAnswered = computed(() => this.test.responses().every((r) => r.text.trim()));

  /** When the current card was shown (for timing). */
  private shownAt = performance.now();

  constructor() {
    // Coming back from the reflection step: start on the last card.
    if (this.allAnswered()) this.index.set(CARD_COUNT - 1);

    // Preload the next card so it appears instantly.
    effect(() => {
      const next = this.index() + 2;
      if (next <= CARD_COUNT) new Image().src = cardImage(next);
    });
  }

  onInput(text: string) {
    const r = this.current();
    const patch: { text: string; reactionTimeMs?: number } = { text };
    if (r.reactionTimeMs === null && text.trim()) {
      patch.reactionTimeMs = Math.round(r.totalTimeMs + performance.now() - this.shownAt);
    }
    this.test.updateResponse(this.index(), patch);
  }

  rotate() {
    this.test.updateResponse(this.index(), { rotation: (this.current().rotation + 90) % 360 });
  }

  go(delta: number) {
    this.recordTime();
    const next = this.index() + delta;
    if (next < 0) {
      this.test.step.set('profile');
      return;
    }
    this.index.set(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  finish() {
    this.recordTime();
    this.test.step.set('reflection');
  }

  private recordTime() {
    const now = performance.now();
    const r = this.current();
    this.test.updateResponse(this.index(), { totalTimeMs: Math.round(r.totalTimeMs + now - this.shownAt) });
    this.shownAt = now;
  }
}
