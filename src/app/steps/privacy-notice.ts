import { Component, computed, inject } from '@angular/core';
import { I18n } from '../i18n/i18n.service';
import { PRIVACY } from '../privacy';

@Component({
  selector: 'app-privacy-notice',
  template: `
    <div class="privacy">
      <h3>{{ t('privacy.title') }}</h3>
      <p class="muted">{{ t('privacy.updated', { date: updated() }) }}</p>
      @if (t('privacy.translationNote')) {
        <p class="muted"><em>{{ t('privacy.translationNote') }}</em></p>
      }

      <h4>{{ t('privacy.who') }}</h4>
      <p [innerHTML]="t('privacy.whoBody', { controller: t('privacy.controller'), email: emailLink })"></p>

      <h4>{{ t('privacy.what') }}</h4>
      <ul>
        <li>{{ t('privacy.what1') }}</li>
        <li>{{ t('privacy.what2') }}</li>
        <li>{{ t('privacy.what3') }}</li>
        <li>{{ t('privacy.what4') }}</li>
        <li>{{ t('privacy.what5') }}</li>
      </ul>
      <p [innerHTML]="t('privacy.whatNot')"></p>
      <p>{{ t('privacy.sensitive') }}</p>

      <h4>{{ t('privacy.why') }}</h4>
      <ul>
        <li [innerHTML]="t('privacy.why1')"></li>
        <li [innerHTML]="t('privacy.why2')"></li>
      </ul>
      <p>{{ t('privacy.legal') }}</p>

      <h4>{{ t('privacy.where') }}</h4>
      <p>{{ t('privacy.whereBody') }}</p>

      <h4>{{ t('privacy.retention') }}</h4>
      <p>{{ t('privacy.retentionBody', { years: years }) }}</p>

      <h4>{{ t('privacy.rights') }}</h4>
      <p [innerHTML]="t('privacy.rightsBody', { email: emailLink })"></p>
      <p>{{ t('privacy.complaint') }}</p>

      <h4>{{ t('privacy.age') }}</h4>
      <p>{{ t('privacy.ageBody') }}</p>
    </div>
  `,
})
export class PrivacyNotice {
  private readonly i18n = inject(I18n);
  protected readonly years = PRIVACY.retentionYears;
  protected readonly emailLink = `<a href="mailto:${PRIVACY.contactEmail}">${PRIVACY.contactEmail}</a>`;
  protected readonly updated = computed(() =>
    new Date(PRIVACY.lastUpdated + 'T12:00:00').toLocaleDateString(this.i18n.lang(), { dateStyle: 'long' }),
  );
  protected t(key: string, params?: Record<string, string | number>) {
    return this.i18n.t(key, params);
  }
}
