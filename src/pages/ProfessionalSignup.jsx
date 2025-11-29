
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, CheckCircle, User, Mail, Phone, Check, Building } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import OtherUserSignupForm from "../components/signup/OtherUserSignupForm";
import ProfilePhotoUpload from "../components/signup/ProfilePhotoUpload";

export default function ProfessionalSignup() {
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

  // Professional specific
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [otherUserBio, setOtherUserBio] = useState("");

  const [signupComplete, setSignupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { registerProfessional } = useAuth();
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
      const filePath = `professional-profiles/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('professional-photos')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('professional-photos')
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

    // Validate required fields
    if (!organizationName || !organizationName.trim()) {
      toast.error("Please enter your practice/organization name");
      return;
    }

    if (!organizationType) {
      toast.error("Please select your practice type");
      return;
    }

    if (!serviceDescription || !serviceDescription.trim()) {
      toast.error("Please describe the services you offer");
      return;
    }

    if (serviceDescription.length > 500) {
      toast.error("Service description must be 500 characters or less");
      return;
    }

    if (!otherUserBio || otherUserBio.length < 100) {
      toast.error("Professional bio must be at least 100 characters");
      return;
    }

    if (otherUserBio.length > 1000) {
      toast.error("Professional bio must be 1000 characters or less");
      return;
    }

    setIsLoading(true);

    try {
      // Upload photo if provided
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      // Generate a temporary password (professional will need to set their own via email)
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

      // Register professional account
      const result = await registerProfessional(
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
          organizationName,
          practiceType: organizationType,
          serviceDescription,
          websiteUrl,
          professionalBio: otherUserBio,
          profilePhotoUrl: photoUrl,
          emailVerified,
          phoneVerified,
        }
      );

      if (result.success) {
        setSignupComplete(true);
        toast.success("🎉 Professional application submitted successfully!");
        // Note: In production, you'd send a password setup email here
      } else {
        // Display the specific error message from the backend
        const errorMessage = result.error || "Failed to submit application. Please try again.";
        toast.error(errorMessage);
        console.error('Professional registration failed:', result.error);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Application Submitted! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your interest in joining One 2 One Love as a professional partner!
          </p>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <p className="text-gray-700 mb-4">
              <strong>{firstName} {lastName}</strong>
            </p>
            <p className="text-gray-700 mb-2">
              <strong>{organizationName}</strong>
            </p>
            <p className="text-gray-600 mb-2">
              We've received your professional application and our team will review it shortly.
            </p>
            <p className="text-gray-600">
              You'll receive an email at <strong>{email}</strong> within 3-5 business days.
            </p>
          </div>
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg px-8 py-6 h-auto"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4 shadow-xl">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Join as a Professional
          </h1>
          <p className="text-xl text-gray-600">
            Partner with One 2 One Love and help couples build stronger relationships
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-200">
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                      required
                      disabled={emailVerified}
                    />
                  </div>
                  {!emailVerified && (
                    <button
                      type="button"
                      onClick={handleSendEmailVerification}
                      disabled={!email}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
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
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 mb-2">Enter code (use: 123456)</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={emailVerificationCode}
                        onChange={(e) => setEmailVerificationCode(e.target.value)}
                        placeholder="123456"
                        className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmail}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                      required
                      disabled={phoneVerified}
                    />
                  </div>
                  {!phoneVerified && (
                    <button
                      type="button"
                      onClick={handleSendPhoneVerification}
                      disabled={phone.length < 10}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
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
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 mb-2">Enter code (use: 123456)</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={phoneVerificationCode}
                        onChange={(e) => setPhoneVerificationCode(e.target.value)}
                        placeholder="123456"
                        className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={handleVerifyPhone}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
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

          {/* Professional Information */}
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

          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isLoading || uploadingPhoto}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white text-lg px-12 py-6 h-auto shadow-xl"
            >
              {isLoading || uploadingPhoto ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {uploadingPhoto ? "Uploading Photo..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Building className="w-5 h-5 mr-2" />
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
