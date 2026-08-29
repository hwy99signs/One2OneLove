import { withSupabase } from 'npm:@supabase/server@^1';
import Stripe from 'npm:stripe@22.1.1';

const allowedPlans = new Set(['Premiere', 'Exclusive']);

function getPriceId(planName: string) {
  if (planName === 'Premiere') return Deno.env.get('STRIPE_PRICE_PREMIERE') || '';
  if (planName === 'Exclusive') return Deno.env.get('STRIPE_PRICE_EXCLUSIVE') || '';
  return '';
}

function getSiteOrigin(req: Request) {
  const configured = Deno.env.get('SITE_URL')?.trim();
  const candidate = configured || req.headers.get('origin') || '';
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') return '';
    return url.origin;
  } catch {
    return '';
  }
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'method_not_allowed' }, { status: 405 });
    }

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')?.trim();
    if (!stripeSecret) {
      return Response.json({ error: 'billing_not_configured' }, { status: 503 });
    }

    let payload: { planName?: string };
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: 'invalid_request' }, { status: 400 });
    }

    const planName = payload.planName?.trim() || '';
    if (!allowedPlans.has(planName)) {
      return Response.json({ error: 'invalid_plan' }, { status: 400 });
    }

    const priceId = getPriceId(planName);
    if (!priceId) {
      return Response.json({ error: 'billing_not_configured' }, { status: 503 });
    }

    const userId = String(ctx.userClaims?.id || ctx.jwtClaims?.sub || '');
    const userEmail = String(ctx.userClaims?.email || '');
    if (!userId) {
      return Response.json({ error: 'authentication_required' }, { status: 401 });
    }

    const siteOrigin = getSiteOrigin(req);
    if (!siteOrigin) {
      return Response.json({ error: 'invalid_site_origin' }, { status: 400 });
    }

    const stripe = new Stripe(stripeSecret);

    const { data: account, error: accountError } = await ctx.supabaseAdmin
      .from('users')
      .select('stripe_customer_id, subscription_plan, subscription_status')
      .eq('id', userId)
      .single();

    if (accountError || !account) {
      return Response.json({ error: 'account_not_found' }, { status: 404 });
    }

    if (account.subscription_plan === planName && account.subscription_status === 'active') {
      return Response.json({ error: 'already_subscribed' }, { status: 409 });
    }

    let customerId = account.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail || undefined,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      const { error: customerSaveError } = await ctx.supabaseAdmin
        .from('users')
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (customerSaveError) {
        return Response.json({ error: 'customer_setup_failed' }, { status: 500 });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteOrigin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteOrigin}/Subscription?canceled=true`,
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        plan_name: planName,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_name: planName,
        },
      },
    });

    if (!session.url) {
      return Response.json({ error: 'checkout_session_failed' }, { status: 502 });
    }

    return Response.json({ url: session.url });
  }),
};
