import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUserSubscription } from '@/lib/stripeService';
import { ACTIVE_MEMBERSHIP_STATUSES } from '@/lib/membershipConfig';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState('checking');
  const [membership, setMembership] = useState(null);
  const hasCheckoutMarker = Boolean(searchParams.get('session_id'));

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

      if (attempts >= 6) {
        setState('processing');
        return;
      }

      timer = window.setTimeout(check, 1500);
    };

    check();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-purple-200 bg-white p-8 text-center shadow-xl sm:p-12">
        {state === 'checking' ? (
          <>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
              <Loader2 className="h-10 w-10 animate-spin text-purple-700" />
            </div>
            <h1 className="text-3xl font-black text-gray-900">Confirming your membership</h1>
            <p className="mt-3 text-gray-600">
              Stripe has returned you to One2OneLove. We are waiting for the signed webhook confirmation before marking membership active.
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
              Your membership status has been confirmed from the server-side Stripe webhook.
            </p>
            {membership?.intro_ends_at && (
              <p className="mt-3 text-sm text-gray-500">
                Intro pricing is scheduled through {new Date(membership.intro_ends_at).toLocaleDateString()}.
              </p>
            )}
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <Clock3 className="h-10 w-10 text-amber-700" />
            </div>
            <h1 className="text-3xl font-black text-gray-900">Your checkout is still processing</h1>
            <p className="mt-3 text-gray-600">
              We have not received a confirmed active membership state yet. This page does not treat a return URL as proof of payment.
            </p>
            {!hasCheckoutMarker && (
              <p className="mt-3 text-sm font-medium text-amber-800">No checkout session marker was present in this return URL.</p>
            )}
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
