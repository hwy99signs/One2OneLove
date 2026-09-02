import { supabase } from './supabase';

export const PROGRAMMING_MODERATION_ENABLED =
  import.meta.env.VITE_PROGRAMMING_MODERATION_ENABLED === 'true';

export const PROGRAMMING_REPORT_REASONS = Object.freeze([
  'harassment_or_hate',
  'sexual_or_exploitative',
  'dangerous_advice',
  'privacy_or_doxxing',
  'spam_or_scam',
  'copyright_or_rights',
  'other',
]);

const ERROR = {
  disabled: 'O2OL_PROGRAMMING_MODERATION_DISABLED',
  access: 'O2OL_PROGRAMMING_MODERATION_ACCESS_FAILED',
  load: 'O2OL_PROGRAMMING_MODERATION_LOAD_FAILED',
  report: 'O2OL_PROGRAMMING_REPORT_FAILED',
  action: 'O2OL_PROGRAMMING_MODERATION_ACTION_FAILED',
};

const requireEnabled = () => {
  if (!PROGRAMMING_MODERATION_ENABLED) throw new Error(ERROR.disabled);
};

const invokeReport = async (body) => {
  requireEnabled();
  const { data, error } = await supabase.functions.invoke('report-programming', { body });
  if (error) throw new Error(ERROR.report);
  return data || {};
};

const invokeModeration = async (body) => {
  requireEnabled();
  const { data, error } = await supabase.functions.invoke('moderate-programming', { body });
  if (error) throw new Error(ERROR.action);
  return data || {};
};

export const getMyProgrammingReport = async (slotId) => {
  requireEnabled();
  const id = String(slotId || '').trim();
  if (!id) return null;

  // The reporting endpoint is duplicate-safe and returns an existing report for the
  // same signed-in member/slot. Use a neutral reason only for lookup when the caller
  // has no report yet; the UI keeps the control hidden unless the server is available.
  const { data, error } = await supabase
    .from('programming_reports')
    .select('id,slot_id,reason,details,status,created_at')
    .eq('slot_id', id)
    .maybeSingle();
  if (error) throw new Error(ERROR.load);
  return data || null;
};

export const reportProgramming = async ({ slotId, reason, details = '' } = {}) => {
  requireEnabled();
  const id = String(slotId || '').trim();
  const safeReason = String(reason || '').trim();
  if (!id || !PROGRAMMING_REPORT_REASONS.includes(safeReason)) throw new Error(ERROR.report);

  const data = await invokeReport({
    slot_id: id,
    reason: safeReason,
    details: String(details || '').trim().slice(0, 1000),
  });
  if (!data?.success) throw new Error(ERROR.report);
  return data.report || null;
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
