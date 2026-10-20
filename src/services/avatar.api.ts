export interface AvatarStatusResponse {
  isConfigured: boolean;
  provider: 'heygen' | 'tavus' | 'simli' | 'none';
  configuredProviders: string[];
  missingKeys: string[];
  defaultAvatarId: string;
  defaultVoiceId: string;
  instructions: {
    title: string;
    steps: string[];
    documentationUrl: string;
  };
}

export interface AvatarSessionResponse {
  sessionId: string;
  provider: 'heygen' | 'tavus' | 'simli';
  token?: string;
  url?: string;
  iceServers?: any[];
  avatarId?: string;
}

export interface ConversationalChatInput {
  candidateAnswer: string;
  currentQuestion: string;
  category?: string;
  difficulty?: string;
  targetRole?: string;
  experienceLevel?: string;
  interviewSessionId?: string;
  questionId?: string;
  avatarSessionId?: string;
  conversationHistory?: Array<{ role: 'interviewer' | 'candidate'; text: string }>;
  language?: 'en' | 'ta' | 'hi';
}

export interface ConversationalChatResponse {
  interviewerSpokenReply: string;
  followUpQuestion?: string;
  isSatisfactory: boolean;
  score: number;
  evaluation: {
    strengths: string[];
    improvements: string[];
    keyPointsHit: string[];
    keyPointsMissed: string[];
    starAssessment?: {
      situationPresent: boolean;
      taskPresent: boolean;
      actionPresent: boolean;
      resultPresent: boolean;
      critique: string;
    };
  };
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const avatarApi = {
  /**
   * Fetch backend avatar provider status & diagnostic configuration
   */
  async getStatus(): Promise<AvatarStatusResponse> {
    const res = await fetch(`${API_BASE}/interview/avatar/status`, {
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch avatar status (${res.status})`);
    }
    const data = await res.json();
    return data.data;
  },

  /**
   * Request backend to start real-time photorealistic avatar streaming session
   */
  async createSession(options?: {
    avatarId?: string;
    voiceId?: string;
    quality?: 'low' | 'medium' | 'high';
  }): Promise<AvatarSessionResponse> {
    const res = await fetch(`${API_BASE}/interview/avatar/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(options || {}),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to initialize avatar session');
    }
    const data = await res.json();
    return data.data;
  },

  /**
   * Instruct active photorealistic avatar to speak text with lip sync
   */
  async speak(sessionId: string, text: string): Promise<void> {
    const res = await fetch(`${API_BASE}/interview/avatar/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sessionId, text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to dispatch speech to avatar');
    }
  },

  /**
   * Interrupt active avatar speech when candidate speaks
   */
  async interrupt(sessionId: string): Promise<void> {
    await fetch(`${API_BASE}/interview/avatar/interrupt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});
  },

  /**
   * Stop active streaming session
   */
  async stopSession(sessionId: string): Promise<void> {
    await fetch(`${API_BASE}/interview/avatar/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sessionId }),
    }).catch(() => {});
  },

  /**
   * Send candidate spoken answer to Conversational AI backend
   */
  async processCandidateAnswer(input: ConversationalChatInput): Promise<ConversationalChatResponse> {
    const res = await fetch(`${API_BASE}/interview/avatar/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to evaluate response');
    }
    const data = await res.json();
    return data.data;
  },
};
