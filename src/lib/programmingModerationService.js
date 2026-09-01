import { supabase } from './supabase';

export const PROGRAMMING_MODERATION_ENABLED =
  import.meta.env.VITE_PROGRAMMING_MODERATION_ENABLED === 'true';

const ERROR = {
  disabled: 'O2OL_PROGRAMMING_MODERATION_DISABLED',
  access: 'O2OL_PROGRAMMING_MODERATION_ACCESS_FAILED',
  load: 'O2OL_PROGRAMMING_MODERATION_LOAD_FAILED',
  action: 'O2OL_PROGRAMMING_MODERATION_ACTION_FAILED',
};

const requireEnabled = () => {
  if (!PROGRAMMING_MODERATION_ENABLED) throw new Error(ERROR.disabled);
};

const invokeModeration = async (body) => {
  requireEnabled();
  const { data, error } = await supabase.functions.invoke('moderate-programming', { body });
  if (error) throw new Error(ERROR.action);
  return data || {};
};

export const getProgrammingModeratorAccess = async () => {
  if (!PROGRAMMING_MODERATION_ENABLED) {
    return { enabled: false, eligible: false };
  }

  try {
    const data = await invokeModeration({ action: 'access' });
    return {
      enabled: Boolean(data?.enabled),
      eligible: Boolean(data?.eligible),
    };
  } catch {
    return { enabled: true, eligible: false, reason: ERROR.access };
  }
};

export const listPendingProgrammingReports = async ({ limit = 100 } = {}) => {
  requireEnabled();
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 100));
  const data = await invokeModeration({ action: 'list', limit: safeLimit });
  if (!data?.success) throw new Error(ERROR.load);
  return Array.isArray(data?.reports) ? data.reports : [];
};

const resolveReport = async (reportId, action) => {
  requireEnabled();
  const id = String(reportId || '').trim();
  if (!id) throw new Error(ERROR.action);

  const data = await invokeModeration({
    action,
    report_id: id,
  });
  if (!data?.success) throw new Error(ERROR.action);
  return data;
};

export const dismissProgrammingReport = async (reportId) =>
  resolveReport(reportId, 'dismiss');

export const removeReportedProgramming = async (reportId) =>
  resolveReport(reportId, 'remove');
