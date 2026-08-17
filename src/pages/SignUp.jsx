import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Heart, Briefcase, Stethoscope, Mic, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RegularUserForm from "@/components/signup/RegularUserForm";

const safeReturnTo = (value) => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
};

export default function SignUp() {
  const [selectedType, setSelectedType] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const returnTo = safeReturnTo(searchParams.get('returnTo'));
  const signInUrl = returnTo
    ? `${createPageUrl("SignIn")}?returnTo=${encodeURIComponent(returnTo)}`
    : createPageUrl("SignIn");

  const signupTypes = [
    {
      id: "regular",
      title: "Regular User",
      description: "Join as a couple or individual to strengthen your relationship",
      icon: Heart,
      color: "from-pink-500 to-rose-500",
      route: null
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
      const destination = returnTo
        ? `${type.route}?returnTo=${encodeURIComponent(returnTo)}`
        : type.route;
      navigate(destination);
      return;
    }

    setSelectedType(type);
  };

  const handleBackFromForm = () => {
    setSelectedType(null);
  };

  if (selectedType && selectedType.id === "regular") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 py-12 px-4">
        <RegularUserForm
          onBack={handleBackFromForm}
          returnTo={returnTo}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4 relative">
      <div className="w-full max-w-4xl">
        <Link to={createPageUrl("Home")}>
          <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10" aria-label="Close signup">
            <X size={24} />
          </button>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full mb-4 shadow-xl">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Join One2OneLove
          </h1>
          <p className="text-xl text-gray-600">
            Choose how you'd like to join our community
          </p>
          {returnTo && (
            <p className="mt-3 text-sm font-semibold text-pink-700">
              After you verify and sign in, we’ll bring you back to the conversation you chose.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {signupTypes.map((type) => {
            const Icon = type.icon;
            return (
              <Card
                key={type.id}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-pink-300 flex flex-col h-full"
                onClick={() => handleSelectType(type)}
              >
                <CardHeader className="flex-1">
                  <div className={`w-12 h-12 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{type.title}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {type.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button className={`w-full bg-gradient-to-r ${type.color} hover:opacity-90 text-white`}>
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
            <Link to={signInUrl} className="text-pink-600 hover:text-pink-700 font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
