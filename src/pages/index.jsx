import { useEffect } from 'react';
import Layout from './Layout.jsx';
import Home from './Home';
import PublicCatalog from './PublicCatalog';
import AboutUs from './AboutUs';
import SignIn from './SignIn';
import SignUp from './SignUp';
import AdminAccess from './AdminAccess';
import Admin from './Admin';
import Analytics from './Analytics';
import AdminMfaGate from '@/components/admin/AdminMfaGate.jsx';
import MemoryLane from './MemoryLane';
import LoveNotes from './LoveNotes';
import CoupleSupport from './CoupleSupport';
import LoveLanguageQuiz from './LoveLanguageQuiz';
import DateIdeas from './DateIdeas';
import Profile from './Profile';
import Invite from './Invite';
import InviteLanding from './InviteLanding';
import PodcastsSupport from './PodcastsSupport';
import ArticlesSupport from './ArticlesSupport';
import RelationshipQuizzes from './RelationshipQuizzes';
import AnniversaryTracker from './AnniversaryTracker';
import ForgotPassword from './ForgotPassword';
import Dashboard from './Dashboard';
import RelationshipMilestones from './RelationshipMilestones';
import RelationshipGoals from './RelationshipGoals';
import CommunicationPractice from './CommunicationPractice';
import CouplesProfile from './CouplesProfile';
import CoupleActivities from './CoupleActivities';
import CooperativeGames from './CooperativeGames';
import Pests from './Pests';
import PoolPingPong from './PoolPingPong';
import IThoughtSo from './IThoughtSo';
import Scrabluko from './Scrabluko';
import WhatShouldTheyDo from './WhatShouldTheyDo';
import GlobalWhatShouldTheyDoPreview from '@/features/whatShouldTheyDo/WhatShouldTheyDoGame';
import ScratchGame from './ScratchGame';
import LikeMinded from './LikeMinded';
import SharedJournals from './SharedJournals';
import CouplesDashboard from './CouplesDashboard';
import CouplesCalendar from './CouplesCalendar';
import LGBTQSupport from './LGBTQSupport';
import HelpCenter from './HelpCenter';
import ContactUs from './ContactUs';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import Reviews from './Reviews';
import LeaveReview from './LeaveReview';
import Suggestions from './Suggestions';
import Chat from './Chat';
import TokenSystemDashboard from './TokenSystemDashboard';
import Professionals from './Professionals';
import ProfessionalSignup from './ProfessionalSignup';
import TherapistSignup from './TherapistSignup';
import InfluencerSignup from './InfluencerSignup';
import FeaturePricing from './FeaturePricing';
import PaidGameSessionGate from '@/components/pricing/PaidGameSessionGate';
import ExternalMyMatchIQRedirect from './ExternalMyMatchIQRedirect';
import O2OLStudio from './O2OLStudio';
import O2OLStudioEpisodes from './O2OLStudioEpisodes';
import TikTokPost from './TikTokPost';
import NotFound from './NotFound';
import FeatureUnavailable from './FeatureUnavailable';
import RetiredFeature from './RetiredFeature';
import LaunchAccessGate from '@/components/launch/LaunchAccessGate.jsx';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { trackPageView } from '@/lib/interactionAnalytics';

const PAGES = {
  Home, PublicCatalog, AboutUs, SignIn, SignUp, AdminAccess, Admin, Analytics, TokenSystemDashboard, MemoryLane, LoveNotes, CoupleSupport,
  LoveLanguageQuiz, DateIdeas, Profile, Invite, PodcastsSupport, ArticlesSupport, RelationshipQuizzes,
  AnniversaryTracker, ForgotPassword, Dashboard, RelationshipMilestones, RelationshipGoals,
  CommunicationPractice, CouplesProfile, CoupleActivities, CooperativeGames, Pests, PoolPingPong, IThoughtSo, Scrabluko, WhatShouldTheyDo, ScratchGame, LikeMinded, SharedJournals, CouplesDashboard,
  CouplesCalendar, LGBTQSupport, HelpCenter, ContactUs, PrivacyPolicy, TermsOfService, Reviews,
  LeaveReview, Suggestions, Chat,
  Professionals, ProfessionalSignup, TherapistSignup, InfluencerSignup, FeaturePricing, O2OLStudio, Episodes: O2OLStudioEpisodes,
};

function _getCurrentPage(url) {
  if (url.endsWith('/')) url = url.slice(0, -1);
  let urlLastPart = url.split('/').pop();
  if (urlLastPart.includes('?')) urlLastPart = urlLastPart.split('?')[0];
  const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
  return pageName || 'Home';
}

function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <Layout currentPageName={currentPage}>
      <LaunchAccessGate pathname={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/Catalog" element={<PublicCatalog />} />
          <Route path="/AboutUs" element={<AboutUs />} />
          <Route path="/About" element={<AboutUs />} />
          <Route path="/SignIn" element={<SignIn />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/SignUp" element={<SignUp />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/AdminAccess" element={<AdminAccess />} />
          <Route path="/Admin" element={<AdminMfaGate><Admin /></AdminMfaGate>} />
          <Route path="/Analytics" element={<AdminMfaGate><Analytics /></AdminMfaGate>} />
          <Route path="/TokenSystemDashboard" element={<AdminMfaGate><TokenSystemDashboard /></AdminMfaGate>} />
          <Route path="/MemoryLane" element={<MemoryLane />} />
          <Route path="/Memories" element={<MemoryLane />} />
          <Route path="/LoveNotes" element={<LoveNotes />} />
          <Route path="/SendCredits" element={<Navigate to="/LoveNotes" replace />} />
          <Route path="/CoupleSupport" element={<CoupleSupport />} />
          <Route path="/LoveLanguageQuiz" element={<LoveLanguageQuiz />} />
          <Route path="/DateIdeas" element={<DateIdeas />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/Invite" element={<Invite />} />
          <Route path="/i/:code" element={<InviteLanding />} />
          <Route path="/PodcastsSupport" element={<PodcastsSupport />} />
          <Route path="/Podcasts" element={<PodcastsSupport />} />
          <Route path="/Podcast" element={<PodcastsSupport />} />
          <Route path="/ArticlesSupport" element={<ArticlesSupport />} />
          <Route path="/RelationshipQuizzes" element={<RelationshipQuizzes />} />
          <Route path="/AnniversaryTracker" element={<AnniversaryTracker />} />
          <Route path="/ForgotPassword" element={<ForgotPassword />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Community" element={<Chat />} />
          <Route path="/Communities" element={<Chat />} />
          <Route path="/RelationshipMilestones" element={<RelationshipMilestones />} />
          <Route path="/RelationshipGoals" element={<RelationshipGoals />} />
          <Route path="/CommunicationPractice" element={<CommunicationPractice />} />
          <Route path="/CouplesProfile" element={<CouplesProfile />} />
          <Route path="/CoupleActivities" element={<CoupleActivities />} />
          <Route path="/CooperativeGames" element={<CooperativeGames />} />
          <Route path="/Pests" element={<PaidGameSessionGate image="/game-cards/card-pests.jpg" backdrop="#0b2e1d" game="pests" title="PEST'S"><Pests /></PaidGameSessionGate>} />
          <Route path="/PoolPingPong" element={<PaidGameSessionGate image="/game-cards/card-pool-ping-pong.jpg" backdrop="#0d3b2a" game="pool_ping_pong" title="Pool Ping Pong"><PoolPingPong /></PaidGameSessionGate>} />
          <Route path="/IThoughtSo" element={<PaidGameSessionGate image="/game-cards/card-i-thought-so.jpg" backdrop="#3a2a05" game="i_thought_so" title="I Thought So!"><IThoughtSo /></PaidGameSessionGate>} />
          <Route path="/Scrabluko" element={<PaidGameSessionGate image="/game-cards/card-scrabluko.jpg" backdrop="#0a1f44" game="scrabluko" title="Scrabluko"><Scrabluko /></PaidGameSessionGate>} />
          <Route path="/WhatShouldTheyDoGlobalPreview" element={<GlobalWhatShouldTheyDoPreview onExit={() => window.location.assign("/CooperativeGames")} />} />
          <Route path="/WhatShouldTheyDo" element={<PaidGameSessionGate image="/game-cards/card-what-should.jpg" backdrop="#2e1020" game="what_should_they_do" title="What Should They Do?"><WhatShouldTheyDo /></PaidGameSessionGate>} />
          <Route path="/Games" element={<PaidGameSessionGate image="/game-cards/card-what-should.jpg" backdrop="#2e1020" game="what_should_they_do" title="What Should They Do?"><WhatShouldTheyDo /></PaidGameSessionGate>} />
          <Route path="/ScratchGame" element={<ScratchGame />} />
          <Route path="/LikeMinded" element={<LikeMinded />} />
          <Route path="/SharedJournals" element={<SharedJournals />} />
          <Route path="/CouplesDashboard" element={<CouplesDashboard />} />
          <Route path="/CouplesCalendar" element={<CouplesCalendar />} />
          <Route path="/LGBTQSupport" element={<LGBTQSupport />} />
          <Route path="/HelpCenter" element={<HelpCenter />} />
          <Route path="/ContactUs" element={<ContactUs />} />
          <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
          <Route path="/TermsOfService" element={<TermsOfService />} />
          <Route path="/Reviews" element={<Reviews />} />
          <Route path="/LeaveReview" element={<LeaveReview />} />
          <Route path="/Suggestions" element={<Suggestions />} />
          <Route path="/Chat" element={<Chat />} />
          <Route path="/ChatRooms" element={<Chat />} />
          <Route path="/ChatRoom" element={<Chat />} />
          <Route path="/PaymentSuccess" element={<Navigate to="/Home" replace />} />
          <Route path="/payment-success" element={<Navigate to="/Home" replace />} />
          <Route path="/Tokens" element={<Navigate to="/FeaturePricing" replace />} />
          <Route path="/Amora" element={<RetiredFeature feature="Amora — AI Relationship Coach" />} />
          <Route path="/Subscription" element={<Navigate to="/FeaturePricing" replace />} />
          <Route path="/MyMatchIQ/Subscription" element={<ExternalMyMatchIQRedirect />} />
          <Route path="/VerifyPhone" element={<Navigate to="/Home" replace />} />
          <Route path="/Professionals" element={<Professionals />} />
          <Route path="/ProfessionalSignup" element={<ProfessionalSignup />} />
          <Route path="/TherapistSignup" element={<TherapistSignup />} />
          <Route path="/InfluencerSignup" element={<InfluencerSignup />} />
          <Route path="/O2OLStudio" element={<O2OLStudio />} />
          <Route path="/OnAir" element={<O2OLStudio />} />
          <Route path="/O2OLStudio/Episodes" element={<O2OLStudioEpisodes />} />
          <Route path="/TikTokPost" element={<TikTokPost />} />
          <Route path="/MyMatchIQ" element={<ExternalMyMatchIQRedirect />} />
          <Route path="/MyMatchIQ/Meet" element={<ExternalMyMatchIQRedirect />} />
          <Route path="/MyMatchIQ/Assessment" element={<ExternalMyMatchIQRedirect />} />
          <Route path="/MyMatchIQ/Passport" element={<ExternalMyMatchIQRedirect />} />
          <Route path="/MyMatchIQ/Bianca" element={<ExternalMyMatchIQRedirect />} />
          <Route path="/MyMatchIQ/Credits" element={<ExternalMyMatchIQRedirect />} />
          <Route path="/Credit" element={<Navigate to="/FeaturePricing" replace />} />
          <Route path="/FeaturePricing" element={<FeaturePricing />} />
          <Route path="/pricing" element={<FeaturePricing />} />
          <Route path="/MyMatchIQ/Actions" element={<ExternalMyMatchIQRedirect />} />
          <Route path="/MyMatchIQ/Dashboard" element={<ExternalMyMatchIQRedirect />} />
          <Route path="/MyMatchIQ/Invite" element={<ExternalMyMatchIQRedirect />} />
          <Route path="/MyMatchIQ/SignIn" element={<ExternalMyMatchIQRedirect />} />
          <Route path="/MyMatchIQ/SignUp" element={<ExternalMyMatchIQRedirect />} />
          <Route path="/MyMatchIQ/*" element={<ExternalMyMatchIQRedirect />} />

          {/* Launch-deferred surfaces stay preserved in source but are not customer-facing. */}
          <Route path="/CounselingSupport" element={<FeatureUnavailable feature="Counseling Support" />} />
          <Route path="/InfluencersSupport" element={<FeatureUnavailable feature="Influencer Support" />} />
          <Route path="/AIContentCreator" element={<RetiredFeature feature="AI Content Creator" />} />
          <Route path="/RelationshipCoach" element={<Navigate to="/Amora" replace />} />
          <Route path="/Meditation" element={<FeatureUnavailable feature="Meditation" />} />
          <Route path="/Developer" element={<FeatureUnavailable feature="Developer" />} />
          <Route path="/Leaderboard" element={<FeatureUnavailable feature="Leaderboard" />} />
          <Route path="/Achievements" element={<FeatureUnavailable feature="Achievements" />} />
          <Route path="/PremiumFeatures" element={<Navigate to="/FeaturePricing" replace />} />
          <Route path="/FindFriends" element={<FeatureUnavailable feature="Find Friends" />} />
          <Route path="/FriendRequests" element={<FeatureUnavailable feature="Friend Requests" />} />
          <Route path="/Blog" element={<Navigate to="/ArticlesSupport" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </LaunchAccessGate>
    </Layout>
  );
}

export default function Pages() {
  return <Router><PagesContent /></Router>;
}
