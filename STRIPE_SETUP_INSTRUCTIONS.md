# Stripe Payment Setup Instructions

## ✅ What's Been Configured

The Stripe payment integration has been set up. When users click on a plan, it will now trigger the Stripe payment interface.

## 🔑 Step 1: Add Stripe Keys to .env File

You need to add your Stripe publishable key to the `.env` file in the root directory.

**Your secret key:**
```
sk_live_YOUR_SECRET_KEY_HERE
```
**Note:** Never commit your actual secret key to Git. Keep it secure in Supabase Edge Function secrets only.

**You need to get the corresponding publishable key:**

1. Go to https://dashboard.stripe.com/apikeys
2. Find the publishable key that matches your secret key (it should start with `pk_live_`)
3. Add it to your `.env` file:

```env
# Add this to your .env file
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
```

## 🔧 Step 2: Set Up Stripe Secret Key in Supabase Edge Function

The Edge Function needs your Stripe secret key. You need to set it as an environment variable in Supabase:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Add a new secret:
   - **Name:** `STRIPE_SECRET_KEY`
   - **Value:** `sk_live_YOUR_SECRET_KEY_HERE` (use your actual Stripe secret key)

## 💰 Step 3: Create Products and Prices in Stripe

You need to create products and prices in your Stripe Dashboard:

1. Go to https://dashboard.stripe.com/products
2. Click **Add product**
3. Create two products:

   **Product 1: Premiere Plan**
   - Name: Premiere Plan
   - Price: $19.99/month (recurring)
   - Copy the Price ID (starts with `price_`)

   **Product 2: Exclusive Plan**
   - Name: Exclusive Plan
   - Price: $34.99/month (recurring)
   - Copy the Price ID (starts with `price_`)

4. Add the Price IDs to your `.env` file (optional, or they'll be auto-detected):

```env
VITE_STRIPE_PRICE_PREMIERE=price_xxxxx
VITE_STRIPE_PRICE_EXCLUSIVE=price_xxxxx
```

Alternatively, you can set these in the Supabase Edge Function secrets:
- `STRIPE_PRICE_PREMIERE`
- `STRIPE_PRICE_EXCLUSIVE`

## 🚀 Step 4: Deploy Edge Function

Make sure your Edge Function is deployed:

```bash
# If using Supabase CLI
npx supabase functions deploy create-checkout-session
```

Or deploy via Supabase Dashboard:
1. Go to **Edge Functions** in your Supabase Dashboard
2. Upload/deploy the `create-checkout-session` function

## ✅ Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the Subscription page
3. Click on a plan (Premiere or Exclusive)
4. You should be redirected to Stripe Checkout

## 📝 How It Works

1. User clicks "Choose [Plan Name]" button on a plan card
2. `TierCard` component calls `handleSubscriptionCheckout` from `stripeService.js`
3. For paid plans, it creates a Stripe checkout session via the Edge Function
4. User is redirected to Stripe's payment page
5. After payment, user is redirected back to your app

## 🔍 Troubleshooting

**Issue: "Stripe failed to initialize"**
- Make sure `VITE_STRIPE_PUBLISHABLE_KEY` is set in `.env`
- Restart your dev server after adding the key

**Issue: "No price ID configured for plan"**
- Make sure you've created the products in Stripe Dashboard
- Set the price IDs in `.env` or Supabase Edge Function secrets

**Issue: "User not authenticated"**
- Make sure the user is logged in before clicking a plan

**Issue: Edge Function errors**
- Check that `STRIPE_SECRET_KEY` is set in Supabase Edge Function secrets
- Check the Edge Function logs in Supabase Dashboard

## 🔐 Security Notes

- ⚠️ **NEVER** commit your `.env` file to Git
- ⚠️ The secret key should only be in Supabase Edge Function secrets, not in `.env`
- ⚠️ Only the publishable key goes in `.env` (it's safe to expose)

