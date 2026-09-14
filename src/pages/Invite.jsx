import React, { useState } from "react";
import { Heart, Copy, Share2, Facebook, Twitter, Instagram, Linkedin, Mail, MessageSquare, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Invite() {
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/Invite` : 'https://one2onelove.com/Invite';
  const inviteMessage = "I've been using One2OneLove to strengthen my relationships and I think you'll love it too! Join me on this romantic journey. 💕";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Link copied to clipboard!');
  };

  const handleEmailInvite = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    const subject = encodeURIComponent('Join me on One2OneLove');
    const body = encodeURIComponent(`${inviteMessage}\n\n${inviteLink}`);
    window.location.href = `mailto:${encodeURIComponent(email.trim())}?subject=${subject}&body=${body}`;
    toast.info('Opening your email app...');
    setEmail("");
  };

  const handleSMSInvite = (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    const text = encodeURIComponent(`${inviteMessage}\n\n${inviteLink}`);
    window.open(`sms:${phoneNumber}?body=${text}`);
    toast.success('Opening text message...');
    setPhoneNumber("");
  };

  const shareVia = (platform) => {
    const text = encodeURIComponent(inviteMessage);
    const url = encodeURIComponent(inviteLink);
    
    switch(platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`);
        break;
      case 'instagram':
        navigator.clipboard.writeText(`${inviteMessage}\n\n${inviteLink}`);
        toast.success('Copied! Paste in Instagram');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`);
        break;
      case 'tiktok':
        navigator.clipboard.writeText(`${inviteMessage}\n\n${inviteLink}`);
        toast.success('Copied! Paste in TikTok');
        break;
      case 'youtube':
        navigator.clipboard.writeText(`${inviteMessage}\n\n${inviteLink}`);
        toast.success('Copied! Paste in YouTube');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${text}%20${url}`);
        break;
      case 'sms':
        window.open(`sms:?body=${text}%20${url}`);
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Invite Friends & Family
          </h1>
          <p className="text-xl text-gray-600">
            Share the love and earn rewards
          </p>
        </motion.div>

        {/* Testimonial Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-pink-50 border-2 border-pink-200 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-center text-gray-700 italic leading-relaxed">
                "{inviteMessage}"
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* SMS Invite Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="shadow-xl">
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Invite via Text Message</h3>
              <form onSubmit={handleSMSInvite} className="flex gap-3">
                <Input
                  type="tel"
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="flex-1 h-12"
                />
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 px-6"
                >
                  <Smartphone className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Email Invite Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="shadow-xl">
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Invite via Email</h3>
              <form onSubmit={handleEmailInvite} className="flex gap-3">
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12"
                />
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-6"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Share Link Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <Card className="shadow-xl">
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Share Link</h3>
              <div className="flex gap-3">
                <Input
                  value={inviteLink}
                  readOnly
                  className="flex-1 h-12 bg-gray-50"
                />
                <Button
                  onClick={handleCopyLink}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 px-6"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Share Via Social Media */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <Card className="shadow-xl">
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Share Via</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button
                  onClick={() => shareVia('facebook')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all"
                >
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <Facebook className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Facebook</span>
                </button>

                <button
                  onClick={() => shareVia('twitter')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                    <Twitter className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Twitter</span>
                </button>

                <button
                  onClick={() => shareVia('instagram')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-pink-600 hover:bg-pink-50 transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Instagram className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Instagram</span>
                </button>

                <button
                  onClick={() => shareVia('linkedin')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-700 hover:bg-blue-50 transition-all"
                >
                  <div className="w-12 h-12 bg-blue-700 rounded-full flex items-center justify-center">
                    <Linkedin className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">LinkedIn</span>
                </button>

                <button
                  onClick={() => shareVia('tiktok')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-cyan-400 hover:bg-cyan-50 transition-all"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-black to-cyan-400 rounded-full flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">TikTok</span>
                </button>

                <button
                  onClick={() => shareVia('youtube')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-red-600 hover:bg-red-50 transition-all"
                >
                  <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">YouTube</span>
                </button>

                <button
                  onClick={() => shareVia('whatsapp')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-green-600 hover:bg-green-50 transition-all"
                >
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">WhatsApp</span>
                </button>

                <button
                  onClick={() => shareVia('sms')}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-600 hover:bg-purple-50 transition-all"
                >
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">SMS</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Why Invite Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-pink-500 to-purple-600 shadow-xl">
            <CardContent className="pt-6 pb-6 text-white">
              <h3 className="text-xl font-bold mb-4">Why invite friends?</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <Heart className="w-5 h-5 mt-0.5 flex-shrink-0 fill-current" />
                  <span>Help your loved ones strengthen their relationships</span>
                </li>
                <li className="flex items-start gap-3">
                  <Heart className="w-5 h-5 mt-0.5 flex-shrink-0 fill-current" />
                  <span>Earn rewards for every friend who joins</span>
                </li>
                <li className="flex items-start gap-3">
                  <Heart className="w-5 h-5 mt-0.5 flex-shrink-0 fill-current" />
                  <span>Build a community of love and connection</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}