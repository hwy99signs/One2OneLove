import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, CheckCircle, User, Mail, Phone, Building, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import OtherUserSignupForm from "../components/signup/OtherUserSignupForm";
import TurnstileWidget, { turnstileConfigured } from "../components/signup/TurnstileWidget";
import { submitProfessionalApplication } from "@/lib/professionalApplicationService";

export default function ProfessionalSignup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [otherUserBio, setOtherUserBio] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const [signupComplete, setSignupComplete] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please complete your name, email, and phone number.");
      return;
    }
    if (!organizationName.trim()) {
      toast.error("Please enter your practice or organization name.");
      return;
    }
    if (!organizationType) {
      toast.error("Please select your practice type.");
      return;
    }
    if (!serviceDescription.trim()) {
      toast.error("Please describe the services you offer.");
      return;
    }
    if (serviceDescription.trim().length > 500) {
      toast.error("Service description must be 500 characters or less.");
      return;
    }
    if (!otherUserBio.trim() || otherUserBio.trim().length < 100) {
      toast.error("Professional bio must be at least 100 characters.");
      return;
    }
    if (otherUserBio.trim().length > 1000) {
      toast.error("Professional bio must be 1000 characters or less.");
      return;
    }
    if (turnstileConfigured() && !turnstileToken) {
      toast.error("Please complete the secure verification before submitting.");
      return;
    }

    setIsLoading(true);
    try {
      const application = await submitProfessionalApplication({
        applicationType: 'professional',
        firstName,
        lastName,
        email,
        phone,
        turnstileToken,
        details: {
          organizationName: organizationName.trim(),
          practiceType: organizationType,
          serviceDescription: serviceDescription.trim(),
          websiteUrl: websiteUrl.trim() || null,
          professionalBio: otherUserBio.trim(),
        },
      });

      setApplicationId(application?.id || null);
      setSignupComplete(true);
      toast.success("Professional application submitted.");
    } catch (error) {
      console.error('Professional application error:', error);
      toast.error(error?.message || "We couldn't submit your application right now.");
      if (turnstileConfigured()) {
        setTurnstileToken("");
        setTurnstileResetKey((value) => value + 1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (signupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Application Submitted</h1>
          <p className="text-xl text-gray-600 mb-8">Thank you for your interest in joining One2OneLove as a professional partner.</p>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8 text-left">
            <p className="font-bold text-gray-800">{firstName} {lastName}</p>
            <p className="mt-1 font-semibold text-gray-700">{organizationName}</p>
            <p className="mt-3 text-gray-600">
              Your application is pending review. Submission does not automatically verify your email, phone, credentials, organization, or create an approved professional profile.
            </p>
            <p className="mt-3 text-gray-600">We will contact you at <strong>{email}</strong> about next steps.</p>
            {applicationId && <p className="mt-3 text-xs text-gray-500">Application reference: {applicationId}</p>}
          </div>
          <Button size="lg" onClick={() => { window.location.href = "/"; }} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg px-8 py-6 h-auto">
            <Heart className="w-5 h-5 mr-2 fill-current" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-xl">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">Join as a Professional</h1>
          <p className="text-xl text-gray-600">Apply to bring useful, relationship-supporting services to the One2OneLove community.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-gray-700">
                First Name *
                <div className="relative mt-2">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required autoComplete="given-name" />
                </div>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Last Name *
                <div className="relative mt-2">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required autoComplete="family-name" />
                </div>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Email Address *
                <div className="relative mt-2">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required autoComplete="email" />
                </div>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number *
                <div className="relative mt-2">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" required autoComplete="tel" />
                </div>
              </label>
            </div>
            <div className="mt-5 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <p>Email, phone, credentials, and organization details are verified during review. One2OneLove no longer uses demo verification codes.</p>
            </div>
          </div>

          <OtherUserSignupForm
            organizationName={organizationName}
            setOrganizationName={setOrganizationName}
            organizationType={organizationType}
            setOrganizationType={setOrganizationType}
            serviceDescription={serviceDescription}
            setServiceDescription={setServiceDescription}
            websiteUrl={websiteUrl}
            setWebsiteUrl={setWebsiteUrl}
            otherUserBio={otherUserBio}
            setOtherUserBio={setOtherUserBio}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Profile photos are added after application review so pre-membership uploads are not placed in public storage.
          </div>

          <TurnstileWidget onToken={setTurnstileToken} resetKey={turnstileResetKey} />

          <div className="flex justify-center">
            <Button type="submit" disabled={isLoading || (turnstileConfigured() && !turnstileToken)} size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg px-12 py-6 h-auto shadow-xl">
              {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Submitting...</> : <><Building className="w-5 h-5 mr-2" />Submit Application</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}