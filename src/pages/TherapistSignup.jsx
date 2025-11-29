import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, CheckCircle, User, Mail, Phone, Check, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import TherapistSignupForm from "../components/signup/TherapistSignupForm";
import ProfilePhotoUpload from "../components/signup/ProfilePhotoUpload";
import SocialMediaPlatformsForm from "../components/signup/SocialMediaPlatformsForm";

export default function TherapistSignup() {
  // Basic info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Photo upload
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Verification state
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [phoneVerificationCode, setPhoneVerificationCode] = useState("");

  // Therapist specific
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
  const [isLoading, setIsLoading] = useState(false);
  const { registerTherapist } = useAuth();
  const navigate = useNavigate();

  // Verification handlers
  const handleSendEmailVerification = () => {
    toast.success("Verification code sent to email!", {
      description: "Use code: 123456"
    });
    setEmailVerificationSent(true);
  };

  const handleVerifyEmail = () => {
    if (emailVerificationCode === "123456") {
      setEmailVerified(true);
      toast.success("Email verified successfully!");
    } else {
      toast.error("Invalid code. Please try again.");
    }
  };

  const handleSendPhoneVerification = () => {
    toast.success("Verification code sent via SMS!", {
      description: "Use code: 123456"
    });
    setPhoneVerificationSent(true);
  };

  const handleVerifyPhone = () => {
    if (phoneVerificationCode === "123456") {
      setPhoneVerified(true);
      toast.success("Phone verified successfully!");
    } else {
      toast.error("Invalid code. Please try again.");
    }
  };

  // Upload photo to Supabase Storage
  const uploadPhoto = async (file) => {
    if (!file) return null;

    try {
      setUploadingPhoto(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `therapist-profiles/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('therapist-photos')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('therapist-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error("Failed to upload photo. You can add it later.");
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate verifications
    if (!emailVerified || !phoneVerified) {
      toast.error("Please verify your email and phone number");
      return;
    }

    if (licensedCountries.length === 0 || licensedStates.length === 0) {
      toast.error("Please provide at least one licensed country and state");
      return;
    }

    if (therapyTypes.length === 0 || specializations.length === 0) {
      toast.error("Please provide therapy types and specializations");
      return;
    }

    setIsLoading(true);

    try {
      // Upload photo if provided
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      // Generate a temporary password (therapist will need to set their own via email)
      // For now, we'll require them to set a password
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

      // Register therapist account
      const result = await registerTherapist(
        {
          email,
          password: tempPassword, // In production, send password reset email instead
          firstName,
          lastName,
        },
        {
          firstName,
          lastName,
          phone,
          licensedCountries,
          licensedStates,
          therapyTypes,
          specializations,
          certifications,
          yearsExperience,
          consultationFee,
          professionalBio,
          socialMediaPlatforms,
          profilePhotoUrl: photoUrl,
          emailVerified,
          phoneVerified,
        }
      );

      if (result.success) {
        setSignupComplete(true);
        toast.success("🎉 Therapist application submitted successfully!");
        // Note: In production, you'd send a password setup email here
      } else {
        // Display the specific error message from the backend
        const errorMessage = result.error || "Failed to submit application. Please try again.";
        toast.error(errorMessage);
        console.error('Therapist registration failed:', result.error);
      }
    } catch (error) {
      console.error('Signup error:', error);
      // Try to extract a meaningful error message
      const errorMessage = error?.message || error?.error || "An unexpected error occurred. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (signupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-teal-100 to-green-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Application Submitted! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your interest in joining One 2 One Love as a therapist!
          </p>
          <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-6 mb-8">
            <p className="text-gray-700 mb-4">
              <strong>{firstName} {lastName}</strong>
            </p>
            <p className="text-gray-600 mb-2">
              We've received your therapist application and our team will review your credentials shortly.
            </p>
            <p className="text-gray-600">
              You'll receive an email at <strong>{email}</strong> within 3-5 business days.
            </p>
          </div>
          <Button
            size="lg"
            className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white text-lg px-8 py-6 h-auto"
            onClick={() => window.location.href = "/"}
          >
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
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Join as a Therapist
          </h1>
          <p className="text-xl text-gray-600">
            Help couples build stronger, healthier relationships
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-teal-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                      required
                      disabled={emailVerified}
                    />
                  </div>
                  {!emailVerified && (
                    <button
                      type="button"
                      onClick={handleSendEmailVerification}
                      disabled={!email}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                    >
                      Verify
                    </button>
                  )}
                  {emailVerified && (
                    <div className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center text-sm">
                      <Check size={16} className="mr-1" /> Verified
                    </div>
                  )}
                </div>
                {emailVerificationSent && !emailVerified && (
                  <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <p className="text-xs text-teal-700 mb-2">Enter code (use: 123456)</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={emailVerificationCode}
                        onChange={(e) => setEmailVerificationCode(e.target.value)}
                        placeholder="123456"
                        className="flex-1 px-3 py-2 border border-teal-300 rounded-lg text-sm"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmail}
                        className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                      required
                      disabled={phoneVerified}
                    />
                  </div>
                  {!phoneVerified && (
                    <button
                      type="button"
                      onClick={handleSendPhoneVerification}
                      disabled={phone.length < 10}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                    >
                      Verify
                    </button>
                  )}
                  {phoneVerified && (
                    <div className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center text-sm">
                      <Check size={16} className="mr-1" /> Verified
                    </div>
                  )}
                </div>
                {phoneVerificationSent && !phoneVerified && (
                  <div className="mt-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <p className="text-xs text-teal-700 mb-2">Enter code (use: 123456)</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={phoneVerificationCode}
                        onChange={(e) => setPhoneVerificationCode(e.target.value)}
                        placeholder="123456"
                        className="flex-1 px-3 py-2 border border-teal-300 rounded-lg text-sm"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPhone}
                        className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Photo Upload */}
          <ProfilePhotoUpload
            photoFile={photoFile}
            setPhotoFile={setPhotoFile}
            photoPreview={photoPreview}
            setPhotoPreview={setPhotoPreview}
          />

          {/* Therapist Information */}
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

          {/* Social Media Platforms */}
          <SocialMediaPlatformsForm
            socialMediaPlatforms={socialMediaPlatforms}
            setSocialMediaPlatforms={setSocialMediaPlatforms}
          />

          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isLoading || uploadingPhoto}
              size="lg"
              className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white text-lg px-12 py-6 h-auto shadow-xl"
            >
              {isLoading || uploadingPhoto ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {uploadingPhoto ? "Uploading Photo..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Stethoscope className="w-5 h-5 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}