import React from "react";
import { Code, User, Users, Heart, Briefcase, Mic, UserPlus, Ship, Calendar, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function Developer() {
  const pages = [
    { name: "Home", icon: Heart, color: "from-pink-500 to-rose-500", description: "Landing page" },
    { name: "Profile", icon: User, color: "from-purple-500 to-indigo-500", description: "Individual user profile" },
    { name: "CouplesProfile", icon: Users, color: "from-pink-500 to-purple-500", description: "Couples profile page" },
    { name: "LoveNotes", icon: Heart, color: "from-red-500 to-pink-500", description: "Send love notes" },
    { name: "DateIdeas", icon: Calendar, color: "from-orange-500 to-yellow-500", description: "Browse date ideas" },
    { name: "MemoryLane", icon: Calendar, color: "from-blue-500 to-cyan-500", description: "Create & view memories" },
    { name: "RelationshipMilestones", icon: Heart, color: "from-purple-500 to-pink-500", description: "Track milestones" },
    { name: "RelationshipGoals", icon: Heart, color: "from-green-500 to-emerald-500", description: "Set relationship goals" },
    { name: "RelationshipCoach", icon: MessageCircle, color: "from-indigo-500 to-purple-500", description: "AI relationship coach" },
    { name: "CommunicationPractice", icon: MessageCircle, color: "from-cyan-500 to-blue-500", description: "Practice communication" },
    { name: "RelationshipQuizzes", icon: Heart, color: "from-violet-500 to-purple-500", description: "Relationship quizzes" },
    { name: "Meditation", icon: Heart, color: "from-emerald-500 to-teal-500", description: "Guided meditation" },
    { name: "AIContentCreator", icon: Code, color: "from-blue-500 to-purple-500", description: "Generate AI content" },
    { name: "CoupleSupport", icon: Users, color: "from-purple-500 to-pink-500", description: "Relationship support hub" },
    { name: "ArticlesSupport", icon: Code, color: "from-blue-500 to-cyan-500", description: "Articles & advice" },
    { name: "PodcastsSupport", icon: Mic, color: "from-orange-500 to-red-500", description: "Relationship podcasts" },
    { name: "Community", icon: Users, color: "from-teal-500 to-green-500", description: "Community discussions" },
    { name: "TherapistSignup", icon: Briefcase, color: "from-green-500 to-teal-500", description: "Therapist signup form" },
    { name: "InfluencerSignup", icon: Mic, color: "from-pink-500 to-red-500", description: "Influencer signup form" },
    { name: "ProfessionalSignup", icon: Briefcase, color: "from-indigo-500 to-blue-500", description: "Professional signup form" },
    { name: "SignUp", icon: UserPlus, color: "from-purple-500 to-pink-500", description: "General signup" },
    { name: "SignIn", icon: User, color: "from-blue-500 to-purple-500", description: "Sign in page" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black text-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full mb-6 shadow-xl">
            <Code className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Developer Access
          </h1>
          <p className="text-xl text-gray-300">
            Quick access to all pages and profile types
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pages.map((page, index) => {
            const Icon = page.icon;
            return (
              <motion.div
                key={page.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
              >
                <Link to={createPageUrl(page.name)}>
                  <Card className="h-full hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-yellow-400 bg-white/5 backdrop-blur-sm hover:bg-white/10">
                    <CardHeader>
                      <div className={`w-12 h-12 bg-gradient-to-br ${page.color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-white text-lg">
                        {page.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 text-sm">{page.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}