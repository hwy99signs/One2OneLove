# Environment Setup Instructions

## ⚠️ IMPORTANT: Supabase Configuration Required

The sign-in functionality requires Supabase credentials to be configured.

## Setup Steps

### 1. Create `.env` file

Create a file named `.env` in the root directory of the project (same level as `package.json`).

### 2. Add Supabase Credentials

Add the following environment variables to your `.env` file:

```env
VITE_SUPABASE_URL=https://hphhmjcutesqsdnubnnw.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-supabase-anon-key-here
```

### 3. Get Your Supabase Credentials

If you don't have the complete Supabase Anon Key:

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → Use this for `VITE_SUPABASE_URL`
   - **anon public** key → Use this for `VITE_SUPABASE_ANON_KEY`

### 4. Restart Development Server

After creating the `.env` file:

```bash
# Stop the current dev server (Ctrl+C or Cmd+C)
npm run dev
```

## Example `.env` File

```env
VITE_SUPABASE_URL=https://hphhmjcutesqsdnubnnw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwaGhtamN1dGVzcXNkbnVibm53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODc5NjYwMDAsImV4cCI6MTk5OTk5OTk5OX0.your-actual-key-signature-here
```

## Troubleshooting

### Sign-in stuck at "Signing in..."?

This means Supabase credentials are missing or invalid. Check:

1. ✅ `.env` file exists in the root directory
2. ✅ `VITE_SUPABASE_URL` is set correctly
3. ✅ `VITE_SUPABASE_ANON_KEY` is set correctly (complete key, not truncated)
4. ✅ Development server was restarted after creating `.env`

### Error: "Application is not properly configured"?

This error appears when:
- The `.env` file is missing
- The environment variables are empty or invalid
- You forgot to restart the dev server

## Security Note

⚠️ **Never commit your `.env` file to git!**

The `.env` file is already in `.gitignore` to prevent accidental commits of sensitive credentials.

## Need Help?

If you need the Supabase credentials, contact:
- Base44 support: app@base44.com
- Check project documentation at `SIGNUP_SIGNIN_STATUS.md`

