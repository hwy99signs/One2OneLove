import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client without automatic auth redirects
// We'll handle authentication manually in the app
export const base44 = createClient({
  appId: "691277042e7df273d4135492", 
  requiresAuth: false // Disable automatic redirects - handle auth manually
});
