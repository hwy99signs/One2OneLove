import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Layout, { useLanguage } from './Layout.jsx';

const Home = lazy(() => import('./Home'));
const InfluencerSignup = lazy(() => import('./InfluencerSignup'));
const ProfessionalSignup = lazy(() => import('./ProfessionalSignup'));
const TherapistSignup = lazy(() => import('./TherapistSignup'));
const AboutUs = lazy(() => import('./AboutUs'));
const SignIn = lazy(() => import('./SignIn'));
const SignUp = lazy(() => import('./SignUp'));
const MemoryLane = lazy(() => import('./MemoryLane'));
const LoveNotes = lazy(() => import('./LoveNotes'));
const CoupleSupport = lazy(() => import('./CoupleSupport'));
const LoveLanguageQuiz = lazy(() => import('./LoveLanguageQuiz'));
const DateIdeas = lazy(() => import('./DateIdeas'));
const DateNight = lazy(() => import('./DateNight'));
const DailyQuestion = lazy(() => import('./DailyQuestion'));
const MarriageMatters = lazy(() => import('./MarriageMatters'));
const RelationshipLibrary = lazy(() => import('./RelationshipLibrary'));
const CouplesChallenges = lazy(() => import('./CouplesChallenges'));
const ConversationCards = lazy(() => import('./ConversationCards'));
const WeeklyCheckIn = lazy(() => import('./WeeklyCheckIn'));
const RelationshipRituals = lazy(() => import('./RelationshipRituals'));
const RelationshipReset = lazy(() => import('./RelationshipReset'));
const O2OLShow = lazy(() => import('./O2OLShow'));
const Profile = lazy(() => import('./Profile'));
const WinACruise = lazy(() => import('./WinACruise'));
const Invite = lazy(() => import('./Invite'));
const CounselingSupport = lazy(() => import('./CounselingSupport'));
const PodcastsSupport = lazy(() => import('./PodcastsSupport'));
const ArticlesSupport = lazy(() => import('./ArticlesSupport'));
const InfluencersSupport = lazy(() => import('./InfluencersSupport'));
const RelationshipQuizzes = lazy(() => import('./RelationshipQuizzes'));
const AnniversaryTracker = lazy(() => import('./AnniversaryTracker'));
const ForgotPassword = lazy(() => import('./ForgotPassword'));
const ResetPassword = lazy(() => import('./ResetPassword'));
const AIContentCreator = lazy(() => import('./AIContentCreator'));
const Dashboard = lazy(() => import('./Dashboard'));
const Community = lazy(() => import('./Community'));
const RelationshipMilestones = lazy(() => import('./RelationshipMilestones'));
const RelationshipCoach = lazy(() => import('./RelationshipCoach'));
const RelationshipGoals = lazy(() => import('./RelationshipGoals'));
const Meditation = lazy(() => import('./Meditation'));
const CommunicationPractice = lazy(() => import('./CommunicationPractice'));
const CouplesProfile = lazy(() => import('./CouplesProfile'));
const Developer = lazy(() => import('./Developer'));
const CoupleActivities = lazy(() => import('./CoupleActivities'));
const SharedJournals = lazy(() => import('./SharedJournals'));
const CooperativeGames = lazy(() => import('./CooperativeGames'));
const CouplesDashboard = lazy(() => import('./CouplesDashboard'));
const CouplesCalendar = lazy(() => import('./CouplesCalendar'));
const LGBTQSupport = lazy(() => import('./LGBTQSupport'));
const HelpCenter = lazy(() => import('./HelpCenter'));
const ContactUs = lazy(() => import('./ContactUs'));
const PrivacyPolicy = lazy(() => import('./PrivacyPolicy'));
const TermsOfService = lazy(() => import('./TermsOfService'));
const Blog = lazy(() => import('./Blog'));
const Reviews = lazy(() => import('./Reviews'));
const Suggestions = lazy(() => import('./Suggestions'));
const Leaderboard = lazy(() => import('./Leaderboard'));
const Achievements = lazy(() => import('./Achievements'));
const PremiumFeatures = lazy(() => import('./PremiumFeatures'));
const Chat = lazy(() => import('./Chat'));
const FindFriends = lazy(() => import('./FindFriends'));
const FriendRequests = lazy(() => import('./FriendRequests'));
const PaymentSuccess = lazy(() => import('./PaymentSuccess'));
const Subscription = lazy(() => import('./Subscription'));
const GlobalRelationshipRoom = lazy(() => import('./GlobalRelationshipRoom'));
const RoomCreatorAccess = lazy(() => import('./RoomCreatorAccess'));
const RoomModeration = lazy(() => import('./RoomModeration'));
const RoomReplayManager = lazy(() => import('./RoomReplayManager'));
const RoomProgramManager = lazy(() => import('./RoomProgramManager'));
const RoomOfficialScheduler = lazy(() => import('./RoomOfficialScheduler'));
const RoomReportQueue = lazy(() => import('./RoomReportQueue'));
const RoomModerationAudit = lazy(() => import('./RoomModerationAudit'));
const RoomOpsDashboard = lazy(() => import('./RoomOpsDashboard'));
const RoomCancellationQueue = lazy(() => import('./RoomCancellationQueue'));
const NotFound = lazy(() => import('./NotFound'));

const PAGES = {
  Home,
  InfluencerSignup,
  ProfessionalSignup,
  TherapistSignup,
  AboutUs,
  SignIn,
  SignUp,
  MemoryLane,
  LoveNotes,
  CoupleSupport,
  LoveLanguageQuiz,
  DateIdeas,
  DateNight,
  DailyQuestion,
  MarriageMatters,
  RelationshipLibrary,
  CouplesChallenges,
  ConversationCards,
  WeeklyCheckIn,
  RelationshipRituals,
  RelationshipReset,
  O2OLShow,
  Profile,
  WinACruise,
  Invite,
  CounselingSupport,
  PodcastsSupport,
  ArticlesSupport,
  InfluencersSupport,
  RelationshipQuizzes,
  AnniversaryTracker,
  ForgotPassword,
  ResetPassword,
  AIContentCreator,
  Dashboard,
  Community,
  RelationshipMilestones,
  RelationshipCoach,
  RelationshipGoals,
  Meditation,
  CommunicationPractice,
  CouplesProfile,
  Developer,
  CoupleActivities,
  SharedJournals,
  CooperativeGames,
  CouplesDashboard,
  CouplesCalendar,
  LGBTQSupport,
  HelpCenter,
  ContactUs,
  PrivacyPolicy,
  TermsOfService,
  Blog,
  Reviews,
  Suggestions,
  Leaderboard,
  Achievements,
  PremiumFeatures,
  Chat,
  FindFriends,
  FriendRequests,
  PaymentSuccess,
  Subscription,
  GlobalRelationshipRoom,
  RoomCreatorAccess,
  RoomModeration,
  RoomReplayManager,
  RoomProgramManager,
  RoomOfficialScheduler,
  RoomReportQueue,
  RoomModerationAudit,
  RoomOpsDashboard,
  RoomCancellationQueue,
  NotFound,
};

const loadingTranslations = {
  en: 'Loading page…',
  es: 'Cargando página…',
  fr: 'Chargement de la page…',
  it: 'Caricamento pagina…',
  de: 'Seite wird geladen…',
};

function RouteLoadingFallback() {
  const { currentLanguage } = useLanguage();
  const label = loadingTranslations[currentLanguage] || loadingTranslations.en;
  return (
    <div className="flex min-h-[45vh] items-center justify-center" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function _getCurrentPage(url) {
  if (url.endsWith('/')) url = url.slice(0, -1);
  let urlLastPart = url.split('/').pop();
  if (urlLastPart.includes('?')) urlLastPart = urlLastPart.split('?')[0];
  const pageName = Object.keys(PAGES).find((page) => page.toLowerCase() === urlLastPart.toLowerCase());
  return pageName || 'NotFound';
}

function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Layout currentPageName={currentPage}>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/InfluencerSignup" element={<InfluencerSignup />} />
          <Route path="/ProfessionalSignup" element={<ProfessionalSignup />} />
          <Route path="/TherapistSignup" element={<TherapistSignup />} />
          <Route path="/AboutUs" element={<AboutUs />} />
          <Route path="/SignIn" element={<SignIn />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/SignUp" element={<SignUp />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/MemoryLane" element={<MemoryLane />} />
          <Route path="/LoveNotes" element={<LoveNotes />} />
          <Route path="/CoupleSupport" element={<CoupleSupport />} />
          <Route path="/LoveLanguageQuiz" element={<LoveLanguageQuiz />} />
          <Route path="/DateIdeas" element={<DateIdeas />} />
          <Route path="/DateNight" element={<DateNight />} />
          <Route path="/DailyQuestion" element={<DailyQuestion />} />
          <Route path="/MarriageMatters" element={<MarriageMatters />} />
          <Route path="/RelationshipLibrary" element={<RelationshipLibrary />} />
          <Route path="/CouplesChallenges" element={<CouplesChallenges />} />
          <Route path="/ConversationCards" element={<ConversationCards />} />
          <Route path="/WeeklyCheckIn" element={<WeeklyCheckIn />} />
          <Route path="/RelationshipRituals" element={<RelationshipRituals />} />
          <Route path="/RelationshipReset" element={<RelationshipReset />} />
          <Route path="/O2OLShow" element={<O2OLShow />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/WinACruise" element={<WinACruise />} />
          <Route path="/Invite" element={<Invite />} />
          <Route path="/CounselingSupport" element={<CounselingSupport />} />
          <Route path="/PodcastsSupport" element={<PodcastsSupport />} />
          <Route path="/ArticlesSupport" element={<ArticlesSupport />} />
          <Route path="/InfluencersSupport" element={<InfluencersSupport />} />
          <Route path="/RelationshipQuizzes" element={<RelationshipQuizzes />} />
          <Route path="/AnniversaryTracker" element={<AnniversaryTracker />} />
          <Route path="/ForgotPassword" element={<ForgotPassword />} />
          <Route path="/ResetPassword" element={<ResetPassword />} />
          <Route path="/AIContentCreator" element={<AIContentCreator />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Community" element={<Community />} />
          <Route path="/RelationshipMilestones" element={<RelationshipMilestones />} />
          <Route path="/RelationshipCoach" element={<RelationshipCoach />} />
          <Route path="/RelationshipGoals" element={<RelationshipGoals />} />
          <Route path="/Meditation" element={<Meditation />} />
          <Route path="/CommunicationPractice" element={<CommunicationPractice />} />
          <Route path="/CouplesProfile" element={<CouplesProfile />} />
          <Route path="/Developer" element={<Developer />} />
          <Route path="/CoupleActivities" element={<CoupleActivities />} />
          <Route path="/SharedJournals" element={<SharedJournals />} />
          <Route path="/CooperativeGames" element={<CooperativeGames />} />
          <Route path="/CouplesDashboard" element={<CouplesDashboard />} />
          <Route path="/CouplesCalendar" element={<CouplesCalendar />} />
          <Route path="/LGBTQSupport" element={<LGBTQSupport />} />
          <Route path="/HelpCenter" element={<HelpCenter />} />
          <Route path="/ContactUs" element={<ContactUs />} />
          <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
          <Route path="/TermsOfService" element={<TermsOfService />} />
          <Route path="/Blog" element={<Blog />} />
          <Route path="/Reviews" element={<Reviews />} />
          <Route path="/Suggestions" element={<Suggestions />} />
          <Route path="/Leaderboard" element={<Leaderboard />} />
          <Route path="/Achievements" element={<Achievements />} />
          <Route path="/PremiumFeatures" element={<PremiumFeatures />} />
          <Route path="/Chat" element={<Chat />} />
          <Route path="/FindFriends" element={<FindFriends />} />
          <Route path="/FriendRequests" element={<FriendRequests />} />
          <Route path="/PaymentSuccess" element={<PaymentSuccess />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/Subscription" element={<Subscription />} />
          <Route path="/GlobalRelationshipRoom" element={<GlobalRelationshipRoom />} />
          <Route path="/RoomCreatorAccess" element={<RoomCreatorAccess />} />
          <Route path="/RoomModeration" element={<RoomModeration />} />
          <Route path="/RoomReplayManager" element={<RoomReplayManager />} />
          <Route path="/RoomProgramManager" element={<RoomProgramManager />} />
          <Route path="/RoomOfficialScheduler" element={<RoomOfficialScheduler />} />
          <Route path="/RoomReportQueue" element={<RoomReportQueue />} />
          <Route path="/RoomModerationAudit" element={<RoomModerationAudit />} />
          <Route path="/RoomOpsDashboard" element={<RoomOpsDashboard />} />
          <Route path="/RoomCancellationQueue" element={<RoomCancellationQueue />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function Pages() {
  return <Router><PagesContent /></Router>;
}
