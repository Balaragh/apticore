import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { connectDB, disconnectDB } from '../src/config/db';
import { User, Resume, InterviewSession, AptitudeQuestion, AptitudeAttempt, DomainStreak } from '../src/models';

describe('AptiCore Backend API Test Suite', () => {
  let candidateCookie = '';
  let interviewerCookie = '';
  let candidateId = '';
  let resumeId = '';
  let sessionId = '';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();
    // Clean test user data
    await User.deleteMany({ email: { $in: ['test.candidate@example.com', 'test.interviewer@example.com', 'test.candidate2@example.com'] } });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['test.candidate@example.com', 'test.interviewer@example.com', 'test.candidate2@example.com'] } });
    if (resumeId) await Resume.findByIdAndDelete(resumeId);
    if (sessionId) await InterviewSession.findByIdAndDelete(sessionId);
    if (candidateId) {
      await AptitudeAttempt.deleteMany({ userId: candidateId });
      await DomainStreak.deleteMany({ userId: candidateId });
    }
    await disconnectDB();
  });

  describe('1. Health & Readiness', () => {
    it('GET /api/health should return status healthy', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('healthy');
    });

    it('GET /api/ready should return database status', async () => {
      const res = await request(app).get('/api/ready');
      expect([200, 503]).toContain(res.status);
    });
  });

  describe('2. Authentication & Session Management', () => {
    it('POST /api/auth/register should register candidate and set HttpOnly cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Candidate',
          email: 'test.candidate@example.com',
          password: 'Password123!',
          role: 'candidate',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('test.candidate@example.com');
      candidateId = res.body.data.id;

      // Verify cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('apticore_session=');
      candidateCookie = cookies[0].split(';')[0];
    });

    it('POST /api/auth/register should register interviewer', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Interviewer',
          email: 'test.interviewer@example.com',
          password: 'Password123!',
          role: 'interviewer',
        });

      expect(res.status).toBe(201);
      const cookies = res.headers['set-cookie'];
      interviewerCookie = cookies[0].split(';')[0];
    });

    it('POST /api/auth/register should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate',
          email: 'test.candidate@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test.candidate@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/auth/me should return authenticated user profile using cookie', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [candidateCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Candidate');
    });

    it('GET /api/auth/me should return 401 when no cookie is sent', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Resume Upload & Grounded Question Generation', () => {
    it('POST /api/resumes should reject invalid non-PDF/DOCX file', async () => {
      const res = await request(app)
        .post('/api/resumes')
        .set('Cookie', [candidateCookie])
        .attach('resume', Buffer.from('console.log("bad");'), 'malicious.js');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/resumes should accept valid dummy PDF document', async () => {
      // Create minimal valid PDF buffer starting with %PDF-1.4
      const pdfHeader = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Test) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');

      const res = await request(app)
        .post('/api/resumes')
        .set('Cookie', [candidateCookie])
        .attach('resume', pdfHeader, 'test_resume.pdf');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.originalFilename).toBe('test_resume.pdf');
      resumeId = res.body.data.id;
    });

    it('GET /api/resumes should list candidate resumes', async () => {
      const res = await request(app)
        .get('/api/resumes')
        .set('Cookie', [candidateCookie]);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('POST /api/resumes/:id/questions/generate should generate grounded questions', async () => {
      const res = await request(app)
        .post(`/api/resumes/${resumeId}/questions/generate`)
        .set('Cookie', [candidateCookie])
        .send({
          targetRole: 'Full Stack Engineer',
          interviewType: 'technical',
          difficulty: 'medium',
          questionCount: 3,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0].questionText).toBeDefined();
    });
  });

  describe('4. Interview Scheduling & Evaluation Lifecycle', () => {
    it('POST /api/interviews should schedule an interview with room code', async () => {
      const scheduledTime = new Date();
      scheduledTime.setDate(scheduledTime.getDate() + 1);

      const res = await request(app)
        .post('/api/interviews')
        .set('Cookie', [candidateCookie])
        .send({
          title: 'Full Stack Technical Evaluation',
          role: 'Full Stack Engineer',
          type: 'technical',
          difficulty: 'medium',
          scheduledFor: scheduledTime.toISOString(),
          durationMinutes: 45,
          candidateName: 'Test Candidate',
          candidateEmail: 'test.candidate@example.com',
          resumeId,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roomCode).toMatch(/^apti-meet-\d+$/);
      sessionId = res.body.data.id;
    });

    it('POST /api/interviews/:id/responses should record candidate answer', async () => {
      const res = await request(app)
        .post(`/api/interviews/${sessionId}/responses`)
        .set('Cookie', [candidateCookie])
        .send({
          questionId: 'q_dummy_test',
          answer: 'I designed a distributed queue with Redis to decouple processing.',
          timeSpent: 120,
          starBreakdown: {
            situation: 'High incoming traffic spikes',
            task: 'Decouple processing',
            action: 'Implemented Redis Stream',
            result: 'Zero dropped requests',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/interviews/:id/feedback should permit interviewer to submit evaluation', async () => {
      const res = await request(app)
        .post(`/api/interviews/${sessionId}/feedback`)
        .set('Cookie', [interviewerCookie])
        .send({
          technicalKnowledge: 4,
          problemSolving: 5,
          communication: 4,
          overallRating: 4,
          recommendation: 'hire',
          strengths: ['Excellent architecture reasoning', 'Strong Star communication'],
          improvementAreas: ['Deepen knowledge of distributed consensus'],
          writtenFeedback: 'Overall solid performance across all technical criteria.',
          confidentialNotes: 'Strong candidate for L4/L5 level.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendation).toBe('hire');
    });

    it('GET /api/interviews/:id/feedback should redact confidential notes for candidate', async () => {
      const res = await request(app)
        .get(`/api/interviews/${sessionId}/feedback`)
        .set('Cookie', [candidateCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.publicFeedback).toBeDefined();
      expect(res.body.data.confidentialNotes).toBeUndefined(); // Redacted for security!
    });
  });

  describe('5. Real Database Derived Analytics', () => {
    it('GET /api/analytics/dashboard should calculate metrics directly from DB', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Cookie', [candidateCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.stats.totalInterviews).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.topicScores)).toBe(true);
    });
  });

  describe('6. Photorealistic Avatar Video & Conversational AI API', () => {
    it('GET /api/interview/avatar/status should return configuration diagnostics without leaking private keys', async () => {
      const res = await request(app).get('/api/interview/avatar/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.provider).toBeDefined();
      expect(typeof res.body.data.isConfigured).toBe('boolean');
      expect(Array.isArray(res.body.data.missingKeys)).toBe(true);
      expect(res.body.data.instructions).toBeDefined();
      // Verify no API keys are returned in response
      expect(res.body.data.HEYGEN_API_KEY).toBeUndefined();
      expect(res.body.data.TAVUS_API_KEY).toBeUndefined();
    });

    it('POST /api/interview/avatar/chat should evaluate candidate spoken answer and generate follow-up', async () => {
      const res = await request(app)
        .post('/api/interview/avatar/chat')
        .send({
          candidateAnswer: 'In my previous project, we optimized our React web application by implementing React.memo and virtualized list windowing with Redis caching on the backend, which reduced API response latency by 45%.',
          currentQuestion: 'How do you optimize rendering performance in large-scale web applications?',
          targetRole: 'Frontend Developer',
          category: 'technical',
          difficulty: 'medium',
          language: 'en',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.interviewerSpokenReply).toBeDefined();
      expect(typeof res.body.data.score).toBe('number');
      expect(res.body.data.evaluation.strengths.length).toBeGreaterThan(0);
      expect(res.body.data.followUpQuestion).toBeDefined();
    });
  });

  describe('7. Daily Aptitude Practice, Domain-Wise Streaks & No-Repeat System', () => {
    let answeredQIds: string[] = [];
    let quantBatchIds: string[] = [];

    it('GET /api/aptitude/dashboard should return domain summaries and overall streaks', async () => {
      const res = await request(app)
        .get('/api/aptitude/dashboard')
        .set('Cookie', [candidateCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.today).toBeDefined();
      expect(Array.isArray(res.body.data.domains)).toBe(true);
      expect(res.body.data.domains.length).toBe(6);
      expect(res.body.data.overall).toBeDefined();
    });

    it('GET /api/aptitude/questions should return un-answered questions without leaking answers', async () => {
      const res = await request(app)
        .get('/api/aptitude/questions?domain=Quantitative%20Aptitude&count=3')
        .set('Cookie', [candidateCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.questions.length).toBe(3);
      expect(res.body.data.exhausted).toBe(false);

      // Verify no answer leakage
      res.body.data.questions.forEach((q: any) => {
        expect(q.id).toBeDefined();
        expect(q.canonicalId).toBeDefined();
        expect(q.question).toBeDefined();
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.correctIndex).toBeUndefined();
        expect(q.explanation).toBeUndefined();
      });

      quantBatchIds = res.body.data.questions.map((q: any) => q.id);
      answeredQIds = [...quantBatchIds];
    });

    it('POST /api/aptitude/submit should record attempts and update only that domain streak (Scenario 1 & 7)', async () => {
      const submitRes = await request(app)
        .post('/api/aptitude/submit')
        .set('Cookie', [candidateCookie])
        .send({
          domain: 'Quantitative Aptitude',
          answers: [
            { questionId: quantBatchIds[0], selectedOption: 1, timeSpentSeconds: 30 },
            { questionId: quantBatchIds[1], selectedOption: 0, timeSpentSeconds: 45 },
            { questionId: quantBatchIds[2], selectedOption: 1, timeSpentSeconds: 25 },
          ],
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.success).toBe(true);
      expect(submitRes.body.data.totalAnswered).toBe(3);
      expect(submitRes.body.data.results.length).toBe(3);

      // Verify both correct and incorrect answers are recorded
      const attempts = await AptitudeAttempt.find({ userId: candidateId, domain: 'Quantitative Aptitude' });
      expect(attempts.length).toBe(3);

      // Verify domain-independence: Quantitative streak is active, Logical streak is 0
      const quantStreak = await DomainStreak.findOne({ userId: candidateId, domain: 'Quantitative Aptitude' });
      const logicStreak = await DomainStreak.findOne({ userId: candidateId, domain: 'Logical Reasoning' });
      expect(quantStreak).toBeDefined();
      expect(logicStreak).toBeNull(); // Logical Reasoning was NOT modified
    });

    it('Completing multiple sessions on the same calendar day counts as one streak day (Scenario 2)', async () => {
      // Fetch 2 more Quantitative questions
      const fetchMore = await request(app)
        .get('/api/aptitude/questions?domain=Quantitative%20Aptitude&count=2')
        .set('Cookie', [candidateCookie]);

      const moreIds = fetchMore.body.data.questions.map((q: any) => q.id);
      answeredQIds.push(...moreIds);

      // Submit second batch today
      await request(app)
        .post('/api/aptitude/submit')
        .set('Cookie', [candidateCookie])
        .send({
          domain: 'Quantitative Aptitude',
          answers: moreIds.map((id: string) => ({ questionId: id, selectedOption: 1, timeSpentSeconds: 20 })),
        });

      const quantStreak = await DomainStreak.findOne({ userId: candidateId, domain: 'Quantitative Aptitude' });
      // Multiple sessions on the same calendar day must equal 1 streak day
      expect(quantStreak?.currentStreak).toBe(1);
      expect(quantStreak?.totalQuestionsCompleted).toBe(5);
    });

    it('Previously answered questions must NEVER reappear for that user and domain (Scenario 5)', async () => {
      const res = await request(app)
        .get('/api/aptitude/questions?domain=Quantitative%20Aptitude&count=10')
        .set('Cookie', [candidateCookie]);

      expect(res.status).toBe(200);
      const returnedIds = res.body.data.questions.map((q: any) => q.id);

      // Ensure none of the 5 previously answered questions appear in returned questions
      answeredQIds.forEach((answeredId) => {
        expect(returnedIds).not.toContain(answeredId);
      });
    });

    it('Different users can independently receive the same questions (Scenario 6)', async () => {
      // Register second candidate
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Second Candidate',
          email: 'test.candidate2@example.com',
          password: 'Password123!',
          role: 'candidate',
        });

      const user2Cookie = regRes.headers['set-cookie']![0];

      // User 2 requests Quantitative questions
      const user2Res = await request(app)
        .get('/api/aptitude/questions?domain=Quantitative%20Aptitude&count=5')
        .set('Cookie', [user2Cookie]);

      expect(user2Res.status).toBe(200);
      const user2Ids = user2Res.body.data.questions.map((q: any) => q.id);

      // User 2 CAN receive questions that User 1 answered
      const overlap = user2Ids.some((id: string) => quantBatchIds.includes(id));
      expect(overlap).toBe(true);
    });

    it('Practicing on consecutive calendar days increases the streak (Scenario 3)', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Simulate that user had already completed yesterday's practice in Logical Reasoning
      await DomainStreak.create({
        userId: candidateId,
        domain: 'Logical Reasoning',
        currentStreak: 1,
        longestStreak: 1,
        lastPracticeDate: yesterdayStr,
        dailyGoal: 2,
        todayQuestionsCompleted: 2,
        practiceDates: [yesterdayStr],
      });

      // Get questions for Logical Reasoning
      const qRes = await request(app)
        .get('/api/aptitude/questions?domain=Logical%20Reasoning&count=2')
        .set('Cookie', [candidateCookie]);

      // Submit practice today
      const submitRes = await request(app)
        .post('/api/aptitude/submit')
        .set('Cookie', [candidateCookie])
        .send({
          domain: 'Logical Reasoning',
          answers: qRes.body.data.questions.map((q: any) => ({
            questionId: q.id,
            selectedOption: 0,
            timeSpentSeconds: 15,
          })),
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.data.streak.currentStreak).toBe(2); // Streak incremented from 1 to 2!
      expect(submitRes.body.data.streak.longestStreak).toBe(2);
    });

    it('Missing a calendar day resets current streak to 1 while preserving longest streak (Scenario 4)', async () => {
      // Simulate that user had a 5-day streak in Verbal Ability 3 days ago, then missed practice
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

      await DomainStreak.create({
        userId: candidateId,
        domain: 'Verbal Ability',
        currentStreak: 5,
        longestStreak: 5,
        lastPracticeDate: threeDaysAgoStr,
        dailyGoal: 2,
        todayQuestionsCompleted: 0,
        practiceDates: [threeDaysAgoStr],
      });

      // User resumes practice today
      const qRes = await request(app)
        .get('/api/aptitude/questions?domain=Verbal%20Ability&count=2')
        .set('Cookie', [candidateCookie]);

      const submitRes = await request(app)
        .post('/api/aptitude/submit')
        .set('Cookie', [candidateCookie])
        .send({
          domain: 'Verbal Ability',
          answers: qRes.body.data.questions.map((q: any) => ({
            questionId: q.id,
            selectedOption: 1,
            timeSpentSeconds: 15,
          })),
        });

      expect(submitRes.status).toBe(200);
      // Reset current streak to 1 because day was missed
      expect(submitRes.body.data.streak.currentStreak).toBe(1);
      // Preserved longest streak of 5!
      expect(submitRes.body.data.streak.longestStreak).toBe(5);
    });

    it('Question-bank exhaustion returns exhausted state and never silently repeats questions (Scenario 9)', async () => {
      // Answer all remaining questions in Data Interpretation
      const allDIQuestions = await AptitudeQuestion.find({ domain: 'Data Interpretation' });

      // Mark all DI questions as answered for this candidate
      for (const q of allDIQuestions) {
        await AptitudeAttempt.findOneAndUpdate(
          { userId: candidateId, questionId: q._id },
          {
            $setOnInsert: {
              userId: candidateId,
              questionId: q._id,
              canonicalId: q.canonicalId,
              domain: q.domain,
              selectedOption: 0,
              isCorrect: true,
              practiceDate: '2026-10-18',
            },
          },
          { upsert: true }
        );
      }

      // Request questions for Data Interpretation
      const res = await request(app)
        .get('/api/aptitude/questions?domain=Data%20Interpretation&count=5')
        .set('Cookie', [candidateCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data.exhausted).toBe(true);
      expect(res.body.data.questions.length).toBe(0); // Never silently repeats answered questions!
      expect(res.body.data.message).toContain('all');
    });
  });
});


