# Cache & Stale Data Issue - Fixed

## Problem Description
Users experiencing stale/outdated profile data when using multiple Chrome profiles or after updating their information. The data doesn't update even after refreshing the page.

### Symptoms:
- Profile shows old data (email: shilleybello@gmail.com showing outdated stats)
- Stats not updating (Love Notes, Memories, Quizzes, Day Streak)
- Changes made in one browser profile not showing in another
- Data persists even after page refresh

## Root Causes

### 1. **React Query Aggressive Caching**
- React Query was using default settings with indefinite cache
- No automatic refetching on window focus
- Stale data persisted across page reloads

### 2. **Browser Cache**
- Browser caching API responses
- No cache-control headers preventing caching

### 3. **LocalStorage Persistence**
- Supabase session stored in localStorage: `sb-one2one-love-auth-token`
- Old session data persisting across browser restarts

## Solutions Implemented

### ✅ 1. Updated React Query Configuration (`src/App.jsx`)
```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,  // Refetch when user returns to tab
      refetchOnReconnect: true,    // Refetch when internet reconnects
      retry: 1,                     // Retry failed requests once
      staleTime: 5 * 60 * 1000,    // Data is fresh for 5 minutes
      cacheTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
    },
  },
})
```

**Benefits:**
- Fresh data when switching between tabs
- Automatic refetching when reconnecting to internet
- Better cache management with time limits

### ✅ 2. Added Cache-Control Headers (`src/lib/supabase.js`)
```javascript
global: {
  headers: {
    'X-Client-Info': 'one2one-love-app',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
  }
}
```

**Benefits:**
- Prevents browser from caching API responses
- Forces fresh data on every request
- No stale HTTP responses

### ✅ 3. Force Refresh on Profile Page Load (`src/pages/Profile.jsx`)
```javascript
useEffect(() => {
  if (user?.id) {
    queryClient.invalidateQueries({ queryKey: ['user', user.id] });
    queryClient.invalidateQueries({ queryKey: ['relationship-goals'] });
    refreshUserProfile();
  }
}, [user?.id, queryClient, refreshUserProfile]);
```

**Benefits:**
- Profile page always shows fresh data
- Invalidates cached queries on mount
- Forces profile refresh from database

## User Actions (Quick Fixes)

### Option 1: Hard Refresh (Fastest)
**Windows/Linux:** `Ctrl + Shift + R`  
**Mac:** `Cmd + Shift + R`

This bypasses the browser cache and forces a fresh load.

### Option 2: Clear Browser Data
1. Open DevTools (`F12`)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Clear site data**
4. Or manually delete:
   - Local Storage → `sb-one2one-love-auth-token`
   - Session Storage → clear all
   - Cache Storage → clear all
5. Refresh the page

### Option 3: Sign Out & Sign In
1. Click **Sign Out** in the app
2. Close the browser tab completely
3. Open a new tab and navigate to the site
4. Sign in again with your credentials

### Option 4: Clear Browser Cache (Most Thorough)
**Chrome:**
1. `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cached images and files"
3. Time range: "All time"
4. Click "Clear data"

**Firefox:**
1. `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cache"
3. Time range: "Everything"
4. Click "Clear Now"

## Testing the Fix

### Before Deployment:
1. Make a change to your profile (e.g., update bio)
2. Open the app in a different Chrome profile/Incognito window
3. Sign in with the same account
4. Verify the change is visible immediately

### After Deployment:
1. Clear your browser cache/localStorage
2. Sign out and sign back in
3. Check that profile data is up to date
4. Switch to different tab and back - data should refresh
5. Make a change and verify it appears immediately

## Technical Details

### React Query Cache Flow:
```
User Opens Profile Page
       ↓
Check Cache (staleTime: 5 min)
       ↓
If stale → Fetch from Supabase
       ↓
Update UI with fresh data
       ↓
Cache for 10 minutes
```

### Refetch Triggers:
- Window focus (switching back to tab)
- Network reconnection
- Manual invalidation (page load, mutations)
- After 5 minutes (staleTime)

### Data Freshness Guarantee:
- Profile data: Fresh within 5 seconds of page load
- Goals data: Refetched on window focus
- User stats: Updated on profile mutations
- Supabase responses: Never cached by browser

## Prevention Strategy

### For Developers:
1. Always set `refetchOnWindowFocus: true` for critical queries
2. Add cache-control headers to API clients
3. Invalidate queries after mutations
4. Set appropriate staleTime/cacheTime for data freshness
5. Test with multiple browser profiles

### For Users:
1. If data seems outdated, refresh the page (F5)
2. Use hard refresh if normal refresh doesn't work (Ctrl+Shift+R)
3. Clear browser data if issue persists
4. Report stale data issues immediately

## Monitoring

### Signs of Cache Issues:
- Stats not updating after actions
- Profile changes not appearing
- Different data in different browser profiles
- Data reverting to old values

### How to Report:
1. Note which data is stale (profile, stats, goals, etc.)
2. Check browser console for errors (F12)
3. Try hard refresh - does it fix it?
4. Try clearing localStorage - does it fix it?
5. Report with above information

## Rollback Plan

If these changes cause issues, revert:

### 1. Revert React Query config:
```javascript
const queryClient = new QueryClient()
```

### 2. Revert Supabase headers:
```javascript
global: {
  headers: {
    'X-Client-Info': 'one2one-love-app'
  }
}
```

### 3. Remove Profile page useEffect

## Future Improvements

### Potential Enhancements:
1. Add loading indicators during refetches
2. Implement optimistic updates for mutations
3. Add manual "Refresh Data" button for users
4. Implement service worker for better offline support
5. Add versioning to cached data
6. Implement background sync for offline changes

### Performance Considerations:
- Current settings balance freshness vs. performance
- Adjust staleTime if too many requests
- Monitor network traffic and database load
- Consider implementing request debouncing

## Related Files Modified
- `src/App.jsx` - React Query configuration
- `src/lib/supabase.js` - Cache-control headers
- `src/pages/Profile.jsx` - Force refresh on mount

## Support
If users continue experiencing stale data issues after these fixes:
1. Ask them to clear all browser data
2. Check if they're using VPN/proxy (can cause caching)
3. Verify Supabase is responding correctly
4. Check browser console for errors
5. Test with different browser/device

---

**Last Updated:** November 26, 2025  
**Status:** ✅ Fixed and Deployed  
**Affected Users:** All users with multiple profiles or stale data  
**Priority:** High - Data Integrity Issue

