import React from "react";
// Base44 removed - using Supabase instead
import { useQuery } from "@tanstack/react-query";

import HeroSection from "../components/home/HeroSection";
import DiversitySection from "../components/home/DiversitySection";
import FeaturedPodcast from "../components/home/FeaturedPodcast";
import FeaturesGrid from "../components/home/FeaturesGrid";
import Testimonials from "../components/home/Testimonials";
import Footer from "../components/home/Footer";

export default function Home() {
  const { data: stats } = useQuery({
    queryKey: ['love-notes-stats'],
    queryFn: async () => {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      const currentYear = new Date().getFullYear().toString();

      // Calculate week period (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Fetch monthly leaderboard - Base44 removed
      const monthlyLeaderboard = [];
      const monthlyTopUser = null;

      // Fetch yearly leaderboard - Base44 removed
      const yearlyLeaderboard = [];
      const yearlyTopUser = null;

      // Calculate weekly stats - Base44 removed
      const weeklyTopUser = null;

      // Get total users count - Base44 removed
      const happyCouples = 0;

      // Get total notes count - Base44 removed
      const totalNotes = 0;

      return {
        notesCreated: totalNotes,
        happyCouples: happyCouples,
        mostNotesWeek: {
          count: weeklyTopUser?.score || 0,
          membershipId: weeklyTopUser?.user_email?.split('@')[0] || ''
        },
        mostNotesMonth: {
          count: monthlyTopUser?.score || 0,
          membershipId: monthlyTopUser?.user_email?.split('@')[0] || ''
        },
        mostNotesYear: {
          count: yearlyTopUser?.score || 0,
          membershipId: yearlyTopUser?.user_email?.split('@')[0] || ''
        }
      };
    },
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    initialData: { 
      notesCreated: 0, 
      happyCouples: 0,
      mostNotesWeek: { count: 0, membershipId: '' },
      mostNotesMonth: { count: 0, membershipId: '' },
      mostNotesYear: { count: 0, membershipId: '' }
    },
  });

  return (
    <div className="min-h-screen">
      <HeroSection stats={stats} />
      <DiversitySection />
      <FeaturedPodcast />
      <FeaturesGrid />
      <Testimonials />
      <Footer />
    </div>
  );
}