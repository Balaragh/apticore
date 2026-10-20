import { useState, useEffect, useRef, useCallback } from 'react';
import { io as createSocket, Socket } from 'socket.io-client';
import type { InterviewUserRole, LiveChatMessage, LiveParticipant, InterviewStage } from '@/types';
import toast from 'react-hot-toast';

export interface UseLiveWebRTCOptions {
  roomCode: string;
  role: InterviewUserRole;
  userName: string;
  userEmail?: string;
  onQuestionSync?: (questionIndex: number) => void;
  onStageSync?: (stage: InterviewStage) => void;
  onCodeSync?: (code: string) => void;
  onCallEnded?: () => void;
}

export interface MediaDeviceOption {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'videoinput' | 'audiooutput';
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export type LiveCallState =
  | 'waiting'
  | 'waiting_room'
  | 'ringing'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'ended';

export function useLiveWebRTC({
  roomCode,
  role,
  userName,
  userEmail,
  onQuestionSync,
  onStageSync,
  onCodeSync,
  onCallEnded,
}: UseLiveWebRTCOptions) {
  // Local Media State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isInitializingMedia, setIsInitializingMedia] = useState<boolean>(false);

  // Available Devices
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceOption[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('');
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>('');

  // Call & Admission States:
  // 'waiting' -> 'ringing' -> 'connecting' -> 'connected' -> 'reconnecting' -> 'disconnected' -> 'ended'
  const [callState, setCallState] = useState<LiveCallState>(
    role === 'candidate' ? 'waiting_room' : 'waiting'
  );
  const [waitingParticipants, setWaitingParticipants] = useState<
    Array<{ id: string; name: string; email?: string; timestamp: string }>
  >([]);
  const [remoteParticipant, setRemoteParticipant] = useState<LiveParticipant | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'fair' | 'poor'>('good');
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);

  // Refs for WebRTC & Signaling
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackSenderRef = useRef<RTCRtpSender | null>(null);
  const clientIdRef = useRef<string>(`peer_${role}_${Math.random().toString(36).substring(2, 9)}`);

  // ─── 1. Signaling: BroadcastChannel + Socket.IO ──────────────────────────
  const broadcast = useCallback(
    (type: string, payload: Record<string, any> = {}) => {
      // BroadcastChannel (local browser tabs)
      if (channelRef.current) {
        channelRef.current.postMessage({
          type,
          senderId: clientIdRef.current,
          senderRole: role,
          senderName: userName,
          senderEmail: userEmail,
          timestamp: new Date().toISOString(),
          ...payload,
        });
      }

      // Socket.IO (cross-device & remote server signalling)
      const socket = socketRef.current;
      if (socket && socket.connected) {
        if (type === 'webrtc_offer') {
          socket.emit('webrtc_offer', { offer: payload.offer });
        } else if (type === 'webrtc_answer') {
          socket.emit('webrtc_answer', { answer: payload.answer });
        } else if (type === 'ice_candidate') {
          socket.emit('ice_candidate', { candidate: payload.candidate });
        } else if (type === 'host_admit') {
          socket.emit('admit_candidate', { candidateSocketId: payload.targetId });
        } else if (type === 'question_sync') {
          socket.emit('sync_question', { questionIndex: payload.questionIndex });
        } else if (type === 'stage_sync') {
          socket.emit('sync_stage', { stage: payload.stage });
        } else if (type === 'code_sync') {
          socket.emit('sync_code', { code: payload.code });
        } else if (type === 'chat_message') {
          socket.emit('chat_message', { text: payload.message?.text, senderName: payload.message?.senderName });
        } else if (type === 'end_call_everyone') {
          socket.emit('end_call');
        }
      }
    },
    [role, userName, userEmail]
  );

  // ─── 2. Enumerate Hardware Devices ───────────────────────────────────────
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();

      const audioIns = devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${i + 1}`,
          kind: 'audioinput' as const,
        }));

      const videoIns = devices
        .filter((d) => d.kind === 'videoinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${i + 1}`,
          kind: 'videoinput' as const,
        }));

      setAudioInputDevices(audioIns);
      setVideoInputDevices(videoIns);

      if (audioIns.length > 0 && !selectedAudioDeviceId) {
        setSelectedAudioDeviceId(audioIns[0].deviceId);
      }
      if (videoIns.length > 0 && !selectedVideoDeviceId) {
        setSelectedVideoDeviceId(videoIns[0].deviceId);
      }
    } catch (err) {
      console.warn('Device enumeration error:', err);
    }
  }, [selectedAudioDeviceId, selectedVideoDeviceId]);

  // ─── 3. Initialize Local Camera & Microphone ─────────────────────────────
  const startLocalMedia = useCallback(
    async (audioDevId?: string, videoDevId?: string) => {
      setIsInitializingMedia(true);
      try {
        // Stop any existing tracks
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        }

        const constraints: MediaStreamConstraints = {
          audio: audioDevId ? { deviceId: { exact: audioDevId } } : true,
          video: videoDevId
            ? {
                deviceId: { exact: videoDevId },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              }
            : {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsCameraOn(true);
        setIsMicMuted(false);

        // Ensure tracks are attached to active peer connection
        if (peerConnectionRef.current) {
          const pc = peerConnectionRef.current;
          const videoTrack = stream.getVideoTracks()[0];
          const audioTrack = stream.getAudioTracks()[0];
          const senders = pc.getSenders();

          if (videoTrack) {
            const videoSender = senders.find((s) => s.track?.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(videoTrack).catch((e) => console.warn('Replace video track error:', e));
            } else {
              try { pc.addTrack(videoTrack, stream); } catch (e) { console.warn('Add video track error:', e); }
            }
          }

          if (audioTrack) {
            const audioSender = senders.find((s) => s.track?.kind === 'audio');
            if (audioSender) {
              audioSender.replaceTrack(audioTrack).catch((e) => console.warn('Replace audio track error:', e));
            } else {
              try { pc.addTrack(audioTrack, stream); } catch (e) { console.warn('Add audio track error:', e); }
            }
          }
        }

        await refreshDevices();
        return stream;
      } catch (err: any) {
        console.error('Failed to access camera/mic:', err);
        toast.error('Could not access camera/mic. Using text-only fallback.');
        return null;
      } finally {
        setIsInitializingMedia(false);
      }
    },
    [refreshDevices]
  );

  // ─── 4. Setup WebRTC Peer Connection ──────────────────────────────────────
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Remote track handler
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setCallState('connected');
      }
    };

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        broadcast('ice_candidate', { candidate: event.candidate });
      }
    };

    // Connection state monitor
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        setCallState('connected');
        setConnectionQuality('good');
      } else if (state === 'connecting') {
        setCallState('connecting');
        setConnectionQuality('fair');
      } else if (state === 'disconnected') {
        setCallState('reconnecting');
        setConnectionQuality('poor');
      } else if (state === 'failed') {
        setCallState('disconnected');
        setConnectionQuality('poor');
      }
    };

    return pc;
  }, [broadcast]);

  // ─── 5. WebRTC Negotiation (Offer / Answer) ──────────────────────────────
  const initiateOffer = useCallback(async () => {
    try {
      const pc = createPeerConnection();
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);
      broadcast('webrtc_offer', { offer });
    } catch (err) {
      console.error('Failed to create offer:', err);
    }
  }, [createPeerConnection, broadcast]);

  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      try {
        const pc = createPeerConnection();
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        broadcast('webrtc_answer', { answer });
      } catch (err) {
        console.error('Failed to handle offer:', err);
      }
    },
    [createPeerConnection, broadcast]
  );

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    try {
      if (peerConnectionRef.current && peerConnectionRef.current.signalingState !== 'stable') {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (err) {
      console.error('Failed to handle answer:', err);
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    try {
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('Failed to add ICE candidate:', err);
    }
  }, []);

  // ─── 6. Host Admission & Waiting Room Actions ─────────────────────────────
  const admitCandidate = useCallback(
    (candidateId: string) => {
      setWaitingParticipants((prev) => prev.filter((p) => p.id !== candidateId));
      broadcast('host_admit', { targetId: candidateId });
      toast.success('Candidate admitted to interview.');
      // After admitting, host initiates peer connection offer
      setTimeout(() => {
        initiateOffer();
      }, 300);
    },
    [broadcast, initiateOffer]
  );

  const denyCandidate = useCallback(
    (candidateId: string) => {
      setWaitingParticipants((prev) => prev.filter((p) => p.id !== candidateId));
      broadcast('host_deny', { targetId: candidateId });
      toast('Candidate admission denied.');
    },
    [broadcast]
  );

  // ─── 7. Media Control Toggles ─────────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const nextState = !videoTrack.enabled;
      videoTrack.enabled = nextState;
      setIsCameraOn(nextState);
      broadcast('media_state_change', { isCameraOff: !nextState, isMuted: isMicMuted });
    }
  }, [broadcast, isMicMuted]);

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextState = !audioTrack.enabled;
      audioTrack.enabled = nextState;
      setIsMicMuted(!nextState);
      broadcast('media_state_change', { isCameraOff: !isCameraOn, isMuted: !nextState });
    }
  }, [broadcast, isCameraOn]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen share and revert to webcam
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);

      if (localStreamRef.current && peerConnectionRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (screenTrackSenderRef.current && videoTrack) {
          screenTrackSenderRef.current.replaceTrack(videoTrack);
        }
      }
      broadcast('screen_share_change', { isScreenSharing: false });
    } else {
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          toast.error('Screen sharing is not supported in this browser environment.');
          return;
        }
        const sStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(sStream);
        setIsScreenSharing(true);

        const screenTrack = sStream.getVideoTracks()[0];

        // Replace track on peer connection
        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === 'video');
          if (videoSender) {
            screenTrackSenderRef.current = videoSender;
            videoSender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          if (localStreamRef.current && screenTrackSenderRef.current) {
            screenTrackSenderRef.current.replaceTrack(localStreamRef.current.getVideoTracks()[0]);
          }
          broadcast('screen_share_change', { isScreenSharing: false });
        };

        broadcast('screen_share_change', { isScreenSharing: true });
        toast.success('Screen sharing started.');
      } catch (err: any) {
        if (err.name !== 'NotAllowedError') {
          console.error('Screen share error:', err);
          toast.error('Failed to share screen.');
        }
      }
    }
  }, [isScreenSharing, screenStream, broadcast]);

  // Switch devices
  const switchCamera = useCallback(
    async (deviceId: string) => {
      setSelectedVideoDeviceId(deviceId);
      await startLocalMedia(selectedAudioDeviceId, deviceId);
    },
    [selectedAudioDeviceId, startLocalMedia]
  );

  const switchMicrophone = useCallback(
    async (deviceId: string) => {
      setSelectedAudioDeviceId(deviceId);
      await startLocalMedia(deviceId, selectedVideoDeviceId);
    },
    [selectedVideoDeviceId, startLocalMedia]
  );

  // ─── 8. In-Call Features: Chat, Question Sync, Stage Sync ─────────────────
  const sendChatMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const newMsg: LiveChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        senderId: clientIdRef.current,
        senderName: userName,
        senderRole: role,
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, newMsg]);
      broadcast('chat_message', { message: newMsg });
    },
    [userName, role, broadcast]
  );

  const syncQuestion = useCallback(
    (questionIndex: number) => {
      if (role === 'interviewer') {
        broadcast('question_sync', { questionIndex });
      }
    },
    [role, broadcast]
  );

  const syncStage = useCallback(
    (stage: InterviewStage) => {
      if (role === 'interviewer') {
        broadcast('stage_sync', { stage });
      }
    },
    [role, broadcast]
  );

  const syncCode = useCallback(
    (code: string) => {
      broadcast('code_sync', { code });
    },
    [broadcast]
  );

  // ─── 9. Leave & End Call ──────────────────────────────────────────────────
  const endCallForEveryone = useCallback(() => {
    broadcast('end_call_everyone', {});
    setCallState('ended');
    toast.success('Interview concluded by host.');
    onCallEnded?.();
  }, [broadcast, onCallEnded]);

  const leaveCall = useCallback(() => {
    broadcast('participant_leave', { peerId: clientIdRef.current });
    setCallState('ended');
    onCallEnded?.();
  }, [broadcast, onCallEnded]);

  const reconnectPeer = useCallback(async () => {
    setCallState('reconnecting');
    toast('Reconnecting WebRTC media stream...');
    if (peerConnectionRef.current) {
      try {
        const offer = await peerConnectionRef.current.createOffer({ iceRestart: true });
        await peerConnectionRef.current.setLocalDescription(offer);
        broadcast('webrtc_offer', { offer });
      } catch (err) {
        console.warn('ICE restart error:', err);
      }
    } else {
      initiateOffer();
    }
  }, [broadcast, initiateOffer]);

  // ─── 10. Message Event Listener (BroadcastChannel) ────────────────────────
  useEffect(() => {
    const channelName = `apticore_room_${roomCode.toLowerCase()}`;
    const ch = new BroadcastChannel(channelName);
    channelRef.current = ch;

    ch.onmessage = (event) => {
      const data = event.data;
      if (!data || data.senderId === clientIdRef.current) return;

      switch (data.type) {
        case 'candidate_knock': {
          if (role === 'interviewer') {
            setCallState('ringing');
            setWaitingParticipants((prev) => {
              if (prev.some((p) => p.id === data.senderId)) return prev;
              return [
                ...prev,
                {
                  id: data.senderId,
                  name: data.senderName,
                  email: data.senderEmail,
                  timestamp: new Date().toLocaleTimeString(),
                },
              ];
            });
            toast(`Incoming participant: ${data.senderName} is in the waiting room!`, {
              icon: '🔔',
              duration: 5000,
            });
          }
          break;
        }

        case 'host_admit': {
          if (role === 'candidate' && (data.targetId === clientIdRef.current || !data.targetId)) {
            setCallState('connecting');
            toast.success('You have been admitted by the interviewer! Connecting video...');
          }
          break;
        }

        case 'host_deny': {
          if (role === 'candidate' && (data.targetId === clientIdRef.current || !data.targetId)) {
            setCallState('ended');
            toast.error('The host has denied admission to this interview room.');
          }
          break;
        }

        case 'webrtc_offer': {
          if (role === 'candidate' && data.offer) {
            handleOffer(data.offer);
            setRemoteParticipant({
              id: data.senderId,
              name: data.senderName,
              role: data.senderRole,
              isMuted: false,
              isCameraOff: false,
              isScreenSharing: false,
              isAdmitted: true,
              joinedAt: data.timestamp,
              connectionQuality: 'good',
            });
          }
          break;
        }

        case 'webrtc_answer': {
          if (role === 'interviewer' && data.answer) {
            handleAnswer(data.answer);
            setRemoteParticipant({
              id: data.senderId,
              name: data.senderName,
              role: data.senderRole,
              isMuted: false,
              isCameraOff: false,
              isScreenSharing: false,
              isAdmitted: true,
              joinedAt: data.timestamp,
              connectionQuality: 'good',
            });
          }
          break;
        }

        case 'ice_candidate': {
          if (data.candidate) {
            handleIceCandidate(data.candidate);
          }
          break;
        }

        case 'chat_message': {
          if (data.message) {
            setChatMessages((prev) => [...prev, data.message]);
          }
          break;
        }

        case 'question_sync': {
          if (role === 'candidate' && typeof data.questionIndex === 'number') {
            onQuestionSync?.(data.questionIndex);
          }
          break;
        }

        case 'stage_sync': {
          if (role === 'candidate' && data.stage) {
            onStageSync?.(data.stage);
          }
          break;
        }

        case 'code_sync': {
          if (data.code !== undefined) {
            onCodeSync?.(data.code);
          }
          break;
        }

        case 'media_state_change': {
          setRemoteParticipant((prev) => (prev ? { ...prev, isMuted: data.isMuted, isCameraOff: data.isCameraOff } : null));
          break;
        }

        case 'screen_share_change': {
          setRemoteParticipant((prev) => (prev ? { ...prev, isScreenSharing: data.isScreenSharing } : null));
          break;
        }

        case 'participant_leave': {
          setRemoteParticipant(null);
          setRemoteStream(null);
          setCallState(role === 'candidate' ? 'waiting_room' : 'connecting');
          toast(`${data.senderName} left the room.`);
          break;
        }

        case 'end_call_everyone': {
          setCallState('ended');
          toast('The interview session has concluded.', { icon: '🏁' });
          onCallEnded?.();
          break;
        }

        default:
          break;
      }
    };

    // Candidate automatically sends knock upon mounting
    if (role === 'candidate') {
      ch.postMessage({
        type: 'candidate_knock',
        senderId: clientIdRef.current,
        senderRole: 'candidate',
        senderName: userName,
        senderEmail: userEmail,
      });
    }

    // ─── Socket.IO Real-Time Server Signalling ──────────────────────────────
    const socketBase = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace(/\/api$/, '')
      : 'http://localhost:5000';

    const socket = createSocket(socketBase, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_room', { roomCode, role, name: userName });
    });

    socket.on('candidate_waiting', (cand: any) => {
      if (role === 'interviewer') {
        setWaitingParticipants((prev) => {
          if (prev.some((p) => p.id === cand.id)) return prev;
          return [
            ...prev,
            { id: cand.id, name: cand.name, timestamp: new Date(cand.timestamp).toLocaleTimeString() },
          ];
        });
        toast(`Candidate ${cand.name} entered waiting room.`, { icon: '👋' });
      }
    });

    socket.on('waiting_room_list', (list: any[]) => {
      if (role === 'interviewer' && Array.isArray(list)) {
        setWaitingParticipants(list);
      }
    });

    socket.on('candidate_admitted', () => {
      if (role === 'candidate') {
        setCallState('connecting');
        toast.success('Admitted by interviewer! Connecting video...');
      }
    });

    socket.on('ready_for_webrtc', () => {
      if (role === 'interviewer') {
        setTimeout(() => initiateOffer(), 300);
      }
    });

    socket.on('webrtc_offer', (data: any) => {
      if (role === 'candidate' && data.offer) {
        handleOffer(data.offer);
        setRemoteParticipant((prev) => prev || {
          id: data.senderSocketId || 'remote',
          name: 'Interviewer',
          role: 'interviewer',
          isMuted: false,
          isCameraOff: false,
          isScreenSharing: false,
          isAdmitted: true,
          joinedAt: new Date().toISOString(),
          connectionQuality: 'good',
        });
      }
    });

    socket.on('webrtc_answer', (data: any) => {
      if (role === 'interviewer' && data.answer) {
        handleAnswer(data.answer);
        setRemoteParticipant((prev) => prev || {
          id: data.senderSocketId || 'remote',
          name: 'Candidate',
          role: 'candidate',
          isMuted: false,
          isCameraOff: false,
          isScreenSharing: false,
          isAdmitted: true,
          joinedAt: new Date().toISOString(),
          connectionQuality: 'good',
        });
      }
    });

    socket.on('ice_candidate', (data: any) => {
      if (data.candidate) {
        handleIceCandidate(data.candidate);
      }
    });

    socket.on('sync_question', (data: any) => {
      if (role === 'candidate' && typeof data.questionIndex === 'number') {
        onQuestionSync?.(data.questionIndex);
      }
    });

    socket.on('sync_stage', (data: any) => {
      if (role === 'candidate' && data.stage) {
        onStageSync?.(data.stage);
      }
    });

    socket.on('sync_code', (data: any) => {
      if (data.code !== undefined) {
        onCodeSync?.(data.code);
      }
    });

    socket.on('chat_message', (msg: any) => {
      if (msg && msg.senderId !== socket.id) {
        setChatMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('call_ended', () => {
      setCallState('ended');
      toast('The interview session has concluded.', { icon: '🏁' });
      onCallEnded?.();
    });

    return () => {
      ch.close();
      channelRef.current = null;
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomCode, role, userName, userEmail, handleOffer, handleAnswer, handleIceCandidate, initiateOffer, onQuestionSync, onStageSync, onCodeSync, onCallEnded]);

  // ─── 11. Cleanup On Unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, []);

  return {
    localStream,
    remoteStream,
    screenStream,
    isCameraOn,
    isMicMuted,
    isScreenSharing,
    isInitializingMedia,
    callState,
    waitingParticipants,
    remoteParticipant,
    connectionQuality,
    chatMessages,
    audioInputDevices,
    videoInputDevices,
    selectedAudioDeviceId,
    selectedVideoDeviceId,
    startLocalMedia,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    switchCamera,
    switchMicrophone,
    admitCandidate,
    denyCandidate,
    sendChatMessage,
    syncQuestion,
    syncStage,
    syncCode,
    leaveCall,
    endCallForEveryone,
    initiateOffer,
    reconnectPeer,
  };
}
