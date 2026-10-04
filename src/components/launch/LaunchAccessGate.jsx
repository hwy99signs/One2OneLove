import React from 'react';
import {Navigate} from 'react-router-dom';
import {Coins} from 'lucide-react';
import {useAuth} from '@/contexts/AuthContext';

const PUBLIC_ROUTES=new Set([
  '/','/home','/aboutus','/signin','/login','/signup','/forgotpassword',
  '/invite','/helpcenter','/contactus','/privacypolicy','/termsofservice',
  '/reviews','/leavereview','/suggestions','/subscription','/payment-success','/paymentsuccess',
  '/tokens','/dateideas','/lovenotes','/lovelanguagequiz','/memorylane','/podcastssupport',
  '/relationshipquizzes','/relationshipmilestones','/relationshipgoals','/communicationpractice',
  '/couplesupport','/articlessupport','/coupleactivities','/cooperativegames',
  '/whatshouldtheydo','/games','/scratchgame','/sharedjournals','/couplescalendar',
  '/lgbtqsupport','/o2olstudio','/chat','/community',
  '/professionals','/professionalsignup','/therapistsignup','/influencersignup','/likeminded',
  '/mymatchiq','/mymatchiq/meet','/mymatchiq/assessment','/mymatchiq/bianca','/mymatchiq/credits',
  '/mymatchiq/actions','/mymatchiq/dashboard','/mymatchiq/invite','/mymatchiq/signin',
  '/mymatchiq/signup','/mymatchiq/subscription',
]);

const TOKEN_COMPAT_ROUTES=new Set([
  '/subscription','/payment-success','/paymentsuccess','/sendcredits',
  '/mymatchiq/credits','/mymatchiq/subscription',
]);

const TOKEN_NOTICE_ROUTES={
  '/mymatchiq/bianca':'Chat with Bianca',
  '/amora':'Talk with Amora',
  '/lovenotes':'Sending Love Notes',
  '/sendcredits':'Sending Love Notes',
  '/likeminded':'Like Minded?',
  '/cooperativegames':'Premium relationship games',
  '/whatshouldtheydo':'Premium relationship games',
  '/games':'Premium relationship games',
  '/scratchgame':'Premium relationship games',
};

const LOADING_COPY={
  en:'Loading your One2OneLove access…',
  es:'Cargando tu acceso a One2OneLove…',
  fr:'Chargement de votre accès One2OneLove…',
  it:'Caricamento del tuo accesso One2OneLove…',
  de:'Ihr One2OneLove-Zugang wird geladen…',
};

function preferredLanguage(){
  try{
    const value=localStorage.getItem('preferredLanguage')||'en';
    return LOADING_COPY[value]?value:'en';
  }catch(_){
    return 'en';
  }
}

const TOKEN_NOTICE_COPY={
  en:(feature)=>`${feature} uses O2OL Tokens. Creating an account and browsing are free; Token charges apply only when you use the metered action.`,
  es:(feature)=>`${feature} usa Tokens O2OL. Crear una cuenta y explorar es gratis; los Tokens se cobran solo cuando usas la acción medida.`,
  fr:(feature)=>`${feature} utilise des Jetons O2OL. La création du compte et la navigation sont gratuites; les Jetons ne sont débités que lors de l’action mesurée.`,
  it:(feature)=>`${feature} usa Token O2OL. Creare un account e navigare è gratuito; i Token vengono addebitati solo quando usi l’azione a consumo.`,
  de:(feature)=>`${feature} verwendet O2OL Tokens. Kontoerstellung und Browsen sind kostenlos; Tokens werden nur bei der gemessenen Aktion berechnet.`,
};

function withTokenNotice(route,children){
  const feature=TOKEN_NOTICE_ROUTES[route];
  if(!feature)return children;
  const language=preferredLanguage();
  const copy=(TOKEN_NOTICE_COPY[language]||TOKEN_NOTICE_COPY.en)(feature);
  return <>
    <div className="border-y border-amber-300 bg-amber-50 px-4 py-3 text-amber-950 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <Coins className="mt-0.5 h-5 w-5 shrink-0"/>
        <div><div className="font-black">O2OL TOKENS</div><p className="text-sm font-semibold leading-6">{copy}</p></div>
      </div>
    </div>
    {children}
  </>;
}

export default function LaunchAccessGate({pathname,children}){
  const {user,isAuthenticated,isLoading}=useAuth();
  const route=String(pathname||'/').toLowerCase().replace(/\/$/,'')||'/';
  const isPublicRoute=PUBLIC_ROUTES.has(route);

  if(isLoading&&!isPublicRoute){
    const language=preferredLanguage();
    return <div className="flex min-h-[55vh] items-center justify-center bg-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"/>
        <p className="text-sm font-medium text-gray-600">{LOADING_COPY[language]}</p>
      </div>
    </div>;
  }

  // Open House browsing stays public. Protected API writes still enforce identity,
  // phone verification and any applicable O2OL Token charge server-side.
  if(!isAuthenticated||!user){
    return isPublicRoute?withTokenNotice(route,children):<Navigate to="/SignIn" replace/>;
  }

  if(TOKEN_COMPAT_ROUTES.has(route)){
    return <Navigate to="/Tokens" replace/>;
  }

  if(route==='/verifyphone')return children;

  const role=String(user.role||'').toLowerCase();
  if(role==='admin')return children;

  const phoneRequired=user.phone_verification_required===true;
  const phoneVerified=user.phoneNumberVerified===true||user.phone_number_verified===true;
  if(phoneRequired&&!phoneVerified)return <Navigate to="/VerifyPhone" replace/>;

  // Current member access is FREE after verification. No browser route is gated
  // by Premiere/Exclusive, Stripe subscription state, or historical time grants.
  return withTokenNotice(route,children);
}
