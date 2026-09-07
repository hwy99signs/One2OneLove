import React from "react";
import { 
  Heart, 
  MessageSquare, 
  Gamepad2, 
  BookOpen, 
  Award, 
  Lock,
  Crown,
  Mail,
  Users,
  Star,
  Shield
} from "lucide-react";

export default function FeaturesGrid() {
  const leftFeatures = [
    {
      icon: Heart,
      color: "text-pink-500",
      title: "Beautiful Love Notes",
      description: "Create and send beautifully-crafted, customizable notes & templates"
    },
    {
      icon: MessageSquare,
      color: "text-purple-500",
      title: "Love Language Quiz",
      description: "Understand your love language & connect with your partner"
    },
    {
      icon: Gamepad2,
      color: "text-green-500",
      title: "Fun Games",
      description: "Enjoy games, Date Ideas, puzzles & hidden messages"
    },
    {
      icon: BookOpen,
      color: "text-blue-500",
      title: "Relationship Articles",
      description: "New articles and tips for stronger relationships"
    },
    {
      icon: Award,
      color: "text-orange-500",
      title: "Expert Articles",
      description: "Comprehensive guides & tips for stronger relationships"
    },
    {
      icon: Lock,
      color: "text-gray-500",
      title: "Hidden Messages",
      description: "Conceal fun & private notes for easy love-lift & occasions"
    }
  ];

  const rightFeatures = [
    {
      icon: Crown,
      color: "text-purple-500",
      title: "Lifetime Member Benefits",
      description: "Exclusive perks to build and expand your relationship journey"
    },
    {
      icon: Mail,
      color: "text-pink-500",
      title: "Romantic Love Notes",
      description: "Send love in multiple languages for every occasion"
    },
    {
      icon: Users,
      color: "text-blue-500",
      title: "Partner Connection",
      description: "Stay connected and feel appreciated every day"
    },
    {
      icon: Star,
      color: "text-orange-500",
      title: "Weekly Featured Experts",
      description: "Get advice from relationship experts to enhance every week"
    },
    {
      icon: Shield,
      color: "text-green-500",
      title: "Private Couple Content",
      description: "Amazing members-that makes both of you very special"
    }
  ];

  return (
    <div className="pt-4 pb-16 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-start gap-4 mb-10">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Platform Features & Resources
            </h2>
          </div>
        </div>

        {/* Two Column Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            {leftFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-4 bg-white rounded-xl hover:shadow-md transition-all"
                >
                  <div className={`flex-shrink-0 ${feature.color}`}>
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {rightFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-4 bg-white rounded-xl hover:shadow-md transition-all"
                >
                  <div className={`flex-shrink-0 ${feature.color}`}>
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}