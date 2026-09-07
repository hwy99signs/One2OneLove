import React from "react";
import { Button } from "@/components/ui/button";
import { Headphones, Gift } from "lucide-react";

export default function FeaturedPodcast() {
  return (
    <div className="bg-white pt-20 pb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl sm:text-5xl font-bold text-center text-gray-900 mb-16">
          Everything You Need for a <br />Perfect Relationship
        </h2>
        
        <p className="text-xl text-center text-gray-600 mb-12 max-w-3xl mx-auto">
          Discover all the amazing ways One 2 One Love helps couples connect, communicate, 
          and create lasting memories together.
        </p>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
              ✨ Featured This Week ✨
            </h3>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-8 border-2 border-pink-200 shadow-xl">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <img
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400"
                alt="Dr. Sarah Chen"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Headphones className="w-5 h-5 text-pink-500" />
                  <span className="text-sm font-semibold text-pink-600 uppercase">Podcast</span>
                </div>
                
                <h4 className="text-2xl font-bold text-gray-900 mb-2">
                  The Love Lab with Dr. Sarah Chen
                </h4>
                
                <p className="text-gray-600 mb-1">Relationship Therapist</p>
                
                <p className="text-gray-700 mb-4">
                  🎉 Must-listen! Dr. Chen dishes out science-backed love advice with humor. 
                  This week: "Why Your Partner Really Didn't Text Back" 😂
                </p>
                
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                    <Headphones className="w-4 h-4 mr-2" />
                    Listen Now
                  </Button>
                  <Button variant="outline" className="border-pink-300 hover:bg-pink-50">
                    <Gift className="w-4 h-4 mr-2" />
                    🎁 Pro Tip: Share with your partner! 💕
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}