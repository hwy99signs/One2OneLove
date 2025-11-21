import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, MapPin, Image as ImageIcon, FileText, X, Video, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmojiPicker from './EmojiPicker';
import VoiceRecorder from './VoiceRecorder';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function ChatInput({ onSendMessage, onSendFile, onSendLocation, disabled }) {
  const [message, setMessage] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file && onSendFile) {
      onSendFile(file, type);
    }
    // Reset input
    e.target.value = '';
  };

  const handleVoiceComplete = (audioBlob, duration) => {
    if (onSendFile) {
      onSendFile(audioBlob, 'voice', duration);
    }
    setShowVoiceRecorder(false);
    setIsRecording(false);
  };

  const handleLocationClick = () => {
    if (navigator.geolocation && onSendLocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onSendLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get your location. Please check permissions.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob && onSendFile) {
          onSendFile(blob, 'image');
        }
        stopCamera();
      }, 'image/jpeg', 0.95);
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  if (showVoiceRecorder) {
    return (
      <div className="border-t border-gray-200 p-4 bg-white">
        <VoiceRecorder
          onRecordingComplete={handleVoiceComplete}
          onCancel={() => {
            setShowVoiceRecorder(false);
            setIsRecording(false);
          }}
        />
      </div>
    );
  }

  if (showCamera) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex-1 relative flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 z-10">
          <button
            onClick={stopCamera}
            className="w-14 h-14 bg-gray-600/80 hover:bg-gray-700/80 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={capturePhoto}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-gray-300 shadow-2xl hover:scale-105 transition-transform"
          >
            <div className="w-14 h-14 bg-white rounded-full border-2 border-gray-400"></div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 p-2 bg-white">
      <div className="flex items-end gap-2">
        {/* Attachment Menu */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Paperclip className="w-5 h-5 text-gray-500" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">Photo</span>
              </button>
              <button
                onClick={startCamera}
                className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-cyan-600" />
                </div>
                <span className="text-sm text-gray-700">Camera</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm text-gray-700">Document</span>
              </button>
              <button
                onClick={handleLocationClick}
                className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">Location</span>
              </button>
              <button
                onClick={() => videoInputRef.current?.click()}
                className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-sm text-gray-700">Video</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Hidden File Inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'image')}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'document')}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'video')}
        />

        {/* Message Input */}
        <div className="flex-1 flex items-end gap-2 bg-gray-100 rounded-3xl px-4 py-2">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            disabled={disabled}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm max-h-32 overflow-y-auto disabled:opacity-50"
            style={{ minHeight: '24px', height: 'auto' }}
          />
        </div>

        {/* Send Button */}
        {message.trim() ? (
          <button
            onClick={handleSend}
            disabled={disabled}
            className="flex-shrink-0 w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        ) : (
          <button
            onClick={() => {
              setShowVoiceRecorder(true);
              setIsRecording(true);
            }}
            disabled={disabled}
            className="flex-shrink-0 w-10 h-10 hover:bg-gray-100 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mic className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
}

