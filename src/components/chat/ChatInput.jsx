import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, MapPin, Image as ImageIcon, FileText, X, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EmojiPicker from './EmojiPicker';
import VoiceRecorder from './VoiceRecorder';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function ChatInput({ onSendMessage, onSendFile, onSendLocation, disabled }) {
  const [message, setMessage] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

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

