import fs from 'node:fs';

const failures = [];
const read = (path) => fs.readFileSync(path, 'utf8');

const contracts = [
  {
    file: 'supabase/functions/privacy-request/index.ts',
    required: "Deno.env.get('PRIVACY_REQUEST_ALLOWED_ORIGINS')",
    forbidden: ['SUPPORT_REQUEST_ALLOWED_ORIGINS', 'CREATOR_PROGRAMMING_ALLOWED_ORIGINS', 'MEMBER_SAFETY_ALLOWED_ORIGINS', 'PROFESSIONAL_APPLICATION_REVIEW_ALLOWED_ORIGINS'],
  },
  {
    file: 'supabase/functions/manage-privacy-requests/index.ts',
    required: "Deno.env.get('PRIVACY_REQUEST_ALLOWED_ORIGINS')",
    forbidden: ['SUPPORT_REQUEST_ALLOWED_ORIGINS', 'CREATOR_PROGRAMMING_ALLOWED_ORIGINS', 'MEMBER_SAFETY_ALLOWED_ORIGINS', 'PROFESSIONAL_APPLICATION_REVIEW_ALLOWED_ORIGINS'],
  },
  {
    file: 'supabase/functions/support-request/index.ts',
    required: "Deno.env.get('SUPPORT_REQUEST_ALLOWED_ORIGINS')",
    forbidden: ['PRIVACY_REQUEST_ALLOWED_ORIGINS', 'CREATOR_PROGRAMMING_ALLOWED_ORIGINS', 'MEMBER_SAFETY_ALLOWED_ORIGINS', 'PROFESSIONAL_APPLICATION_REVIEW_ALLOWED_ORIGINS'],
  },
  {
    file: 'supabase/functions/manage-support-requests/index.ts',
    required: "Deno.env.get('SUPPORT_REQUEST_ALLOWED_ORIGINS')",
    forbidden: ['PRIVACY_REQUEST_ALLOWED_ORIGINS', 'CREATOR_PROGRAMMING_ALLOWED_ORIGINS', 'MEMBER_SAFETY_ALLOWED_ORIGINS', 'PROFESSIONAL_APPLICATION_REVIEW_ALLOWED_ORIGINS'],
  },
  {
    file: 'supabase/functions/member-block/index.ts',
    required: "Deno.env.get('MEMBER_SAFETY_ALLOWED_ORIGINS')",
    forbidden: ['PRIVACY_REQUEST_ALLOWED_ORIGINS', 'SUPPORT_REQUEST_ALLOWED_ORIGINS', 'CREATOR_PROGRAMMING_ALLOWED_ORIGINS', 'PROFESSIONAL_APPLICATION_REVIEW_ALLOWED_ORIGINS'],
  },
  {
    file: 'supabase/functions/list-blocked-members/index.ts',
    required: "Deno.env.get('MEMBER_SAFETY_ALLOWED_ORIGINS')",
    forbidden: ['PRIVACY_REQUEST_ALLOWED_ORIGINS', 'SUPPORT_REQUEST_ALLOWED_ORIGINS', 'CREATOR_PROGRAMMING_ALLOWED_ORIGINS', 'PROFESSIONAL_APPLICATION_REVIEW_ALLOWED_ORIGINS'],
  },
  {
    file: 'supabase/functions/discover-members/index.ts',
    required: "Deno.env.get('MEMBER_SAFETY_ALLOWED_ORIGINS')",
    forbidden: ['PRIVACY_REQUEST_ALLOWED_ORIGINS', 'SUPPORT_REQUEST_ALLOWED_ORIGINS', 'CREATOR_PROGRAMMING_ALLOWED_ORIGINS', 'PROFESSIONAL_APPLICATION_REVIEW_ALLOWED_ORIGINS'],
  },
  {
    file: 'supabase/functions/manage-professional-applications/index.ts',
    required: "Deno.env.get('PROFESSIONAL_APPLICATION_REVIEW_ALLOWED_ORIGINS')",
    forbidden: ['PRIVACY_REQUEST_ALLOWED_ORIGINS', 'SUPPORT_REQUEST_ALLOWED_ORIGINS', 'CREATOR_PROGRAMMING_ALLOWED_ORIGINS', 'MEMBER_SAFETY_ALLOWED_ORIGINS'],
  },
];

for (const contract of contracts) {
  const source = read(contract.file);
  if (!source.includes(contract.required)) {
    failures.push(`${contract.file}: missing dedicated origin configuration ${contract.required}.`);
  }
  for (const token of contract.forbidden) {
    if (source.includes(token)) {
      failures.push(`${contract.file}: must not inherit unrelated origin configuration ${token}.`);
    }
  }
  if (!source.includes("if (!configuredOrigins().has(origin)) return json(request, { error: 'ORIGIN_NOT_ALLOWED' }, 403)")) {
    failures.push(`${contract.file}: missing explicit origin rejection before private feature handling.`);
  }
  if (!source.includes("return new Set(values.length ? values : [DEFAULT_ORIGIN])")) {
    failures.push(`${contract.file}: missing narrow production-origin default when dedicated allowlist is unset.`);
  }
}

if (failures.length) {
  console.error('\nPrivate feature origin-isolation blockers:');
  failures.forEach((failure) => console.error(` - ${failure}`));
  process.exit(1);
}

console.log('Private feature origin-isolation preflight passed: Privacy, Support, Member Safety and professional-review endpoints use independent origin allowlists with a narrow default.');
