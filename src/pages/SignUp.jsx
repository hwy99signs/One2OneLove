import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, User, Users, Briefcase, Stethoscope, Mic, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RegularUserForm from "@/components/signup/RegularUserForm";
import SubscriptionSelection from "@/components/subscriptions/SubscriptionSelection";

export default function SignUp() {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showSubscription, setShowSubscription] = useState(false);
  const navigate = useNavigate();

  const signupTypes = [
    {
      id: "regular",
      title: "Regular User",
      description: "Join as a couple or individual to strengthen your relationship",
      icon: Heart,
      color: "from-pink-500 to-rose-500",
      route: null // Will show form inline
    },
    {
      id: "therapist",
      title: "Therapist",
      description: "Licensed therapists and counselors",
      icon: Stethoscope,
      color: "from-green-500 to-teal-500",
      route: "/TherapistSignup"
    },
    {
      id: "influencer",
      title: "Influencer",
      description: "Content creators and social media influencers",
      icon: Mic,
      color: "from-pink-500 to-red-500",
      route: "/InfluencerSignup"
    },
    {
      id: "professional",
      title: "Professional",
      description: "Relationship coaches and other professionals",
      icon: Briefcase,
      color: "from-indigo-500 to-blue-500",
      route: "/ProfessionalSignup"
    }
  ];

  const handleSelectType = (type) => {
    if (type.route) {
      navigate(type.route);
    } else if (type.id === 'regular') {
      // For regular users, show subscription selection first
      setSelectedType(type);
      setShowSubscription(true);
    } else {
      setSelectedType(type);
    }
  };

  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
    setShowSubscription(false);
  };

  const handleBackFromSubscription = () => {
    setShowSubscription(false);
    setSelectedType(null);
    setSelectedPlan(null);
  };

  // Show subscription selection first for regular users
  if (selectedType && selectedType.id === "regular" && showSubscription) {
    return (
      <SubscriptionSelection 
        onBack={handleBackFromSubscription}
        onSelectPlan={handlePlanSelection}
      />
    );
  }

  // After plan selection, show the registration form
  if (selectedType && selectedType.id === "regular" && selectedPlan && !showSubscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 py-12 px-4">
        <RegularUserForm 
          onBack={handleBackFromSubscription} 
          selectedPlan={selectedPlan}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4 relative">
      <div className="w-full max-w-4xl">
        <Link to={createPageUrl("Home")}>
          <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10">
            <X size={24} />
          </button>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full mb-4 shadow-xl">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Join One 2 One Love
          </h1>
          <p className="text-xl text-gray-600">
            Choose how you'd like to join our community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {signupTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-pink-300"
                onClick={() => handleSelectType(type)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{type.title}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {type.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className={`w-full bg-gradient-to-r ${type.color} hover:opacity-90 text-white`}
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <Link to={createPageUrl("SignIn")} className="text-pink-600 hover:text-pink-700 font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

