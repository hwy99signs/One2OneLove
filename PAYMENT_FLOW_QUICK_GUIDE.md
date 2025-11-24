# Payment Flow Quick Guide

## ✅ How It Works

When a user clicks **"Choose Premiere"** or **"Choose Exclusive"** on the subscription page:

1. **Button Click** → `TierCard` component's `handleChoosePlan` function is triggered
2. **Checkout Initiation** → Calls `handleSubscriptionCheckout` from `stripeService.js`
3. **Session Creation** → Creates a Stripe checkout session via Supabase Edge Function
4. **Redirect** → User is automatically redirected to Stripe's payment page
5. **Payment** → User completes payment on Stripe
6. **Return** → User is redirected back to your app after payment

## 🔍 Code Flow

```
User clicks "Choose Premiere/Exclusive"
    ↓
TierCard.handleChoosePlan()
    ↓
stripeService.handleSubscriptionCheckout(planData)
    ↓
stripeService.createCheckoutSession(priceId, planName, amount)
    ↓
Supabase Edge Function: create-checkout-session
    ↓
Stripe API: Creates checkout session
    ↓
Returns checkout URL
    ↓
window.location.href = checkoutUrl
    ↓
User sees Stripe payment page
```

## 🚨 Common Issues & Solutions

### Issue: "Stripe failed to initialize"
**Solution:** 
- Make sure `VITE_STRIPE_PUBLISHABLE_KEY` is set in `.env`
- Restart your dev server after adding the key

### Issue: "No price ID configured for plan"
**Solution:**
- Create products in Stripe Dashboard (Premiere: $19.99/month, Exclusive: $34.99/month)
- Set `STRIPE_PRICE_PREMIERE` and `STRIPE_PRICE_EXCLUSIVE` in Supabase Edge Function secrets
- Or set `VITE_STRIPE_PRICE_PREMIERE` and `VITE_STRIPE_PRICE_EXCLUSIVE` in `.env`

### Issue: "User not authenticated"
**Solution:**
- User must be logged in before clicking a plan
- Check that Supabase auth is working correctly

### Issue: Edge Function returns error
**Solution:**
- Check that `STRIPE_SECRET_KEY` is set in Supabase Edge Function secrets
- Verify the Edge Function is deployed
- Check Edge Function logs in Supabase Dashboard

## 🧪 Testing the Flow

1. **Start your dev server:** `npm run dev`
2. **Navigate to:** `/subscription` page
3. **Click:** "Choose Premiere" or "Choose Exclusive"
4. **Expected:** You should be redirected to Stripe checkout page
5. **Test payment:** Use Stripe test card `4242 4242 4242 4242`

## 📝 Required Setup

1. ✅ Add `VITE_STRIPE_PUBLISHABLE_KEY` to `.env`
2. ✅ Add `STRIPE_SECRET_KEY` to Supabase Edge Function secrets
3. ✅ Create products in Stripe Dashboard
4. ✅ Deploy Edge Function: `create-checkout-session`
5. ✅ Set up webhook (optional, for subscription updates)

## 🔐 Security Notes

- ⚠️ Never commit `.env` file to Git
- ⚠️ Secret key should only be in Supabase Edge Function secrets
- ⚠️ Publishable key is safe to expose (goes in `.env`)

