import React from 'react';

// One2OneLove is a free, open relationship platform (owner decision,
// 2026-11-25): no signup, no card, no Credit. Every route renders for
// everyone — guests and members alike. This gate used to enforce the
// 2026-10-11 "site locked behind sign-up" wall (QuickAccountGate), the
// view-only homepage, the PrivateSpaceNotice for member areas and the
// phone-verification redirect. All of that is retired:
//   - There is no sign-up wall: personal features run in guest mode
//     (browser-local storage) when there is no account, and Chat Rooms /
//     Communities accept guest participation with a display name.
//   - Phone verification is retired with the SMS features it served.
//   - Admin routes stay protected by AdminMfaGate in the router, which is
//     independent of this component.
// The historical route-set exports are kept because other launch
// components import them; they no longer restrict anything.
export const PUBLIC_INFORMATION_ROUTES = new Set([
  '/aboutus', '/signin', '/login', '/signup', '/forgotpassword',
  '/helpcenter', '/contactus', '/privacypolicy', '/termsofservice', '/reviews', '/suggestions',
  '/invite', '/professionals', '/professionalsignup', '/therapistsignup', '/influencersignup',
  '/adminaccess', '/catalog',
]);

export const VIEW_ONLY_ROUTES = new Set(['/', '/home']);

export default function LaunchAccessGate({ children }) {
  return children;
}
