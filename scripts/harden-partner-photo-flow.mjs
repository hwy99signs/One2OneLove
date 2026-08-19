import fs from 'node:fs';

const targets = [
  {
    file: 'src/pages/InfluencerSignup.jsx',
    type: 'influencer',
    serviceImport: "import { getInfluencerProfile, updateInfluencerProfile } from '@/lib/influencerService';",
    oldServiceImport: "import { getInfluencerProfile } from '@/lib/influencerService';",
    updateCall: "await updateInfluencerProfile(result.user.id, { profile_photo_url: photoResult.publicUrl });",
  },
  {
    file: 'src/pages/ProfessionalSignup.jsx',
    type: 'professional',
    serviceImport: "import { getProfessionalProfile, updateProfessionalProfile } from '@/lib/professionalService';",
    oldServiceImport: "import { getProfessionalProfile } from '@/lib/professionalService';",
    updateCall: "await updateProfessionalProfile(result.user.id, { profile_photo_url: photoResult.publicUrl });",
  },
];

for (const target of targets) {
  let source = fs.readFileSync(target.file, 'utf8');

  source = source.replace("import { supabase } from '@/lib/supabase';\n", '');
  if (!source.includes("import { uploadPartnerProfilePhoto } from '@/lib/partnerPhotoService';")) {
    source = source.replace(
      target.oldServiceImport,
      `${target.serviceImport}\nimport { uploadPartnerProfilePhoto } from '@/lib/partnerPhotoService';`,
    );
  }

  const uploadStart = source.indexOf('  const uploadPhoto = async (file) => {');
  const validateStart = source.indexOf('  const validate = () => {');
  if (uploadStart >= 0 && validateStart > uploadStart) {
    source = `${source.slice(0, uploadStart)}${source.slice(validateStart)}`;
  }

  source = source.replace(/\s*const photoUrl = await uploadPhoto\(photoFile\);\n/, '\n');
  source = source.replace('          profilePhotoUrl: photoUrl,', '          profilePhotoUrl: null,');

  const marker = "      setSignupComplete(true);";
  const insertion = `      if (photoFile) {\n        const photoResult = await uploadPartnerProfilePhoto('${target.type}', photoFile);\n        if (photoResult.success) {\n          ${target.updateCall}\n        }\n      }\n\n${marker}`;
  if (!source.includes(`uploadPartnerProfilePhoto('${target.type}', photoFile)`)) {
    source = source.replace(marker, insertion);
  }

  if (source.includes('uploadPhoto(photoFile)')) {
    throw new Error(`${target.file} still attempts pre-auth photo upload`);
  }
  if (!source.includes(`uploadPartnerProfilePhoto('${target.type}', photoFile)`)) {
    throw new Error(`${target.file} did not receive authenticated photo upload flow`);
  }

  fs.writeFileSync(target.file, source);
}

console.log('Partner photo signup flows hardened.');
