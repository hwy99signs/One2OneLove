import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, CalendarX2, CheckCircle2, Clock3, Globe2, Radio, ShieldCheck, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/Layout';
import {
  cancelMyRoomSlot,
  createRoomCreatorProfile,
  getMyRoomCreatorProfile,
  getMyRoomSlots,
  submitRoomSlot,
} from '@/lib/globalRelationshipRoomService';
import {
  getMyGlobalRoomCancellationRequests,
  submitGlobalRoomCancellationRequest,
} from '@/lib/globalRoomCancellationService';
import { getRoomCreatorTranslation } from '@/lib/roomCreatorTranslations';
import { getGlobalRoomCommonTranslation, translateGlobalRoomServiceError } from '@/lib/globalRoomI18n';

function formatDateTime(value, language) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(language || 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return new Date(value).toLocaleString();
  }
}

function toLocalDateTimeInput(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function getBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

function statusLabel(status, t) {
  return ({
    pending: t.pendingSlot,
    approved: t.approvedSlot,
    scheduled: t.scheduledSlot,
    live: t.liveSlot,
    completed: t.completedSlot,
    cancelled: t.cancelled,
    removed: t.removedSlot,
  })[status] || status;
}

export default function RoomCreatorAccess() {
  const { currentLanguage } = useLanguage();
  const t = getRoomCreatorTranslation(currentLanguage);
  const common = getGlobalRoomCommonTranslation(currentLanguage);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [programTitle, setProgramTitle] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [cancellationReasons, setCancellationReasons] = useState({});
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const profileQuery = useQuery({
    queryKey: ['roomCreatorProfile', user?.id],
    queryFn: () => getMyRoomCreatorProfile(user.id),
    enabled: Boolean(user?.id),
  });
  const creatorProfile = profileQuery.data?.success ? profileQuery.data.profile : null;
  const profileLoadFailed = profileQuery.isError || (profileQuery.data && !profileQuery.data.success);

  const slotsQuery = useQuery({
    queryKey: ['myRoomSlots', user?.id],
    queryFn: () => getMyRoomSlots(user.id),
    enabled: Boolean(user?.id),
  });
  const slots = slotsQuery.data?.success ? slotsQuery.data.slots : [];
  const slotsLoadFailed = slotsQuery.isError || (slotsQuery.data && !slotsQuery.data.success);

  const cancellationQuery = useQuery({
    queryKey: ['myRoomCancellationRequests', user?.id],
    queryFn: () => getMyGlobalRoomCancellationRequests(user.id),
    enabled: Boolean(user?.id),
  });
  const cancellationRequests = cancellationQuery.data?.success ? cancellationQuery.data.requests : [];
  const cancellationLoadFailed = cancellationQuery.isError || (cancellationQuery.data && !cancellationQuery.data.success);
  const latestCancellationBySlot = useMemo(() => {
    const latest = new Map();
    for (const request of cancellationRequests) {
      if (!latest.has(request.slot_id)) latest.set(request.slot_id, request);
    }
    return latest;
  }, [cancellationRequests]);

  const createProfileMutation = useMutation({
    mutationFn: () => createRoomCreatorProfile(user.id, { displayName, bio }),
    onSuccess: (result) => {
      if (!result.success) {
        setNotice('');
        setError(translateGlobalRoomServiceError(result.error, currentLanguage, 'creatorApplicationError'));
        return;
      }
      setError('');
      setNotice(t.submitted);
      queryClient.invalidateQueries({ queryKey: ['roomCreatorProfile', user.id] });
    },
    onError: () => {
      setNotice('');
      setError(common.creatorApplicationError);
    },
  });

  const bookMutation = useMutation({
    mutationFn: () => submitRoomSlot({
      userId: user.id,
      creatorProfile,
      title: programTitle,
      description: programDescription,
      scheduledStart: startTime,
      scheduledEnd: endTime,
    }),
    onSuccess: (result) => {
      if (!result.success) {
        setNotice('');
        setError(translateGlobalRoomServiceError(result.error, currentLanguage, 'bookingError'));
        return;
      }
      setError('');
      setNotice(t.slotSubmitted);
      setProgramTitle('');
      setProgramDescription('');
      setStartTime('');
      setEndTime('');
      queryClient.invalidateQueries({ queryKey: ['myRoomSlots', user.id] });
      queryClient.invalidateQueries({ queryKey: ['globalRelationshipRoom'] });
    },
    onError: () => {
      setNotice('');
      setError(common.bookingError);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (slotId) => cancelMyRoomSlot(slotId, user.id),
    onSuccess: (result) => {
      if (!result.success) {
        setNotice('');
        setError(translateGlobalRoomServiceError(result.error, currentLanguage, 'cancelError'));
        return;
      }
      setError('');
      setNotice(t.slotCancelled);
      queryClient.invalidateQueries({ queryKey: ['myRoomSlots', user.id] });
    },
    onError: () => {
      setNotice('');
      setError(common.cancelError);
    },
  });

  const cancellationMutation = useMutation({
    mutationFn: ({ slotId, reason }) => submitGlobalRoomCancellationRequest({ userId: user.id, slotId, reason }),
    onSuccess: (result, variables) => {
      if (!result.success) {
        setNotice('');
        setError(result.duplicate ? t.cancellationAlreadyOpen : t.cancellationRequestFailed);
        return;
      }
      setError('');
      setNotice(t.cancellationRequested);
      setCancellationReasons((current) => ({ ...current, [variables.slotId]: '' }));
      queryClient.invalidateQueries({ queryKey: ['myRoomCancellationRequests', user.id] });
      queryClient.invalidateQueries({ queryKey: ['globalRoomCancellationQueue'] });
      queryClient.invalidateQueries({ queryKey: ['globalRoomOpsSummary'] });
    },
    onError: () => {
      setNotice('');
      setError(t.cancellationRequestFailed);
    },
  });

  const submitProfile = (event) => {
    event.preventDefault();
    setNotice('');
    setError('');
    if (!displayName.trim() || !termsAccepted) {
      setError(t.required);
      return;
    }
    createProfileMutation.mutate();
  };

  const submitBooking = (event) => {
    event.preventDefault();
    setNotice('');
    setError('');
    if (!programTitle.trim() || !startTime || !endTime) {
      setError(t.bookingRequired);
      return;
    }
    if (new Date(startTime).getTime() <= Date.now()) {
      setError(common.pastTime);
      return;
    }
    if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      setError(common.endAfterStart);
      return;
    }
    bookMutation.mutate();
  };

  if (authLoading) {
    return <div role="status" aria-live="polite" className="min-h-screen bg-slate-50 p-8 text-center text-slate-500">{common.loading}</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-blue-50 px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <Link to="/GlobalRelationshipRoom" className="text-sm font-medium text-rose-700 hover:underline">← {t.back}</Link>
          <Card className="mt-6 rounded-3xl">
            <CardHeader><CardTitle>{t.signInTitle}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-600">{t.signInCopy}</p>
              <Button className="mt-5" asChild><Link to="/SignIn">{t.signIn}</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const profileStatusText = creatorProfile
    ? ({ pending: t.pending, approved: t.approved, suspended: t.suspended, rejected: t.rejected })[creatorProfile.status] || creatorProfile.status
    : '';
  const creatorTimezone = creatorProfile?.timezone || getBrowserTimezone();
  const minimumStartTime = toLocalDateTimeInput(new Date(Date.now() + 60 * 1000));
  const minimumEndTime = startTime || minimumStartTime;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-blue-50 px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <Link to="/GlobalRelationshipRoom" className="text-sm font-medium text-rose-700 hover:underline">← {t.back}</Link>

        <div className="mt-5 rounded-3xl border border-rose-100 bg-white p-6 shadow-sm md:p-9">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-rose-50 p-3"><Radio aria-hidden="true" className="h-7 w-7 text-rose-600" /></div>
            <div><h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{t.title}</h1><p className="mt-2 text-slate-600">{t.subtitle}</p></div>
          </div>
        </div>

        {(notice || error) && (
          <div role={error ? 'alert' : 'status'} aria-live="polite" className={`mt-5 rounded-2xl border p-4 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || notice}</div>
        )}

        <div className="mt-7 grid gap-6 lg:grid-cols-2">
          <Card className="rounded-3xl">
            <CardHeader><CardTitle>{t.profileTitle}</CardTitle></CardHeader>
            <CardContent>
              {profileQuery.isLoading ? <p role="status" className="text-slate-500">{common.loading}</p> : profileLoadFailed ? (
                <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><span>{common.genericError}</span></div>
              ) : creatorProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                    {creatorProfile.status === 'approved' ? <CheckCircle2 aria-hidden="true" className="h-6 w-6 text-emerald-600" /> : <ShieldCheck aria-hidden="true" className="h-6 w-6 text-amber-600" />}
                    <div><div className="font-semibold text-slate-900">{creatorProfile.display_name}</div><div className="text-sm text-slate-600">{profileStatusText}</div></div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"><Globe2 aria-hidden="true" className="h-4 w-4 text-blue-600" /><span><strong>{t.timezone}:</strong> {creatorTimezone}</span></div>
                  <p className="text-sm leading-6 text-slate-600">{t.approvalCopy}</p>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={submitProfile}>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t.displayName} aria-label={t.displayName} maxLength={120} required />
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t.bio} aria-label={t.bio} rows={5} maxLength={1200} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
                  <label className="flex items-start gap-3 text-sm leading-6 text-slate-600"><input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1" required /><span>{t.agree}</span></label>
                  <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800"><Globe2 aria-hidden="true" className="h-4 w-4" /> {t.timezone}: {getBrowserTimezone()}</div>
                  <Button type="submit" disabled={createProfileMutation.isPending} className="w-full">{createProfileMutation.isPending ? t.submitting : t.apply}</Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader><CardTitle>{t.bookingTitle}</CardTitle></CardHeader>
            <CardContent>
              {creatorProfile?.status === 'approved' ? (
                <form className="space-y-4" onSubmit={submitBooking}>
                  <Input value={programTitle} onChange={(e) => setProgramTitle(e.target.value)} placeholder={t.programTitle} aria-label={t.programTitle} maxLength={160} required />
                  <textarea value={programDescription} onChange={(e) => setProgramDescription(e.target.value)} placeholder={t.description} aria-label={t.description} rows={4} maxLength={2000} className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">{t.start}<Input type="datetime-local" value={startTime} min={minimumStartTime} onChange={(e) => { const nextStart = e.target.value; setStartTime(nextStart); if (endTime && endTime <= nextStart) setEndTime(''); }} className="mt-1" required /></label>
                    <label className="text-sm font-medium text-slate-700">{t.end}<Input type="datetime-local" value={endTime} min={minimumEndTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1" required /></label>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                    <div className="flex gap-2"><CalendarClock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span>{t.freeLimit}</span></div>
                    <div className="mt-2 flex gap-2"><Globe2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span>{t.timezone}: {creatorTimezone}</span></div>
                    <div className="mt-2 flex gap-2"><ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span>{t.moderation}</span></div>
                  </div>
                  <Button type="submit" disabled={bookMutation.isPending} className="w-full">{bookMutation.isPending ? t.booking : t.book}</Button>
                </form>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm leading-6 text-slate-600"><ShieldCheck aria-hidden="true" className="mx-auto mb-3 h-8 w-8 text-amber-500" />{t.approvalCopy}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 rounded-3xl">
          <CardHeader><CardTitle>{t.mySlots}</CardTitle></CardHeader>
          <CardContent>
            {slotsQuery.isLoading || cancellationQuery.isLoading ? <p role="status" className="text-slate-500">{common.loading}</p> : slotsLoadFailed || cancellationLoadFailed ? (
              <div role="alert" className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"><AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /><span>{common.genericError}</span></div>
            ) : slots.length === 0 ? (
              <p className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">{t.noSlots}</p>
            ) : (
              <div className="space-y-3">
                {slots.map((slot) => {
                  const cancellation = latestCancellationBySlot.get(slot.id);
                  const futureApprovedProgram = ['approved', 'scheduled'].includes(slot.status) && new Date(slot.scheduled_end).getTime() > Date.now();
                  return (
                    <article key={slot.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div><div className="font-semibold text-slate-900">{slot.title}</div><time dateTime={slot.scheduled_start} className="mt-1 flex items-center gap-2 text-sm text-slate-500"><Clock3 aria-hidden="true" className="h-4 w-4" />{formatDateTime(slot.scheduled_start, currentLanguage)}</time><div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{statusLabel(slot.status, t)}</div></div>
                        {['draft', 'pending'].includes(slot.status) ? <Button variant="outline" size="sm" onClick={() => cancelMutation.mutate(slot.id)} disabled={cancelMutation.isPending}><XCircle aria-hidden="true" className="mr-2 h-4 w-4" />{t.cancel}</Button> : null}
                      </div>

                      {futureApprovedProgram && cancellation?.status === 'open' && (
                        <div role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><CalendarX2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /><span>{t.cancellationPending}</span></div>
                      )}

                      {futureApprovedProgram && cancellation?.status !== 'open' && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          {cancellation?.status === 'denied' && <p className="mb-3 text-xs font-medium text-slate-500">{t.cancellationDenied}</p>}
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input value={cancellationReasons[slot.id] || ''} onChange={(event) => setCancellationReasons((current) => ({ ...current, [slot.id]: event.target.value }))} placeholder={t.cancellationReason} aria-label={`${t.cancellationReason}: ${slot.title}`} maxLength={1000} />
                            <Button variant="outline" onClick={() => cancellationMutation.mutate({ slotId: slot.id, reason: cancellationReasons[slot.id] || '' })} disabled={cancellationMutation.isPending}><CalendarX2 aria-hidden="true" className="mr-2 h-4 w-4" />{cancellationMutation.isPending ? t.requestingCancellation : t.requestCancellation}</Button>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
