import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, MapPin, Image as ImageIcon, FileText, X, Video, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import EmojiPicker from './EmojiPicker';
import VoiceRecorder from './VoiceRecorder';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function ChatInput({ onSendMessage, onSendFile, onSendLocation, disabled }) {
  const [message, setMessage] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recordTimeoutRef = useRef(null);

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
        audio: true // Enable audio for video recording
      });
      setStream(mediaStream);
      setShowCamera(true);
      // Use setTimeout to ensure the video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Could not access camera. Please check permissions.');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    // Stop video recording if active
    if (mediaRecorder && isRecordingVideo) {
      mediaRecorder.stop();
      setIsRecordingVideo(false);
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setMediaRecorder(null);
    setRecordedChunks([]);
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && stream && !isRecordingVideo) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Check if video is ready
      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        console.error('Video not ready');
        toast.error('Camera not ready. Please wait...');
        return;
      }
      
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;
      
      const ctx = canvas.getContext('2d');
      
      // Flip the image back to normal (since we mirrored it)
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob && onSendFile) {
          // Create a File object with proper name
          const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onSendFile(file, 'image');
          toast.success('Photo captured!');
          stopCamera();
        } else {
          toast.error('Failed to capture photo');
        }
      }, 'image/jpeg', 0.95);
    } else {
      console.error('Camera not ready', { video: !!videoRef.current, canvas: !!canvasRef.current, stream: !!stream, isRecording: isRecordingVideo });
      toast.error('Camera not ready. Please try again.');
    }
  };

  const startVideoRecording = () => {
    if (!stream || isRecordingVideo) return;

    try {
      const chunks = [];
      setRecordedChunks(chunks);

      // Try different MIME types for better browser compatibility
      let mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size > 0 && onSendFile) {
          onSendFile(blob, 'video');
          toast.success('Video recorded!');
        } else {
          toast.error('Failed to record video');
        }
        setRecordedChunks([]);
        setIsRecordingVideo(false);
        stopCamera();
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast.error('Error recording video');
        setIsRecordingVideo(false);
      };

      recorder.start(100); // Collect data every 100ms
      setMediaRecorder(recorder);
      setIsRecordingVideo(true);
      toast.info('Recording...');
    } catch (error) {
      console.error('Error starting video recording:', error);
      toast.error('Could not start video recording');
    }
  };

  const stopVideoRecording = () => {
    if (mediaRecorder && isRecordingVideo) {
      mediaRecorder.stop();
    }
  };

  const handleCapturePress = (e) => {
    e.preventDefault();
    // Start a timer - if released quickly, take photo; if held, start video
    recordTimeoutRef.current = setTimeout(() => {
      // Long press detected - start video recording
      startVideoRecording();
    }, 150); // 150ms to distinguish tap from long press
  };

  const handleCaptureRelease = (e) => {
    e.preventDefault();
    
    // Clear the timeout if it hasn't fired yet
    if (recordTimeoutRef.current) {
      clearTimeout(recordTimeoutRef.current);
      recordTimeoutRef.current = null;
      
      // If we were recording video, stop it
      if (isRecordingVideo && mediaRecorder) {
        stopVideoRecording();
      } else {
        // Quick tap = capture photo
        capturePhoto();
      }
    } else if (isRecordingVideo && mediaRecorder) {
      // Release after recording started - stop recording
      stopVideoRecording();
    }
  };

  const handleCaptureClick = (e) => {
    // Prevent click from firing if we already handled it via press/release
    e.preventDefault();
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorder && isRecordingVideo) {
        mediaRecorder.stop();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream, mediaRecorder, isRecordingVideo]);

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
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} // Mirror the video for better UX
          />
          <canvas ref={canvasRef} className="hidden" />
          {!stream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Starting camera...</p>
              </div>
            </div>
          )}
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6 z-10">
          <button
            onClick={stopCamera}
            disabled={isRecordingVideo}
            className="w-14 h-14 bg-gray-600/80 hover:bg-gray-700/80 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm disabled:opacity-50"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <button
            onMouseDown={handleCapturePress}
            onMouseUp={handleCaptureRelease}
            onMouseLeave={handleCaptureRelease}
            onTouchStart={handleCapturePress}
            onTouchEnd={handleCaptureRelease}
            onClick={handleCaptureClick}
            disabled={!stream}
            className={`w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecordingVideo 
                ? 'bg-red-500 border-red-300 scale-110' 
                : 'bg-white border-gray-300 hover:scale-105'
            }`}
          >
            <div className={`w-14 h-14 rounded-full border-2 ${
              isRecordingVideo 
                ? 'bg-red-600 border-red-400' 
                : 'bg-white border-gray-400'
            }`}></div>
          </button>
        </div>
        {isRecordingVideo && (
          <div className="absolute top-8 left-0 right-0 flex justify-center z-10">
            <div className="bg-red-500/90 text-white px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold">Recording...</span>
            </div>
          </div>
        )}
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

