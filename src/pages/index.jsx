import Layout from "./Layout.jsx";

import Home from "./Home";

import InfluencerSignup from "./InfluencerSignup";

import ProfessionalSignup from "./ProfessionalSignup";

import TherapistSignup from "./TherapistSignup";

import AboutUs from "./AboutUs";

import SignIn from "./SignIn";

import SignUp from "./SignUp";

import MemoryLane from "./MemoryLane";

import LoveNotes from "./LoveNotes";

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

import Community from "./Community";

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

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    InfluencerSignup: InfluencerSignup,
    
    ProfessionalSignup: ProfessionalSignup,
    
    TherapistSignup: TherapistSignup,
    
    AboutUs: AboutUs,
    
    SignIn: SignIn,
    
    SignUp: SignUp,
    
    MemoryLane: MemoryLane,
    
    LoveNotes: LoveNotes,
    
    CoupleSupport: CoupleSupport,
    
    LoveLanguageQuiz: LoveLanguageQuiz,
    
    DateIdeas: DateIdeas,
    
    Profile: Profile,
    
    WinACruise: WinACruise,
    
    Invite: Invite,
    
    CounselingSupport: CounselingSupport,
    
    PodcastsSupport: PodcastsSupport,
    
    ArticlesSupport: ArticlesSupport,
    
    InfluencersSupport: InfluencersSupport,
    
    RelationshipQuizzes: RelationshipQuizzes,
    
    AnniversaryTracker: AnniversaryTracker,
    
    ForgotPassword: ForgotPassword,
    
    AIContentCreator: AIContentCreator,
    
    Dashboard: Dashboard,
    
    Community: Community,
    
    RelationshipMilestones: RelationshipMilestones,
    
    RelationshipCoach: RelationshipCoach,
    
    RelationshipGoals: RelationshipGoals,
    
    Meditation: Meditation,
    
    CommunicationPractice: CommunicationPractice,
    
    CouplesProfile: CouplesProfile,
    
    Developer: Developer,
    
    CoupleActivities: CoupleActivities,
    
    SharedJournals: SharedJournals,
    
    CooperativeGames: CooperativeGames,
    
    CouplesDashboard: CouplesDashboard,
    
    CouplesCalendar: CouplesCalendar,
    
    LGBTQSupport: LGBTQSupport,
    
    HelpCenter: HelpCenter,
    
    ContactUs: ContactUs,
    
    PrivacyPolicy: PrivacyPolicy,
    
    TermsOfService: TermsOfService,
    
    Blog: Blog,
    
    Reviews: Reviews,
    
    Suggestions: Suggestions,
    
    Leaderboard: Leaderboard,
    
    Achievements: Achievements,
    
    PremiumFeatures: PremiumFeatures,
    
    Chat: Chat,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    const isChatPage = location.pathname.toLowerCase().includes('/chat');
    
    // Chat page should be full view without Layout
    if (isChatPage) {
        return <Chat />;
    }
    
    return (
        <Layout currentPageName={currentPage}>
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
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}