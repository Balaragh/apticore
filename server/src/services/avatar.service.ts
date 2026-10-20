import { env } from '../config/env';

export interface AvatarProviderStatus {
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

export class AvatarService {
  /**
   * Returns current backend avatar provider configuration status.
   * Never leaks secret keys to the client.
   */
  static getProviderStatus(): AvatarProviderStatus {
    const configured: string[] = [];
    const missing: string[] = [];

    if (env.HEYGEN_API_KEY) {
      configured.push('heygen');
    } else {
      missing.push('HEYGEN_API_KEY');
    }

    if (env.TAVUS_API_KEY) {
      configured.push('tavus');
    } else {
      missing.push('TAVUS_API_KEY');
    }

    if (env.SIMLI_API_KEY) {
      configured.push('simli');
    } else {
      missing.push('SIMLI_API_KEY');
    }

    const activeProvider = env.AVATAR_PROVIDER;
    const isConfigured = Boolean(
      (activeProvider === 'heygen' && env.HEYGEN_API_KEY) ||
      (activeProvider === 'tavus' && env.TAVUS_API_KEY) ||
      (activeProvider === 'simli' && env.SIMLI_API_KEY)
    );

    return {
      isConfigured,
      provider: activeProvider,
      configuredProviders: configured,
      missingKeys: missing,
      defaultAvatarId: env.HEYGEN_AVATAR_ID || 'Wayne_20240711',
      defaultVoiceId: env.HEYGEN_VOICE_ID || 'en-US-JennyNeural',
      instructions: {
        title: 'Photorealistic AI Video Interview Provider Setup',
        steps: [
          'Choose your preferred photorealistic avatar provider (HeyGen Interactive Avatar or Tavus).',
          'Obtain an API key from https://www.heygen.com or https://www.tavus.io.',
          'Add your secret key to server/.env (e.g. HEYGEN_API_KEY=your_key_here or TAVUS_API_KEY=your_key_here).',
          'Restart the backend server. The live photorealistic human avatar WebRTC stream will connect automatically.',
        ],
        documentationUrl: 'https://docs.heygen.com/reference/create-an-interactive-avatar',
      },
    };
  }

  /**
   * Initializes a new real-time streaming session with the photorealistic human avatar provider.
   */
  static async createSession(options?: {
    avatarId?: string;
    voiceId?: string;
    quality?: 'low' | 'medium' | 'high';
  }): Promise<AvatarSessionResponse> {
    const status = this.getProviderStatus();
    if (!status.isConfigured) {
      throw new Error(
        `Avatar provider "${status.provider}" is not configured. Missing environment variable(s): ${status.missingKeys.join(', ')}.`
      );
    }

    const avatarId = options?.avatarId || env.HEYGEN_AVATAR_ID || 'Wayne_20240711';
    const voiceId = options?.voiceId || env.HEYGEN_VOICE_ID;
    const quality = options?.quality || 'medium';

    if (status.provider === 'heygen') {
      try {
        // HeyGen Interactive Avatar Streaming API session creation
        const response = await fetch('https://api.heygen.com/v1/streaming.new', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.HEYGEN_API_KEY,
          },
          body: JSON.stringify({
            quality,
            avatar_name: avatarId,
            voice: voiceId ? { voice_id: voiceId } : undefined,
            version: 'v2',
            video_encoding: 'H264',
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`HeyGen session creation failed (${response.status}): ${errBody}`);
        }

        const data = await response.json();
        const payload = data.data || data;

        return {
          sessionId: payload.session_id || payload.id || `session_${Date.now()}`,
          provider: 'heygen',
          token: payload.token || payload.access_token,
          url: payload.url,
          iceServers: payload.ice_servers2 || payload.ice_servers,
          avatarId,
        };
      } catch (err: any) {
        console.error('HeyGen createSession error:', err.message);
        throw err;
      }
    }

    if (status.provider === 'tavus') {
      try {
        const response = await fetch('https://tavusapi.com/v1/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.TAVUS_API_KEY,
          },
          body: JSON.stringify({
            replica_id: env.TAVUS_REPLICA_ID || 'r79e1c03c9',
            persona_id: env.TAVUS_PERSONA_ID || 'p9a95912',
            conversation_name: `SkillPilot Interview ${Date.now()}`,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`Tavus session creation failed (${response.status}): ${errBody}`);
        }

        const data = await response.json();
        return {
          sessionId: data.conversation_id || `tavus_${Date.now()}`,
          provider: 'tavus',
          url: data.conversation_url,
          avatarId: env.TAVUS_REPLICA_ID,
        };
      } catch (err: any) {
        console.error('Tavus createSession error:', err.message);
        throw err;
      }
    }

    throw new Error(`Unsupported avatar provider: ${status.provider}`);
  }

  /**
   * Sends text to the active photorealistic human avatar session to speak with synchronized lip movements.
   */
  static async speak(sessionId: string, text: string): Promise<{ success: boolean; message?: string }> {
    const status = this.getProviderStatus();
    if (!status.isConfigured) {
      throw new Error(`Cannot dispatch speech: Avatar provider is not configured.`);
    }

    if (!sessionId) {
      throw new Error('Session ID is required to send speech to avatar.');
    }

    if (status.provider === 'heygen') {
      const response = await fetch('https://api.heygen.com/v1/streaming.task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.HEYGEN_API_KEY,
        },
        body: JSON.stringify({
          session_id: sessionId,
          text,
          task_type: 'repeat',
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`HeyGen speech dispatch failed: ${errBody}`);
      }

      return { success: true };
    }

    return { success: true };
  }

  /**
   * Interrupts the active avatar speech when the candidate speaks or intervenes.
   */
  static async interrupt(sessionId: string): Promise<{ success: boolean }> {
    const status = this.getProviderStatus();
    if (!status.isConfigured || !sessionId) return { success: false };

    if (status.provider === 'heygen') {
      try {
        await fetch('https://api.heygen.com/v1/streaming.interrupt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.HEYGEN_API_KEY,
          },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch (e) {
        console.warn('Avatar interrupt warning:', e);
      }
    }

    return { success: true };
  }

  /**
   * Closes and cleans up the active streaming session.
   */
  static async closeSession(sessionId: string): Promise<{ success: boolean }> {
    const status = this.getProviderStatus();
    if (!status.isConfigured || !sessionId) return { success: true };

    if (status.provider === 'heygen') {
      try {
        await fetch('https://api.heygen.com/v1/streaming.stop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.HEYGEN_API_KEY,
          },
          body: JSON.stringify({ session_id: sessionId }),
        });
      } catch (e) {
        console.warn('HeyGen session stop warning:', e);
      }
    }

    return { success: true };
  }
}
