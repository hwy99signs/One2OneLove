# ✅ Vercel Deployment Checklist

Quick checklist before deploying to Vercel.

## Pre-Deployment

- [ ] Code is committed and pushed to Git
- [ ] Local build works: `npm run build`
- [ ] All dependencies are in `package.json`
- [ ] `.env` file is in `.gitignore` (should not be committed)

## Vercel Setup

- [ ] Vercel account created
- [ ] Project imported from Git repository
- [ ] Framework auto-detected as "Vite" ✅

## Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

- [ ] `VITE_SUPABASE_URL` (from Supabase Dashboard → Settings → API)
- [ ] `VITE_SUPABASE_ANON_KEY` (from Supabase Dashboard → Settings → API)
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` (if using Stripe)
- [ ] `VITE_STRIPE_PRICE_PREMIERE` (if using Stripe)
- [ ] `VITE_STRIPE_PRICE_EXCLUSIVE` (if using Stripe)

**Important:** Set variables for Production, Preview, AND Development environments!

## Database Setup

- [ ] Run `supabase-add-notes-to-goals.sql` in Supabase SQL Editor
- [ ] Verify `notes` column exists in `relationship_goals` table
- [ ] Test goal progress updates work locally

## Deployment

- [ ] Click "Deploy" in Vercel
- [ ] Build completes successfully
- [ ] Deployment URL is accessible

## Post-Deployment Testing

- [ ] Site loads correctly
- [ ] User authentication works
- [ ] Can create/update goals
- [ ] Progress update with notes works
- [ ] Database connections work
- [ ] No console errors

## Optional

- [ ] Custom domain configured
- [ ] Analytics enabled
- [ ] Monitoring set up

---

**Ready to deploy?** Follow the [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for detailed instructions.

