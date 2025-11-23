
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, CheckCircle, User, Mail, Phone, Check } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import InfluencerSignupForm from "../components/signup/InfluencerSignupForm";
import ProfilePhotoUpload from "../components/signup/ProfilePhotoUpload";

export default function InfluencerSignup() {
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

  // Influencer specific
  const [platformLinks, setPlatformLinks] = useState({});
  const [followerCount, setFollowerCount] = useState("");
  const [contentCategories, setContentCategories] = useState([]);
  const [collaborationTypes, setCollaborationTypes] = useState([]);
  const [mediaKitUrl, setMediaKitUrl] = useState("");
  const [influencerBio, setInfluencerBio] = useState("");

  const [signupComplete, setSignupComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { registerInfluencer } = useAuth();
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
      const filePath = `influencer-profiles/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('influencer-photos')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('influencer-photos')
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

    // Validate at least one platform link
    const hasAtLeastOnePlatform = Object.values(platformLinks).some(link => link && link.trim() !== '');
    if (!hasAtLeastOnePlatform) {
      toast.error("Please provide at least one social media platform link");
      return;
    }

    if (contentCategories.length === 0) {
      toast.error("Please provide at least one content category");
      return;
    }

    if (collaborationTypes.length === 0) {
      toast.error("Please provide at least one collaboration type");
      return;
    }

    // Validate bio length
    if (!influencerBio || influencerBio.length < 100) {
      toast.error("Bio must be at least 100 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Upload photo if provided
      let photoUrl = null;
      if (photoFile) {
        photoUrl = await uploadPhoto(photoFile);
      }

      // Generate a temporary password (influencer will need to set their own via email)
      // For now, we'll require them to set a password
      const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`;

      // Register influencer account
      const result = await registerInfluencer(
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
          totalFollowerCount: followerCount,
          platformLinks,
          contentCategories,
          collaborationTypes,
          mediaKitUrl,
      bio: influencerBio,
          profilePhotoUrl: photoUrl,
          emailVerified,
          phoneVerified,
        }
      );

      if (result.success) {
        setSignupComplete(true);
        toast.success("🎉 Influencer application submitted successfully!");
        // Note: In production, you'd send a password setup email here
      } else {
        toast.error(result.error || "Failed to submit application. Please try again.");
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (signupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-12 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Application Submitted! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your interest in partnering with One 2 One Love!
          </p>
          <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-6 mb-8">
            <p className="text-gray-700 mb-4">
              <strong>{firstName} {lastName}</strong>
            </p>
            <p className="text-gray-600 mb-2">
              We've received your influencer application and our team will review it shortly.
            </p>
            <p className="text-gray-600">
              You'll receive an email at <strong>{email}</strong> within 3-5 business days.
            </p>
          </div>
          <Button
            size="lg"
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-lg px-8 py-6 h-auto"
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
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-4 shadow-xl">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Join as an Influencer
          </h1>
          <p className="text-xl text-gray-600">
            Partner with One 2 One Love and inspire couples worldwide
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-pink-200">
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
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
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-transparent outline-none"
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

          {/* Influencer Information */}
          <InfluencerSignupForm
            platformLinks={platformLinks}
            setPlatformLinks={setPlatformLinks}
            followerCount={followerCount}
            setFollowerCount={setFollowerCount}
            contentCategories={contentCategories}
            setContentCategories={setContentCategories}
            collaborationTypes={collaborationTypes}
            setCollaborationTypes={setCollaborationTypes}
            mediaKitUrl={mediaKitUrl}
            setMediaKitUrl={setMediaKitUrl}
            influencerBio={influencerBio}
            setInfluencerBio={setInfluencerBio}
          />

          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={isLoading || uploadingPhoto}
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-lg px-12 py-6 h-auto shadow-xl"
            >
              {isLoading || uploadingPhoto ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {uploadingPhoto ? "Uploading Photo..." : "Submitting..."}
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2 fill-current" />
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
