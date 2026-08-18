import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, CheckCircle, User, Mail, Phone, Stethoscope, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import TherapistSignupForm from "../components/signup/TherapistSignupForm";
import SocialMediaPlatformsForm from "../components/signup/SocialMediaPlatformsForm";
import { submitProfessionalApplication } from "@/lib/professionalApplicationService";

export default function TherapistSignup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [licensedCountries, setLicensedCountries] = useState([]);
  const [licensedStates, setLicensedStates] = useState([]);
  const [therapyTypes, setTherapyTypes] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [yearsExperience, setYearsExperience] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [professionalBio, setProfessionalBio] = useState("");
  const [socialMediaPlatforms, setSocialMediaPlatforms] = useState({});

  const [signupComplete, setSignupComplete] = useState(false);
  const [applicationId, setApplicationId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please complete your name, email, and phone number.");
      return;
    }
    if (licensedCountries.length === 0 || licensedStates.length === 0) {
      toast.error("Please provide at least one licensed country and state/province.");
      return;
    }
    if (therapyTypes.length === 0 || specializations.length === 0) {
      toast.error("Please provide therapy types and specializations.");
      return;
    }
    if (!professionalBio.trim()) {
      toast.error("Please add your professional bio.");
      return;
    }

    setIsLoading(true);
    try {
      const application = await submitProfessionalApplication({
        applicationType: 'therapist',
        firstName,
        lastName,
        email,
        phone,
        details: {
          licensedCountries,
          licensedStates,
          therapyTypes,
          specializations,
          certifications,
          yearsExperience: yearsExperience ? Number(yearsExperience) : null,
          consultationFee: consultationFee ? Number(consultationFee) : null,
          professionalBio: professionalBio.trim(),
          socialMediaPlatforms,
        },
      });

      setApplicationId(application?.id || null);
      setSignupComplete(true);
      toast.success("Therapist application submitted.");
    } catch (error) {
      console.error('Therapist application error:', error);
      toast.error(error?.message || "We couldn't submit your application right now.");
    } finally {
      setIsLoading(false);
    }
  };

  if (signupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-100 to-green-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-12 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Application Submitted</h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your interest in joining One2OneLove as a therapist.
          </p>
          <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-6 mb-8 text-left">
            <p className="font-bold text-gray-800">{firstName} {lastName}</p>
            <p className="mt-3 text-gray-600">
              Your application is pending review. Submission does not automatically verify your license, email, phone number, or create an approved professional profile.
            </p>
            <p className="mt-3 text-gray-600">
              We will use <strong>{email}</strong> to contact you about the review and any verification steps.
            </p>
            {applicationId && <p className="mt-3 text-xs text-gray-500">Application reference: {applicationId}</p>}
          </div>
          <Button size="lg" onClick={() => { window.location.href = "/"; }} className="bg-gradient-to-r from-teal-500 to-blue-500 text-white text-lg px-8 py-6 h-auto">
            <Heart className="w-5 h-5 mr-2 fill-current" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-100 to-green-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full mb-4 shadow-xl">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">Join as a Therapist</h1>
          <p className="text-xl text-gray-600">Apply to support healthier relationships in the One2OneLove community.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-teal-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-gray-700">
                First Name *
                <div className="relative mt-2">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none" required autoComplete="given-name" />
                </div>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Last Name *
                <div className="relative mt-2">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none" required autoComplete="family-name" />
                </div>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Email Address *
                <div className="relative mt-2">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none" required autoComplete="email" />
                </div>
              </label>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number *
                <div className="relative mt-2">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none" required autoComplete="tel" />
                </div>
              </label>
            </div>
            <div className="mt-5 flex gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <p>Email, phone, credentials, and licensing are verified during review. One2OneLove will never mark them verified from a demo code.</p>
            </div>
          </div>

          <TherapistSignupForm
            licensedCountries={licensedCountries}
            setLicensedCountries={setLicensedCountries}
            licensedStates={licensedStates}
            setLicensedStates={setLicensedStates}
            therapyTypes={therapyTypes}
            setTherapyTypes={setTherapyTypes}
            yearsExperience={yearsExperience}
            setYearsExperience={setYearsExperience}
            professionalBio={professionalBio}
            setProfessionalBio={setProfessionalBio}
            certifications={certifications}
            setCertifications={setCertifications}
            specializations={specializations}
            setSpecializations={setSpecializations}
            consultationFee={consultationFee}
            setConsultationFee={setConsultationFee}
          />

          <SocialMediaPlatformsForm socialMediaPlatforms={socialMediaPlatforms} setSocialMediaPlatforms={setSocialMediaPlatforms} />

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Profile photos are added after application review so pre-membership uploads are not placed in public storage.
          </div>

          <div className="flex justify-center">
            <Button type="submit" disabled={isLoading} size="lg" className="bg-gradient-to-r from-teal-500 to-blue-500 text-white text-lg px-12 py-6 h-auto shadow-xl">
              {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Submitting...</> : <><Stethoscope className="w-5 h-5 mr-2" />Submit Application</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}