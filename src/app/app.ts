import { Component, inject, signal } from '@angular/core';
import { I18n, LANGS } from './i18n/i18n.service';
import { CardsStep } from './steps/cards';
import { Intro } from './steps/intro';
import { PrivacyNotice } from './steps/privacy-notice';
import { ProfileStep } from './steps/profile';
import { ReflectionStep } from './steps/reflection';
import { ResultsStep } from './steps/results';
import { TestService } from './test.service';

@Component({
  selector: 'app-root',
  imports: [PrivacyNotice, Intro, ProfileStep, CardsStep, ReflectionStep, ResultsStep],
  templateUrl: './app.html',
})
export class App {
  protected readonly test = inject(TestService);
  protected readonly i18n = inject(I18n);
  protected readonly langs = LANGS;
  protected readonly showPrivacy = signal(false);
}
