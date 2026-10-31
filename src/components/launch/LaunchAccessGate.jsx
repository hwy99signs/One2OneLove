import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import QuickAccountGate from '@/components/launch/QuickAccountGate.jsx';
import { isUnifiedPrelaunchGuestAccessEnabled } from '@/lib/prelaunchGuestAccess';

// Site locked behind sign-up (owner decision, 2026-10-11): guests may open
// only the entry pages (sign in / sign up / invite / recovery / admin entry)
// and the public information pages a person needs BEFORE joining (About,
// Reviews, Help, Contact, Suggestions, Terms, Privacy, professional
// application funnels). Every other known route - the homepage included -
// shows the QuickAccountGate sign-up wall to guests, with a return to the
// page they asked for after they join. Unknown routes stay public by the
// isKnown rule below (SPA not-found handling + the certification canary).
export const PUBLIC_INFORMATION_ROUTES = new Set([
  '/aboutus', '/signin', '/login', '/signup', '/forgotpassword',
  '/helpcenter', '/contactus', '/privacypolicy', '/termsofservice', '/reviews', '/suggestions',
  '/invite', '/professionals', '/professionalsignup', '/therapistsignup', '/influencersignup',
  '/adminaccess', '/catalog',
]);

// View-only routes (owner, 2026-10-11): guests may OPEN and SCROLL these
// pages - the homepage is the shop window - but every action tab, button,
// card and menu item on them is locked: GuestHomepageGate intercepts the
// tap and opens the sign-up panel instead. Members are unaffected.
export const VIEW_ONLY_ROUTES = new Set(['/', '/home']);

// Each guest feature route opens the public title-only catalog instead of
// mounting the protected feature component. Members keep their routes.
// Include aliases and game paths missing from the older known-route list.
const CATALOG_FEATURE_ROUTES = new Set([
  '/lovenotes','/dateideas','/podcastssupport','/podcasts','/podcast',
  '/o2olstudio','/onair','/o2olstudio/episodes',
  '/cooperativegames','/games','/pests','/poolpingpong','/ithoughtso',
  '/scrabluko','/whatshouldtheydo','/whatshouldtheydoglobalpreview',
  '/scratchgame','/likeminded',
  '/articlessupport','/blog','/relationshipquizzes','/lovelanguagequiz',
  '/couplesupport','/lgbtqsupport','/communicationpractice','/counselingsupport',
  '/meditation','/influencerssupport','/chat','/chatrooms','/chatroom',
  '/community','/communities','/findfriends','/friendrequests','/invite',
  '/memorylane','/sharedjournals','/relationshipmilestones','/relationshipgoals',
  '/anniversarytracker','/coupleactivities','/couplesdashboard','/couplesprofile',
  '/couplescalendar','/achievements','/leaderboard','/aicontentcreator',
  '/tiktokpost','/mymatchiq',
]);

const KNOWN_APP_ROUTES = new Set([
  '/',
  '/aboutus',
  '/achievements',
  '/admin',
  '/adminaccess',
  '/aicontentcreator',
  '/amora',
  '/analytics',
  '/anniversarytracker',
  '/articlessupport',
  '/blog',
  '/chat',
  '/communicationpractice',
  '/community',
  '/contactus',
  '/cooperativegames',
  '/counselingsupport',
  '/coupleactivities',
  '/couplescalendar',
  '/couplesdashboard',
  '/couplesprofile',
  '/couplesupport',
  '/credit',
  '/dashboard',
  '/dateideas',
  '/developer',
  '/findfriends',
  '/forgotpassword',
  '/friendrequests',
  '/games',
  '/helpcenter',
  '/home',
  '/influencersignup',
  '/influencerssupport',
  '/invite',
  '/leaderboard',
  '/leavereview',
  '/lgbtqsupport',
  '/likeminded',
  '/login',
  '/lovelanguagequiz',
  '/lovenotes',
  '/meditation',
  '/memorylane',
  '/mymatchiq',
  '/mymatchiq/actions',
  '/mymatchiq/assessment',
  '/mymatchiq/bianca',
  '/mymatchiq/credits',
  '/mymatchiq/dashboard',
  '/mymatchiq/invite',
  '/mymatchiq/meet',
  '/mymatchiq/passport',
  '/mymatchiq/signin',
  '/mymatchiq/signup',
  '/mymatchiq/subscription',
  '/o2olstudio',
  '/o2olstudio/episodes',
  '/payment-success',
  '/paymentsuccess',
  '/podcastssupport',
  '/premiumfeatures',
  '/privacypolicy',
  '/professionals',
  '/professionalsignup',
  '/profile',
  '/relationshipcoach',
  '/relationshipgoals',
  '/relationshipmilestones',
  '/relationshipquizzes',
  '/reviews',
  '/scratchgame',
  '/sendcredits',
  '/sharedjournals',
  '/signin',
  '/signup',
  '/subscription',
  '/suggestions',
  '/termsofservice',
  '/therapistsignup',
  '/tiktokpost',
  '/credit',
  '/tokensystemdashboard',
  '/verifyphone',
  '/whatshouldtheydo',
]);

const LOADING_COPY = {
  en:'Loading your One2OneLove access…',
  es:'Cargando tu acceso a One2OneLove…',
  fr:'Chargement de votre accès One2OneLove…',
  it:'Caricamento del tuo accesso One2OneLove…',
  de:'Ihr One2OneLove-Zugang wird geladen…',
};

function preferredLanguage(){
  try{
    const value=String(localStorage.getItem('preferredLanguage')||'en').toLowerCase();
    return LOADING_COPY[value]?value:'en';
  }catch{return 'en';}
}

export default function LaunchAccessGate({ pathname, children }) {
  const { user,isAuthenticated,isLoading }=useAuth();
  const route=String(pathname||'/').toLowerCase().replace(/\/$/,'')||'/';
  const isKnown=KNOWN_APP_ROUTES.has(route);
  // MyMatchIQ has its own production app, signup and verification.
  // Never require One2OneLove membership or phone verification just to
  // follow an external MyMatchIQ link from a public entry point.
  const isStandaloneMyMatchIQ = route === '/mymatchiq' || route.startsWith('/mymatchiq/');
  const isPublic=PUBLIC_INFORMATION_ROUTES.has(route) || !isKnown || isStandaloneMyMatchIQ;
  const isViewOnly=VIEW_ONLY_ROUTES.has(route);
  // Temporary PRELAUNCH browsing only. Never expose admin/account/payment routes
  // or relax server-side ownership, verification, entitlement or Credit rules.
  const protectedAccountRoute = route.startsWith('/admin') || new Set([
    '/analytics', '/tokensystemdashboard', '/dashboard', '/profile',
    '/verifyphone', '/credit', '/sendcredits', '/payment-success', '/paymentsuccess',
  ]).has(route);
  const catalogFeature = CATALOG_FEATURE_ROUTES.has(route) || route.startsWith('/mymatchiq/');
  // Retire the earlier all-features-open prelaunch exception: guests now
  // see metadata in /Catalog, never the actual component for these paths.
  const previewGuestBrowse = isUnifiedPrelaunchGuestAccessEnabled() && !protectedAccountRoute && !catalogFeature;

  if(isLoading && (catalogFeature || (!isPublic && !previewGuestBrowse))){
    const language=preferredLanguage();
    return <div className="flex min-h-[55vh] items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"/>
        <p className="text-sm font-medium text-gray-600">{LOADING_COPY[language]}</p>
      </div>
    </div>;
  }

  if(!isAuthenticated || !user){
    if(catalogFeature){
      return <Navigate to={'/Catalog?feature='+encodeURIComponent(route.slice(1))} replace />;
    }
    return (isPublic || isViewOnly || previewGuestBrowse) ? children : <QuickAccountGate intendedPath={pathname||'/'} />;
  }

  // Registered Free is the site access identity. Feature-specific APIs/components
  // decide whether an action is free or requires Credit.
  //
  // Phone verification front door (owner decision, 2026-10-10): phone
  // verification is a hard requirement for the member area, not a step a
  // signed-in member can click out of. A signed-in member whose phone is not
  // verified may browse public information pages (Open House), but every
  // member route redirects to /VerifyPhone until verification is completed.
  // The only exits from that state are verifying the phone or signing out
  // (the site header with Sign Out renders above this gate). Server-side 428
  // phone checks remain the backstop for every protected API.
  const phoneRequired = user?.phone_verification_required === true;
  const phoneVerified = user?.phoneNumberVerified === true || user?.phone_number_verified === true;
  const isAdmin = String(user?.role || '').toLowerCase() === 'admin';
  if (phoneRequired && !phoneVerified && !isAdmin && isKnown && !isPublic && route !== '/verifyphone') {
    return <Navigate to={`/VerifyPhone?redirect=${encodeURIComponent(pathname || '/')}`} replace />;
  }

  return children;
}
