import Layout from "./Layout.jsx";

import Home from "./Home";





import SignIn from "./SignIn";

import SignUp from "./SignUp";

import MemoryLane from "./MemoryLane";

import LoveNotes from "./LoveNotes";

import CoupleSupport from "./CoupleSupport";

import LoveLanguageQuiz from "./LoveLanguageQuiz";

import DateIdeas from "./DateIdeas";

import Profile from "./Profile";


import Invite from "./Invite";

import CounselingSupport from "./CounselingSupport";


import ArticlesSupport from "./ArticlesSupport";

import InfluencersSupport from "./InfluencersSupport";

import RelationshipQuizzes from "./RelationshipQuizzes";

import AnniversaryTracker from "./AnniversaryTracker";

import ForgotPassword from "./ForgotPassword";

import AIContentCreator from "./AIContentCreator";

import Dashboard from "./Dashboard";

import Community from "./Community";

import RelationshipMilestones from "./RelationshipMilestones";


import RelationshipGoals from "./RelationshipGoals";

import Meditation from "./Meditation";

import CommunicationPractice from "./CommunicationPractice";



import CoupleActivities from "./CoupleActivities";

import SharedJournals from "./SharedJournals";

import CooperativeGames from "./CooperativeGames";

import CouplesDashboard from "./CouplesDashboard";

import CouplesCalendar from "./CouplesCalendar";





import TermsOfService from "./TermsOfService";

import Blog from "./Blog";



import Leaderboard from "./Leaderboard";

import Achievements from "./Achievements";


import Chat from "./Chat";

import FindFriends from "./FindFriends";

import FriendRequests from "./FriendRequests";

import PaymentSuccess from "./PaymentSuccess";

import Subscription from "./Subscription";

import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    SignIn: SignIn,
    
    SignUp: SignUp,
    
    MemoryLane: MemoryLane,
    
    LoveNotes: LoveNotes,
    
    CoupleSupport: CoupleSupport,
    
    LoveLanguageQuiz: LoveLanguageQuiz,
    
    DateIdeas: DateIdeas,
    
    Profile: Profile,
    Invite: Invite,
    
    CounselingSupport: CounselingSupport,
    ArticlesSupport: ArticlesSupport,
    
    InfluencersSupport: InfluencersSupport,
    
    RelationshipQuizzes: RelationshipQuizzes,
    
    AnniversaryTracker: AnniversaryTracker,
    
    ForgotPassword: ForgotPassword,
    
    AIContentCreator: AIContentCreator,
    
    Dashboard: Dashboard,
    
    Community: Community,
    
    RelationshipMilestones: RelationshipMilestones,
    RelationshipGoals: RelationshipGoals,
    
    Meditation: Meditation,
    
    CommunicationPractice: CommunicationPractice,
    CoupleActivities: CoupleActivities,
    
    SharedJournals: SharedJournals,
    
    CooperativeGames: CooperativeGames,
    
    CouplesDashboard: CouplesDashboard,
    
    CouplesCalendar: CouplesCalendar,
    TermsOfService: TermsOfService,
    
    Blog: Blog,
    Leaderboard: Leaderboard,
    
    Achievements: Achievements,
    Chat: Chat,
    
    FindFriends: FindFriends,
    
    FriendRequests: FriendRequests,
    
    PaymentSuccess: PaymentSuccess,
    
    Subscription: Subscription,
    
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
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/InfluencerSignup" element={<Navigate to="/" replace />} />
                
                <Route path="/ProfessionalSignup" element={<Navigate to="/" replace />} />
                
                <Route path="/TherapistSignup" element={<Navigate to="/" replace />} />
                
                <Route path="/AboutUs" element={<Navigate to="/" replace />} />
                
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
                
                <Route path="/WinACruise" element={<Navigate to="/" replace />} />
                
                <Route path="/Invite" element={<Invite />} />
                
                <Route path="/CounselingSupport" element={<CounselingSupport />} />
                
                <Route path="/PodcastsSupport" element={<Navigate to="/" replace />} />
                
                <Route path="/ArticlesSupport" element={<ArticlesSupport />} />
                
                <Route path="/InfluencersSupport" element={<InfluencersSupport />} />
                
                <Route path="/RelationshipQuizzes" element={<RelationshipQuizzes />} />
                
                <Route path="/AnniversaryTracker" element={<AnniversaryTracker />} />
                
                <Route path="/ForgotPassword" element={<ForgotPassword />} />
                
                <Route path="/AIContentCreator" element={<AIContentCreator />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Community" element={<Community />} />
                
                <Route path="/RelationshipMilestones" element={<RelationshipMilestones />} />
                
                <Route path="/RelationshipCoach" element={<Navigate to="/" replace />} />
                
                <Route path="/RelationshipGoals" element={<RelationshipGoals />} />
                
                <Route path="/Meditation" element={<Meditation />} />
                
                <Route path="/CommunicationPractice" element={<CommunicationPractice />} />
                
                <Route path="/CouplesProfile" element={<Navigate to="/" replace />} />
                
                <Route path="/Developer" element={<Navigate to="/" replace />} />
                
                <Route path="/CoupleActivities" element={<CoupleActivities />} />
                
                <Route path="/SharedJournals" element={<SharedJournals />} />
                
                <Route path="/CooperativeGames" element={<CooperativeGames />} />
                
                <Route path="/CouplesDashboard" element={<CouplesDashboard />} />
                
                <Route path="/CouplesCalendar" element={<CouplesCalendar />} />
                
                <Route path="/LGBTQSupport" element={<Navigate to="/" replace />} />
                
                <Route path="/HelpCenter" element={<Navigate to="/" replace />} />
                
                <Route path="/ContactUs" element={<Navigate to="/" replace />} />
                
                <Route path="/PrivacyPolicy" element={<Navigate to="/" replace />} />
                
                <Route path="/TermsOfService" element={<TermsOfService />} />
                
                <Route path="/Blog" element={<Blog />} />
                
                <Route path="/Reviews" element={<Navigate to="/" replace />} />
                
                <Route path="/Suggestions" element={<Navigate to="/" replace />} />
                
                <Route path="/Leaderboard" element={<Leaderboard />} />
                
                <Route path="/Achievements" element={<Achievements />} />
                
                <Route path="/PremiumFeatures" element={<Navigate to="/" replace />} />
                
                <Route path="/Chat" element={<Chat />} />
                
                <Route path="/FindFriends" element={<FindFriends />} />
                
                <Route path="/FriendRequests" element={<FriendRequests />} />
                
                <Route path="/PaymentSuccess" element={<PaymentSuccess />} />
                
                <Route path="/payment-success" element={<PaymentSuccess />} />
                
                <Route path="/Subscription" element={<Subscription />} />
                
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