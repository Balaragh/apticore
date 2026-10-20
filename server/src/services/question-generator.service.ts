import { env } from '../config/env';
import { IResume } from '../models/Resume';
import { IInterviewQuestion, InterviewQuestion } from '../models/InterviewQuestion';
import { InterviewType, Difficulty } from '../types';

export interface GenerateQuestionsOptions {
  userId: string;
  resume: IResume;
  targetRole: string;
  interviewType: InterviewType;
  difficulty: Difficulty;
  questionCount: number;
  language?: 'en' | 'ta' | 'hi';
  interviewSessionId?: string;
}

export class QuestionGeneratorService {
  /**
   * Generates resume-grounded interview questions in the candidate's chosen language.
   */
  static async generateQuestions(options: GenerateQuestionsOptions): Promise<IInterviewQuestion[]> {
    const {
      userId,
      resume,
      targetRole,
      interviewType,
      difficulty,
      questionCount,
      language = 'en',
      interviewSessionId,
    } = options;

    const count = Math.min(Math.max(questionCount || 5, 1), 15);
    const hasAIConfig = Boolean(env.AI_API_KEY && env.AI_PROVIDER !== 'mock');

    let questionsData: Array<{
      questionText: string;
      category: InterviewType;
      difficulty: Difficulty;
      sourceContext: string;
      expectedSkills: string[];
      hints: string[];
      expectedPoints: string[];
      sampleStarGuide?: { situation: string; task: string; action: string; result: string };
      generatedBy: 'ai' | 'resume-rule';
    }> = [];

    if (hasAIConfig) {
      try {
        questionsData = await this.generateViaAI(resume, targetRole, interviewType, difficulty, count, language);
      } catch (err: any) {
        console.warn('⚠️ AI Provider failed or timed out. Falling back to grounded resume heuristics:', err.message);
        questionsData = this.generateGroundedRules(resume, targetRole, interviewType, difficulty, count, language);
      }
    } else {
      questionsData = this.generateGroundedRules(resume, targetRole, interviewType, difficulty, count, language);
    }

    // Persist questions in MongoDB
    const createdQuestions: IInterviewQuestion[] = [];
    for (let i = 0; i < questionsData.length; i++) {
      const q = questionsData[i];
      const doc = await InterviewQuestion.create({
        userId,
        resumeId: resume._id,
        interviewSessionId: interviewSessionId || undefined,
        questionText: q.questionText,
        category: q.category,
        difficulty: q.difficulty,
        sourceContext: q.sourceContext,
        expectedSkills: q.expectedSkills,
        questionOrder: i + 1,
        generatedBy: q.generatedBy,
        language,
        hints: q.hints,
        expectedPoints: q.expectedPoints,
        sampleStarGuide: q.sampleStarGuide,
      });
      createdQuestions.push(doc);
    }

    return createdQuestions;
  }

  /**
   * Generates grounded questions directly from actual skills and projects extracted from the candidate's resume,
   * localized into Tamil, Hindi, or English while preserving technical keywords.
   */
  private static generateGroundedRules(
    resume: IResume,
    targetRole: string,
    interviewType: InterviewType,
    difficulty: Difficulty,
    count: number,
    language: 'en' | 'ta' | 'hi' = 'en'
  ) {
    const questions: any[] = [];
    const skills = resume.parsedSkills.map((s) => s.name);
    const projects = resume.parsedProjects;
    const experiences = resume.parsedExperience;

    // 1. Project-grounded technical questions
    if (projects.length > 0) {
      for (const proj of projects) {
        if (questions.length >= count) break;
        const techs = proj.technologies.length > 0 ? proj.technologies.join(', ') : 'the chosen stack';

        let questionText = `In your project "${proj.title}", you utilized ${techs}. Could you walk me through the overall architectural decisions you made, and what major performance or scaling bottlenecks you encountered?`;
        if (language === 'ta') {
          questionText = `உங்கள் project "${proj.title}"-ல் நீங்கள் ${techs} பயன்படுத்தியுள்ளீர்கள். இதன் ஒட்டுமொத்த architectural முடிவுகள் மற்றும் எதிர்கொண்ட முக்கிய performance/scaling சவால்களைப் பற்றி விளக்க முடியுமா?`;
        } else if (language === 'hi') {
          questionText = `आपके प्रोजेक्ट "${proj.title}" में आपने ${techs} का उपयोग किया था। क्या आप इसके architectural निर्णयों और मुख्य performance या scaling चुनौतियों के बारे में बता सकते हैं?`;
        }

        questions.push({
          questionText,
          category: interviewType === 'behavioral' ? 'behavioral' : 'technical',
          difficulty,
          sourceContext: `Grounded in Resume Project: "${proj.title}"`,
          expectedSkills: proj.technologies.slice(0, 4),
          hints: [
            language === 'ta' ? 'State management, database schema மற்றும் API வடிவமைப்பு பற்றி விவரியுங்கள்.' : language === 'hi' ? 'State management, डेटाबेस स्कीमा और API डिज़ाइन पर चर्चा करें।' : 'Discuss state management, data flow, and database schema choice.',
            language === 'ta' ? 'உருவாக்கத்தின் போது செய்த முக்கியமான trade-offகளை குறிப்பிடுங்கள்.' : language === 'hi' ? 'विकास के दौरान किए गए प्रमुख trade-offs का उल्लेख करें।' : 'Mention specific trade-offs considered during development.',
          ],
          expectedPoints: [
            'Clear technical rationale for selecting the tech stack',
            'Architecture explanation (client vs server vs database)',
            'Handling error boundaries and real-world failure cases',
          ],
          sampleStarGuide: {
            situation: `Developing "${proj.title}" to solve a specific workflow challenge`,
            task: `Architecting the backend and frontend using ${techs}`,
            action: `Designed modular services, implemented efficient queries, and established caching`,
            result: `Achieved stable sub-100ms response times and smooth user interaction`,
          },
          generatedBy: 'resume-rule' as const,
        });
      }
    }

    // 2. Skill-grounded questions
    for (const skill of skills) {
      if (questions.length >= count) break;

      let questionText = `Your resume highlights proficiency with ${skill}. How have you leveraged ${skill} in a production or intensive project environment to optimize reliability or developer velocity?`;
      if (language === 'ta') {
        questionText = `உங்கள் resume-ல் ${skill} திறன் குறிப்பிடப்பட்டுள்ளது. நம்பகத்தன்மை அல்லது செயல்திறனை அதிகரிக்க நிஜமான project-ல் ${skill}-ஐ எவ்வாறு பயன்படுத்தினீர்கள்?`;
      } else if (language === 'hi') {
        questionText = `आपके रिज्यूमे में ${skill} में दक्षता दिखाई गई है। आपने विश्वसनीयता या डेवलपर दक्षता को बेहतर बनाने के लिए किसी प्रोजेक्ट में ${skill} का उपयोग कैसे किया?`;
      }

      questions.push({
        questionText,
        category: interviewType,
        difficulty,
        sourceContext: `Grounded in Resume Skill: "${skill}"`,
        expectedSkills: [skill],
        hints: [
          `Reference specific design patterns or features within ${skill}.`,
          'Explain how you tested and debugged issues with it.',
        ],
        expectedPoints: [
          `Demonstrated in-depth knowledge of core ${skill} mechanics`,
          'Memory/performance considerations',
          'Production debugging experience',
        ],
        sampleStarGuide: {
          situation: `Encountered performance or complexity challenges with ${skill}`,
          task: `Refactor or optimize implementation for reliability`,
          action: `Applied best practices, asynchronous patterns, and profiling tools`,
          result: `Reduced error rates and streamlined codebase maintainability`,
        },
        generatedBy: 'resume-rule' as const,
      });
    }

    // 3. Experience / Behavioral questions
    if (experiences.length > 0) {
      for (const exp of experiences) {
        if (questions.length >= count) break;

        let questionText = `During your role as ${exp.role} at ${exp.company}, tell me about a time you had to deliver a critical milestone under tight deadlines or ambiguous requirements. How did you prioritize?`;
        if (language === 'ta') {
          questionText = `${exp.company}-ல் ${exp.role} பணியில் இருந்தபோது, இறுக்கமான காலக்கெடுவுக்குள் ஒரு முக்கிய பணியை முடிக்க வேண்டிய சூழல் ஏற்பட்டதா? நீங்கள் எவ்வாறு முன்னுரிமை அளித்தீர்கள்?`;
        } else if (language === 'hi') {
          questionText = `${exp.company} में ${exp.role} के रूप में, किसी ऐसे समय के बारे में बताएं जब आपको सख्त समयसीमा में महत्वपूर्ण प्रोजेक्ट पूरा करना था। आपने प्राथमिकताओं को कैसे तय किया?`;
        }

        questions.push({
          questionText,
          category: 'behavioral',
          difficulty,
          sourceContext: `Grounded in Work Experience: ${exp.role} at ${exp.company}`,
          expectedSkills: ['Communication', 'Prioritization', 'Leadership'],
          hints: ['Use the STAR method: Situation, Task, Action, Result.'],
          expectedPoints: [
            'Proactive stakeholder communication',
            'Task decomposition and trade-off analysis',
            'Measurable project outcome',
          ],
          sampleStarGuide: {
            situation: `Tight deadline for a core feature deliverable at ${exp.company}`,
            task: `Deliver the feature without compromising test coverage or security`,
            action: `Prioritized the MVP scope, coordinated with team leads, and automated regression tests`,
            result: `Shipped on schedule with zero high-severity incidents reported in release`,
          },
          generatedBy: 'resume-rule' as const,
        });
      }
    }

    // 4. Role-specific fallback questions if resume is minimal
    const fallbackBank: any[] = [
      {
        questionText:
          language === 'ta'
            ? `${targetRole} பணிக்கு, குறைந்த ட்ராஃபிக்கிலிருந்து லட்சக்கணக்கான பதிவுகளுக்கு மாறும்போது database schema மற்றும் indexing-ஐ எவ்வாறு அணுகுவீர்கள்?`
            : language === 'hi'
            ? `${targetRole} पद के लिए, जब ट्रैफ़िक कम से लाखों रिकॉर्ड्स तक बढ़ जाता है, तो आप डेटाबेस स्कीमा और इंडेक्सिंग को कैसे डिज़ाइन करेंगे?`
            : `For the target role of ${targetRole}, how do you approach database schema design and indexing when transitioning from low traffic to millions of records?`,
        category: 'system-design',
        difficulty,
        sourceContext: `Grounded in Target Role: ${targetRole}`,
        expectedSkills: ['Database Design', 'Indexing', 'Scalability'],
        hints: ['Consider read vs write ratios, B-tree indexes, and sharding.'],
        expectedPoints: ['Composite index utilization', 'Query execution plans', 'Caching with Redis'],
        generatedBy: 'resume-rule' as const,
      },
      {
        questionText:
          language === 'ta'
            ? `நவீன web பயன்பாடுகளில் XSS, CSRF மற்றும் பாதுகாப்பான session management-ஐ எவ்வாறு செயல்படுத்துகிறீர்கள் என்பதை விளக்குங்கள்.`
            : language === 'hi'
            ? `आधुनिक वेब अनुप्रयोगों में सुरक्षित सेशन प्रबंधन और XSS, CSRF से सुरक्षा को आप कैसे लागू करते हैं, समझाइए।`
            : `Explain how you implement secure session management and protect against XSS, CSRF, and session fixation in modern web applications.`,
        category: 'technical',
        difficulty,
        sourceContext: `Grounded in Core Security for ${targetRole}`,
        expectedSkills: ['Security', 'Cookies', 'Web Architecture'],
        hints: ['Discuss HttpOnly flags, SameSite policies, and CSRF token verification.'],
        expectedPoints: ['HttpOnly + Secure cookies', 'SameSite=Lax/Strict', 'Input sanitization'],
        generatedBy: 'resume-rule' as const,
      },
    ];

    while (questions.length < count) {
      const nextQ = fallbackBank[questions.length % fallbackBank.length];
      questions.push({ ...nextQ });
    }

    return questions.slice(0, count);
  }

  /**
   * Calls AI provider (e.g. Gemini / OpenAI) with prompt injection defenses and language instructions.
   */
  private static async generateViaAI(
    resume: IResume,
    targetRole: string,
    interviewType: string,
    difficulty: string,
    count: number,
    language: 'en' | 'ta' | 'hi' = 'en'
  ) {
    // Defend against prompt injection: strip system instruction delimiters from resume
    const safeResumeText = (resume.extractedText || '')
      .substring(0, 4000)
      .replace(/```/g, '')
      .replace(/system:/gi, '');

    const languageInstruction =
      language === 'ta'
        ? 'Output all questionText in natural conversational Tamil (தமிழ் script) while keeping technical terms (React, Node, SQL, API, Git, Docker, etc.) in English.'
        : language === 'hi'
        ? 'Output all questionText in natural conversational Hindi (देवनागरी script) while keeping technical terms (React, Node, SQL, API, Git, Docker, etc.) in English.'
        : 'Output in professional English.';

    const prompt = `You are a senior technical interviewer. Ground all questions STRICTLY in the candidate's resume below.
DO NOT invent any company, technology, or degree not in the resume.
Language instruction: ${languageInstruction}
Return a pure JSON array of ${count} interview questions.

Candidate Target Role: ${targetRole}
Interview Type: ${interviewType}
Difficulty: ${difficulty}

Resume Excerpt:
${safeResumeText}

Required JSON schema for each item:
{
  "questionText": "string",
  "category": "${interviewType}",
  "difficulty": "${difficulty}",
  "sourceContext": "Grounded in: <specific resume detail>",
  "expectedSkills": ["skill1", "skill2"],
  "hints": ["hint1", "hint2"],
  "expectedPoints": ["point1", "point2"],
  "sampleStarGuide": { "situation": "...", "task": "...", "action": "...", "result": "..." }
}`;

    if (env.AI_PROVIDER === 'gemini') {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${env.AI_MODEL}:generateContent?key=${env.AI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const json = await response.json();
      const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(content);

      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({ ...item, generatedBy: 'ai' as const }));
      }
    }

    throw new Error('Unsupported or unconfigured AI provider');
  }
}
