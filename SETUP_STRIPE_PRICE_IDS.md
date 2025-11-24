# Step-by-Step Guide: Setting Up Stripe Price IDs

## 📋 Step 1: Create Products in Stripe Dashboard

### 1.1 Log in to Stripe Dashboard
1. Go to https://dashboard.stripe.com
2. Log in with your Stripe account

### 1.2 Create Premiere Plan Product
1. Click on **"Products"** in the left sidebar
2. Click **"+ Add product"** button (top right)
3. Fill in the product details:
   - **Name:** `Premiere Plan`
   - **Description:** `For couples ready to grow together` (optional)
   - **Pricing model:** Select **"Recurring"**
   - **Price:** `19.99`
   - **Currency:** `USD` (or your preferred currency)
   - **Billing period:** `Monthly`
4. Click **"Save product"**
5. **IMPORTANT:** After saving, you'll see a **Price ID** that looks like `price_1ABC123xyz...`
   - **Copy this Price ID** - you'll need it for the next step!

### 1.3 Create Exclusive Plan Product
1. Click **"+ Add product"** again
2. Fill in the product details:
   - **Name:** `Exclusive Plan`
   - **Description:** `The complete relationship toolkit` (optional)
   - **Pricing model:** Select **"Recurring"**
   - **Price:** `34.99`
   - **Currency:** `USD` (or your preferred currency)
   - **Billing period:** `Monthly`
3. Click **"Save product"**
4. **IMPORTANT:** Copy the **Price ID** (starts with `price_`)

## 📝 Step 2: Add Price IDs to .env File

### 2.1 Open your .env file
Open the `.env` file in the root of your project.

### 2.2 Add the Stripe configuration
Add these lines to your `.env` file (replace with your actual Price IDs):

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
VITE_STRIPE_PRICE_PREMIERE=price_1ABC123xyz...
VITE_STRIPE_PRICE_EXCLUSIVE=price_1DEF456uvw...
```

**Example:**
```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_51SV4p31hUkGAE9PVqSCAGt6k4M27r1UO8VR2midTU917G9djaV0zQ83lzFGp9rJI86CpVEu1AjMjPl0ZYIdoDAq700r9Z20Vte
VITE_STRIPE_PRICE_PREMIERE=price_1QwErTyUiOp1234567890
VITE_STRIPE_PRICE_EXCLUSIVE=price_1AsDfGhJkL0987654321
```

### 2.3 Your complete .env file should look like:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://hphhmjcutesqsdnubnnw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwaGhtamN1dGVzcXNkbnVibm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDc2ODksImV4cCI6MjA3Mjg4MzY4OX0.JBW0sannIyJmzipxoT3aRZBcbkaRzZwfY0C92B-6V88

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
VITE_STRIPE_PRICE_PREMIERE=price_YOUR_PREMIERE_PRICE_ID
VITE_STRIPE_PRICE_EXCLUSIVE=price_YOUR_EXCLUSIVE_PRICE_ID
```

## ✅ Step 3: Verify Setup

1. **Restart your dev server** after adding the environment variables:
   ```bash
   npm run dev
   ```

2. **Test the integration:**
   - Navigate to the subscription page
   - Click "Choose Premiere" or "Choose Exclusive"
   - You should be redirected to Stripe checkout

## 🔍 How to Find Your Price IDs Later

If you need to find your Price IDs again:
1. Go to Stripe Dashboard → **Products**
2. Click on the product name (e.g., "Premiere Plan")
3. You'll see the **Price ID** listed under the pricing information
4. It will look like: `price_1ABC123xyz...`

## ⚠️ Important Notes

- **Price IDs start with `price_`** - make sure you copy the entire ID
- **No spaces** around the `=` sign in `.env` file
- **Restart your dev server** after changing `.env` file
- **Never commit** your `.env` file to Git (it should be in `.gitignore`)

## 🆘 Troubleshooting

**Issue: "No price ID configured for plan"**
- Make sure you copied the entire Price ID (including `price_` prefix)
- Check for typos in the `.env` file
- Restart your dev server

**Issue: Price ID not found in Stripe**
- Make sure you're using the correct Stripe account (live vs test)
- Verify the products exist in your Stripe Dashboard
- Check that the Price IDs match exactly

