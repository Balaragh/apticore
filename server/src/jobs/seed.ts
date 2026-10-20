import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { User, Resume, InterviewQuestion, InterviewSession, PracticeProgress } from '../models';
import { hashPassword } from '../utils/crypto';

async function seed() {
  console.log('🌱 Starting AptiCore development seed...');
  await connectDB();

  // 1. Clear existing seed collections
  await User.deleteMany({ email: { $in: ['alex.johnson@example.com', 'sarah.lead@example.com'] } });
  await InterviewSession.deleteMany({ roomCode: 'apti-meet-801' });

  // 2. Create Candidate
  const candidatePassword = await hashPassword('CandidatePass123!');
  const candidate = await User.create({
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    passwordHash: candidatePassword,
    role: 'candidate',
    accountStatus: 'active',
    emailVerifiedAt: new Date(),
    targetJobRoles: ['Full Stack Engineer', 'Backend Engineer'],
    profile: {
      bio: 'Full-stack software developer passionate about TypeScript, React, Node.js, and distributed systems.',
      github: 'https://github.com/example/alexj',
      linkedin: 'https://linkedin.com/in/alex-johnson-dev',
    },
    preferences: {
      emailNotifications: true,
      practiceReminders: true,
      weeklyReport: true,
      theme: 'light',
      profileVisibility: 'private',
      dailyGoal: 5,
    },
  });

  // 3. Create Interviewer
  const interviewerPassword = await hashPassword('InterviewerPass123!');
  const interviewer = await User.create({
    name: 'Sarah Chen',
    email: 'sarah.lead@example.com',
    passwordHash: interviewerPassword,
    role: 'interviewer',
    accountStatus: 'active',
    emailVerifiedAt: new Date(),
    targetJobRoles: ['Staff Engineer', 'Engineering Manager'],
    profile: {
      bio: 'Staff Engineering Lead conducting senior technical architecture and systems interviews.',
    },
  });

  // 4. Create Sample Resume for Candidate
  const resume = await Resume.create({
    userId: candidate._id,
    originalFilename: 'Alex_Johnson_Software_Engineer_Resume.pdf',
    detectedMimeType: 'application/pdf',
    fileSize: 142800,
    storageKey: 'seed_alex_johnson_resume.pdf',
    targetRole: 'Full Stack Engineer',
    overallScore: 88,
    parsingStatus: 'completed',
    parsedSkills: [
      { name: 'TypeScript', level: 'advanced', source: 'resume' },
      { name: 'React', level: 'advanced', source: 'resume' },
      { name: 'Node.js', level: 'advanced', source: 'resume' },
      { name: 'Express', level: 'advanced', source: 'resume' },
      { name: 'MongoDB', level: 'intermediate', source: 'resume' },
      { name: 'PostgreSQL', level: 'intermediate', source: 'resume' },
      { name: 'Docker', level: 'intermediate', source: 'resume' },
      { name: 'WebRTC', level: 'intermediate', source: 'resume' },
    ],
    parsedProjects: [
      {
        title: 'Real-time Video & Interview Workspace',
        description: 'Built low-latency signalling over WebSockets with WebRTC mesh audio/video, collaborative code editor, and question state synchronisation.',
        technologies: ['React', 'TypeScript', 'Node.js', 'Socket.IO', 'WebRTC'],
      },
      {
        title: 'Distributed Analytics Pipeline',
        description: 'Engineered high-throughput event ingestion processing 10,000 req/sec with Redis caching and PostgreSQL storage.',
        technologies: ['Node.js', 'Redis', 'PostgreSQL', 'Docker'],
      },
    ],
    parsedExperience: [
      {
        role: 'Software Engineer',
        company: 'CloudScale Technologies',
        duration: '2023 - Present',
        highlights: [
          'Spearheaded full-stack modernization of client dashboard in React & TypeScript.',
          'Reduced API latency by 42% through optimized database indexing and query restructuring.',
        ],
      },
    ],
    education: [
      {
        degree: 'B.Tech in Computer Science and Engineering',
        institution: 'Institute of Technology',
        year: '2019 - 2023',
      },
    ],
  });

  // 5. Create Sample Questions Grounded in Resume
  const q1 = await InterviewQuestion.create({
    userId: candidate._id,
    resumeId: resume._id,
    questionText: 'In your Real-time Video project, how did you handle WebRTC ICE candidate gathering and peer disconnection recovery across asymmetric NATs?',
    category: 'technical',
    difficulty: 'medium',
    sourceContext: 'Grounded in Project: "Real-time Video & Interview Workspace"',
    expectedSkills: ['WebRTC', 'Socket.IO', 'Networking'],
    questionOrder: 1,
    generatedBy: 'resume-rule',
    hints: ['Discuss STUN/TURN server fallback, RTCIceCandidate trickle, and ICE connection state listener.'],
    expectedPoints: ['Trickle ICE concept', 'STUN/TURN necessity', 'Reconnection logic on ICE failure state'],
    sampleStarGuide: {
      situation: 'WebRTC calls failed on restrictive mobile cellular networks behind symmetric NATs',
      task: 'Guarantee peer-to-peer connection success rate above 99%',
      action: 'Integrated configured TURN relay server and trickle ICE candidate buffers',
      result: 'Connection success increased from 82% to 99.4%',
    },
  });

  const q2 = await InterviewQuestion.create({
    userId: candidate._id,
    resumeId: resume._id,
    questionText: 'Explain how you structured your MongoDB schemas and indexes at CloudScale Technologies to avoid collection scans on frequently filtered query parameters.',
    category: 'technical',
    difficulty: 'medium',
    sourceContext: 'Grounded in Experience: Software Engineer at CloudScale Technologies',
    expectedSkills: ['MongoDB', 'Indexing', 'Query Optimization'],
    questionOrder: 2,
    generatedBy: 'resume-rule',
    hints: ['Reference explain("executionStats"), ESR rule (Equality, Sort, Range).'],
    expectedPoints: ['Compound indexing', 'Index selectivity', 'Avoiding in-memory sorting'],
  });

  const q3 = await InterviewQuestion.create({
    userId: candidate._id,
    resumeId: resume._id,
    questionText: 'Tell me about a time you identified a critical production performance bug before a major feature release. How did you triage and resolve it?',
    category: 'behavioral',
    difficulty: 'medium',
    sourceContext: 'Grounded in Work Experience at CloudScale Technologies',
    expectedSkills: ['Troubleshooting', 'Communication', 'Root Cause Analysis'],
    questionOrder: 3,
    generatedBy: 'resume-rule',
  });

  // 6. Create Scheduled Live Interview Session
  const scheduledTime = new Date();
  scheduledTime.setHours(scheduledTime.getHours() + 2); // 2 hours from now

  await InterviewSession.create({
    candidateId: candidate._id,
    interviewerId: interviewer._id,
    resumeId: resume._id,
    title: 'Full Stack Engineering Live Technical Interview',
    jobRole: 'Full Stack Engineer',
    interviewType: 'technical',
    difficulty: 'medium',
    scheduledAt: scheduledTime,
    durationMinutes: 45,
    status: 'scheduled',
    roomCode: 'apti-meet-801',
    questionIds: [q1._id, q2._id, q3._id],
    interviewerName: interviewer.name,
    interviewerEmail: interviewer.email,
    interviewerCompany: 'AptiCore Enterprise',
    candidateName: candidate.name,
    candidateEmail: candidate.email,
    meetingNotes: 'Focus on full-stack system architecture, TypeScript patterns, and live problem solving.',
  });

  // 7. Initialize Practice Progress
  await PracticeProgress.create({
    userId: candidate._id,
    targetRole: 'Full Stack Engineer',
    practiceGoal: {
      targetQuestions: 5,
      targetMinutes: 30,
      streakDays: 4,
    },
    completedSessions: 3,
    streakDays: 4,
    skillProgress: [
      { skill: 'React & TypeScript', level: 'advanced', score: 88, questionsPracticed: 12 },
      { skill: 'Node.js & Express', level: 'advanced', score: 85, questionsPracticed: 10 },
      { skill: 'MongoDB Architecture', level: 'intermediate', score: 76, questionsPracticed: 6 },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log(`👤 Fictional Candidate: alex.johnson@example.com (Password: CandidatePass123!)`);
  console.log(`👤 Fictional Interviewer: sarah.lead@example.com (Password: InterviewerPass123!)`);
  console.log(`🚪 Default Live Room Code: apti-meet-801`);

  await disconnectDB();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
