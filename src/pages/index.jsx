import React, { useEffect } from "react";
import Layout from "./Layout.jsx";
import Home from "./Home";
import InfluencerSignup from "./InfluencerSignup";
import ProfessionalSignup from "./ProfessionalSignup";
import TherapistSignup from "./TherapistSignup";
import AboutUs from "./AboutUs";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import AuthCallback from "./AuthCallback";
import ResetPassword from "./ResetPassword";
import MemoryLane from "./MemoryLane";
import LoveNotes from "./LoveNotesHub";
import LoveNotesCollection from "./LoveNotesCollectionRelaunch";
import LoveNoteSendDemo from "./LoveNoteSendDemo";
import LoveNoteRevealDemo from "./LoveNoteRevealDemo";
import LoveNoteReveal from "./LoveNoteReveal";
import SavedLoveNotes from "./SavedLoveNotes";
import CoupleSupport from "./CoupleSupport";
import LoveLanguageQuiz from "./LoveLanguageQuiz";
import DateIdeas from "./DateIdeas";
import Profile from "./Profile";
import WinACruise from "./WinACruise";
import Invite from "./Invite";
import CounselingSupport from "./CounselingSupport";
import PodcastsSupport from "./PodcastsSupport";
import ArticlesSupport from "./ArticlesSupport";
import InfluencersSupport from "./InfluencersSupport";
import RelationshipQuizzes from "./RelationshipQuizzes";
import AnniversaryTracker from "./AnniversaryTracker";
import ForgotPassword from "./ForgotPassword";
import AIContentCreator from "./AIContentCreator";
import Dashboard from "./Dashboard";
import Community from "./LiveCommunity";
import LiveRoom from "./LiveRoom";
import RelationshipMilestones from "./RelationshipMilestones";
import RelationshipCoach from "./RelationshipCoach";
import RelationshipGoals from "./RelationshipGoals";
import Meditation from "./Meditation";
import CommunicationPractice from "./CommunicationPractice";
import CouplesProfile from "./CouplesProfile";
import Developer from "./Developer";
import CoupleActivities from "./CoupleActivities";
import SharedJournals from "./SharedJournals";
import CooperativeGames from "./CooperativeGames";
import CouplesDashboard from "./CouplesDashboard";
import CouplesCalendar from "./CouplesCalendar";
import LGBTQSupport from "./LGBTQSupport";
import HelpCenter from "./HelpCenter";
import ContactUs from "./ContactUs";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import Blog from "./Blog";
import Reviews from "./Reviews";
import Suggestions from "./Suggestions";
import Leaderboard from "./Leaderboard";
import Achievements from "./Achievements";
import PremiumFeatures from "./PremiumFeatures";
import Chat from "./Chat";
import FindFriends from "./FindFriends";
import FriendRequests from "./FriendRequests";
import PaymentSuccess from "./PaymentSuccess";
import Subscription from "./Subscription";
import FeatureGate from "@/components/subscription/FeatureGate";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";

const PAGES = {
  Home,
  InfluencerSignup,
  ProfessionalSignup,
  TherapistSignup,
  AboutUs,
  SignIn,
  SignUp,
  AuthCallback,
  ResetPassword,
  MemoryLane,
  LoveNotes,
  LoveNotesCollection,
  LoveNoteSendDemo,
  LoveNoteRevealDemo,
  LoveNoteReveal,
  SavedLoveNotes,
  CoupleSupport,
  LoveLanguageQuiz,
  DateIdeas,
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
  AIContentCreator,
  Dashboard,
  Community,
  LiveRoom,
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
};

// Third tuple value is an approved paid entitlement key. The FeatureGate remains
// transparent until VITE_MEMBERSHIP_GATING_ENABLED=true after controlled billing tests.
const ROUTES = [
  ["/", Home],
  ["/Home", Home],
  ["/InfluencerSignup", InfluencerSignup],
  ["/ProfessionalSignup", ProfessionalSignup],
  ["/TherapistSignup", TherapistSignup],
  ["/AboutUs", AboutUs],
  ["/SignIn", SignIn],
  ["/login", SignIn],
  ["/SignUp", SignUp],
  ["/signup", SignUp],
  ["/auth/callback", AuthCallback],
  ["/ResetPassword", ResetPassword],
  ["/MemoryLane", MemoryLane, "memory_lane"],
  ["/LoveNotes", LoveNotes],
  ["/LoveNotesCollection", LoveNotesCollection],
  ["/LoveNotes/Send", LoveNoteSendDemo],
  ["/LoveNoteSendDemo", LoveNoteSendDemo],
  ["/LoveNoteRevealDemo", LoveNoteRevealDemo],
  ["/LoveNoteReveal", LoveNoteReveal],
  ["/SavedLoveNotes", SavedLoveNotes],
  ["/CoupleSupport", CoupleSupport],
  ["/LoveLanguageQuiz", LoveLanguageQuiz],
  ["/DateIdeas", DateIdeas],
  ["/Profile", Profile],
  ["/WinACruise", WinACruise],
  ["/Invite", Invite],
  ["/CounselingSupport", CounselingSupport],
  ["/PodcastsSupport", PodcastsSupport],
  ["/ArticlesSupport", ArticlesSupport],
  ["/InfluencersSupport", InfluencersSupport],
  ["/RelationshipQuizzes", RelationshipQuizzes, "advanced_relationship_quizzes"],
  ["/AnniversaryTracker", AnniversaryTracker, "anniversary_tracker"],
  ["/ForgotPassword", ForgotPassword],
  ["/AIContentCreator", AIContentCreator, "ai_content_creator"],
  ["/Dashboard", Dashboard],
  ["/Community", Community],
  ["/LiveRoom", LiveRoom],
  ["/RelationshipMilestones", RelationshipMilestones, "relationship_milestones"],
  ["/RelationshipCoach", RelationshipCoach, "relationship_coach"],
  ["/RelationshipGoals", RelationshipGoals, "relationship_goals"],
  ["/Meditation", Meditation, "meditation"],
  ["/CommunicationPractice", CommunicationPractice, "communication_practice"],
  ["/CouplesProfile", CouplesProfile],
  ["/Developer", Developer],
  ["/CoupleActivities", CoupleActivities, "couple_activities"],
  ["/SharedJournals", SharedJournals, "shared_journals"],
  ["/CooperativeGames", CooperativeGames, "cooperative_games"],
  ["/CouplesDashboard", CouplesDashboard, "couples_dashboard"],
  ["/CouplesCalendar", CouplesCalendar, "couples_calendar"],
  ["/LGBTQSupport", LGBTQSupport],
  ["/HelpCenter", HelpCenter],
  ["/ContactUs", ContactUs],
  ["/PrivacyPolicy", PrivacyPolicy],
  ["/TermsOfService", TermsOfService],
  ["/Blog", Blog],
  ["/Reviews", Reviews],
  ["/Suggestions", Suggestions],
  ["/Leaderboard", Leaderboard],
  ["/Achievements", Achievements],
  ["/PremiumFeatures", PremiumFeatures],
  ["/Chat", Chat],
  ["/FindFriends", FindFriends],
  ["/FriendRequests", FriendRequests],
  ["/PaymentSuccess", PaymentSuccess],
  ["/payment-success", PaymentSuccess],
  ["/Subscription", Subscription],
];

function _getCurrentPage(url) {
  if (url.endsWith("/")) url = url.slice(0, -1);
  let urlLastPart = url.split("/").pop();
  if (urlLastPart.includes("?")) urlLastPart = urlLastPart.split("?")[0];

  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase()
  );

  return pageName || "Home";
}

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, search]);

  return null;
}

function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <>
      <ScrollToTop />
      <Layout currentPageName={currentPage}>
        <Routes>
          {ROUTES.map(([path, Component, entitlement]) => (
            <Route
              key={path}
              path={path}
              element={
                entitlement ? (
                  <FeatureGate feature={entitlement}>
                    <Component />
                  </FeatureGate>
                ) : (
                  <Component />
                )
              }
            />
          ))}
        </Routes>
      </Layout>
    </>
  );
}

export default function Pages() {
  return (
    <Router>
      <PagesContent />
    </Router>
  );
}
