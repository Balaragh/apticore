import { Server, Socket } from 'socket.io';
import { parse as parseCookie } from 'cookie';
import { Session, User, InterviewSession } from '../models';
import { hashToken } from '../utils/crypto';
import { env } from '../config/env';

interface RoomParticipant {
  socketId: string;
  userId?: string;
  name: string;
  role: 'candidate' | 'interviewer';
  admitted: boolean;
  joinedAt: Date;
}

// In-memory active room tracking: roomCode -> Map of socketId -> RoomParticipant
const activeRooms = new Map<string, Map<string, RoomParticipant>>();

export function setupInterviewSockets(io: Server): void {
  // Authentication middleware for socket connections
  io.use(async (socket: Socket, next) => {
    try {
      let rawToken: string | undefined = socket.handshake.auth?.token;

      if (!rawToken && socket.handshake.headers.cookie) {
        const cookies = parseCookie(socket.handshake.headers.cookie);
        rawToken = cookies[env.SESSION_COOKIE_NAME];
      }

      if (rawToken) {
        const tokenHash = hashToken(rawToken);
        const session = await Session.findOne({
          sessionTokenHash: tokenHash,
          revokedAt: null,
          expiresAt: { $gt: new Date() },
        });

        if (session) {
          const user = await User.findById(session.userId);
          if (user && user.accountStatus === 'active') {
            socket.data.user = {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }
      }

      next();
    } catch (err) {
      console.warn('Socket authentication warning:', err);
      next(); // Continue even if anonymous/guest to allow room access via room code
    }
  });

  io.on('connection', (socket: Socket) => {
    let currentRoom: string | null = null;
    let participantRole: 'candidate' | 'interviewer' = 'candidate';

    // 1. Join Room
    socket.on('join_room', async (data: { roomCode: string; role: 'candidate' | 'interviewer'; name?: string; isHost?: boolean }) => {
      const { roomCode, role, name, isHost } = data;
      currentRoom = roomCode;
      participantRole = role;

      const participantName = name || socket.data.user?.name || (role === 'interviewer' ? 'Interviewer' : 'Candidate');

      if (!activeRooms.has(roomCode)) {
        activeRooms.set(roomCode, new Map());
      }
      const roomParticipants = activeRooms.get(roomCode)!;

      // Host determination: explicit interviewer, isHost flag, or first creator in empty room
      const isRoomHost = role === 'interviewer' || Boolean(isHost) || roomParticipants.size === 0;

      let interviewSession: any = null;
      try {
        interviewSession = await InterviewSession.findOne({ roomCode });
        if (interviewSession) {
          socket.emit('session_details', {
            title: interviewSession.title,
            jobRole: interviewSession.jobRole,
            interviewerName: interviewSession.interviewerName,
            candidateName: interviewSession.candidateName,
          });
        }
      } catch (dbErr) {
        console.warn('Interview session lookup notice:', dbErr);
      }

      socket.join(roomCode);

      const participant: RoomParticipant = {
        socketId: socket.id,
        userId: socket.data.user?.id,
        name: participantName,
        role,
        admitted: isRoomHost, // Host is admitted automatically; guest waits for admission
        joinedAt: new Date(),
      };

      roomParticipants.set(socket.id, participant);

      if (!isRoomHost) {
        // Candidate / Guest joins waiting room
        socket.emit('waiting_room_status', {
          status: 'waiting',
          message: 'Waiting for the room host to admit you to the interview...',
        });

        // Notify host(s) in room about participant in waiting room
        socket.to(roomCode).emit('candidate_waiting', {
          id: socket.id,
          name: participantName,
          role,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Host has joined
        socket.emit('host_joined', { message: 'You have joined as room host.' });

        // Update database session status if still scheduled
        if (interviewSession && interviewSession.status === 'scheduled') {
          interviewSession.status = 'waiting';
          await interviewSession.save();
        }

        // Inform host of any waiting participants
        const waitingList: any[] = [];
        roomParticipants.forEach((p) => {
          if (!p.admitted) {
            waitingList.push({ id: p.socketId, name: p.name, role: p.role, timestamp: p.joinedAt.toISOString() });
          }
        });
        if (waitingList.length > 0) {
          socket.emit('waiting_room_list', waitingList);
        }
      }

      // Broadcast updated participant roster
      broadcastRoster(io, roomCode);
    });

    // 2. Host Admits Participant
    socket.on('admit_candidate', async (data: { candidateSocketId: string }) => {
      if (!currentRoom) return;

      const roomParticipants = activeRooms.get(currentRoom);
      if (!roomParticipants) return;

      const candidate = roomParticipants.get(data.candidateSocketId);
      if (candidate) {
        candidate.admitted = true;

        // Tell candidate they are admitted
        io.to(data.candidateSocketId).emit('candidate_admitted', {
          admitted: true,
          roomCode: currentRoom,
        });

        // Update session in DB
        const session = await InterviewSession.findOne({ roomCode: currentRoom });
        if (session) {
          session.status = 'in_progress';
          session.startedAt = new Date();
          await session.save();
        }

        // Notify room to start WebRTC negotiation
        io.to(currentRoom).emit('ready_for_webrtc', {
          initiatorSocketId: socket.id,
          targetSocketId: data.candidateSocketId,
        });

        broadcastRoster(io, currentRoom);
      }
    });

    // 3. WebRTC Signalling: Offer
    socket.on('webrtc_offer', (data: { offer: any; targetSocketId?: string }) => {
      if (!currentRoom) return;
      if (data.targetSocketId) {
        io.to(data.targetSocketId).emit('webrtc_offer', {
          offer: data.offer,
          senderSocketId: socket.id,
        });
      } else {
        socket.to(currentRoom).emit('webrtc_offer', {
          offer: data.offer,
          senderSocketId: socket.id,
        });
      }
    });

    // 4. WebRTC Signalling: Answer
    socket.on('webrtc_answer', (data: { answer: any; targetSocketId?: string }) => {
      if (!currentRoom) return;
      if (data.targetSocketId) {
        io.to(data.targetSocketId).emit('webrtc_answer', {
          answer: data.answer,
          senderSocketId: socket.id,
        });
      } else {
        socket.to(currentRoom).emit('webrtc_answer', {
          answer: data.answer,
          senderSocketId: socket.id,
        });
      }
    });

    // 5. WebRTC Signalling: ICE Candidate
    socket.on('ice_candidate', (data: { candidate: any; targetSocketId?: string }) => {
      if (!currentRoom) return;
      if (data.targetSocketId) {
        io.to(data.targetSocketId).emit('ice_candidate', {
          candidate: data.candidate,
          senderSocketId: socket.id,
        });
      } else {
        socket.to(currentRoom).emit('ice_candidate', {
          candidate: data.candidate,
          senderSocketId: socket.id,
        });
      }
    });

    // 6. Live Synchronisation: Question
    socket.on('sync_question', (data: { questionIndex: number }) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('sync_question', data);
    });

    // 7. Live Synchronisation: Stage
    socket.on('sync_stage', (data: { stage: string }) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('sync_stage', data);
    });

    // 8. Live Synchronisation: Shared Code
    socket.on('sync_code', (data: { code: string }) => {
      if (!currentRoom) return;
      socket.to(currentRoom).emit('sync_code', data);
    });

    // 9. In-room Chat
    socket.on('chat_message', (data: { text: string; senderName?: string }) => {
      if (!currentRoom) return;
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        senderId: socket.id,
        senderName: data.senderName || socket.data.user?.name || (participantRole === 'interviewer' ? 'Interviewer' : 'Candidate'),
        senderRole: participantRole,
        text: data.text,
        timestamp: new Date().toISOString(),
      };
      io.to(currentRoom).emit('chat_message', message);
    });

    // 10. Call Ending
    socket.on('end_call', async () => {
      if (!currentRoom) return;
      // Mark session in DB
      await InterviewSession.findOneAndUpdate(
        { roomCode: currentRoom },
        { status: 'completed', endedAt: new Date() }
      );
      io.to(currentRoom).emit('call_ended', {
        endedBy: participantRole,
        message: 'The interview session has concluded.',
      });
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      if (currentRoom && activeRooms.has(currentRoom)) {
        const roomParticipants = activeRooms.get(currentRoom)!;
        roomParticipants.delete(socket.id);

        if (roomParticipants.size === 0) {
          activeRooms.delete(currentRoom);
        } else {
          socket.to(currentRoom).emit('participant_left', { socketId: socket.id });
          broadcastRoster(io, currentRoom);
        }
      }
    });
  });
}

function broadcastRoster(io: Server, roomCode: string) {
  const participantsMap = activeRooms.get(roomCode);
  if (!participantsMap) return;

  const roster: any[] = [];
  participantsMap.forEach((p) => {
    roster.push({
      id: p.socketId,
      name: p.name,
      role: p.role,
      isAdmitted: p.admitted,
      joinedAt: p.joinedAt.toISOString(),
    });
  });

  io.to(roomCode).emit('participants_update', roster);
}
