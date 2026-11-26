import { Component, inject, signal } from '@angular/core';
import { I18n } from '../i18n/i18n.service';
import { CARD_COUNT, ResponseStyle, cardImage } from '../models';
import { TestService } from '../test.service';

@Component({
  selector: 'app-reflection',
  template: `
    <section class="panel">
      <h2>{{ i18n.t('reflection.title') }}</h2>
      <p class="muted">{{ i18n.t('reflection.subtitle') }}</p>

      <fieldset class="picker">
        <legend>{{ i18n.t('reflection.favorite') }}</legend>
        <div class="thumbs">
          @for (n of cards; track n) {
            <button type="button" [class.selected]="favorite() === n" [attr.aria-pressed]="favorite() === n" (click)="favorite.set(n)">
              <img [src]="image(n)" [alt]="i18n.t('reflection.cardAlt', { n: n })" /><span>{{ n }}</span>
            </button>
          }
        </div>
      </fieldset>

      <fieldset class="picker">
        <legend>{{ i18n.t('reflection.hardest') }}</legend>
        <div class="thumbs">
          @for (n of cards; track n) {
            <button type="button" [class.selected]="hardest() === n" [attr.aria-pressed]="hardest() === n" (click)="hardest.set(n)">
              <img [src]="image(n)" [alt]="i18n.t('reflection.cardAlt', { n: n })" /><span>{{ n }}</span>
            </button>
          }
        </div>
      </fieldset>

      <fieldset class="picker">
        <legend>{{ i18n.t('reflection.style') }}</legend>
        <div class="choices">
          @for (o of styles; track o) {
            <label [class.selected]="style() === o">
              <input type="radio" name="style" [value]="o" [checked]="style() === o" (change)="style.set(o)" />
              <strong>{{ i18n.t('reflection.' + o) }}</strong>
              <span class="muted">{{ i18n.t('reflection.' + o + 'Hint') }}</span>
            </label>
          }
        </div>
      </fieldset>

      @if (test.error(); as err) {
        <p class="error">{{ err }}</p>
      }

      <div class="actions">
        <button type="button" (click)="back()">{{ i18n.t('common.back') }}</button>
        <button class="primary" type="button" [disabled]="!favorite() || !hardest() || !style()" (click)="submit()">
          {{ i18n.t('reflection.submit') }}
        </button>
      </div>
    </section>
  `,
})
export class ReflectionStep {
  protected readonly test = inject(TestService);
  protected readonly i18n = inject(I18n);
  protected readonly cards = Array.from({ length: CARD_COUNT }, (_, i) => i + 1);
  protected readonly image = cardImage;
  protected readonly styles: ResponseStyle[] = ['shapes', 'mix', 'stories'];

  private readonly saved = this.test.reflection();
  protected readonly favorite = signal<number | null>(this.saved?.favoriteCard ?? null);
  protected readonly hardest = signal<number | null>(this.saved?.hardestCard ?? null);
  protected readonly style = signal<ResponseStyle | null>(this.saved?.style ?? null);

  private save() {
    const [favoriteCard, hardestCard, style] = [this.favorite(), this.hardest(), this.style()];
    if (favoriteCard && hardestCard && style) this.test.reflection.set({ favoriteCard, hardestCard, style });
  }

  back() {
    this.save();
    this.test.error.set(null);
    this.test.step.set('cards');
  }

  submit() {
    this.save();
    this.test.submit();
  }
}
