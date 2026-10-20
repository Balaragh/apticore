import { useEffect, useRef, useState } from 'react';
import {
  Video, VideoOff, Mic, MicOff, Volume2, AlertCircle, CheckCircle2,
  RefreshCw, Shield, HelpCircle, ArrowRight, Settings, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import toast from 'react-hot-toast';

interface DeviceCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReady: () => void;
}

export function DeviceCheckModal({ isOpen, onClose, onConfirmReady }: DeviceCheckModalProps) {
  const {
    stream,
    isCameraActive,
    isMicMuted,
    cameraPermission,
    micPermission,
    errorMessage,
    errorType,
    audioLevel,
    videoDevices,
    audioDevices,
    selectedVideoDevice,
    selectedAudioDevice,
    setSelectedVideoDevice,
    setSelectedAudioDevice,
    isInitializing,
    startMedia,
    stopMedia,
    toggleCamera,
    toggleMic,
  } = useMediaDevices();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [speakerTestState, setSpeakerTestState] = useState<'idle' | 'playing'>('idle');

  // Attach stream to video tag whenever stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!isOpen) return null;

  const handleStartTest = async () => {
    await startMedia({ video: true, audio: true });
  };

  const playSpeakerTestChime = () => {
    try {
      setSpeakerTestState('playing');
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        setSpeakerTestState('idle');
        return;
      }
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);

      setTimeout(() => {
        setSpeakerTestState('idle');
        toast.success('Audio chime played! Verify speaker volume.');
      }, 550);
    } catch {
      setSpeakerTestState('idle');
    }
  };

  const handleFinish = () => {
    // Keep tracks or cleanly transition
    onConfirmReady();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-navy-900 rounded-2xl border border-surface-200 dark:border-navy-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-200 dark:border-navy-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 flex items-center justify-center">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-800 dark:text-white">
                Pre-Interview Equipment & Device Check
              </h3>
              <p className="text-xs text-surface-500">
                Test camera, microphone input, and audio output before joining.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopMedia();
              onClose();
            }}
            className="p-1.5 rounded-lg text-surface-400 hover:text-navy-800 dark:hover:text-white hover:bg-surface-100 dark:hover:bg-navy-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Permission or Device Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-semibold">{errorMessage}</p>
                {errorType === 'permission_denied' && (
                  <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300">
                    <strong>How to grant permission:</strong> Click the padlock or settings icon in your browser URL bar at the top, change Camera and Microphone from "Blocked" to "Allow", and click the retry button below.
                  </p>
                )}
                {errorType === 'device_not_found' && (
                  <p className="text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300">
                    No physical camera or microphone detected. You can still proceed seamlessly with the text-answer fallback practice mode.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Camera Preview and Test Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Camera Box */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-navy-700 dark:text-surface-300 flex items-center justify-between">
                <span>Camera Preview</span>
                <span className={`text-[11px] font-normal ${isCameraActive ? 'text-emerald-500' : 'text-surface-400'}`}>
                  {isCameraActive ? '● Camera Online' : '○ Disabled'}
                </span>
              </label>

              <div className="relative aspect-video rounded-xl bg-navy-950 border border-navy-800 overflow-hidden flex items-center justify-center">
                {stream && isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="text-center p-4">
                    <VideoOff size={32} className="mx-auto text-navy-600 mb-2" />
                    <p className="text-xs text-navy-400">
                      Camera preview is idle
                    </p>
                  </div>
                )}

                {/* Overlay Controls */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-navy-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white">
                  <span>Candidate Video</span>
                  <button
                    onClick={toggleCamera}
                    disabled={!stream}
                    className="text-xs text-accent-400 hover:text-accent-300 disabled:opacity-40"
                  >
                    {isCameraActive ? 'Turn Off' : 'Turn On'}
                  </button>
                </div>
              </div>

              {/* Camera device selector if multiple */}
              {videoDevices.length > 1 && (
                <select
                  value={selectedVideoDevice}
                  onChange={(e) => setSelectedVideoDevice(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg bg-surface-50 dark:bg-navy-800 border border-surface-200 dark:border-navy-700 text-navy-800 dark:text-white"
                >
                  {videoDevices.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Audio & Mic Meters */}
            <div className="space-y-4 flex flex-col justify-between">
              {/* Microphone Meter */}
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-navy-800/50 border border-surface-200 dark:border-navy-700 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-navy-800 dark:text-white flex items-center gap-1.5">
                    <Mic size={14} className={audioLevel > 5 ? 'text-emerald-500' : 'text-surface-400'} />
                    Microphone Input
                  </span>
                  <span className="text-[11px] text-surface-500">
                    {isMicMuted ? 'Muted' : stream ? `${audioLevel}%` : 'Not active'}
                  </span>
                </div>

                {/* Live meter bar */}
                <div className="w-full h-3 rounded-full bg-surface-200 dark:bg-navy-900 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-75 ${
                      audioLevel > 60
                        ? 'bg-amber-500'
                        : audioLevel > 10
                        ? 'bg-emerald-500'
                        : 'bg-surface-400'
                    }`}
                    style={{ width: `${Math.max(4, audioLevel)}%` }}
                  />
                </div>
                <p className="text-[11px] text-surface-500 leading-tight">
                  Speak into your microphone. The green level indicator should react smoothly to your voice.
                </p>
              </div>

              {/* Speaker Test */}
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-navy-800/50 border border-surface-200 dark:border-navy-700 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-navy-800 dark:text-white flex items-center gap-1.5">
                    <Volume2 size={14} className="text-accent-500" />
                    Speaker & Audio Output
                  </p>
                  <p className="text-[11px] text-surface-500">
                    Play a test tone to confirm you can hear the interviewer.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={playSpeakerTestChime}
                  isLoading={speakerTestState === 'playing'}
                >
                  Test Audio
                </Button>
              </div>

              {/* Start Device Check Button */}
              {!stream ? (
                <Button
                  onClick={handleStartTest}
                  isLoading={isInitializing}
                  className="w-full"
                  leftIcon={<Video size={16} />}
                >
                  Enable Camera & Microphone
                </Button>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Devices connected! Your hardware is ready for practice.</span>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="text-[11px] text-surface-500 border-t border-surface-100 dark:border-navy-800 pt-3 flex items-center gap-2">
            <Shield size={14} className="text-accent-500 shrink-0" />
            <span>
              <strong>Local Privacy Notice:</strong> Camera and microphone streams are rendered entirely inside your browser for self-evaluation. No video or audio is transmitted or recorded remotely without your explicit action.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-surface-200 dark:border-navy-700 bg-surface-50/50 dark:bg-navy-800/40 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              stopMedia();
              onClose();
            }}
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleFinish}
              rightIcon={<ArrowRight size={16} />}
            >
              Ready to Interview
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
