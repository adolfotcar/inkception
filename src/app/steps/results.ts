import { Component, computed, inject, signal } from '@angular/core';
import { I18n } from '../i18n/i18n.service';
import { cardImage } from '../models';
import { PRIVACY } from '../privacy';
import { TestService } from '../test.service';

@Component({
  selector: 'app-results',
  template: `
    @if (test.analysis(); as a) {
      <section class="panel results">
        <p class="eyebrow">{{ i18n.t('results.eyebrow') }}</p>
        <h1>{{ a.headline }}</h1>

        @if (a.wellbeingNote) {
          <div class="notice care">{{ a.wellbeingNote }}</div>
        }

        @for (p of paragraphs(); track $index) {
          <p>{{ p }}</p>
        }

        @if (a.selfPerception) {
          <h2>{{ i18n.t('results.howYouSaw') }}</h2>
          <p>{{ a.selfPerception }}</p>
        }

        <h2>{{ i18n.t('results.traits') }}</h2>
        <div class="traits">
          @for (t of a.traits; track t.name) {
            <div class="trait">
              <h3>{{ t.name }}</h3>
              <p>{{ t.description }}</p>
            </div>
          }
        </div>

        <h2>{{ i18n.t('results.cardByCard') }}</h2>
        <ol class="card-list">
          @for (c of a.cards; track c.card) {
            <li>
              <img [src]="image(c.card)" alt="" />
              <div>
                <p class="quote">“{{ answer(c.card) }}”
                  @if (c.isCommonResponse) { <span class="tag">{{ i18n.t('results.common') }}</span> }
                </p>
                <p>{{ c.interpretation }}</p>
              </div>
            </li>
          }
        </ol>

        <div class="notice">{{ i18n.t('results.disclaimer') }}</div>

        @if (test.submissionId(); as id) {
          <div class="reference">
            <p><strong>{{ i18n.t('results.reference') }}</strong> <code>{{ id }}</code>
              <button class="ghost" type="button" (click)="copy(id)">{{ copied() ? i18n.t('results.copied') : i18n.t('results.copy') }}</button>
            </p>
            <p class="muted" [innerHTML]="i18n.t('results.referenceBody', { email: emailLink(id) })"></p>
          </div>
        }

        <div class="actions">
          <button class="primary" type="button" (click)="test.restart()">{{ i18n.t('results.retake') }}</button>
        </div>
      </section>
    }
  `,
})
export class ResultsStep {
  protected readonly test = inject(TestService);
  protected readonly i18n = inject(I18n);
  protected readonly paragraphs = computed(() => (this.test.analysis()?.summary ?? '').split(/\n+/).filter(Boolean));
  protected readonly image = cardImage;
  protected readonly copied = signal(false);

  protected emailLink(id: string) {
    const email = PRIVACY.contactEmail;
    return `<a href="mailto:${email}?subject=${encodeURIComponent('Inkception data request ' + id)}">${email}</a>`;
  }

  protected answer(card: number) {
    return this.test.responses()[card - 1]?.text ?? '';
  }

  protected async copy(id: string) {
    await navigator.clipboard.writeText(id);
    this.copied.set(true);
  }
}
