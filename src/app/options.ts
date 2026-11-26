// Option values are stored in Firestore; labels come from the i18n dictionaries.

// ISO 3166-1 alpha-2 codes. Names are shown in the selected UI language via Intl.DisplayNames.
const COUNTRY_CODES = `AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UY UZ VU VE VN VG VI WF EH YE ZM ZW`.split(' ');

const LANGUAGE_CODES = `ar bn bg ca zh hr cs da nl en et fil fi fr de el gu he hi hu id it ja kn ko lv lt ms ml mr no fa pl pt pa ro ru sr sk sl es sw sv ta te th tr uk ur vi yo zu`.split(' ');

export interface Option<T = string> {
  value: T;
  label: string;
}

function named(codes: string[], lang: string, type: 'region' | 'language'): Option[] {
  const names = new Intl.DisplayNames([lang, 'en'], { type });
  return codes
    .map((code) => ({ value: code, label: names.of(code) ?? code }))
    .sort((a, b) => a.label.localeCompare(b.label, lang));
}

export const countries = (lang: string) => named(COUNTRY_CODES, lang, 'region');
export const languages = (lang: string) => named(LANGUAGE_CODES, lang, 'language');

export const GENDERS = ['female', 'male', 'non-binary', 'other', 'prefer-not-to-say'];
export const EDUCATION = ['primary', 'secondary', 'vocational', 'bachelor', 'master', 'doctorate', 'prefer-not-to-say'];
export const FAMILIARITY = ['never', 'heard', 'seen', 'taken'];
export const MOODS = [
  { value: 1, emoji: '😞' },
  { value: 2, emoji: '🙁' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😄' },
];
