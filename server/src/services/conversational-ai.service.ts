import { env } from '../config/env';
import { IResume } from '../models/Resume';

export interface ConversationalTurnInput {
  candidateAnswer: string;
  currentQuestion: string;
  category?: string;
  difficulty?: string;
  targetRole?: string;
  experienceLevel?: string;
  resumeDetails?: {
    skills?: string[];
    projects?: Array<{ title: string; techStack?: string[]; description?: string }>;
    extractedText?: string;
  };
  conversationHistory?: Array<{
    role: 'interviewer' | 'candidate';
    text: string;
  }>;
  language?: 'en' | 'ta' | 'hi';
}

export interface ConversationalTurnOutput {
  interviewerSpokenReply: string;
  followUpQuestion?: string;
  isSatisfactory: boolean;
  score: number; // 0-100
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

export class ConversationalAIService {
  /**
   * Processes the candidate's spoken response, performs technical evaluation,
   * and generates a natural spoken follow-up / transition for the photorealistic avatar.
   */
  static async evaluateAndRespond(input: ConversationalTurnInput): Promise<ConversationalTurnOutput> {
    const {
      candidateAnswer,
      currentQuestion,
      category = 'technical',
      difficulty = 'medium',
      targetRole = 'Software Engineer',
      experienceLevel = 'Mid-Level',
      resumeDetails,
      conversationHistory = [],
      language = 'en',
    } = input;

    const trimmedAnswer = candidateAnswer.trim();
    if (!trimmedAnswer || trimmedAnswer.length < 5) {
      const defaultSpoken =
        language === 'ta'
          ? 'மன்னிக்கவும், உங்கள் பதிலை தெளிவாக கேட்க முடியவில்லை. மீண்டும் விளக்க முடியுமா?'
          : language === 'hi'
          ? 'माफ़ कीजिये, मैं आपका उत्तर स्पष्ट रूप से नहीं सुन सका। क्या आप पुनः समझा सकते हैं?'
          : "I didn't quite catch that clearly. Could you elaborate on your response or provide a specific technical example?";

      return {
        interviewerSpokenReply: defaultSpoken,
        isSatisfactory: false,
        score: 30,
        evaluation: {
          strengths: [],
          improvements: ['Response was very brief or inaudible; provide a structured explanation.'],
          keyPointsHit: [],
          keyPointsMissed: ['Core concepts', 'Practical implementation details'],
        },
      };
    }

    const hasAIConfig = Boolean(env.AI_API_KEY && env.AI_PROVIDER !== 'mock');

    if (hasAIConfig) {
      try {
        return await this.evaluateViaAI(input);
      } catch (err: any) {
        console.warn('Conversational AI provider failed, using grounded evaluation heuristic:', err.message);
        return this.evaluateViaHeuristics(input);
      }
    }

    return this.evaluateViaHeuristics(input);
  }

  /**
   * Evaluates candidate response using LLM (Gemini / OpenAI).
   */
  private static async evaluateViaAI(input: ConversationalTurnInput): Promise<ConversationalTurnOutput> {
    const {
      candidateAnswer,
      currentQuestion,
      category,
      difficulty,
      targetRole,
      experienceLevel,
      resumeDetails,
      conversationHistory = [],
      language = 'en',
    } = input;

    const resumeContext = resumeDetails?.extractedText
      ? resumeDetails.extractedText.slice(0, 2000).replace(/```/g, '')
      : (resumeDetails?.skills || []).join(', ');

    const languageNote =
      language === 'ta'
        ? 'Generate interviewerSpokenReply in natural, professional spoken Tamil (தமிழ்) keeping technical keywords in English.'
        : language === 'hi'
        ? 'Generate interviewerSpokenReply in natural, professional spoken Hindi (हिन्दी) keeping technical keywords in English.'
        : 'Generate interviewerSpokenReply in professional, engaging spoken English.';

    const systemPrompt = `You are a staff technical interviewer conducting a live face-to-face video interview for the position of ${targetRole} (${experienceLevel}).
The candidate is answering your question. You need to:
1. Actively listen to their spoken answer and assess technical accuracy, depth, architectural understanding, and communication structure.
2. Formulate a natural verbal response (interviewerSpokenReply) that acknowledges their specific points, offers brief feedback or clarification, and transitions smoothly into a relevant follow-up question.
3. ${languageNote}
4. Keep the interviewerSpokenReply conversational and concise (2-4 sentences max), formatted for speech synthesis.

Candidate Target Role: ${targetRole}
Question Asked: "${currentQuestion}"
Category: ${category}
Difficulty: ${difficulty}
Candidate's Spoken Answer: "${candidateAnswer}"
Candidate Resume Details: "${resumeContext}"

Recent Conversation:
${conversationHistory.slice(-4).map((m) => `${m.role}: ${m.text}`).join('\n')}

Output MUST be a pure JSON object with the following schema:
{
  "interviewerSpokenReply": "Natural verbal response to speak aloud",
  "followUpQuestion": "Specific technical or behavioral follow-up question",
  "isSatisfactory": true,
  "score": 85,
  "evaluation": {
    "strengths": ["string"],
    "improvements": ["string"],
    "keyPointsHit": ["string"],
    "keyPointsMissed": ["string"],
    "starAssessment": {
      "situationPresent": true,
      "taskPresent": true,
      "actionPresent": true,
      "resultPresent": true,
      "critique": "Brief STAR breakdown assessment"
    }
  }
}`;

    if (env.AI_PROVIDER === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.AI_MODEL}:generateContent?key=${env.AI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini conversational API failed (${response.status}): ${response.statusText}`);
      }

      const json = await response.json();
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(text);
      return parsed as ConversationalTurnOutput;
    }

    throw new Error('Unsupported AI provider configuration');
  }

  /**
   * Deterministic grounded heuristic evaluator for offline/mock or fallback mode.
   */
  private static evaluateViaHeuristics(input: ConversationalTurnInput): ConversationalTurnOutput {
    const { candidateAnswer, currentQuestion, targetRole = 'Frontend Developer', language = 'en' } = input;
    const words = candidateAnswer.trim().split(/\s+/);
    const wordCount = words.length;

    // Technical term detector
    const techTerms = [
      'react', 'state', 'hook', 'component', 'performance', 'latency', 'cache',
      'redis', 'database', 'sql', 'index', 'api', 'async', 'promise', 'memory',
      'architecture', 'scale', 'docker', 'test', 'error', 'security', 'token',
      'render', 'dom', 'css', 'types', 'distributed', 'service', 'event', 'star'
    ];

    const matchedTerms = techTerms.filter((term) =>
      candidateAnswer.toLowerCase().includes(term)
    );

    let score = 65;
    if (wordCount > 30) score += 10;
    if (wordCount > 70) score += 10;
    if (matchedTerms.length >= 3) score += 10;
    score = Math.min(score, 95);

    const isSatisfactory = score >= 70;

    let interviewerSpokenReply = '';
    let followUpQuestion = '';

    if (language === 'ta') {
      interviewerSpokenReply = isSatisfactory
        ? `மிக அருமையான விளக்கம். குறிப்பாக ${matchedTerms.slice(0, 2).join(' மற்றும் ')} பற்றிய உங்கள் கருத்து பொருத்தமானது. இது நிஜமான தயாரிப்பு சூழலில் எவ்வாறு அளவிடப்படும்?`
        : `நன்றி. உங்கள் பதிலில் சில முக்கியமான கருத்துக்கள் உள்ளன, ஆனால் செயல்திறன் மற்றும் பிழை கையாளுதலை இன்னும் ஆழமாக விவரிக்கலாம்.`;
      followUpQuestion = `${targetRole} சூழலில், எதிர்பாராத பிழைகள் அல்லது அதிக பணிச்சுமை ஏற்படும் போது இதை எவ்வாறு கையாளுவீர்கள்?`;
    } else if (language === 'hi') {
      interviewerSpokenReply = isSatisfactory
        ? `बहुत बढ़िया व्याख्या। विशेष रूप से ${matchedTerms.slice(0, 2).join(' और ')} पर आपका दृष्टिकोण सटीक है। वास्तविक उत्पादन वातावरण में इसे कैसे लागू करेंगे?`
        : `धन्यवाद। आपके उत्तर में बुनियादी बिंदु शामिल हैं, लेकिन प्रदर्शन और स्केलेबिलिटी पर और विस्तार की आवश्यकता है।`;
      followUpQuestion = `इस आर्किटेक्चर में संभावित बॉटलनेक और थ्रूपुट समस्याओं को आप कैसे हल करेंगे?`;
    } else {
      interviewerSpokenReply = isSatisfactory
        ? `Great explanation. I appreciate how you connected ${matchedTerms.slice(0, 2).join(' and ') || 'the core concepts'} to real-world engineering trade-offs.`
        : `Thanks for walking through that. You touched on the foundation, but let's dive deeper into system resilience and scalability trade-offs.`;
      followUpQuestion = `In a high-throughput production environment, how would you monitor latency regressions and prevent cascading failures with this pattern?`;
    }

    return {
      interviewerSpokenReply: `${interviewerSpokenReply} ${followUpQuestion}`,
      followUpQuestion,
      isSatisfactory,
      score,
      evaluation: {
        strengths: [
          'Articulated ideas clearly and maintained professional composure',
          matchedTerms.length > 0 ? `Demonstrated knowledge of ${matchedTerms.slice(0, 3).join(', ')}` : 'Addressed the core subject',
          'Good conversational cadence',
        ],
        improvements: [
          'Quantify metrics where possible (e.g. latency improvements, concurrency bounds)',
          'Elaborate more on error boundaries and edge case failure handling',
        ],
        keyPointsHit: matchedTerms.slice(0, 4),
        keyPointsMissed: ['Automated integration testing strategy', 'Disaster recovery rollback plan'],
        starAssessment: {
          situationPresent: wordCount > 25,
          taskPresent: wordCount > 40,
          actionPresent: matchedTerms.length >= 2,
          resultPresent: wordCount > 60,
          critique: 'Response follows a structured narrative; adding measurable outcome metrics will elevate it to staff level.',
        },
      },
    };
  }
}
