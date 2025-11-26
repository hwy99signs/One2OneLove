import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

const countries = [
  "United States", "United Kingdom", "Canada", "France", "Spain", "Mexico",
  "Italy", "Germany", "Netherlands", "Australia", "Brazil", "Argentina",
  "Belgium", "Switzerland", "Portugal", "Austria", "Ireland", "New Zealand",
  "Denmark", "Sweden", "Norway", "Finland", "Poland", "Czech Republic",
  "Greece", "Turkey", "India", "Japan", "South Korea", "Singapore",
  "Other"
];

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const queryClient = useQueryClient();

  const signupMutation = useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('waitlist')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlist-signups'] });
      toast.success("🎉 You're on the waitlist!", {
        description: "We'll notify you when we launch in your country!"
      });
      setEmail("");
      setCountry("");
    },
    onError: (error) => {
      toast.error("Oops!", {
        description: "Something went wrong. Please try again."
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !country) {
      toast.error("Please fill in all fields");
      return;
    }
    signupMutation.mutate({ email, country });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-pink-600 rounded-3xl p-1 shadow-2xl">
        <div className="bg-white rounded-[22px] p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Heart className="w-16 h-16 text-pink-500 fill-pink-500 animate-pulse" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Join the Waitlist
            </h2>
            <p className="text-xl text-gray-600">
              Be the first to know when we launch in your country!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Enter your email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-lg"
                required
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Select your country
              </label>
              <Select value={country} onValueChange={setCountry} required>
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue placeholder="Choose your country" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {countries.map((c) => (
                    <SelectItem key={c} value={c} className="text-lg">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {signupMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2 fill-current" />
                  Join the Waitlist
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}