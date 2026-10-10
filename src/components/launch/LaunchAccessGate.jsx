import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import QuickAccountGate from '@/components/launch/QuickAccountGate.jsx';

const PUBLIC_INFORMATION_ROUTES = new Set([
  '/', '/home', '/aboutus', '/signin', '/login', '/signup', '/forgotpassword',
  '/helpcenter', '/contactus', '/privacypolicy', '/termsofservice', '/reviews', '/suggestions',
  '/invite', '/professionals', '/professionalsignup', '/therapistsignup', '/influencersignup',
  '/lovenotes', '/dateideas',
  '/adminaccess',
  '/winacruise','/counselingsupport','/influencerssupport','/aicontentcreator','/meditation',
  '/developer','/leaderboard','/achievements','/findfriends','/friendrequests',
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
  '/winacruise',
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
  const isPublic=PUBLIC_INFORMATION_ROUTES.has(route) || !isKnown;

  if(isLoading && !isPublic){
    const language=preferredLanguage();
    return <div className="flex min-h-[55vh] items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"/>
        <p className="text-sm font-medium text-gray-600">{LOADING_COPY[language]}</p>
      </div>
    </div>;
  }

  if(!isAuthenticated || !user){
    return isPublic ? children : <QuickAccountGate intendedPath={pathname||'/'} />;
  }

  // Registered Free is the site access identity. Feature-specific APIs/components
  // decide whether an action is free or requires Credit.
  // Phone verification remains a feature-level requirement where applicable
  // (for example, participating in Chat), not a global browsing gate.
  return children;
}
