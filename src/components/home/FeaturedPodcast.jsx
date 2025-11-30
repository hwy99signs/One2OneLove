import React from "react";
import { Button } from "@/components/ui/button";
import { Target, Sparkles, Lightbulb, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FeaturedPodcast() {
  return (
    <div className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 mb-16">
          Everything You Need for a <br />Perfect Relationship
        </h2>
        
        <p className="text-xl text-center text-gray-600 mb-12 max-w-3xl mx-auto">
          Discover all the amazing ways One 2 One Love helps couples connect, communicate, 
          and create lasting memories together.
        </p>

        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-6">
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600">
              ✨ Featured This Week ✨
            </h3>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-3xl p-8 border-2 border-yellow-400 shadow-xl relative overflow-hidden">
            {/* Sparkle graphics - animated */}
            <div className="absolute inset-0 opacity-20">
              <Sparkles className="absolute top-4 left-8 w-6 h-6 text-yellow-600 animate-pulse" />
              <Star className="absolute top-12 right-16 w-4 h-4 text-orange-500 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <Sparkles className="absolute bottom-8 left-20 w-5 h-5 text-pink-500 animate-pulse" style={{ animationDelay: '1s' }} />
              <Star className="absolute bottom-16 right-8 w-6 h-6 text-yellow-600 animate-pulse" style={{ animationDelay: '1.5s' }} />
              <Sparkles className="absolute top-1/2 right-12 w-5 h-5 text-orange-400 animate-pulse" style={{ animationDelay: '0.75s' }} />
            </div>
            
            {/* Party popper emoji icons */}
            <div className="absolute inset-0 pointer-events-none">
              <span className="absolute top-6 right-20 text-2xl animate-bounce" style={{ animationDuration: '2s', animationDelay: '0.3s' }}>🎊</span>
              <span className="absolute bottom-12 left-12 text-xl animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.8s' }}>🎊</span>
              <span className="absolute top-1/3 right-8 text-lg animate-bounce" style={{ animationDuration: '2.2s', animationDelay: '1.2s' }}>🎊</span>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
              {/* Left side - Image with NEW badge and confetti effect */}
              <div className="relative">
                <div className="absolute -top-2 -left-2 z-20 bg-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform -rotate-12 animate-bounce" style={{ animationDuration: '2s' }}>
                  NEW!
                </div>
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg border-4 border-white relative overflow-hidden">
                  {/* Party popper emoji icon */}
                  <div className="text-6xl animate-bounce" style={{ animationDuration: '2s' }}>
                    🎊
                  </div>
                </div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <span className="text-sm font-semibold text-red-400">2026 SPECIAL</span>
                </div>
                
                <h4 className="text-3xl font-bold text-red-600 mb-2">
                  NEW YEAR RESOLUTIONS 2026
                </h4>
                
                <p className="text-gray-700 font-semibold mb-3 text-lg">
                  Set Your Relationship Goals for the New Year!
                </p>
                
                <p className="text-gray-700 mb-6">
                  Start 2026 with purpose! Set meaningful relationship goals, track milestones, and make this your best year together yet. Plus get exclusive New Year bonuses!
                </p>
                
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Link to={createPageUrl("RelationshipGoals")}>
                    <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      <Target className="w-4 h-4 mr-2" />
                      Set Your 2026 Goals
                    </Button>
                  </Link>
                  <Button variant="outline" className="border-red-400 text-red-600 hover:bg-red-50 shadow-md hover:shadow-lg transition-all duration-300">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Get New Year Tips!
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-2">
            Platform Features & Resources
          </h3>
        </div>
      </div>
    </div>
  );
}