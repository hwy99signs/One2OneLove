import { supabase } from './supabase';

const buckets = {
  influencer: 'influencer-photos',
  professional: 'professional-photos',
};

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const maxBytes = 5 * 1024 * 1024;

export const uploadPartnerProfilePhoto = async (partnerType, file) => {
  if (!file) return { success: false, error: 'no_file' };
  const bucket = buckets[partnerType];
  if (!bucket) return { success: false, error: 'invalid_partner_type' };
  if (!allowedTypes.has(file.type) || file.size <= 0 || file.size > maxBytes) {
    return { success: false, error: 'invalid_image' };
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;
  if (authError || !user) return { success: false, error: 'authentication_required' };

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const objectPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(objectPath, file, { upsert: false, contentType: file.type });

  if (uploadError) return { success: false, error: 'upload_failed' };

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  if (!data?.publicUrl) {
    await supabase.storage.from(bucket).remove([objectPath]);
    return { success: false, error: 'url_failed' };
  }

  return { success: true, publicUrl: data.publicUrl, objectPath };
};
