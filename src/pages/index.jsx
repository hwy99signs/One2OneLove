import { useEffect } from 'react';
import Layout from './Layout.jsx';
import Home from './Home';
import AboutUs from './AboutUs';
import SignIn from './SignIn';
import SignUp from './SignUp';
import AdminAccess from './AdminAccess';
import MemoryLane from './MemoryLane';
import LoveNotes from './LoveNotes';
import SendCredits from './SendCredits';
import CoupleSupport from './CoupleSupport';
import LoveLanguageQuiz from './LoveLanguageQuiz';
import DateIdeas from './DateIdeas';
import Profile from './Profile';
import Invite from './Invite';
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
import PaymentSuccess from './PaymentSuccess';
import Subscription from './Subscription';
import VerifyPhone from './VerifyPhone';
import LaunchAccessGate from '@/components/launch/LaunchAccessGate.jsx';
import { useAuth } from '@/contexts/AuthContext';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';

const PAGES = {
  Home, AboutUs, SignIn, SignUp, AdminAccess, MemoryLane, LoveNotes, SendCredits, CoupleSupport,
  LoveLanguageQuiz, DateIdeas, Profile, Invite, PodcastsSupport, ArticlesSupport, RelationshipQuizzes,
  AnniversaryTracker, ForgotPassword, Dashboard, RelationshipMilestones, RelationshipGoals,
  CommunicationPractice, CouplesProfile, CoupleActivities, SharedJournals, CouplesDashboard,
  CouplesCalendar, LGBTQSupport, HelpCenter, ContactUs, PrivacyPolicy, TermsOfService, Reviews,
  LeaveReview, Suggestions, Chat, PaymentSuccess, Subscription, VerifyPhone,
};

const FEATURE_BY_ROUTE = {
  '/memorylane': 'Memory Lane',
  '/lovenotes': 'Love Notes',
  '/sendcredits': 'Love Notes',
  '/couplesupport': 'Relationship Support',
  '/lovelanguagequiz': 'Love Language Quiz',
  '/dateideas': 'Date Ideas',
  '/profile': 'Member Profile',
  '/invite': 'Invite & Share',
  '/podcastssupport': 'Podcasts',
  '/articlessupport': 'Articles',
  '/relationshipquizzes': 'Relationship Quizzes',
  '/anniversarytracker': 'Anniversary Tracker',
  '/dashboard': 'Member Profile',
  '/community': 'Community Chat',
  '/relationshipmilestones': 'Relationship Milestones',
  '/relationshipgoals': 'Relationship Goals',
  '/communicationpractice': 'Communication Practice',
  '/couplesprofile': 'Couples Profile',
  '/coupleactivities': 'Couple Activities',
  '/sharedjournals': 'Shared Journals',
  '/couplesdashboard': 'Couples Dashboard',
  '/couplescalendar': 'Couples Calendar',
  '/lgbtqsupport': 'LGBTQ+ Support',
  '/chat': 'Community Chat',
  '/subscription': 'Subscription / Billing',
};

function _getCurrentPage(url) {
  if (url.endsWith('/')) url = url.slice(0, -1);
  let urlLastPart = url.split('/').pop();
  if (urlLastPart.includes('?')) urlLastPart = urlLastPart.split('?')[0];
  const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
  return pageName || 'Home';
}

function trackFeatureView(pathname, isAuthenticated) {
  const feature = FEATURE_BY_ROUTE[String(pathname || '').toLowerCase()];
  if (!feature || !isAuthenticated) return;
  fetch('/api/feature-usage', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ feature, eventType: 'view', route: pathname }),
  }).catch(() => {});
}

function PagesContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const currentPage = _getCurrentPage(location.pathname);

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    scrollToTop();
    trackFeatureView(location.pathname, isAuthenticated);
    const frame = window.requestAnimationFrame(scrollToTop);
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.search, location.key, isAuthenticated]);

  return (
    <Layout currentPageName={currentPage}>
      <LaunchAccessGate pathname={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Home" element={<Home />} />
          <Route path="/AboutUs" element={<AboutUs />} />
          <Route path="/SignIn" element={<SignIn />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/SignUp" element={<SignUp />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/AdminAccess" element={<AdminAccess />} />
          <Route path="/MemoryLane" element={<MemoryLane />} />
          <Route path="/LoveNotes" element={<LoveNotes />} />
          <Route path="/SendCredits" element={<SendCredits />} />
          <Route path="/CoupleSupport" element={<CoupleSupport />} />
          <Route path="/LoveLanguageQuiz" element={<LoveLanguageQuiz />} />
          <Route path="/DateIdeas" element={<DateIdeas />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/Invite" element={<Invite />} />
          <Route path="/PodcastsSupport" element={<PodcastsSupport />} />
          <Route path="/ArticlesSupport" element={<ArticlesSupport />} />
          <Route path="/RelationshipQuizzes" element={<RelationshipQuizzes />} />
          <Route path="/AnniversaryTracker" element={<AnniversaryTracker />} />
          <Route path="/ForgotPassword" element={<ForgotPassword />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Community" element={<Chat />} />
          <Route path="/RelationshipMilestones" element={<RelationshipMilestones />} />
          <Route path="/RelationshipGoals" element={<RelationshipGoals />} />
          <Route path="/CommunicationPractice" element={<CommunicationPractice />} />
          <Route path="/CouplesProfile" element={<CouplesProfile />} />
          <Route path="/CoupleActivities" element={<CoupleActivities />} />
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
          <Route path="/PaymentSuccess" element={<PaymentSuccess />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/Subscription" element={<Subscription />} />
          <Route path="/VerifyPhone" element={<VerifyPhone />} />

          {/* Launch-deferred surfaces stay preserved in source but are not customer-facing. */}
          <Route path="/InfluencerSignup" element={<Navigate to="/Home" replace />} />
          <Route path="/ProfessionalSignup" element={<Navigate to="/Home" replace />} />
          <Route path="/TherapistSignup" element={<Navigate to="/Home" replace />} />
          <Route path="/WinACruise" element={<Navigate to="/Home" replace />} />
          <Route path="/CounselingSupport" element={<Navigate to="/CoupleSupport" replace />} />
          <Route path="/InfluencersSupport" element={<Navigate to="/CoupleSupport" replace />} />
          <Route path="/AIContentCreator" element={<Navigate to="/Home" replace />} />
          <Route path="/RelationshipCoach" element={<Navigate to="/CoupleSupport" replace />} />
          <Route path="/Meditation" element={<Navigate to="/CoupleSupport" replace />} />
          <Route path="/Developer" element={<Navigate to="/Home" replace />} />
          <Route path="/CooperativeGames" element={<Navigate to="/CoupleActivities" replace />} />
          <Route path="/Leaderboard" element={<Navigate to="/Home" replace />} />
          <Route path="/Achievements" element={<Navigate to="/Home" replace />} />
          <Route path="/PremiumFeatures" element={<Navigate to="/Subscription" replace />} />
          <Route path="/FindFriends" element={<Navigate to="/Community" replace />} />
          <Route path="/FriendRequests" element={<Navigate to="/Community" replace />} />
          <Route path="/Blog" element={<Navigate to="/ArticlesSupport" replace />} />
          <Route path="*" element={<Navigate to="/Home" replace />} />
        </Routes>
      </LaunchAccessGate>
    </Layout>
  );
}

export default function Pages() {
  return <Router><PagesContent /></Router>;
}
