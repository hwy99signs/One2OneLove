import React, { useEffect } from "react";
import Layout from "./LayoutRelaunch.jsx";
import Home from "./Home";
import InfluencerSignup from "./InfluencerSignup";
import ProfessionalSignup from "./ProfessionalSignup";
import TherapistSignup from "./TherapistSignup";
import ProfessionalApplicationsClosed from "./ProfessionalApplicationsClosed";
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
import LoveLanguageQuiz from "./LoveLanguageQuizRelaunch";
import DateIdeas from "./DateIdeas";
import Profile from "./ProfileRelaunch";
import PrivacyCenter from "./PrivacyCenter";
import BlockedMembers from "./BlockedMembers";
import Invite from "./InviteRelaunch";
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
import ProgrammingSchedule from "./ProgrammingSchedule";
import CreatorProgramming from "./CreatorProgramming";
import O2OLProgrammingAdmin from "./O2OLProgrammingAdmin";
import RelationshipMilestones from "./RelationshipMilestones";
import RelationshipCoach from "./RelationshipCoach";
import RelationshipGoals from "./RelationshipGoalsRelaunch";
import Meditation from "./Meditation";
import CommunicationPractice from "./CommunicationPractice";
import CoupleActivities from "./CoupleActivities";
import SharedJournals from "./SharedJournals";
import CooperativeGames from "./CooperativeGames";
import CouplesDashboard from "./CouplesDashboard";
import CouplesCalendar from "./CouplesCalendar";
import LGBTQSupport from "./LGBTQSupport";
import HelpCenter from "./HelpCenterRelaunch";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import PremiumFeatures from "./PremiumFeatures";
import Chat from "./Chat";
import FindFriends from "./FindFriends";
import FriendRequests from "./FriendRequests";
import PaymentSuccess from "./PaymentSuccess";
import Subscription from "./Subscription";
import RelaunchUnavailable from "./RelaunchUnavailable";
import NotFoundRelaunch from "./NotFoundRelaunch";
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
  PrivacyCenter,
  BlockedMembers,
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
  ProgrammingSchedule,
  CreatorProgramming,
  O2OLProgrammingAdmin,
  RelationshipMilestones,
  RelationshipCoach,
  RelationshipGoals,
  Meditation,
  CommunicationPractice,
  CoupleActivities,
  SharedJournals,
  CooperativeGames,
  CouplesDashboard,
  CouplesCalendar,
  LGBTQSupport,
  HelpCenter,
  PrivacyPolicy,
  TermsOfService,
  PremiumFeatures,
  Chat,
  FindFriends,
  FriendRequests,
  PaymentSuccess,
  Subscription,
};

const PROFESSIONAL_APPLICATION_PATHS = new Set([
  "/InfluencerSignup",
  "/ProfessionalSignup",
  "/TherapistSignup",
]);

const professionalApplicationsOpen = () =>
  import.meta.env.VITE_PROFESSIONAL_APPLICATIONS_ENABLED === "true";

// Third tuple value is an approved paid entitlement key. The FeatureGate remains
// transparent until VITE_MEMBERSHIP_GATING_ENABLED=true after controlled billing tests.
// Legacy pages that contain fabricated reviews/editorial authors, mock rankings/rewards,
// placeholder contact delivery, developer indexes, unverified couple-account assumptions
// or retired campaigns remain preserved in source but are fenced from the public relaunch.
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
  ["/PrivacyCenter", PrivacyCenter],
  ["/BlockedMembers", BlockedMembers],
  ["/WinACruise", RelaunchUnavailable],
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
  ["/ProgrammingSchedule", ProgrammingSchedule],
  ["/CreatorProgramming", CreatorProgramming],
  ["/O2OLProgrammingAdmin", O2OLProgrammingAdmin],
  ["/RelationshipMilestones", RelationshipMilestones, "relationship_milestones"],
  ["/RelationshipCoach", RelationshipCoach, "relationship_coach"],
  ["/RelationshipGoals", RelationshipGoals, "relationship_goals"],
  ["/Meditation", Meditation, "meditation"],
  ["/CommunicationPractice", CommunicationPractice, "communication_practice"],
  ["/CouplesProfile", RelaunchUnavailable],
  ["/Developer", RelaunchUnavailable],
  ["/CoupleActivities", CoupleActivities, "couple_activities"],
  ["/SharedJournals", SharedJournals, "shared_journals"],
  ["/CooperativeGames", CooperativeGames, "cooperative_games"],
  ["/CouplesDashboard", CouplesDashboard, "couples_dashboard"],
  ["/CouplesCalendar", CouplesCalendar, "couples_calendar"],
  ["/LGBTQSupport", LGBTQSupport],
  ["/HelpCenter", HelpCenter],
  ["/ContactUs", RelaunchUnavailable],
  ["/PrivacyPolicy", PrivacyPolicy],
  ["/TermsOfService", TermsOfService],
  ["/Blog", RelaunchUnavailable],
  ["/Reviews", RelaunchUnavailable],
  ["/Suggestions", RelaunchUnavailable],
  ["/Leaderboard", RelaunchUnavailable],
  ["/Achievements", RelaunchUnavailable],
  ["/PremiumFeatures", PremiumFeatures],
  ["/Chat", Chat],
  ["/FindFriends", FindFriends],
  ["/FriendRequests", FriendRequests],
  ["/PaymentSuccess", PaymentSuccess],
  ["/payment-success", PaymentSuccess],
  ["/Subscription", Subscription],
  ["*", NotFoundRelaunch],
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

function routeElement(path, Component, entitlement) {
  if (PROFESSIONAL_APPLICATION_PATHS.has(path) && !professionalApplicationsOpen()) {
    return <ProfessionalApplicationsClosed />;
  }

  if (entitlement) {
    return (
      <FeatureGate feature={entitlement}>
        <Component />
      </FeatureGate>
    );
  }

  return <Component />;
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
              element={routeElement(path, Component, entitlement)}
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
