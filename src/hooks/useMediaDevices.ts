import { useState, useEffect, useRef, useCallback } from 'react';

export interface DeviceInfo {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'videoinput' | 'audiooutput';
}

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface MediaDevicesState {
  stream: MediaStream | null;
  isCameraActive: boolean;
  isMicMuted: boolean;
  cameraPermission: PermissionState;
  micPermission: PermissionState;
  errorMessage: string | null;
  errorType: 'permission_denied' | 'device_not_found' | 'device_in_use' | 'unsupported' | null;
  audioLevel: number; // 0 to 100
  videoDevices: DeviceInfo[];
  audioDevices: DeviceInfo[];
  selectedVideoDevice: string;
  selectedAudioDevice: string;
  isInitializing: boolean;
}

export function useMediaDevices() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [cameraPermission, setCameraPermission] = useState<PermissionState>('prompt');
  const [micPermission, setMicPermission] = useState<PermissionState>('prompt');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<MediaDevicesState['errorType']>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [videoDevices, setVideoDevices] = useState<DeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<DeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Check initial permissions & available devices
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      setErrorMessage('Media devices are not supported in this browser environment.');
      setErrorType('unsupported');
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos: DeviceInfo[] = [];
      const audios: DeviceInfo[] = [];

      devices.forEach((d) => {
        if (d.kind === 'videoinput') {
          videos.push({ deviceId: d.deviceId, label: d.label || `Camera ${videos.length + 1}`, kind: d.kind });
        } else if (d.kind === 'audioinput') {
          audios.push({ deviceId: d.deviceId, label: d.label || `Microphone ${audios.length + 1}`, kind: d.kind });
        }
      });

      setVideoDevices(videos);
      setAudioDevices(audios);

      if (videos.length && !selectedVideoDevice) {
        setSelectedVideoDevice(videos[0].deviceId);
      }
      if (audios.length && !selectedAudioDevice) {
        setSelectedAudioDevice(audios[0].deviceId);
      }
    } catch (err) {
      console.warn('Could not enumerate devices:', err);
    }
  }, [selectedVideoDevice, selectedAudioDevice]);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // Audio level monitoring using Web Audio API
  const startAudioMonitoring = useCallback((mediaStream: MediaStream) => {
    try {
      const audioTracks = mediaStream.getAudioTracks();
      if (!audioTracks.length) return;

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;

      const source = audioCtx.createMediaStreamSource(mediaStream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (e) {
      console.warn('Audio metering unavailable:', e);
    }
  }, []);

  const stopAudioMonitoring = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // Stop all media tracks safely
  const stopMedia = useCallback(() => {
    stopAudioMonitoring();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    setStream(null);
    setIsCameraActive(false);
  }, [stopAudioMonitoring]);

  // Request user media explicitly
  const startMedia = useCallback(
    async (options: { video?: boolean; audio?: boolean } = { video: true, audio: true }) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage('Web camera / microphone is not supported in this browser.');
        setErrorType('unsupported');
        setCameraPermission('unsupported');
        setMicPermission('unsupported');
        return null;
      }

      setIsInitializing(true);
      setErrorMessage(null);
      setErrorType(null);

      // Stop any existing tracks first
      stopMedia();

      const constraints: MediaStreamConstraints = {
        video: options.video
          ? selectedVideoDevice
            ? { deviceId: { exact: selectedVideoDevice }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
          : false,
        audio: options.audio
          ? selectedAudioDevice
            ? { deviceId: { exact: selectedAudioDevice }, echoCancellation: true, noiseSuppression: true }
            : { echoCancellation: true, noiseSuppression: true }
          : false,
      };

      try {
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = newStream;
        setStream(newStream);
        setIsCameraActive(options.video !== false && newStream.getVideoTracks().length > 0);
        setIsMicMuted(false);

        if (options.video) setCameraPermission('granted');
        if (options.audio) setMicPermission('granted');

        if (options.audio && newStream.getAudioTracks().length > 0) {
          startAudioMonitoring(newStream);
        }

        // Refresh device list to populate proper labels now that permission is granted
        await refreshDevices();
        setIsInitializing(false);
        return newStream;
      } catch (err: unknown) {
        setIsInitializing(false);
        const error = err as Error;
        const name = error.name || '';

        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setErrorMessage('Camera or microphone access was denied. Please allow camera and microphone permissions in your browser address bar.');
          setErrorType('permission_denied');
          if (options.video) setCameraPermission('denied');
          if (options.audio) setMicPermission('denied');
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setErrorMessage('No camera or microphone hardware was found on your device. You can proceed using the text-answer fallback mode.');
          setErrorType('device_not_found');
        } else if (name === 'NotReadableError' || name === 'TrackStartError') {
          setErrorMessage('Camera or microphone is currently in use by another application. Please close other video apps and retry.');
          setErrorType('device_in_use');
        } else {
          setErrorMessage(error.message || 'Could not access media devices. Text fallback mode is enabled.');
          setErrorType('unsupported');
        }

        return null;
      }
    },
    [selectedVideoDevice, selectedAudioDevice, stopMedia, startAudioMonitoring, refreshDevices]
  );

  // Toggle Camera on/off
  const toggleCamera = useCallback(async () => {
    if (!streamRef.current) {
      await startMedia({ video: true, audio: !isMicMuted });
      return;
    }

    const videoTracks = streamRef.current.getVideoTracks();
    if (videoTracks.length > 0) {
      const enabled = !videoTracks[0].enabled;
      videoTracks.forEach((t) => (t.enabled = enabled));
      setIsCameraActive(enabled);
    } else {
      // Need to re-request stream with video track
      await startMedia({ video: true, audio: !isMicMuted });
    }
  }, [startMedia, isMicMuted]);

  // Toggle Mic on/off
  const toggleMic = useCallback(() => {
    if (!streamRef.current) return;
    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length > 0) {
      const newMuted = !isMicMuted;
      audioTracks.forEach((t) => (t.enabled = !newMuted));
      setIsMicMuted(newMuted);
      if (newMuted) {
        setAudioLevel(0);
      }
    }
  }, [isMicMuted]);

  // Clean up all tracks on unmount
  useEffect(() => {
    return () => {
      stopMedia();
    };
  }, [stopMedia]);

  return {
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
    clearError: () => {
      setErrorMessage(null);
      setErrorType(null);
    },
  };
}
