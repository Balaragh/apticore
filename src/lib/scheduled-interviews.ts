import type { ScheduledInterview, LiveInterviewEvaluation, MeetingStatus } from '@/types';
import { apiClient } from './api-client';

const STORAGE_KEYS = {
  INTERVIEWS: 'apticore_scheduled_interviews_v1',
  EVALUATIONS: 'apticore_interview_evaluations_v1',
};

const SEED_INTERVIEWS: ScheduledInterview[] = [
  {
    id: 'int-801',
    title: 'Senior Frontend Architecture & React Internals',
    role: 'Frontend Developer',
    type: 'technical',
    scheduledFor: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // 30 mins from now
    durationMinutes: 45,
    status: 'scheduled',
    interviewerName: 'Sarah Chen',
    interviewerEmail: 'sarah.chen@enterprise-hire.com',
    interviewerCompany: 'AptiCore Enterprise Platforms',
    candidateName: 'Alex Johnson',
    candidateEmail: 'alex.candidate@example.com',
    roomCode: 'apti-meet-801',
    createdAt: new Date().toISOString(),
    meetingNotes: 'Focus on React 19 architecture, reconciliation pipeline, and performance optimization in production.',
  },
  {
    id: 'int-802',
    title: 'Backend Systems, Distributed Caching & SQL vs NoSQL',
    role: 'Backend Developer',
    type: 'system-design',
    scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
    durationMinutes: 60,
    status: 'scheduled',
    interviewerName: 'David Miller',
    interviewerEmail: 'david.miller@enterprise-hire.com',
    interviewerCompany: 'AptiCore Cloud Engineering',
    candidateName: 'Alex Johnson',
    candidateEmail: 'alex.candidate@example.com',
    roomCode: 'apti-meet-802',
    createdAt: new Date().toISOString(),
    meetingNotes: 'System design for high-throughput transactional ledger and distributed cache invalidation strategies.',
  },
  {
    id: 'int-790',
    title: 'Full Stack Problem Solving & Behavioral Collaboration',
    role: 'Full Stack Developer',
    type: 'mixed',
    scheduledFor: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    durationMinutes: 45,
    status: 'completed',
    interviewerName: 'Alex Rivera',
    interviewerEmail: 'alex.rivera@enterprise-hire.com',
    interviewerCompany: 'AptiCore Solutions',
    candidateName: 'Alex Johnson',
    candidateEmail: 'alex.candidate@example.com',
    roomCode: 'apti-meet-790',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    meetingNotes: 'Full-stack evaluation covering live debugging, API contract negotiation, and STAR conflict resolution.',
    assessmentId: 'eval-790',
  },
];

const SEED_EVALUATIONS: Record<string, LiveInterviewEvaluation> = {
  'apti-meet-790': {
    id: 'eval-790',
    sessionId: 'int-790',
    roomCode: 'apti-meet-790',
    candidateName: 'Alex Johnson',
    role: 'Full Stack Developer',
    interviewType: 'mixed',
    interviewerName: 'Alex Rivera',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
    technicalScore: 4,
    problemSolvingScore: 5,
    communicationScore: 4,
    overallRating: 4.3,
    recommendation: 'hire',
    strengths: [
      'Exceptional structured thinking during the system architectural walk-through.',
      'Strong grasp of state decoupling and database transaction boundaries.',
      'Calm, transparent communication when weighing architecture trade-offs.',
    ],
    improvements: [
      'Could spend more time discussing automated integration tests before diving into implementation.',
      'Recommend deeper familiarity with distributed tracing tools like OpenTelemetry.',
    ],
    publicFeedback:
      'Alex performed exceptionally well during the technical architecture and live problem-solving stages. Demonstrated mature engineering judgment, proactive communication, and articulated trade-offs cleanly.',
    confidentialNotes:
      'Strong recommendation for Senior Level 1 role. Demonstrates team leadership aptitude and could mentor junior engineers on front-end decoupling.',
    isSubmitted: true,
  },
};

export function getScheduledInterviews(): ScheduledInterview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INTERVIEWS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(SEED_INTERVIEWS));
      return SEED_INTERVIEWS;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_INTERVIEWS;
  }
}

export function saveScheduledInterviews(interviews: ScheduledInterview[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INTERVIEWS, JSON.stringify(interviews));
  } catch (err) {
    console.error('Failed to save scheduled interviews:', err);
  }
}

export function getInterviewByRoomCode(roomCode: string): ScheduledInterview | null {
  const interviews = getScheduledInterviews();
  return (
    interviews.find((i) => i.roomCode.toLowerCase() === roomCode.toLowerCase()) || {
      id: `int-${Date.now().toString().slice(-4)}`,
      title: `${roomCode.toUpperCase()} Live Interview`,
      role: 'Full Stack Developer',
      type: 'mixed',
      scheduledFor: new Date().toISOString(),
      durationMinutes: 45,
      status: 'scheduled',
      interviewerName: 'Enterprise Interviewer',
      interviewerEmail: 'interviewer@apticore.com',
      interviewerCompany: 'AptiCore Enterprise',
      candidateName: 'Alex Johnson',
      candidateEmail: 'alex@example.com',
      roomCode: roomCode,
      createdAt: new Date().toISOString(),
    }
  );
}

export function createScheduledInterview(
  data: Omit<ScheduledInterview, 'id' | 'createdAt' | 'status' | 'roomCode'> & { customRoomCode?: string }
): ScheduledInterview {
  const interviews = getScheduledInterviews();
  const roomCode = data.customRoomCode?.trim() || `apti-meet-${Math.floor(100 + Math.random() * 900)}`;

  const newSession: ScheduledInterview = {
    id: `int-${Date.now().toString().slice(-6)}`,
    title: data.title,
    role: data.role,
    type: data.type,
    scheduledFor: data.scheduledFor,
    durationMinutes: data.durationMinutes || 45,
    status: 'scheduled',
    interviewerName: data.interviewerName,
    interviewerEmail: data.interviewerEmail,
    interviewerCompany: data.interviewerCompany || 'AptiCore Enterprise',
    candidateName: data.candidateName,
    candidateEmail: data.candidateEmail,
    roomCode,
    createdAt: new Date().toISOString(),
    meetingNotes: data.meetingNotes,
  };

  interviews.unshift(newSession);
  saveScheduledInterviews(interviews);
  return newSession;
}

export function updateInterviewStatus(roomCode: string, status: MeetingStatus): void {
  const interviews = getScheduledInterviews();
  const index = interviews.findIndex((i) => i.roomCode.toLowerCase() === roomCode.toLowerCase());
  if (index !== -1) {
    interviews[index].status = status;
    saveScheduledInterviews(interviews);
  }
}

export function getInterviewEvaluation(roomCode: string): LiveInterviewEvaluation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVALUATIONS);
    const evals: Record<string, LiveInterviewEvaluation> = raw ? JSON.parse(raw) : SEED_EVALUATIONS;
    return evals[roomCode] || null;
  } catch {
    return SEED_EVALUATIONS[roomCode] || null;
  }
}

export function saveInterviewEvaluation(evaluation: LiveInterviewEvaluation): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVALUATIONS);
    const evals: Record<string, LiveInterviewEvaluation> = raw ? JSON.parse(raw) : SEED_EVALUATIONS;
    evals[evaluation.roomCode] = evaluation;
    localStorage.setItem(STORAGE_KEYS.EVALUATIONS, JSON.stringify(evals));

    // Update meeting status to completed
    updateInterviewStatus(evaluation.roomCode, 'completed');
  } catch (err) {
    console.error('Failed to save evaluation:', err);
  }
}
