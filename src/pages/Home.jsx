import React from "react";

import HeroSection from "../components/home/HeroSection";
import DiversitySection from "../components/home/DiversitySection";
import FeaturedPodcast from "../components/home/FeaturedPodcast";
import GlobalRoomPromo from "../components/home/GlobalRoomPromo";
import DailyQuestionPromo from "../components/home/DailyQuestionPromo";
import MarriageMattersPromo from "../components/home/MarriageMattersPromo";
import FeaturesGrid from "../components/home/FeaturesGrid";
import Testimonials from "../components/home/Testimonials";
import Footer from "../components/home/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <DiversitySection />
      <FeaturedPodcast />
      <GlobalRoomPromo />
      <DailyQuestionPromo />
      <MarriageMattersPromo />
      <FeaturesGrid />
      <Testimonials />
      <Footer />
    </div>
  );
}