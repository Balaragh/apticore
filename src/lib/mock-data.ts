/**
 * Mock data for AptiCore demo mode and practice simulation.
 * All sample data here is clearly labeled as simulation/practice guidance.
 * In production with a connected backend, real API calls are made instead.
 */

import type {
  User,
  DashboardStats,
  RecentSession,
  RecommendedTopic,
  PerformanceData,
  InterviewQuestion,
  InterviewFeedback,
  ResumeAnalysis,
  BankQuestion,
  RoadmapNode,
  InterviewSession,
  AppNotification,
  InterviewConfig,
} from '@/types';

// ─── Demo User ───────────────────────────────
export const DEMO_USER: User = {
  id: 'demo-001',
  name: 'Alex Johnson',
  email: 'alex@example.com',
  role: 'user',
  isEmailVerified: true,
  createdAt: '2024-09-15T10:00:00Z',
  preferences: {
    emailNotifications: true,
    practiceReminders: true,
    weeklyReport: true,
    theme: 'system',
    profileVisibility: 'private',
    targetRole: 'Frontend Developer',
    preferredInterviewType: 'technical',
    dailyGoal: 3,
  },
};

// ─── Interviewers / Personas ─────────────────
export interface InterviewerPersona {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  style: string;
  intro: string;
}

export const INTERVIEWER_PERSONAS: InterviewerPersona[] = [
  {
    id: 'sarah',
    name: 'Sarah Chen',
    role: 'Staff Software Engineer',
    company: 'Tech Platforms',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    style: 'Rigorous & Technical',
    intro: 'Focuses on deep fundamentals, performance tradeoffs, real-world edge cases, and architectural clarity.',
  },
  {
    id: 'david',
    name: 'David Miller',
    role: 'Engineering Director',
    company: 'Enterprise Systems',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&auto=format&fit=crop&q=80',
    style: 'Behavioral & Leadership',
    intro: 'Evaluates structured communication (STAR method), team collaboration, conflict resolution, and product thinking.',
  },
  {
    id: 'alex',
    name: 'Alex Rivera',
    role: 'Principal Full Stack Architect',
    company: 'NextGen Cloud',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    style: 'Balanced & Practical',
    intro: 'Pragmatic assessment of end-to-end engineering, clean coding habits, debugging acumen, and adaptability.',
  },
];

// ─── Dashboard Stats ─────────────────────────
export const DEMO_DASHBOARD_STATS: DashboardStats = {
  totalInterviews: 24,
  avgScore: 76,
  practiceStreak: 5,
  questionsAnswered: 186,
  improvementRate: 12,
};

export const DEMO_RECENT_SESSIONS: RecentSession[] = [
  { id: 's1', role: 'Frontend Developer', type: 'technical', score: 82, date: '2024-10-10', questionCount: 5 },
  { id: 's2', role: 'Full Stack Engineer', type: 'mixed', score: 71, date: '2024-10-08', questionCount: 5 },
  { id: 's3', role: 'Python Developer', type: 'technical', score: 88, date: '2024-10-06', questionCount: 4 },
  { id: 's4', role: 'Software Engineer', type: 'behavioral', score: 65, date: '2024-10-04', questionCount: 5 },
  { id: 's5', role: 'Backend Developer', type: 'system-design', score: 73, date: '2024-10-02', questionCount: 4 },
];

export const DEMO_RECOMMENDED_TOPICS: RecommendedTopic[] = [
  { topic: 'React Hooks & State Architecture', reason: 'Frequently asked in frontend role screenings', difficulty: 'medium', questionCount: 15 },
  { topic: 'Microservices & REST API Design', reason: 'Bridge your identified backend skill gap', difficulty: 'hard', questionCount: 12 },
  { topic: 'STAR Behavioral Scenarios', reason: 'Improve communication clarity on leadership questions', difficulty: 'easy', questionCount: 10 },
  { topic: 'Concurrency & Async Programming', reason: 'Core requirement for Python and Java roles', difficulty: 'hard', questionCount: 18 },
];

// ─── Performance Data ────────────────────────
export const DEMO_PERFORMANCE: PerformanceData = {
  weeklyPractice: [
    { day: 'Mon', sessions: 2, score: 74 },
    { day: 'Tue', sessions: 1, score: 68 },
    { day: 'Wed', sessions: 3, score: 81 },
    { day: 'Thu', sessions: 1, score: 72 },
    { day: 'Fri', sessions: 2, score: 77 },
    { day: 'Sat', sessions: 2, score: 85 },
    { day: 'Sun', sessions: 2, score: 79 },
  ],
  topicScores: [
    { topic: 'JavaScript', score: 85, sessions: 8 },
    { topic: 'React', score: 80, sessions: 6 },
    { topic: 'Node.js', score: 72, sessions: 4 },
    { topic: 'System Design', score: 62, sessions: 3 },
    { topic: 'Python', score: 78, sessions: 5 },
    { topic: 'Java', score: 74, sessions: 3 },
    { topic: 'STAR Method', score: 82, sessions: 4 },
    { topic: 'Database Design', score: 76, sessions: 3 },
  ],
  overallProgress: [
    { month: 'May', score: 52 },
    { month: 'Jun', score: 58 },
    { month: 'Jul', score: 63 },
    { month: 'Aug', score: 68 },
    { month: 'Sep', score: 73 },
    { month: 'Oct', score: 76 },
  ],
  totalSessions: 24,
  avgScore: 76,
  totalHours: 18,
  streak: 5,
};

// ─── Role-Based & Comprehensive Interview Questions ─────────
export const DEMO_QUESTIONS: InterviewQuestion[] = [
  // Frontend Questions
  {
    id: 'fe-1',
    role: 'Frontend Developer',
    text: 'Explain how the Virtual DOM in React works, and compare its performance characteristics with direct DOM updates.',
    type: 'technical',
    difficulty: 'medium',
    topic: 'React',
    hints: ['Discuss tree reconciliation', 'Explain batching and Fiber scheduler', 'Mention memory overhead vs reflow costs'],
    expectedPoints: [
      'Virtual representation of UI tree maintained in memory',
      'Diffing algorithm computes minimal operations between render cycles',
      'Batched DOM mutations minimize expensive layout recalculation and browser reflows',
      'Tradeoff: CPU memory cost for virtual nodes vs DOM speedup',
    ],
  },
  {
    id: 'fe-2',
    role: 'Frontend Developer',
    text: 'What are JavaScript closures, and how are they used in modern frontend patterns such as custom hooks and debounce handlers?',
    type: 'technical',
    difficulty: 'easy',
    topic: 'JavaScript',
    hints: ['Lexical scoping', 'Outer variable persistence after execution returns'],
    expectedPoints: [
      'Inner function retains reference to parent lexical environment',
      'Variables persist in memory even after outer function finishes',
      'Used for data encapsulation, memoization, and timers in event handlers',
    ],
  },
  {
    id: 'fe-3',
    role: 'Frontend Developer',
    text: 'How would you diagnose and optimize a web application experiencing slow Initial Server Response and poor Largest Contentful Paint (LCP)?',
    type: 'technical',
    difficulty: 'hard',
    topic: 'Performance',
    hints: ['Core Web Vitals', 'SSR vs CSR caching', 'Asset compression and critical CSS'],
    expectedPoints: [
      'Analyze waterfall using DevTools and Web Vitals metrics',
      'Optimize TTFB via CDN caching and database query efficiency',
      'Preload priority hero images and eliminate render-blocking stylesheets',
      'Implement code-splitting and dynamic module imports',
    ],
  },

  // Backend Questions
  {
    id: 'be-1',
    role: 'Backend Developer',
    text: 'Describe the differences between horizontal and vertical scaling for a relational database, and when you would introduce read replicas.',
    type: 'technical',
    difficulty: 'medium',
    topic: 'Databases',
    hints: ['CPU/RAM limits vs sharding', 'Read-heavy vs write-heavy workloads', 'Replication lag considerations'],
    expectedPoints: [
      'Vertical scaling upgrades hardware resources but hits cost/hardware ceiling',
      'Horizontal scaling distributes data across nodes (sharding, partitioning)',
      'Read replicas offload SELECT queries for read-heavy workloads (e.g. 80/20 read/write)',
      'Managing eventual consistency and replication lag',
    ],
  },
  {
    id: 'be-2',
    role: 'Backend Developer',
    text: 'How does the Node.js Event Loop process asynchronous operations across the timers, poll, and check phases?',
    type: 'technical',
    difficulty: 'hard',
    topic: 'Node.js',
    hints: ['libuv thread pool', 'microtask queue vs macrotask queue', 'process.nextTick priority'],
    expectedPoints: [
      'Single-threaded execution with libuv background threadpool for blocking I/O',
      'Phases: Timers -> Pending Callbacks -> Poll -> Check (setImmediate) -> Close',
      'Microtask queue (Promise callbacks, process.nextTick) executes between phase transitions',
    ],
  },
  {
    id: 'be-3',
    role: 'Backend Developer',
    text: 'Explain how you would design secure authentication and rate limiting for a public-facing REST API.',
    type: 'technical',
    difficulty: 'medium',
    topic: 'API Security',
    hints: ['Token strategies', 'Token bucket vs sliding window', 'Headers & HTTP status codes'],
    expectedPoints: [
      'JWT with short-lived access tokens and refresh tokens stored in HttpOnly cookies',
      'Redis-backed token bucket or sliding window algorithm per IP/API Key',
      'Return 429 Too Many Requests with Retry-After header',
      'CORS configuration, input sanitization, and parameterized queries against SQL injection',
    ],
  },

  // Full Stack Questions
  {
    id: 'fs-1',
    role: 'Full Stack Developer',
    text: 'Walk through end-to-end architecture: how would you build a real-time collaborative document or notification system?',
    type: 'system-design',
    difficulty: 'hard',
    topic: 'System Architecture',
    hints: ['WebSockets vs SSE vs Long Polling', 'Pub/Sub broker', 'Conflict resolution'],
    expectedPoints: [
      'Bi-directional WebSocket connection for instant duplex updates or SSE for one-way events',
      'Pub/Sub message broker (Redis Pub/Sub or Kafka) to broadcast across multiple server instances',
      'Operational Transformation (OT) or CRDTs for collaborative concurrent text edits',
      'Heartbeat/ping mechanism to handle graceful reconnection and stale state synchronization',
    ],
  },
  {
    id: 'fs-2',
    role: 'Full Stack Developer',
    text: 'What are the key trade-offs between Server-Side Rendering (SSR), Static Site Generation (SSG), and Client-Side Rendering (CSR)?',
    type: 'technical',
    difficulty: 'medium',
    topic: 'Full Stack Web',
    hints: ['SEO and initial load vs server cost and build time'],
    expectedPoints: [
      'CSR has fast subsequent navigation but slower initial page load and weaker initial SEO',
      'SSR delivers complete HTML for optimal SEO and fast first paint, but incurs server compute overhead per request',
      'SSG generates static files at build time for near-instant CDN delivery, but requires regeneration for dynamic content',
      'Hybrid hydration / Incremental Static Regeneration combines advantages based on route needs',
    ],
  },

  // Python Developer Questions
  {
    id: 'py-1',
    role: 'Python Developer',
    text: 'Explain Python’s Global Interpreter Lock (GIL), its implications for multi-threading, and how you achieve true parallelism in CPU-bound tasks.',
    type: 'technical',
    difficulty: 'medium',
    topic: 'Python Internals',
    hints: ['Thread safety in CPython', 'multiprocessing module vs threading', 'asyncio for I/O'],
    expectedPoints: [
      'GIL is a mutex that prevents multiple native threads from executing Python bytecode simultaneously in CPython',
      'For I/O-bound tasks, threading and asyncio work well because the GIL is released during I/O wait',
      'For CPU-bound tasks, use the `multiprocessing` module or Celery to spawn separate processes with independent memory spaces',
      'Recent Python 3.13 free-threaded developments',
    ],
  },
  {
    id: 'py-2',
    role: 'Python Developer',
    text: 'How do Python generators and the `yield` statement work under the hood, and what memory benefits do they provide for large datasets?',
    type: 'technical',
    difficulty: 'easy',
    topic: 'Python Core',
    hints: ['Iterator protocol', 'Lazy evaluation', 'Memory consumption comparison'],
    expectedPoints: [
      'Generators implement the iterator protocol using `yield` to pause execution and preserve stack frame state',
      'Values are produced lazily one-at-a-time on demand via `__next__()` rather than computed in bulk',
      'Enables streaming gigabyte-scale logs or database records in constant O(1) memory space',
    ],
  },

  // Java Developer Questions
  {
    id: 'jav-1',
    role: 'Java Developer',
    text: 'Explain the Java Memory Model: Heap vs Stack, the Garbage Collection generational hypothesis, and common causes of OutOfMemoryError.',
    type: 'technical',
    difficulty: 'hard',
    topic: 'Java JVM',
    hints: ['Young/Old generation', 'G1GC / ZGC', 'Memory leak patterns like unclosed resources'],
    expectedPoints: [
      'Stack stores thread-specific primitive values and object references; Heap stores actual object instances',
      'Young Gen (Eden + Survivor spaces) collects short-lived objects via minor GC; Old Gen retains long-lived objects',
      'OutOfMemoryError: Java heap space occurs when GC cannot reclaim memory (e.g. static collections growing unbounded, unclosed streams)',
      'Modern collectors (G1, ZGC) optimize for predictable low-latency pause times',
    ],
  },
  {
    id: 'jav-2',
    role: 'Java Developer',
    text: 'In Spring Boot, how does Dependency Injection and Inversion of Control (IoC) function, and what are the primary bean scopes?',
    type: 'technical',
    difficulty: 'medium',
    topic: 'Spring Framework',
    hints: ['ApplicationContext', 'Singleton vs Prototype', 'Constructor injection benefits'],
    expectedPoints: [
      'IoC container instantiates, configures, and manages object lifecycles and dependencies',
      'Constructor injection is preferred over field injection for immutability and unit testability',
      'Common scopes: Singleton (default, single instance per container), Prototype (new instance on request), Request/Session in web apps',
    ],
  },

  // Behavioral & HR Questions (with STAR Model Guidance)
  {
    id: 'beh-1',
    role: 'Common / Behavioral',
    text: 'Tell me about a time you faced a critical production incident or major technical bug under tight time pressure. How did you resolve it?',
    type: 'behavioral',
    difficulty: 'medium',
    topic: 'Problem Solving & Resilience',
    hints: ['Use the STAR method', 'Quantify downtime and recovery', 'Share the post-mortem takeaway'],
    expectedPoints: ['Clear context and urgency', 'Systematic debugging/triage approach', 'Collaborative mitigation', 'Root-cause analysis and preventive fix'],
    sampleStarGuide: {
      situation: 'During Black Friday deployment at my previous role, our checkout API error rate spiked to 18% right before peak traffic.',
      task: 'As the on-call engineer, I needed to urgently identify the cause, restore payments within 15 minutes, and safeguard transaction integrity.',
      action: 'I inspected Datadog logs, isolated a deadlock in a newly deployed database migration, coordinated an immediate rollback to the stable artifact, and applied a hotfix with connection pooling adjustments.',
      result: 'Error rates dropped back to 0.02% within 8 minutes. We saved an estimated $45,000 in lost revenue and implemented automated staging canary checks.',
    },
  },
  {
    id: 'beh-2',
    role: 'Common / Behavioral',
    text: 'Describe a situation where you had a strong technical disagreement with a peer or senior engineer. How did you navigate the conversation?',
    type: 'behavioral',
    difficulty: 'medium',
    topic: 'Collaboration & Conflict',
    hints: ['Focus on active listening', 'Rely on data/benchmarks rather than ego', 'Commit to team consensus'],
    expectedPoints: ['Respectful disagreement', 'Empirical benchmarking or proof-of-concept', 'Alignment on customer/business goal', 'Positive team outcome'],
    sampleStarGuide: {
      situation: 'Our team was split between adopting GraphQL vs extending existing REST endpoints for a mobile app redesign.',
      task: 'I needed to resolve the technical deadlock without stalling sprint velocity or damaging team morale.',
      action: 'Rather than debating hypotheticals, I built a quick 2-day proof-of-concept measuring payload size, caching complexity, and developer velocity for both approaches.',
      result: 'The data proved REST with sparse fieldsets met our mobile network targets with 40% less server overhaul. The senior engineer agreed, and we delivered the release 1 week ahead of schedule.',
    },
  },
  {
    id: 'hr-1',
    role: 'Common / HR',
    text: 'Why are you interested in this position, and where do you see your engineering skills expanding over the next 2-3 years?',
    type: 'hr',
    difficulty: 'easy',
    topic: 'Career Motivation & Culture',
    hints: ['Connect your passion with company mission', 'Highlight desire to master system scale', 'Demonstrate mentorship and continuous learning'],
    expectedPoints: [
      'Specific alignment with company technology stack and engineering challenges',
      'Demonstrated track record of self-driven learning and proactive problem solving',
      'Clear roadmap from contributor to technical domain specialist or lead mentor',
    ],
    sampleStarGuide: {
      situation: 'I have spent the past 2 years building core web and cloud services, and I am drawn to this team’s focus on high-throughput distributed systems.',
      task: 'My goal is to transition from implementing discrete features to owning end-to-end service reliability and mentoring junior engineers.',
      action: 'I actively study system design architectures, contribute to open-source libraries, and practice structured technical communication daily on AptiCore.',
      result: 'I am excited to bring my proactive problem-solving to deliver measurable impact on your platform’s scalability and uptime goals.',
    },
  },
  {
    id: 'hr-2',
    role: 'Common / HR',
    text: 'Walk me through your resume: what has been your most impactful project, and what would you do differently if you rebuilt it today?',
    type: 'hr',
    difficulty: 'easy',
    topic: 'Resume & Self-Reflection',
    hints: ['Concisely outline background', 'Highlight measurable impact', 'Show technical maturity and hindsight'],
    expectedPoints: ['Crisp narrative arc', 'Quantified accomplishments', 'Honest engineering retrospective and growth'],
  },
];

// ─── Filter or Generate Questions for Config ─
export function getQuestionsForConfig(config: InterviewConfig): InterviewQuestion[] {
  const roleLower = (config.role || '').toLowerCase();
  const typeFilter = config.type;
  const count = config.questionCount || 5;

  // Filter matching questions
  let matched = DEMO_QUESTIONS.filter((q) => {
    // Role match check
    const qRole = (q.role || '').toLowerCase();
    const roleMatch =
      roleLower.includes('frontend') ? qRole.includes('frontend') || qRole.includes('common') :
      roleLower.includes('backend') ? qRole.includes('backend') || qRole.includes('common') :
      roleLower.includes('full stack') ? qRole.includes('full stack') || qRole.includes('frontend') || qRole.includes('backend') || qRole.includes('common') :
      roleLower.includes('python') ? qRole.includes('python') || qRole.includes('backend') || qRole.includes('common') :
      roleLower.includes('java') ? qRole.includes('java') || qRole.includes('backend') || qRole.includes('common') :
      true; // Custom role gets balanced mix

    // Type match
    const typeMatch =
      typeFilter === 'mixed' ? true :
      typeFilter === 'technical' ? q.type === 'technical' || q.type === 'system-design' :
      typeFilter === 'behavioral' ? q.type === 'behavioral' :
      typeFilter === 'hr' ? q.type === 'hr' || q.type === 'behavioral' :
      q.type === typeFilter;

    return roleMatch && typeMatch;
  });

  // If not enough questions matched, append general questions
  if (matched.length < count) {
    const remaining = DEMO_QUESTIONS.filter((q) => !matched.includes(q));
    matched = [...matched, ...remaining];
  }

  // Return requested count
  return matched.slice(0, count);
}

// ─── Feedback (Clearly labeled as practice simulation) ─────
export const DEMO_FEEDBACK: InterviewFeedback = {
  sessionId: 's1',
  overallScore: 82,
  technicalAccuracy: 85,
  relevance: 80,
  communication: 78,
  completeness: 75,
  strengths: [
    'Strong conceptual understanding of core fundamentals',
    'Clear and structured explanations using technical terminology',
    'Good identification of performance bottlenecks and edge cases',
    'Demonstrated readiness to consider operational tradeoffs',
  ],
  improvements: [
    'Incorporate the STAR framework more explicitly on behavioral prompts',
    'Practice time management to avoid rushing through multi-part technical queries',
    'Elaborate on production observability (metrics, logging, alert triggers)',
    'Deepen system design coverage of caching and database indexing',
  ],
  questionFeedback: [
    {
      questionId: 'fe-1',
      score: 88,
      feedback: 'Excellent explanation of the Virtual DOM and reconciliation pipeline. Clearly connected batch updates to browser reflow savings.',
      keyPointsCovered: ['Virtual representation', 'Diffing algorithm', 'Batch DOM updates'],
      missedPoints: ['Fiber priority scheduling'],
    },
    {
      questionId: 'beh-1',
      score: 84,
      feedback: 'Compelling incident resolution scenario with quantifiable impact. Emphasize post-mortem follow-through even more.',
      keyPointsCovered: ['Specific situation', 'Root-cause diagnosis', 'Measurable recovery time'],
      missedPoints: ['Long-term automated safeguards'],
    },
  ],
  recommendations: [
    'Review STAR Answer Coach templates for structured storytelling',
    'Practice 2 system design scenarios before your next round',
    'Revisit your resume skill gaps in testing and distributed caching',
  ],
};

// ─── Resume Analysis Demo Data ───────────────
export const DEMO_RESUME_ANALYSIS: ResumeAnalysis = {
  id: 'r1',
  fileName: 'alex_johnson_resume.pdf',
  uploadedAt: '2024-10-09T14:30:00Z',
  overallScore: 74,
  targetRole: 'Frontend Developer',
  skills: [
    { name: 'React', level: 'advanced', source: 'resume' },
    { name: 'TypeScript', level: 'intermediate', source: 'resume' },
    { name: 'JavaScript', level: 'advanced', source: 'resume' },
    { name: 'Tailwind CSS', level: 'advanced', source: 'resume' },
    { name: 'REST APIs', level: 'intermediate', source: 'resume' },
    { name: 'Node.js', level: 'beginner', source: 'resume' },
    { name: 'Git & GitHub', level: 'intermediate', source: 'inferred' },
  ],
  gaps: [
    {
      skill: 'Automated Testing (Jest / Vitest / Playwright)',
      importance: 'critical',
      description: 'Most mid-level to senior roles require unit and end-to-end test verification to ensure release reliability.',
    },
    {
      skill: 'Advanced State Management (Redux Toolkit / Zustand)',
      importance: 'recommended',
      description: 'Experience handling complex asynchronous server and client state transitions at scale.',
    },
    {
      skill: 'Web Performance & Core Web Vitals',
      importance: 'recommended',
      description: 'LCP, CLS, INP monitoring, bundle chunk optimization, and CDN edge caching.',
    },
    {
      skill: 'CI/CD Pipelines (GitHub Actions / Docker)',
      importance: 'nice-to-have',
      description: 'Understanding build pipelines, automated linting, and container deployment.',
    },
  ],
  suggestions: [
    'Highlight quantifiable metrics (e.g. "Reduced initial bundle size by 35% using code-splitting")',
    'Add an automated testing section detailing component test coverage',
    'Link live deployed demos and your GitHub profile',
    'Practice answering interview questions targeting your 3 identified skill gaps',
  ],
};

// ─── Question Bank ───────────────────────────
export const DEMO_BANK_QUESTIONS: BankQuestion[] = [
  { id: 'bq1', text: 'Explain the event loop in Node.js and the role of libuv', type: 'technical', difficulty: 'medium', topic: 'Node.js', role: 'Backend Developer', tags: ['backend', 'async', 'node'], practiceCount: 3, lastPracticed: '2024-10-08', isSaved: true },
  { id: 'bq2', text: 'What are React hooks? Explain the rules of hooks and dependency arrays.', type: 'technical', difficulty: 'easy', topic: 'React', role: 'Frontend Developer', tags: ['frontend', 'hooks', 'react'], practiceCount: 5, lastPracticed: '2024-10-09', isSaved: true },
  { id: 'bq3', text: 'Design a distributed rate limiter for a multi-tenant API gateway', type: 'system-design', difficulty: 'hard', topic: 'System Design', role: 'Full Stack Developer', tags: ['architecture', 'redis', 'scalability'], practiceCount: 1, isSaved: false },
  { id: 'bq4', text: 'Tell me about a time you had to pivot quickly due to shifting requirements', type: 'behavioral', difficulty: 'easy', topic: 'Communication', role: 'Common', tags: ['behavioral', 'adaptability', 'star'], practiceCount: 2, lastPracticed: '2024-10-05', isSaved: true },
  { id: 'bq5', text: 'What are the trade-offs between SQL transactions (ACID) and NoSQL (BASE)?', type: 'technical', difficulty: 'medium', topic: 'Databases', role: 'Backend Developer', tags: ['database', 'sql', 'nosql'], practiceCount: 0, isSaved: false },
  { id: 'bq6', text: 'Explain CSS Grid vs Flexbox: layout mechanics, axis control, and responsive design', type: 'technical', difficulty: 'easy', topic: 'CSS', role: 'Frontend Developer', tags: ['frontend', 'css', 'layout'], practiceCount: 4, lastPracticed: '2024-10-07', isSaved: true },
  { id: 'bq7', text: 'How does garbage collection in Python manage circular references?', type: 'technical', difficulty: 'hard', topic: 'Python', role: 'Python Developer', tags: ['python', 'memory', 'performance'], practiceCount: 1, isSaved: false },
  { id: 'bq8', text: 'Describe a project you are most proud of: technical challenges and impact', type: 'behavioral', difficulty: 'easy', topic: 'Communication', role: 'Common', tags: ['behavioral', 'projects', 'leadership'], practiceCount: 3, lastPracticed: '2024-10-06', isSaved: true },
  { id: 'bq9', text: 'Implement a debounce and throttle utility from scratch in TypeScript', type: 'technical', difficulty: 'medium', topic: 'JavaScript', role: 'Frontend Developer', tags: ['javascript', 'typescript', 'utility'], practiceCount: 2, isSaved: false },
  { id: 'bq10', text: 'Explain Java Spring Boot annotations: @Component, @Service, and @Repository', type: 'technical', difficulty: 'medium', topic: 'Java', role: 'Java Developer', tags: ['java', 'spring', 'backend'], practiceCount: 0, isSaved: false },
  { id: 'bq11', text: 'What is CORS, and why does the browser trigger preflight OPTIONS requests?', type: 'technical', difficulty: 'medium', topic: 'Web Security', role: 'Full Stack Developer', tags: ['security', 'http', 'backend'], practiceCount: 1, isSaved: false },
  { id: 'bq12', text: 'Explain React memo, useMemo, and useCallback: when to use and when to avoid', type: 'technical', difficulty: 'medium', topic: 'React', role: 'Frontend Developer', tags: ['react', 'performance', 'hooks'], practiceCount: 2, lastPracticed: '2024-10-03', isSaved: true },
];

// ─── Roadmap ─────────────────────────────────
export const DEMO_ROADMAP: RoadmapNode[] = [
  {
    id: 'rm1',
    title: 'Modern JavaScript & TypeScript Mastery',
    description: 'Master core language mechanics: closures, prototypal inheritance, async/await, generators, and strict type safety.',
    status: 'completed',
    category: 'Fundamentals',
    estimatedHours: 8,
    resources: [
      { title: 'MDN JavaScript Deep Dive', type: 'article', url: '#' },
      { title: 'TypeScript Handbook & Generics', type: 'article', url: '#' },
    ],
  },
  {
    id: 'rm2',
    title: 'React Architecture & State Patterns',
    description: 'Component lifecycles, custom hooks, reconciliation pipeline, and scalable state management.',
    status: 'completed',
    category: 'Frontend',
    estimatedHours: 10,
    resources: [
      { title: 'React Documentation: Escape Hatches', type: 'article', url: '#' },
      { title: 'Building Production Hooks', type: 'project', url: '#' },
    ],
  },
  {
    id: 'rm3',
    title: 'Automated Testing & Test-Driven Development',
    description: 'Unit testing with Vitest/Jest, component test coverage with React Testing Library, and mocking API calls.',
    status: 'in-progress',
    category: 'Quality',
    estimatedHours: 6,
    resources: [
      { title: 'Testing Library Best Practices', type: 'article', url: '#' },
      { title: 'Unit Testing Real-World Components', type: 'exercise', url: '#' },
    ],
  },
  {
    id: 'rm4',
    title: 'Web Performance & Core Web Vitals',
    description: 'Optimizing LCP, INP, and CLS. Code splitting, asset compression, lazy loading, and rendering optimization.',
    status: 'available',
    category: 'Frontend',
    estimatedHours: 8,
    resources: [
      { title: 'Google Web Vitals Guide', type: 'article', url: '#' },
      { title: 'Performance Profiling Workshop', type: 'video', url: '#' },
    ],
  },
  {
    id: 'rm5',
    title: 'Backend API Design & Distributed Caching',
    description: 'REST and GraphQL contract design, Redis caching, rate limiting, and database indexing.',
    status: 'available',
    category: 'Backend',
    estimatedHours: 12,
    resources: [
      { title: 'RESTful API Architectural Guidelines', type: 'article', url: '#' },
      { title: 'High-Performance Redis Caching', type: 'project', url: '#' },
    ],
  },
  {
    id: 'rm6',
    title: 'System Design & Scalability Principles',
    description: 'Load balancing, relational vs non-relational storage, event-driven message queues, and fault tolerance.',
    status: 'locked',
    category: 'Architecture',
    estimatedHours: 15,
    resources: [
      { title: 'System Design Primer', type: 'article', url: '#' },
      { title: 'Designing Data-Intensive Applications', type: 'article', url: '#' },
    ],
  },
];

// ─── Interview History ───────────────────────
export const DEMO_INTERVIEW_HISTORY: InterviewSession[] = [
  {
    id: 's1',
    config: { role: 'Frontend Developer', technologies: ['React', 'TypeScript'], difficulty: 'medium', type: 'technical', questionCount: 5, timePerQuestion: 180, mode: 'video' },
    questions: DEMO_QUESTIONS.slice(0, 3),
    answers: [
      { questionId: 'fe-1', answer: 'The Virtual DOM acts as a lightweight buffer...', timeSpent: 160, savedAt: '2024-10-10T09:15:00Z' },
    ],
    status: 'completed',
    startedAt: '2024-10-10T09:00:00Z',
    completedAt: '2024-10-10T09:25:00Z',
    selfReview: {
      sessionId: 's1',
      confidence: 4,
      clarity: 4,
      difficulty: 3,
      keyTakeaway: 'Good coverage of reconciliation; need to mention Fiber priority scheduler explicitly next time.',
      areasToImprove: 'Time management during technical derivations.',
      savedAt: '2024-10-10T09:26:00Z',
    },
  },
  {
    id: 's2',
    config: { role: 'Full Stack Engineer', technologies: ['React', 'Node.js'], difficulty: 'medium', type: 'mixed', questionCount: 5, timePerQuestion: 180, mode: 'mock' },
    questions: DEMO_QUESTIONS.slice(3, 6),
    answers: [],
    status: 'completed',
    startedAt: '2024-10-08T14:00:00Z',
    completedAt: '2024-10-08T14:35:00Z',
  },
  {
    id: 's3',
    config: { role: 'Python Developer', technologies: ['Python', 'FastAPI'], difficulty: 'hard', type: 'technical', questionCount: 4, timePerQuestion: 180, mode: 'video' },
    questions: DEMO_QUESTIONS.slice(8, 10),
    answers: [],
    status: 'completed',
    startedAt: '2024-10-06T11:00:00Z',
    completedAt: '2024-10-06T11:40:00Z',
  },
  {
    id: 's4',
    config: { role: 'Software Engineer', technologies: ['Communication'], difficulty: 'easy', type: 'behavioral', questionCount: 5, timePerQuestion: 180, mode: 'video' },
    questions: DEMO_QUESTIONS.slice(12, 14),
    answers: [],
    status: 'completed',
    startedAt: '2024-10-04T16:00:00Z',
    completedAt: '2024-10-04T16:30:00Z',
  },
];

// ─── Notifications ───────────────────────────
export const DEMO_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', title: 'Video Interview Practice Ready', message: 'Try the new interactive Video Interview Training mode with real-time camera feedback.', type: 'info', read: false, createdAt: '2024-10-10T09:30:00Z' },
  { id: 'n2', title: '5-Day Practice Streak!', message: 'Great momentum! Complete today’s practice goal to maintain your streak.', type: 'success', read: false, createdAt: '2024-10-10T09:00:00Z' },
  { id: 'n3', title: 'Resume Gaps Identified', message: 'Targeted practice questions are available for your testing and caching gaps.', type: 'info', read: true, createdAt: '2024-10-07T08:00:00Z' },
];

export function simulateDelay(ms = 600): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
