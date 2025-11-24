# 🔐 Stripe Payment Integration Setup Guide

## 📋 Prerequisites

Before implementing the payment system, you need:

1. **Stripe Account**: Sign up at https://stripe.com
2. **Stripe API Keys**: Get from https://dashboard.stripe.com/apikeys
3. **Install Stripe Package**: `npm install @stripe/stripe-js @stripe/react-stripe-js`

---

## 🔑 Step 1: Get Your Stripe Keys

### From Stripe Dashboard:

1. Go to https://dashboard.stripe.com
2. Click **Developers** → **API keys**
3. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

---

## 🌐 Step 2: Add Keys to Environment Variables

Add to your `.env` file:VITE_STRIPE_PUBLISHABLE_KEY=pk_test_PLACEHOLDER_WILL_ADD_REAL_KEY_LATER

```env
# Stripe Keys (Frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Stripe Keys (Backend - Supabase Edge Functions)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

**⚠️ IMPORTANT:** 
- Use **test keys** for development (pk_test_ and sk_test_)
- Use **live keys** only in production (pk_live_ and sk_live_)
- **NEVER** commit your secret keys to Git!

---

## 📦 Step 3: Install Dependencies

Run in your project directory:

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## 🗄️ Step 4: Update Database Schema

Run this SQL in **Supabase SQL Editor**:

This adds payment tracking fields to your users table and creates payment history.

**File:** `supabase-add-payment-fields.sql` (already created for you)

---

## ⚙️ Step 5: Create Supabase Edge Functions

You'll need to create Edge Functions for:

1. **create-checkout-session** - Creates Stripe checkout session
2. **stripe-webhook** - Handles Stripe webhook events

### To create Edge Functions:

```bash
# Initialize Supabase CLI (if not done)
npx supabase init

# Create functions
npx supabase functions new create-checkout-session
npx supabase functions new stripe-webhook

# Deploy functions
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook
```

---

## 🔗 Step 6: Set Up Stripe Webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://your-project-ref.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)
6. Add to Edge Function secrets:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

---

## 🧪 Step 7: Test Payment Flow

### Test Mode Cards:

Use these test card numbers in Stripe test mode:

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0025 0000 3155 | Requires authentication |

**Expiry:** Any future date  
**CVC:** Any 3 digits  
**ZIP:** Any 5 digits

---

## 🎯 Implementation Checklist

- [ ] Created Stripe account
- [ ] Got API keys (publishable + secret)
- [ ] Added keys to `.env` file
- [ ] Installed npm packages
- [ ] Ran database migration SQL
- [ ] Created Edge Functions
- [ ] Deployed Edge Functions
- [ ] Set up webhook endpoint
- [ ] Tested with test cards
- [ ] Verified payment flow works
- [ ] Tested feature access control

---

## 🚀 Going Live (Production)

When ready for production:

1. **Activate Stripe account** (provide business details)
2. **Replace test keys** with live keys in production environment
3. **Update webhook URL** to production URL
4. **Test thoroughly** with real payment method
5. **Set up email notifications** for successful payments
6. **Enable fraud detection** in Stripe dashboard
7. **Set up billing portal** for customers to manage subscriptions

---

## 📞 Support

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Test Cards**: https://stripe.com/docs/testing
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

---

**Next Steps:** Follow the implementation files I've created to integrate payments into your app!

