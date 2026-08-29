import { withSupabase } from 'npm:@supabase/server@^1';
import Stripe from 'npm:stripe@22.1.1';

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

    const userId = String(ctx.userClaims?.id || ctx.jwtClaims?.sub || '');
    if (!userId) {
      return Response.json({ error: 'authentication_required' }, { status: 401 });
    }

    const siteOrigin = getSiteOrigin(req);
    if (!siteOrigin) {
      return Response.json({ error: 'invalid_site_origin' }, { status: 400 });
    }

    const { data: account, error: accountError } = await ctx.supabaseAdmin
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (accountError || !account?.stripe_customer_id) {
      return Response.json({ error: 'billing_profile_not_found' }, { status: 404 });
    }

    const stripe = new Stripe(stripeSecret);
    const session = await stripe.billingPortal.sessions.create({
      customer: account.stripe_customer_id,
      return_url: `${siteOrigin}/Subscription`,
    });

    return Response.json({ url: session.url });
  }),
};
