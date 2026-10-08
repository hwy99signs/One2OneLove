// @ts-nocheck
//
// One2OneLove "Credit" configuration — the single config table for the
// Love Note SMS Credit system (spec: love-note-pricing-final-spec-2026-10-07).
//
// The user currency is Credit, denominated in plain US dollars and cents.
// The wallet's integer unit IS one US cent (1 Credit cent = $0.01); balances
// display as money ($2, $5, $7.75). There is no conversion rate anywhere.
//
// EVERY price, threshold and exclusion for Love Note SMS lives in this file.
// Changing a price (for example the Africa price, which is a config default
// pending Eisenhower's flip decision) is a one-line change here.

export const SMS_FOOTER = '\n\n❤️ One2OneLove';

export const CREDIT_CONFIG = {
  currencyName: 'Credit',
  unit: 'USD_CENTS',
  // Purchased Credit expiry: NOT decided by Eisenhower. Default built per
  // directive: purchased Credit never expires while this flag stays false.
  creditExpires: false,

  // Total SMS body (title + "\n\n" + content + footer) hard cap, in
  // characters (code points, same measure as o2ol-cost-ledger countCharacters).
  // 201 chars of Unicode (GSM-7 is impossible once the ❤️ footer is present)
  // is a hard maximum of 3 SMS segments.
  maxSmsBodyCharacters: 201,

  // First-free-send promo: monthly pot. Closes for the month when EITHER the
  // slot cap is reached OR the pot is empty (first hit). Unspent pot balance
  // rolls into the next month on top of the new monthly amount; unused
  // account slots NEVER roll over. One redemption per verified PHONE NUMBER
  // and one per account, ever. No burn test on the promo send.
  promo: {
    monthlyPotCents: 5000,
    monthlySlots: 100,
  },

  // Weekly free note: rolling 7-day average balance >= tier base AND
  // >= $2.50/week paid Credit burned on ANY feature (deposits/replenishments
  // never count as burn). Free notes per week scale with the average-balance
  // tier: one free note per ladder unit of average balance, up to 4.
  // Middle East accounts climb on a $10 unit instead of $5.
  weekly: {
    windowDays: 7,
    burnThresholdCents: 250,
    baseBalanceCents: 500,
    ladderUnitCents: 500,
    middleEastBaseBalanceCents: 1000,
    middleEastLadderUnitCents: 1000,
    maxFreePerWeek: 4,
  },

  autoReplenish: {
    // Fire when the balance falls to/below the trigger; default reload is the
    // $10 package; the $5 package remains a user-selectable option.
    triggerCents: 500,
    defaultPackageCode: 'credit_10',
    // Applied when a user enables auto-replenish without choosing a cap.
    defaultMonthlyCapCents: 5000,
  },

  // Per-account send rate limits for One2OneLove-delivered SMS.
  rateLimits: {
    sendsPerHour: 30,
    sendsPerDay: 200,
  },

  // Regional pricelist per delivered SMS Love Note. Destination is resolved
  // from the RECIPIENT's country calling code. estCostCents is the worst-case
  // (3-segment, highest-rate market in the region) provider cost from the
  // 2026-10-07 verification against Twilio's official per-country pages; it is
  // what the promo pot is debited per redemption so the $50 cap is a hard cap.
  regions: {
    USCA: { label: 'USA & Canada', priceCents: 29, estCostCents: 4 },
    UK: { label: 'United Kingdom', priceCents: 39, estCostCents: 17 },
    EU: { label: 'Europe', priceCents: 59, estCostCents: 34 },
    OC: { label: 'Oceania', priceCents: 39, estCostCents: 16 },
    AS: { label: 'Asia', priceCents: 69, estCostCents: 27 },
    LATAM: { label: 'Latin America & Caribbean', priceCents: 79, estCostCents: 75 },
    // CONFIG DEFAULT $1.49 — pending Eisenhower's flip decision ($1.49 for
    // the region vs $0.79 for South Africa + Morocco only). One-line change.
    AF: { label: 'Africa', priceCents: 149, estCostCents: 119 },
    ME: { label: 'Middle East', priceCents: 99, estCostCents: 95 },
  },

  // Countries where SMS is never offered at the regional price (3-segment
  // cost >= price, verified 2026-10-07): members are steered to the free
  // WhatsApp / email / social share routes instead.
  excludedCountries: ['PH', 'ID', 'VN', 'MY', 'PK'],
};

// [callingCodePrefix, isoCountry, regionCode]
// Longest-prefix match wins (so NANP Caribbean area codes beat the bare "1").
// Any calling code not listed here resolves to NO region: SMS is not offered
// (fail closed — steered to the free share routes), which also implements the
// spec rule that any country whose cost exceeds its region price is excluded.
const CALLING_CODE_TABLE = [
  // NANP — USA & Canada default; US territories stay USCA; Caribbean = LATAM.
  ['1', 'US', 'USCA'],
  ['1240', 'US', 'USCA'], ['1201', 'US', 'USCA'],
  ['1340', 'VI', 'USCA'], ['1670', 'MP', 'USCA'], ['1671', 'GU', 'USCA'],
  ['1684', 'AS', 'USCA'], ['1787', 'PR', 'USCA'], ['1939', 'PR', 'USCA'],
  ['1242', 'BS', 'LATAM'], ['1246', 'BB', 'LATAM'], ['1268', 'AG', 'LATAM'],
  ['1284', 'VG', 'LATAM'], ['1345', 'KY', 'LATAM'], ['1441', 'BM', 'LATAM'],
  ['1473', 'GD', 'LATAM'], ['1649', 'TC', 'LATAM'], ['1664', 'MS', 'LATAM'],
  ['1721', 'SX', 'LATAM'], ['1758', 'LC', 'LATAM'], ['1767', 'DM', 'LATAM'],
  ['1784', 'VC', 'LATAM'], ['1809', 'DO', 'LATAM'], ['1829', 'DO', 'LATAM'],
  ['1849', 'DO', 'LATAM'], ['1868', 'TT', 'LATAM'], ['1869', 'KN', 'LATAM'],
  ['1876', 'JM', 'LATAM'], ['1658', 'JM', 'LATAM'],
  // United Kingdom (+44, incl. Crown dependencies)
  ['44', 'GB', 'UK'],
  // Europe
  ['30', 'GR', 'EU'], ['31', 'NL', 'EU'], ['32', 'BE', 'EU'], ['33', 'FR', 'EU'],
  ['34', 'ES', 'EU'], ['36', 'HU', 'EU'], ['39', 'IT', 'EU'], ['40', 'RO', 'EU'],
  ['41', 'CH', 'EU'], ['43', 'AT', 'EU'], ['45', 'DK', 'EU'], ['46', 'SE', 'EU'],
  ['47', 'NO', 'EU'], ['48', 'PL', 'EU'], ['49', 'DE', 'EU'], ['90', 'TR', 'EU'],
  ['350', 'GI', 'EU'], ['351', 'PT', 'EU'], ['352', 'LU', 'EU'], ['353', 'IE', 'EU'],
  ['354', 'IS', 'EU'], ['355', 'AL', 'EU'], ['356', 'MT', 'EU'], ['358', 'FI', 'EU'],
  ['359', 'BG', 'EU'], ['370', 'LT', 'EU'], ['371', 'LV', 'EU'], ['372', 'EE', 'EU'],
  ['373', 'MD', 'EU'], ['375', 'BY', 'EU'], ['376', 'AD', 'EU'], ['377', 'MC', 'EU'],
  ['378', 'SM', 'EU'], ['380', 'UA', 'EU'], ['381', 'RS', 'EU'], ['382', 'ME', 'EU'],
  ['383', 'XK', 'EU'], ['385', 'HR', 'EU'], ['386', 'SI', 'EU'], ['387', 'BA', 'EU'],
  ['389', 'MK', 'EU'], ['420', 'CZ', 'EU'], ['421', 'SK', 'EU'], ['423', 'LI', 'EU'],
  ['357', 'CY', 'EU'],
  // Middle East
  ['961', 'LB', 'ME'], ['962', 'JO', 'ME'], ['963', 'SY', 'ME'], ['964', 'IQ', 'ME'],
  ['965', 'KW', 'ME'], ['966', 'SA', 'ME'], ['967', 'YE', 'ME'], ['968', 'OM', 'ME'],
  ['970', 'PS', 'ME'], ['971', 'AE', 'ME'], ['972', 'IL', 'ME'], ['973', 'BH', 'ME'],
  ['974', 'QA', 'ME'],
  // Asia (PH/ID/VN/MY/PK resolve here and are then excluded by country)
  ['7', 'RU', 'AS'],
  ['60', 'MY', 'AS'], ['62', 'ID', 'AS'], ['63', 'PH', 'AS'], ['65', 'SG', 'AS'],
  ['66', 'TH', 'AS'], ['81', 'JP', 'AS'], ['82', 'KR', 'AS'], ['84', 'VN', 'AS'],
  ['86', 'CN', 'AS'], ['91', 'IN', 'AS'], ['92', 'PK', 'AS'], ['93', 'AF', 'AS'],
  ['94', 'LK', 'AS'], ['95', 'MM', 'AS'],
  ['374', 'AM', 'AS'], ['994', 'AZ', 'AS'], ['995', 'GE', 'AS'],
  ['852', 'HK', 'AS'], ['853', 'MO', 'AS'], ['855', 'KH', 'AS'], ['856', 'LA', 'AS'],
  ['880', 'BD', 'AS'], ['886', 'TW', 'AS'], ['960', 'MV', 'AS'], ['977', 'NP', 'AS'],
  ['673', 'BN', 'AS'], ['670', 'TL', 'AS'],
  // Latin America (mainland)
  ['51', 'PE', 'LATAM'], ['52', 'MX', 'LATAM'], ['53', 'CU', 'LATAM'],
  ['54', 'AR', 'LATAM'], ['55', 'BR', 'LATAM'], ['56', 'CL', 'LATAM'],
  ['57', 'CO', 'LATAM'], ['58', 'VE', 'LATAM'],
  ['502', 'GT', 'LATAM'], ['503', 'SV', 'LATAM'], ['504', 'HN', 'LATAM'],
  ['505', 'NI', 'LATAM'], ['506', 'CR', 'LATAM'], ['507', 'PA', 'LATAM'],
  ['509', 'HT', 'LATAM'], ['591', 'BO', 'LATAM'], ['592', 'GY', 'LATAM'],
  ['593', 'EC', 'LATAM'], ['594', 'GF', 'LATAM'], ['595', 'PY', 'LATAM'],
  ['597', 'SR', 'LATAM'], ['598', 'UY', 'LATAM'], ['590', 'GP', 'LATAM'],
  ['596', 'MQ', 'LATAM'], ['599', 'CW', 'LATAM'], ['297', 'AW', 'LATAM'],
  // Oceania
  ['61', 'AU', 'OC'], ['64', 'NZ', 'OC'],
  ['672', 'NF', 'OC'], ['674', 'NR', 'OC'], ['675', 'PG', 'OC'], ['676', 'TO', 'OC'],
  ['677', 'SB', 'OC'], ['678', 'VU', 'OC'], ['679', 'FJ', 'OC'], ['682', 'CK', 'OC'],
  ['683', 'NU', 'OC'], ['685', 'WS', 'OC'], ['686', 'KI', 'OC'], ['687', 'NC', 'OC'],
  ['688', 'TV', 'OC'], ['689', 'PF', 'OC'], ['690', 'TK', 'OC'], ['691', 'FM', 'OC'],
  ['692', 'MH', 'OC'],
  // Africa
  ['20', 'EG', 'AF'], ['27', 'ZA', 'AF'],
  ['211', 'SS', 'AF'], ['212', 'MA', 'AF'], ['213', 'DZ', 'AF'], ['216', 'TN', 'AF'],
  ['218', 'LY', 'AF'], ['220', 'GM', 'AF'], ['221', 'SN', 'AF'], ['222', 'MR', 'AF'],
  ['223', 'ML', 'AF'], ['224', 'GN', 'AF'], ['225', 'CI', 'AF'], ['226', 'BF', 'AF'],
  ['227', 'NE', 'AF'], ['228', 'TG', 'AF'], ['229', 'BJ', 'AF'], ['230', 'MU', 'AF'],
  ['231', 'LR', 'AF'], ['232', 'SL', 'AF'], ['233', 'GH', 'AF'], ['234', 'NG', 'AF'],
  ['235', 'TD', 'AF'], ['236', 'CF', 'AF'], ['237', 'CM', 'AF'], ['238', 'CV', 'AF'],
  ['239', 'ST', 'AF'], ['240', 'GQ', 'AF'], ['241', 'GA', 'AF'], ['242', 'CG', 'AF'],
  ['243', 'CD', 'AF'], ['244', 'AO', 'AF'], ['245', 'GW', 'AF'], ['248', 'SC', 'AF'],
  ['249', 'SD', 'AF'], ['250', 'RW', 'AF'], ['251', 'ET', 'AF'], ['252', 'SO', 'AF'],
  ['253', 'DJ', 'AF'], ['254', 'KE', 'AF'], ['255', 'TZ', 'AF'], ['256', 'UG', 'AF'],
  ['257', 'BI', 'AF'], ['258', 'MZ', 'AF'], ['260', 'ZM', 'AF'], ['261', 'MG', 'AF'],
  ['262', 'YT', 'AF'], ['263', 'ZW', 'AF'], ['264', 'NA', 'AF'], ['265', 'MW', 'AF'],
  ['266', 'LS', 'AF'], ['267', 'BW', 'AF'], ['268', 'SZ', 'AF'], ['269', 'KM', 'AF'],
  ['290', 'SH', 'AF'], ['291', 'ER', 'AF'],
];

const SORTED_CALLING_CODES = [...CALLING_CODE_TABLE].sort((a, b) => b[0].length - a[0].length);

// Resolve an E.164 phone number to its SMS pricing region.
// Returns { country, region, regionLabel, priceCents, estCostCents } or, when
// SMS is not offered, { country, region:null, excluded:true, reason }.
export function resolveSmsRegion(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return { country: null, region: null, excluded: true, reason: 'invalid_phone' };
  for (const [prefix, country, region] of SORTED_CALLING_CODES) {
    if (digits.startsWith(prefix)) {
      if (CREDIT_CONFIG.excludedCountries.includes(country)) {
        return { country, region: null, excluded: true, reason: 'country_excluded' };
      }
      const def = CREDIT_CONFIG.regions[region];
      return {
        country,
        region,
        regionLabel: def.label,
        priceCents: def.priceCents,
        estCostCents: def.estCostCents,
        excluded: false,
      };
    }
  }
  return { country: null, region: null, excluded: true, reason: 'country_not_offered' };
}

// The account's own region (from the member's verified phone number) decides
// which weekly-balance tier base applies: Middle East accounts use $10.
export function accountTierBaseCents(phone) {
  const resolved = resolveSmsRegion(phone);
  if (resolved.region === 'ME') {
    return {
      region: 'ME',
      baseBalanceCents: CREDIT_CONFIG.weekly.middleEastBaseBalanceCents,
      ladderUnitCents: CREDIT_CONFIG.weekly.middleEastLadderUnitCents,
    };
  }
  return {
    region: resolved.region || null,
    baseBalanceCents: CREDIT_CONFIG.weekly.baseBalanceCents,
    ladderUnitCents: CREDIT_CONFIG.weekly.ladderUnitCents,
  };
}

// Full SMS body exactly as Twilio sends it. When senderName is given the
// note is SIGNED (the default): the name sits at the foot of the note,
// directly above the One2OneLove sign-off. The signature lives INSIDE the
// 201-char body cap (owner ruling, 2026-10-08): signing adds exactly the
// name's characters plus 3 — the "—", the space after it, and the line
// break before the ❤️ sign-off. No senderName (Send Anonymous) composes
// exactly the unsigned body.
export function smsBodyFor(title, content, senderName = null) {
  const name = String(senderName || '').replace(/\s+/g, ' ').trim();
  if (!name) return `${title}\n\n${content}${SMS_FOOTER}`;
  return `${title}\n\n${content}\n\n— ${name}\n❤️ One2OneLove`;
}

export function publicPriceTable() {
  return Object.entries(CREDIT_CONFIG.regions).map(([code, def]) => ({
    region: code,
    label: def.label,
    priceCents: def.priceCents,
  }));
}
