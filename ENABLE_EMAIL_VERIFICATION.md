# Enable Email Verification for One 2 One Love

This guide explains how to enable email verification so users must verify their email before signing in.

## 🎯 What This Does

When email verification is enabled:
- ✅ Users receive a verification email after signing up
- ✅ Users must click the verification link to activate their account
- ✅ Users cannot sign in until their email is verified
- ✅ A notification pops up after signup directing users to check their email
- ✅ Better security and reduces spam accounts

---

## 📋 Step-by-Step Setup

### 1. Enable Email Confirmation in Supabase

1. **Go to your Supabase Dashboard** → Select your project
2. **Navigate to:** `Authentication` → `Providers`
3. **Find:** Email provider section
4. **Check/Enable:** ✅ "Confirm email"
5. **Click:** Save

### 2. Configure Email Templates (Recommended)

1. In Supabase Dashboard, go to: `Authentication` → `Email Templates`
2. **Find:** "Confirm signup" template
3. **Customize the email** to match your brand:
   ```html
   <h2>Welcome to One 2 One Love! 💕</h2>
   <p>Hi {{ .Email }},</p>
   <p>Thank you for signing up! Please confirm your email address by clicking the button below:</p>
   <p><a href="{{ .ConfirmationURL }}">Verify Email Address</a></p>
   <p>If you didn't create an account, you can safely ignore this email.</p>
   <p>Best regards,<br>The One 2 One Love Team</p>
   ```
4. **Save** the template

### 3. Set Up Email Redirect URL

The app is already configured to redirect users to the correct verification page:
- Development: `http://localhost:5173/auth/verify-email`
- Production: `https://one2-one-love.vercel.app/auth/verify-email`

**No additional configuration needed** - the app handles this automatically!

### 4. Run the Database Migration

Run the SQL migration to add email verification tracking to your database:

1. Go to: `Database` → `SQL Editor` in Supabase Dashboard
2. Copy the contents of `supabase-add-email-verification.sql`
3. Paste and **Run** the SQL script
4. Verify the column was added successfully

```sql
-- Quick verification query
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name = 'email_verified';
```

### 5. Configure Email Provider (If Needed)

By default, Supabase uses their email service which is rate-limited. For production, consider:

**Option A: Use Supabase's Default (Easiest)**
- Good for development and low-volume apps
- Rate limits: 3 emails per hour per user
- No configuration needed

**Option B: Use Custom SMTP (Recommended for Production)**
1. Go to: `Settings` → `Authentication` → `SMTP Settings`
2. Configure your SMTP provider (SendGrid, AWS SES, Mailgun, etc.)
3. Test the configuration

### 6. Test the Email Verification Flow

1. **Sign up** with a test email address
2. **Check** that you see the verification notification
3. **Open** your email inbox (check spam folder too)
4. **Click** the verification link in the email
5. **Verify** you're redirected to the success page
6. **Try signing in** - it should work now!
7. **Test blocked login** - sign up with another email but don't verify, then try to sign in

---

## 🔧 Technical Details

### Frontend Changes Made

1. **AuthContext.jsx**
   - Updated `register()` to require email verification
   - Updated `login()` to block unverified users
   - Added email verification status tracking

2. **SignIn.jsx**
   - Shows helpful error message for unverified users
   - Reminds users to check spam folder

3. **RegularUserForm.jsx**
   - Shows email verification dialog after signup
   - Prevents auto-login until email is verified

4. **EmailVerificationCallback.jsx** (New)
   - Handles the email verification redirect
   - Updates user profile after verification
   - Shows success/error messages

5. **EmailVerificationDialog.jsx**
   - Beautiful notification popup
   - Clear instructions for users
   - Links to sign in page

### Database Changes Made

- Added `email_verified` column to `users` table
- Tracks whether user has verified their email
- Separate from `is_verified` (general account verification)

### Routes Added

- `/auth/verify-email` - Email verification success page
- `/auth/callback` - Alternative callback route (fallback)

---

## 🎨 User Experience Flow

### New User Signup Flow

1. User fills out signup form
2. User submits form
3. Account is created in Supabase Auth
4. Profile is created in database with `email_verified: false`
5. **Popup appears** with this message:

   ```
   📧 Check Your Email!
   
   ✅ Account Created Successfully!
   We've sent a verification email to: user@example.com
   
   Next Steps:
   1. Open your email inbox
   2. Find the email from One 2 One Love
   3. Click the verification link
   4. Return here and sign in!
   
   💡 Can't find the email? Check your spam or junk folder.
   ```

6. User clicks "Got it, go to Sign In"
7. User checks their email
8. User clicks verification link
9. User is redirected to success page
10. User can now sign in successfully

### Sign In with Unverified Email

If a user tries to sign in before verifying:
```
❌ Please verify your email address before signing in.
   Check your inbox for the verification link.
   
   Don't see the email? Check your spam folder.
```

---

## 🐛 Troubleshooting

### Users not receiving emails?

1. **Check Supabase email rate limits**
   - Go to: `Authentication` → `Rate Limits`
   - Temporarily increase for testing

2. **Check spam folder**
   - Supabase emails often end up in spam initially

3. **Verify SMTP configuration** (if using custom SMTP)
   - Test sending a test email from Supabase Dashboard

4. **Check Supabase logs**
   - Go to: `Logs` → `Auth Logs`
   - Look for email sending errors

### Verification link not working?

1. **Check the redirect URL** is correct in Supabase
2. **Verify routes** are set up correctly in `src/pages/index.jsx`
3. **Check console logs** in browser developer tools
4. **Test with a fresh signup** - old links may have expired

### Want to disable email verification again?

1. Go to Supabase: `Authentication` → `Providers`
2. Uncheck "Confirm email"
3. Save changes
4. New signups won't require verification
5. Existing unverified users can now sign in

---

## 📊 Monitoring

### Check Verification Status

Run this query in Supabase SQL Editor:

```sql
-- Count of verified vs unverified users
SELECT 
  email_verified,
  COUNT(*) as count
FROM public.users
GROUP BY email_verified;

-- Recently signed up but not verified
SELECT 
  email,
  name,
  created_at
FROM public.users
WHERE email_verified = FALSE
ORDER BY created_at DESC
LIMIT 20;

-- Sync email_verified status from auth.users
UPDATE public.users u
SET email_verified = TRUE
FROM auth.users au
WHERE u.id = au.id 
AND au.email_confirmed_at IS NOT NULL
AND u.email_verified = FALSE;
```

---

## ✅ Verification Checklist

- [ ] Enabled email confirmation in Supabase Auth settings
- [ ] Customized email template (optional but recommended)
- [ ] Ran database migration to add `email_verified` column
- [ ] Tested signup flow - receives email notification
- [ ] Tested email delivery - verification email arrives
- [ ] Tested verification link - redirects to success page
- [ ] Tested sign in - verified users can sign in
- [ ] Tested blocked login - unverified users cannot sign in
- [ ] Configured production SMTP (for production deployment)
- [ ] Checked spam folder behavior

---

## 🚀 Deployment Notes

### For Vercel Deployment

The app automatically detects the environment and uses the correct redirect URL:
- Development: `http://localhost:5173/auth/verify-email`
- Production: `https://one2-one-love.vercel.app/auth/verify-email` (or your custom domain)

No additional environment variables needed!

### For Custom Domains

If you're using a custom domain, update the redirect URL in `src/contexts/AuthContext.jsx`:

```javascript
const redirectUrl = typeof window !== 'undefined' 
  ? `${window.location.origin}/auth/verify-email`
  : 'https://your-custom-domain.com/auth/verify-email';
```

---

## 📚 Related Files

- `src/contexts/AuthContext.jsx` - Authentication logic
- `src/pages/EmailVerificationCallback.jsx` - Verification success page
- `src/components/signup/EmailVerificationDialog.jsx` - Popup notification
- `src/components/signup/RegularUserForm.jsx` - Signup form
- `src/pages/SignIn.jsx` - Sign in page
- `supabase-add-email-verification.sql` - Database migration

---

## 💡 Tips

1. **Test with a real email** you control - don't use fake emails
2. **Check spam folder** during testing - emails often go there initially
3. **Use Gmail** for initial testing - most reliable for receiving test emails
4. **Set up custom SMTP** before production launch
5. **Monitor verification rates** to identify any issues
6. **Provide support contact** for users who don't receive emails

---

## 🎉 Success!

Once email verification is enabled, your app will have:
- ✅ Better security
- ✅ Reduced spam accounts
- ✅ Verified user contact information
- ✅ Professional onboarding experience
- ✅ Clear user communication

Users will love the smooth verification flow! 💕

