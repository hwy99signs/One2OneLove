import { supabase } from './supabase';

export const PROFESSIONAL_APPLICATION_REVIEW_ENABLED =
  import.meta.env.VITE_PROFESSIONAL_APPLICATION_REVIEW_ENABLED === 'true';

const invokeReview = async (body) => {
  if (!PROFESSIONAL_APPLICATION_REVIEW_ENABLED) {
    return { enabled: false, eligible: false, applications: [] };
  }

  const { data, error } = await supabase.functions.invoke('manage-professional-applications', { body });
  if (error || data?.error) {
    const code = data?.error || error?.message || 'O2OL_PRO_APPLICATION_REVIEW_FAILED';
    const enriched = new Error(code);
    enriched.code = code;
    throw enriched;
  }
  return data || {};
};

export const getProfessionalApplicationReviewAccess = async () =>
  invokeReview({ action: 'access' });

export const listProfessionalApplicationsForReview = async ({ status = '', applicationType = '' } = {}) => {
  const data = await invokeReview({ action: 'list', status, application_type: applicationType });
  return data.applications || [];
};

export const getProfessionalApplicationForReview = async (applicationId) => {
  const data = await invokeReview({ action: 'get', application_id: applicationId });
  return data.application || null;
};

const reviewAction = async (applicationId, action, reviewNotes = '') => {
  const data = await invokeReview({
    action,
    application_id: applicationId,
    review_notes: reviewNotes,
  });
  return data.application || null;
};

export const startProfessionalApplicationReview = (applicationId) =>
  reviewAction(applicationId, 'start');

export const approveProfessionalApplicationReview = (applicationId, reviewNotes = '') =>
  reviewAction(applicationId, 'approve', reviewNotes);

export const rejectProfessionalApplicationReview = (applicationId, reviewNotes) =>
  reviewAction(applicationId, 'reject', reviewNotes);

export const reopenProfessionalApplicationReview = (applicationId, reviewNotes = '') =>
  reviewAction(applicationId, 'reopen', reviewNotes);
