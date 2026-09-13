import { supabase, handleSupabaseError } from './supabase';
import { createTherapistProfile } from './therapistService';
import { createProfessionalProfile } from './professionalService';
import { createInfluencerProfile } from './influencerService';

const MODE_CONFIG = {
  licensed: {
    userType: 'therapist',
    professionalKind: 'licensed_therapist_counselor',
    photoBucket: 'therapist-photos',
  },
  coach: {
    userType: 'professional',
    professionalKind: 'relationship_coach_educator',
    photoBucket: 'professional-photos',
  },
  contributor: {
    userType: 'influencer',
    professionalKind: 'creator_media_contributor',
    photoBucket: 'influencer-photos',
  },
  organization: {
    userType: 'professional',
    professionalKind: 'organization_professional_partner',
    photoBucket: 'professional-photos',
  },
};

function cleanApplicationData(application = {}) {
  const cleaned = { ...application };
  delete cleaned.password;
  delete cleaned.confirmPassword;
  delete cleaned.profilePhotoFile;
  return cleaned;
}

function locationLabel(application = {}) {
  return [application.city, application.region, application.country]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .join(', ');
}

function buildProfessionalServiceDescription(application = {}) {
  const pieces = [];
  if (application.specialties?.length) pieces.push(`Specialties: ${application.specialties.join(', ')}`);
  if (application.serviceFormats?.length) pieces.push(`Formats: ${application.serviceFormats.join(', ')}`);
  if (application.serviceDescription) pieces.push(application.serviceDescription);
  if (application.partnershipInterests?.length) pieces.push(`Partnership interests: ${application.partnershipInterests.join(', ')}`);
  return pieces.join(' | ').slice(0, 500);
}

function parsePlatformLinks(text = '') {
  return String(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((acc, line, index) => {
      const separator = line.indexOf(':');
      if (separator > 0 && !line.startsWith('http')) {
        const label = line.slice(0, separator).trim() || `platform_${index + 1}`;
        const url = line.slice(separator + 1).trim();
        if (url) acc[label] = url;
      } else {
        acc[`platform_${index + 1}`] = line;
      }
      return acc;
    }, {});
}

export async function uploadProfessionalProfilePhoto(file, mode) {
  if (!file) return null;
  const config = MODE_CONFIG[mode];
  if (!config) throw new Error('Invalid professional application type');

  const extension = file.name?.split('.').pop() || 'jpg';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const filePath = `${config.professionalKind}/${safeName}`;

  const { error } = await supabase.storage
    .from(config.photoBucket)
    .upload(filePath, file, { upsert: false });

  if (error) throw error;

  const { data } = supabase.storage
    .from(config.photoBucket)
    .getPublicUrl(filePath);

  return data?.publicUrl || null;
}

export async function submitProfessionalApplication(mode, account, application) {
  try {
    const config = MODE_CONFIG[mode];
    if (!config) throw new Error('Invalid professional application type');

    const fullName = `${account.firstName} ${account.lastName}`.trim();
    const applicationData = cleanApplicationData(application);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: account.email,
      password: account.password,
      options: {
        data: {
          name: fullName,
          user_type: config.userType,
          professional_kind: config.professionalKind,
          professional_application: applicationData,
        },
      },
    });

    if (authError) {
      return { success: false, error: handleSupabaseError(authError) };
    }

    if (!authData?.user) {
      return { success: false, error: 'Registration failed' };
    }

    const isEmailConfirmed = authData.user.email_confirmed_at !== null;

    const { error: userProfileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: account.email,
        name: fullName,
        user_type: config.userType,
        location: locationLabel(application) || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (userProfileError && userProfileError.code !== '23505') {
      console.error('Professional onboarding user profile error:', userProfileError);
    }

    let profileResult;

    if (mode === 'licensed') {
      profileResult = await createTherapistProfile(authData.user.id, {
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        phone: application.phone,
        licensedCountries: application.licenseCountry ? [application.licenseCountry] : [],
        licensedStates: application.licenseRegion ? [application.licenseRegion] : [],
        therapyTypes: application.serviceFormats || [],
        specializations: application.specialties || [],
        certifications: application.certifications || [],
        yearsExperience: application.yearsExperience,
        consultationFee: application.consultationFee,
        professionalBio: application.bio,
        socialMediaPlatforms: parsePlatformLinks(application.platformLinksText),
        profilePhotoUrl: application.profilePhotoUrl,
        emailVerified: isEmailConfirmed,
        phoneVerified: false,
        licenseNumber: application.licenseNumber,
      });
    } else if (mode === 'contributor') {
      profileResult = await createInfluencerProfile(authData.user.id, {
        firstName: account.firstName,
        lastName: account.lastName,
        phone: application.phone,
        totalFollowerCount: application.followerCount,
        platformLinks: parsePlatformLinks(application.platformLinksText),
        contentCategories: application.contentCategories || [],
        collaborationTypes: application.collaborationTypes || [],
        mediaKitUrl: application.mediaKitUrl,
        bio: application.bio,
        profilePhotoUrl: application.profilePhotoUrl,
        emailVerified: isEmailConfirmed,
        phoneVerified: false,
      });
    } else {
      const organizationName = mode === 'organization'
        ? application.organizationName
        : (application.businessName || application.professionalDisplayName || fullName);

      profileResult = await createProfessionalProfile(authData.user.id, {
        firstName: account.firstName,
        lastName: account.lastName,
        phone: application.phone,
        organizationName,
        practiceType: mode === 'organization'
          ? (application.organizationType || 'organization_partner')
          : (application.professionalTitle || 'relationship_coach_educator'),
        serviceDescription: buildProfessionalServiceDescription(application),
        websiteUrl: application.websiteUrl,
        professionalBio: application.bio,
        profilePhotoUrl: application.profilePhotoUrl,
        emailVerified: isEmailConfirmed,
        phoneVerified: false,
      });
    }

    if (!profileResult?.success) {
      return {
        success: false,
        accountCreated: true,
        requiresEmailVerification: !isEmailConfirmed,
        error: profileResult?.error || 'Account created, but the professional application profile could not be completed.',
      };
    }

    return {
      success: true,
      user: authData.user,
      profile: profileResult.profile,
      requiresEmailVerification: !isEmailConfirmed,
      status: 'pending',
    };
  } catch (error) {
    console.error('Professional onboarding error:', error);
    return { success: false, error: handleSupabaseError(error) };
  }
}
