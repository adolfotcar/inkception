import { Component, inject, signal } from '@angular/core';
import { I18n } from '../i18n/i18n.service';
import { PRIVACY } from '../privacy';
import { TestService } from '../test.service';
import { PrivacyNotice } from './privacy-notice';

@Component({
  selector: 'app-intro',
  imports: [PrivacyNotice],
  template: `
    <section class="panel">
      <h1>Inkception</h1>
      <p class="lead">{{ i18n.t('intro.lead') }}</p>
      <ul class="tips">
        <li>{{ i18n.t('intro.tip1') }}</li>
        <li>{{ i18n.t('intro.tip2') }}</li>
        <li>{{ i18n.t('intro.tip3') }}</li>
      </ul>

      <div class="notice" [innerHTML]="i18n.t('intro.notDiagnosis')"></div>

      <div class="data-summary">
        <h2>{{ i18n.t('intro.dataTitle') }}</h2>
        <ul>
          <li [innerHTML]="i18n.t('intro.data1')"></li>
          <li [innerHTML]="i18n.t('intro.data2')"></li>
          <li [innerHTML]="i18n.t('intro.data3')"></li>
          <li [innerHTML]="i18n.t('intro.data4', { years: retention })"></li>
          <li [innerHTML]="i18n.t('intro.data5')"></li>
        </ul>
        <details>
          <summary>{{ i18n.t('intro.readFull') }}</summary>
          <app-privacy-notice />
        </details>
      </div>

      <label class="check">
        <input type="checkbox" [checked]="adult()" (change)="adult.set($any($event.target).checked)" />
        <span>{{ i18n.t('intro.adult') }}</span>
      </label>
      <label class="check">
        <input type="checkbox" [checked]="test.consent()" (change)="test.consent.set($any($event.target).checked)" />
        <span [innerHTML]="i18n.t('intro.consent')"></span>
      </label>

      <button class="primary" [disabled]="!adult() || !test.consent()" (click)="test.step.set('profile')">
        {{ i18n.t('intro.start') }}
      </button>
    </section>
  `,
})
export class Intro {
  protected readonly test = inject(TestService);
  protected readonly i18n = inject(I18n);
  protected readonly adult = signal(this.test.consent());
  protected readonly retention = PRIVACY.retentionYears;
}
