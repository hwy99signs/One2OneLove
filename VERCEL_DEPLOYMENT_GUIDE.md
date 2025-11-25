# 🚀 Vercel Deployment Guide - One 2 One Love

Complete guide to deploy your One 2 One Love app to Vercel.

---

## 📋 Prerequisites

Before deploying, make sure you have:

- ✅ A Vercel account ([sign up here](https://vercel.com/signup))
- ✅ Your project pushed to GitHub, GitLab, or Bitbucket
- ✅ Supabase project set up
- ✅ Stripe account (if using payments)
- ✅ All environment variables ready

---

## 🎯 Step 1: Prepare Your Repository

### 1.1 Push to Git

Make sure your code is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 1.2 Verify Build Works Locally

Test that your build works:

```bash
npm install
npm run build
```

If the build succeeds, you're ready to deploy!

---

## 🔗 Step 2: Connect to Vercel

### 2.1 Import Your Project

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Vercel will auto-detect it's a Vite project

### 2.2 Configure Project Settings

Vercel should auto-detect:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**Verify these settings match!**

---

## 🔑 Step 3: Set Environment Variables

### 3.1 Add Environment Variables in Vercel

In the Vercel project settings, go to **Settings** → **Environment Variables** and add:

#### Required Variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Optional (if using Stripe):

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_STRIPE_PRICE_PREMIERE=price_your_premiere_id
VITE_STRIPE_PRICE_EXCLUSIVE=price_your_exclusive_id
```

### 3.2 Where to Find These Values

**Supabase:**
- Go to **Supabase Dashboard** → **Settings** → **API**
- Copy **Project URL** → `VITE_SUPABASE_URL`
- Copy **anon/public key** → `VITE_SUPABASE_ANON_KEY`

**Stripe:**
- Go to **Stripe Dashboard** → **Developers** → **API keys**
- Copy **Publishable key** → `VITE_STRIPE_PUBLISHABLE_KEY`
- Go to **Products** → Copy **Price IDs** → `VITE_STRIPE_PRICE_*`

### 3.3 Set for All Environments

Make sure to add these variables for:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

---

## 🚀 Step 4: Deploy

### 4.1 Deploy from Vercel Dashboard

1. Click **"Deploy"** button
2. Wait for the build to complete (usually 2-5 minutes)
3. You'll get a deployment URL like: `https://your-app.vercel.app`

### 4.2 Deploy from CLI (Alternative)

If you prefer using CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# For production
vercel --prod
```

---

## ✅ Step 5: Verify Deployment

### 5.1 Check Your Site

1. Visit your deployment URL
2. Test key features:
   - ✅ User authentication
   - ✅ Database connections
   - ✅ Goal progress updates
   - ✅ Payment flow (if applicable)

### 5.2 Check Build Logs

If something doesn't work:
1. Go to **Deployments** tab
2. Click on your deployment
3. Check **Build Logs** for errors

---

## 🔧 Step 6: Configure Custom Domain (Optional)

### 6.1 Add Domain

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's DNS instructions

### 6.2 Update Supabase Settings

If you added a custom domain, update your Supabase:
- Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
- Add your custom domain to **Redirect URLs**

---

## 🔄 Step 7: Continuous Deployment

### 7.1 Automatic Deployments

Vercel automatically deploys:
- ✅ Every push to `main` branch → **Production**
- ✅ Every push to other branches → **Preview**
- ✅ Every pull request → **Preview**

### 7.2 Manual Deployments

You can also trigger manual deployments from:
- Vercel Dashboard
- Git commits
- Vercel CLI

---

## 🐛 Troubleshooting

### Build Fails

**Error: "Module not found"**
- Check all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: "Environment variable not found"**
- Verify all `VITE_*` variables are set in Vercel
- Make sure they're set for the correct environment

**Error: "Build command failed"**
- Check build logs for specific errors
- Test build locally: `npm run build`

### Runtime Errors

**Error: "Supabase connection failed"**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase project is active

**Error: "Stripe not working"**
- Verify Stripe keys are set correctly
- Check you're using test keys for test mode

### Performance Issues

**Slow loading:**
- Check Vercel's **Analytics** tab
- Optimize images and assets
- Enable Vercel's Edge Network

---

## 📊 Step 8: Monitor Your Deployment

### 8.1 Vercel Analytics

1. Go to **Analytics** tab
2. Monitor:
   - Page views
   - Performance metrics
   - Error rates

### 8.2 Logs

1. Go to **Deployments** → Select deployment
2. View **Function Logs** and **Build Logs**

---

## 🔐 Security Checklist

Before going live:

- ✅ All environment variables are set
- ✅ No sensitive keys in code
- ✅ Supabase RLS policies are enabled
- ✅ API keys are production keys (not test keys)
- ✅ Custom domain has SSL (automatic with Vercel)
- ✅ CORS settings are correct in Supabase

---

## 📝 Quick Reference

### Environment Variables Needed:

```env
# Required
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Optional (Stripe)
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_STRIPE_PRICE_PREMIERE=
VITE_STRIPE_PRICE_EXCLUSIVE=
```

### Build Commands:

```bash
# Local build test
npm run build

# Deploy to Vercel
vercel --prod
```

### Useful Links:

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

## 🎉 You're Done!

Your app should now be live on Vercel! 

**Next Steps:**
1. Test all features on production
2. Set up monitoring
3. Configure custom domain (optional)
4. Share your app URL with users

---

## 💡 Pro Tips

1. **Use Preview Deployments**: Test changes before merging to main
2. **Set up Alerts**: Get notified of deployment failures
3. **Use Vercel Analytics**: Monitor performance and errors
4. **Enable Edge Functions**: For better performance globally
5. **Set up CI/CD**: Automate testing before deployment

---

**Need Help?**
- Check [Vercel Documentation](https://vercel.com/docs)
- Visit [Vercel Community](https://github.com/vercel/vercel/discussions)

