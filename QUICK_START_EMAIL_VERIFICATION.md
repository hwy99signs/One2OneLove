# Quick Start: Enable Email Verification

## 🚀 3 Steps to Enable

### Step 1: Enable in Supabase (2 minutes)
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate: **Authentication** → **Providers**
4. Find **Email** provider
5. ✅ Check **"Confirm email"**
6. Click **Save**

### Step 2: Run Database Migration (1 minute)
1. In Supabase, go to: **Database** → **SQL Editor**
2. Open file: `supabase-add-email-verification.sql`
3. Copy all contents
4. Paste into SQL Editor
5. Click **Run**

### Step 3: Test It! (5 minutes)
1. Go to your app signup page
2. Create a new account
3. See the email verification popup ✅
4. Check your email inbox
5. Click the verification link
6. Sign in successfully! 🎉

**Done!** Email verification is now active.

---

## 📧 What Happens Now?

### When Users Sign Up:
1. Account created ✅
2. Popup appears: "Check Your Email!" 📧
3. Verification email sent
4. User must click link to verify
5. Then they can sign in

### If They Try to Sign In Without Verifying:
```
❌ Please verify your email address before signing in.
   Check your inbox for the verification link.
```

---

## 🎨 Optional: Customize Email Template

1. In Supabase: **Authentication** → **Email Templates**
2. Select **"Confirm signup"**
3. Edit the template:

```html
<h2>Welcome to One 2 One Love! 💕</h2>
<p>Hi {{ .Email }},</p>
<p>Thank you for signing up!</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email Address</a></p>
```

4. Save changes

---

## 📚 Need More Details?

See comprehensive guide: `ENABLE_EMAIL_VERIFICATION.md`

---

## ✅ All Code Is Ready!

✅ Frontend - Implemented  
✅ Backend - Ready  
✅ Database - Migration file created  
✅ Routes - Configured  
✅ UI Components - Beautiful notifications  
✅ Error Handling - Robust  

**Just enable it in Supabase!** 🚀

