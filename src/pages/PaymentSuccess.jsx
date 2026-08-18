import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock3, Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUserSubscription, isPaymentsEnabled } from '@/lib/stripeService';
import { ACTIVE_MEMBERSHIP_STATUSES } from '@/lib/membershipConfig';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState('checking');
  const [membership, setMembership] = useState(null);
  const hasCheckoutMarker = Boolean(searchParams.get('session_id'));
  const paymentsEnabled = isPaymentsEnabled();

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer = null;

    const check = async () => {
      attempts += 1;
      const current = await getUserSubscription();
      if (cancelled) return;

      setMembership(current);
      if (ACTIVE_MEMBERSHIP_STATUSES.has(current?.status)) {
        setState('active');
        return;
      }

      // When billing is intentionally disabled there is no legitimate new checkout to
      // wait on. Likewise, a return URL without Stripe's session marker must not be
      // described as a payment that is merely processing.
      if (!paymentsEnabled) {
        setState('disabled');
        return;
      }
      if (!hasCheckoutMarker) {
        setState('unverified');
        return;
      }

      if (attempts >= 6) {
        setState('processing');
        return;
      }

      timer = window.setTimeout(check, 1500);
    };

    void check();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [hasCheckoutMarker, paymentsEnabled]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-purple-200 bg-white p-8 text-center shadow-xl sm:p-12">
        {state === 'checking' ? (
          <>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
              <Loader2 className="h-10 w-10 animate-spin text-purple-700" />
            </div>
            <h1 className="text-3xl font-black text-gray-900">Checking your membership</h1>
            <p className="mt-3 text-gray-600">
              We are checking One2OneLove's server-side membership record. This page does not treat its URL as proof of payment.
            </p>
          </>
        ) : state === 'active' ? (
          <>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-11 w-11 text-green-700" />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-700">One2OneLove Membership</p>
            <h1 className="mt-2 text-4xl font-black text-gray-900">Membership confirmed</h1>
            <p className="mt-4 text-gray-600">
              Your active membership status was confirmed from the server-side membership record.
            </p>
            {membership?.intro_ends_at && (
              <p className="mt-3 text-sm text-gray-500">
                Intro pricing is scheduled through {new Date(membership.intro_ends_at).toLocaleDateString()}.
              </p>
            )}
          </>
        ) : state === 'processing' ? (
          <>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <Clock3 className="h-10 w-10 text-amber-700" />
            </div>
            <h1 className="text-3xl font-black text-gray-900">Your checkout is still processing</h1>
            <p className="mt-3 text-gray-600">
              A checkout session marker was present, but we have not received a confirmed active membership state yet. Access will not be granted until the server-side record is active.
            </p>
          </>
        ) : state === 'disabled' ? (
          <>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <AlertCircle className="h-10 w-10 text-slate-600" />
            </div>
            <h1 className="text-3xl font-black text-gray-900">Membership checkout is not active yet</h1>
            <p className="mt-3 text-gray-600">
              Live billing is still disabled during the controlled relaunch build. No new paid membership is being claimed from this page.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-10 w-10 text-amber-700" />
            </div>
            <h1 className="text-3xl font-black text-gray-900">No verified checkout was found</h1>
            <p className="mt-3 text-gray-600">
              This return URL did not include the expected checkout session marker, and no active membership was confirmed. Nothing has been marked paid from this page.
            </p>
          </>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={() => navigate('/')} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <Crown className="mr-2 h-4 w-4" />
            Back to One2OneLove
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/Subscription')}>
            Membership Details
          </Button>
        </div>
      </div>
    </div>
  );
}
