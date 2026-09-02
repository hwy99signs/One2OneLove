import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getChatCopy } from '@/lib/chatCopy';
import { useLanguage } from '@/Layout';
import { toast } from 'sonner';

export default function VoiceRecorder({ onRecordingComplete, onCancel }) {
  const { currentLanguage } = useLanguage();
  const t = getChatCopy(currentLanguage);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const discardOnStopRef = useRef(false);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopRecorder = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch { /* Track cleanup below is the final privacy boundary. */ }
    }
    mediaRecorderRef.current = null;
    stopTimer();
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error(t.microphoneUnavailable);
      return;
    }

    try {
      discardOnStopRef.current = false;
      stopRecorder();
      stopTracks();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const shouldDiscard = discardOnStopRef.current;
        discardOnStopRef.current = false;
        const mime = mediaRecorder.mimeType || chunksRef.current[0]?.type || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mime });
        chunksRef.current = [];
        stopTracks();
        if (shouldDiscard || !mountedRef.current || blob.size <= 0) return;
        setAudioBlob(blob);
        setAudioUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous);
          return URL.createObjectURL(blob);
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((previous) => previous + 1), 1000);
    } catch (error) {
      console.warn('Microphone capture was not available:', error);
      discardOnStopRef.current = true;
      stopRecorder();
      stopTracks();
      if (mountedRef.current) toast.error(t.microphoneUnavailable);
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    discardOnStopRef.current = false;
    setIsRecording(false);
    stopRecorder();
  };

  const handleSend = () => {
    if (!audioBlob || !onRecordingComplete) return;
    // The parent owns upload success/failure. Keep the local preview available if the
    // upload fails; a successful send unmounts this recorder and cleanup revokes the URL.
    void onRecordingComplete(audioBlob, recordingTime);
  };

  const handleCancel = () => {
    discardOnStopRef.current = true;
    setIsRecording(false);
    stopRecorder();
    stopTracks();
    chunksRef.current = [];
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    onCancel?.();
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      discardOnStopRef.current = true;
      stopRecorder();
      stopTracks();
      chunksRef.current = [];
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioBlob && !isRecording) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-sm font-medium text-gray-700">{t.voiceNote}</span>
            <span className="text-xs text-gray-500">{formatTime(recordingTime)}</span>
          </div>
          {audioUrl && <audio src={audioUrl} controls className="mt-2 w-full" />}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleCancel} className="flex-shrink-0" aria-label={t.cancelVoice}><X className="h-4 w-4" /></Button>
          <Button size="sm" onClick={handleSend} className="flex-shrink-0 bg-green-500 hover:bg-green-600" aria-label={t.sendVoice}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
      <button type="button" onClick={isRecording ? stopRecording : startRecording} aria-label={isRecording ? t.stopVoice : t.recordVoice} className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
        {isRecording ? <Square className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {isRecording ? <><div className="h-2 w-2 animate-pulse rounded-full bg-red-500" /><span className="text-sm font-medium text-gray-700">{t.recordingVoice}</span></> : <span className="text-sm text-gray-600">{t.tapToRecordVoice}</span>}
        </div>
        {isRecording && <div className="mt-1"><div className="h-1 overflow-hidden rounded-full bg-red-200"><div className="h-full w-full animate-pulse bg-red-500" /></div><p className="mt-1 text-xs text-gray-500">{formatTime(recordingTime)}</p></div>}
      </div>
      {isRecording && <Button size="sm" variant="outline" onClick={handleCancel} className="flex-shrink-0" aria-label={t.cancelVoice}><X className="h-4 w-4" /></Button>}
    </div>
  );
}
