import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { I18n } from '../i18n/i18n.service';
import { Profile } from '../models';
import { EDUCATION, FAMILIARITY, GENDERS, MOODS, countries, languages } from '../options';
import { TestService } from '../test.service';

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule],
  template: `
    <section class="panel">
      <h2>{{ i18n.t('profile.title') }}</h2>
      <p class="muted">{{ i18n.t('profile.subtitle') }}</p>

      <form [formGroup]="form" (ngSubmit)="next()">
        <div class="grid">
          <label>{{ i18n.t('profile.age') }}
            <input type="number" formControlName="age" min="18" max="120" inputmode="numeric" />
          </label>

          <label>{{ i18n.t('profile.gender') }}
            <select formControlName="gender">
              <option value="" disabled>{{ i18n.t('common.select') }}</option>
              @for (v of genders; track v) { <option [value]="v">{{ i18n.t('gender.' + v) }}</option> }
            </select>
          </label>

          <label>{{ i18n.t('profile.nationality') }}
            <select formControlName="nationality">
              <option value="" disabled>{{ i18n.t('common.select') }}</option>
              @for (o of countryList(); track o.value) { <option [value]="o.value">{{ o.label }}</option> }
            </select>
          </label>

          <label>{{ i18n.t('profile.residence') }}
            <select formControlName="countryOfResidence">
              <option value="" disabled>{{ i18n.t('common.select') }}</option>
              @for (o of countryList(); track o.value) { <option [value]="o.value">{{ o.label }}</option> }
            </select>
          </label>

          <label>{{ i18n.t('profile.nativeLanguage') }}
            <select formControlName="nativeLanguage">
              <option value="" disabled>{{ i18n.t('common.select') }}</option>
              @for (o of languageList(); track o.value) { <option [value]="o.value">{{ o.label }}</option> }
              <option value="other">{{ i18n.t('language.other') }}</option>
            </select>
          </label>

          <label>{{ i18n.t('profile.education') }}
            <select formControlName="education">
              <option value="" disabled>{{ i18n.t('common.select') }}</option>
              @for (v of education; track v) { <option [value]="v">{{ i18n.t('education.' + v) }}</option> }
            </select>
          </label>

          <label class="full">{{ i18n.t('profile.occupation') }} <span class="muted">{{ i18n.t('profile.optional') }}</span>
            <input type="text" formControlName="occupation" maxlength="100" [placeholder]="i18n.t('profile.occupationPlaceholder')" />
          </label>

          <label class="full">{{ i18n.t('profile.familiarity') }}
            <select formControlName="familiarity">
              <option value="" disabled>{{ i18n.t('common.select') }}</option>
              @for (v of familiarity; track v) { <option [value]="v">{{ i18n.t('familiarity.' + v) }}</option> }
            </select>
          </label>
        </div>

        <fieldset class="mood">
          <legend>{{ i18n.t('profile.mood') }}</legend>
          @for (m of moods; track m.value) {
            <label [class.selected]="form.controls.mood.value === m.value" [title]="i18n.t('mood.' + m.value)">
              <input type="radio" formControlName="mood" [value]="m.value" [attr.aria-label]="i18n.t('mood.' + m.value)" />
              {{ m.emoji }}
            </label>
          }
        </fieldset>

        @if (form.controls.age.touched && form.controls.age.invalid) {
          <p class="error">{{ i18n.t('profile.ageError') }}</p>
        }

        <div class="actions">
          <button type="button" (click)="test.step.set('intro')">{{ i18n.t('common.back') }}</button>
          <button class="primary" type="submit" [disabled]="form.invalid">{{ i18n.t('common.continue') }}</button>
        </div>
      </form>
    </section>
  `,
})
export class ProfileStep {
  protected readonly test = inject(TestService);
  protected readonly i18n = inject(I18n);
  protected readonly countryList = computed(() => countries(this.i18n.lang()));
  protected readonly languageList = computed(() => languages(this.i18n.lang()));
  protected readonly genders = GENDERS;
  protected readonly education = EDUCATION;
  protected readonly familiarity = FAMILIARITY;
  protected readonly moods = MOODS;

  private readonly saved = this.test.profile();

  protected readonly form = inject(FormBuilder).nonNullable.group({
    age: [this.saved?.age ?? (null as unknown as number), [Validators.required, Validators.min(18), Validators.max(120)]],
    gender: [this.saved?.gender ?? '', Validators.required],
    nationality: [this.saved?.nationality ?? '', Validators.required],
    countryOfResidence: [this.saved?.countryOfResidence ?? '', Validators.required],
    nativeLanguage: [this.saved?.nativeLanguage ?? '', Validators.required],
    education: [this.saved?.education ?? '', Validators.required],
    occupation: [this.saved?.occupation ?? ''],
    familiarity: [this.saved?.familiarity ?? '', Validators.required],
    mood: [this.saved?.mood ?? (null as unknown as number), Validators.required],
  });

  next() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const profile: Profile = { ...v, age: Math.round(Number(v.age)), occupation: v.occupation.trim() };
    this.test.profile.set(profile);
    this.test.step.set('cards');
  }
}
