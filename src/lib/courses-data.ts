export interface CourseLesson {
  id: string;
  title: string;
  durationMinutes: number;
  summary: string;
  keyConcepts: string[];
  interviewQuestions: string[];
  contentMarkdown: string;
}

export interface PracticeCourse {
  id: string;
  title: string;
  category: 'Fundamentals' | 'Languages' | 'Core CS' | 'Web & Systems' | 'Interview Prep';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  description: string;
  tags: string[];
  lessons: CourseLesson[];
  practiceQuestionCount: number;
}

export const PRACTICE_COURSES: PracticeCourse[] = [
  {
    id: 'prog-fundamentals',
    title: 'Programming Fundamentals & Logic',
    category: 'Fundamentals',
    difficulty: 'Beginner',
    estimatedHours: 12,
    description: 'Master the fundamental building blocks of computation: variables, memory addresses, control flow, loops, recursion, and modular decomposition.',
    tags: ['Logic', 'Control Flow', 'Algorithms', 'Basics'],
    practiceQuestionCount: 28,
    lessons: [
      {
        id: 'pf-1',
        title: 'Memory Representation & Data Types',
        durationMinutes: 25,
        summary: 'How computers store integers, floats, characters, and pointers in physical memory.',
        keyConcepts: ['Stack vs Heap memory', 'Primitive vs Reference types', 'Bitwise operations', 'Type casting pitfalls'],
        interviewQuestions: [
          'What is the difference between stack and heap memory allocation?',
          'How does floating-point precision error occur in binary representation?',
        ],
        contentMarkdown: `### Memory Models in Modern Programming\nEvery running program is assigned a virtual address space partitioned into:\n\n1. **Code Segment (Text):** Read-only machine instructions.\n2. **Data Segment:** Global and static variables.\n3. **Stack:** Automatic memory for function call frames, local variables, and return pointers (LIFO order, very fast).\n4. **Heap:** Dynamically allocated memory managed at runtime (malloc/free, new/delete, garbage collector).\n\n\`\`\`c\n// Stack allocation:\nint count = 10; \n\n// Heap allocation:\nint* buffer = (int*)malloc(10 * sizeof(int));\nfree(buffer);\n\`\`\``,
      },
      {
        id: 'pf-2',
        title: 'Control Flow, Branching & Time Complexity',
        durationMinutes: 30,
        summary: 'Writing efficient conditional logic, loop invariants, and asymptotic analysis fundamentals.',
        keyConcepts: ['Branch prediction', 'Loop invariants', 'Big-O notation', 'Tail recursion elimination'],
        interviewQuestions: [
          'Why are nested loops O(N^2) and how do you reduce them using lookup tables?',
          'What happens in CPU branch prediction when if-else conditions are unsorted?',
        ],
        contentMarkdown: `### Control Flow & Computational Complexity\nWhen analyzing loops, consider the loop termination condition and invariant.\n\n\`\`\`python\ndef find_duplicates(arr):\n    seen = set() # O(1) average lookup\n    duplicates = []\n    for num in arr:\n        if num in seen:\n            duplicates.append(num)\n        seen.add(num)\n    return duplicates # Time: O(N), Space: O(N)\n\`\`\``,
      },
    ],
  },
  {
    id: 'python-java',
    title: 'Python & Java for Enterprise Interviews',
    category: 'Languages',
    difficulty: 'Intermediate',
    estimatedHours: 20,
    description: 'Deep dive into Python GIL, memory management, decorators, generators alongside Java JVM internals, Garbage Collection, and Spring Boot architecture.',
    tags: ['Python', 'Java', 'JVM', 'Garbage Collection', 'OOP'],
    practiceQuestionCount: 36,
    lessons: [
      {
        id: 'pj-1',
        title: 'Python Internal Mechanics: GIL, Garbage Collection & Asyncio',
        durationMinutes: 35,
        summary: 'Understand CPython reference counting, cyclic garbage collection, and async event loops.',
        keyConcepts: ['Global Interpreter Lock (GIL)', 'Generators & Yield', 'Context Managers', 'asyncio vs threading'],
        interviewQuestions: [
          'Why does Python have a GIL and how do multiprocessing vs multithreading differ?',
          'How does Python handle cyclic memory references with generational GC?',
        ],
        contentMarkdown: `### CPython Memory & Concurrency\nThe GIL ensures thread safety by executing only one thread of Python bytecode at a time.\nFor CPU-bound tasks, use \`multiprocessing\` or C extensions.\nFor I/O-bound tasks, use \`asyncio\` or \`concurrent.futures.ThreadPoolExecutor\`.\n\n\`\`\`python\nimport asyncio\n\nasync def fetch_data(api_url):\n    # Non-blocking I/O cooperative multitasking\n    await asyncio.sleep(0.5)\n    return {"status": 200}\n\`\`\``,
      },
      {
        id: 'pj-2',
        title: 'Java JVM Internals, ClassLoader & Memory Tuning',
        durationMinutes: 40,
        summary: 'Master JVM memory pools: Eden, Survivor, Tenured, Metaspace, and G1GC.',
        keyConcepts: ['JVM Architecture', 'Garbage First (G1) GC', 'JIT Compiler', 'Java Memory Model'],
        interviewQuestions: [
          'Explain the difference between Metaspace and PermGen in modern Java.',
          'How does the G1 Garbage Collector balance latency and throughput?',
        ],
        contentMarkdown: `### JVM Memory Layout\n- **Young Generation:** Eden Space + S0 & S1 Survivor spaces (Minor GC uses Mark-Copy).\n- **Old Generation (Tenured):** Long-lived objects (Major GC).\n- **Metaspace:** Class metadata stored off-heap in native memory.\n\n\`\`\`java\npublic class MemoryDemo {\n    public static void main(String[] args) {\n        // Strong reference prevents GC collection\n        Object liveObject = new Object();\n    }\n}\n\`\`\``,
      },
    ],
  },
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms (DSA)',
    category: 'Core CS',
    difficulty: 'Intermediate',
    estimatedHours: 28,
    description: 'Rigorous problem solving across Arrays, Linked Lists, Trees, Graphs, Dynamic Programming, Two Pointers, and Sliding Window techniques.',
    tags: ['DSA', 'Trees', 'Graphs', 'Dynamic Programming', 'Sliding Window'],
    practiceQuestionCount: 52,
    lessons: [
      {
        id: 'dsa-1',
        title: 'Two Pointers & Sliding Window Patterns',
        durationMinutes: 30,
        summary: 'Optimal patterns for subarray search, palindrome verification, and target sum matching.',
        keyConcepts: ['Fast & Slow Pointers', 'Fixed vs Variable Window', 'Monotonic Queue', 'O(N) Amortized Time'],
        interviewQuestions: [
          'How to find the longest substring without repeating characters in O(N)?',
          'Explain cycle detection in a linked list using Floyd’s Tortoise and Hare.',
        ],
        contentMarkdown: `### Sliding Window Strategy\nMaintain window boundaries \`left\` and \`right\` to track valid subsets without recomputing overlaps.\n\n\`\`\`typescript\nfunction lengthOfLongestSubstring(s: string): number {\n  const map = new Map<string, number>();\n  let maxLen = 0, left = 0;\n  for (let right = 0; right < s.length; right++) {\n    if (map.has(s[right])) {\n      left = Math.max(left, map.get(s[right])! + 1);\n    }\n    map.set(s[right], right);\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}\n\`\`\``,
      },
      {
        id: 'dsa-2',
        title: 'Trees, Binary Search Trees & Graph Traversals',
        durationMinutes: 45,
        summary: 'BFS, DFS, Dijkstra, Topological Sort, and Lowest Common Ancestor (LCA).',
        keyConcepts: ['Level-order traversal', 'DFS pre/in/post order', 'Adjacency list', 'Cycle detection'],
        interviewQuestions: [
          'What is the difference between BFS and DFS in memory consumption for a balanced tree?',
          'How do you detect a cycle in a directed graph using Topological Sort (Kahn’s Algorithm)?',
        ],
        contentMarkdown: `### Graph Search Mechanics\n- **BFS:** Uses a Queue (FIFO), ideal for unweighted shortest path.\n- **DFS:** Uses recursion or an explicit Stack (LIFO), ideal for exhaustive path search and cycle detection.`,
      },
    ],
  },
  {
    id: 'dbms-sql',
    title: 'DBMS & SQL Systems Design',
    category: 'Core CS',
    difficulty: 'Intermediate',
    estimatedHours: 18,
    description: 'Relational database architecture, B-Tree index structures, ACID guarantees, transaction isolation levels, query execution plans, and normalization.',
    tags: ['SQL', 'PostgreSQL', 'Indexing', 'ACID', 'Transactions'],
    practiceQuestionCount: 34,
    lessons: [
      {
        id: 'db-1',
        title: 'Database Indexing: B-Tree, Hash & Composite Indexes',
        durationMinutes: 35,
        summary: 'How indexing accelerates retrieval and the write amplification tradeoff.',
        keyConcepts: ['B+ Tree leaf nodes', 'Clustered index', 'Covering index', 'Index selectivity'],
        interviewQuestions: [
          'Why are B+ Trees preferred over Binary Search Trees in disk-based databases?',
          'What is a covering index and how does it prevent table heap lookups?',
        ],
        contentMarkdown: `### B+ Tree Index Mechanics\nB+ Trees have high fan-out (100-1000 keys per node), reducing disk I/O depth to 3-4 seeks even for millions of records. Leaf nodes form a doubly linked list for optimal range scans.\n\n\`\`\`sql\n-- Create composite index matching query filter order:\nCREATE INDEX idx_orders_user_date ON orders (user_id, created_at DESC);\n\`\`\``,
      },
      {
        id: 'db-2',
        title: 'ACID Transactions & Isolation Levels',
        durationMinutes: 40,
        summary: 'Dirty reads, Non-repeatable reads, Phantom reads, and MVCC (Multi-Version Concurrency Control).',
        keyConcepts: ['Read Committed', 'Repeatable Read', 'Serializable', 'Write-Ahead Logging (WAL)'],
        interviewQuestions: [
          'What is the phantom read anomaly and which isolation level prevents it?',
          'How does MVCC in PostgreSQL avoid read-write lock contention?',
        ],
        contentMarkdown: `### Isolation Levels\n1. **Read Uncommitted:** Allows dirty reads.\n2. **Read Committed:** Default in Postgres; each statement sees data committed before it began.\n3. **Repeatable Read:** Transaction sees snapshot as of first query.\n4. **Serializable:** Guarantees strict sequential ordering equivalence.`,
      },
    ],
  },
  {
    id: 'os-systems',
    title: 'Operating Systems & Architecture',
    category: 'Core CS',
    difficulty: 'Advanced',
    estimatedHours: 16,
    description: 'Process vs thread scheduling, virtual memory, paging, inter-process communication (IPC), deadlocks, and POSIX system calls.',
    tags: ['OS', 'Virtual Memory', 'Threads', 'Deadlocks', 'POSIX'],
    practiceQuestionCount: 26,
    lessons: [
      {
        id: 'os-1',
        title: 'Processes, Threads & CPU Context Switching',
        durationMinutes: 30,
        summary: 'Kernel mode vs user mode, PCB, TCB, and context switch overhead.',
        keyConcepts: ['Process Control Block', 'Kernel vs User space', 'Mutexes vs Semaphores', 'Preemption'],
        interviewQuestions: [
          'What exactly is saved and restored during a CPU process context switch?',
          'How do spinlocks differ from mutexes and when are spinlocks appropriate?',
        ],
        contentMarkdown: `### Process vs Thread\nA Process has an independent address space, file descriptor table, and security context. Threads inside a process share memory, heap, and open handles but have their own registers and execution stacks.`,
      },
    ],
  },
  {
    id: 'computer-networks',
    title: 'Computer Networks & Protocols',
    category: 'Core CS',
    difficulty: 'Intermediate',
    estimatedHours: 14,
    description: 'OSI 7-layer stack, TCP 3-way handshake & flow control, UDP, DNS resolution, HTTP/1.1 vs HTTP/2 vs HTTP/3 (QUIC), and TLS encryption.',
    tags: ['Networks', 'TCP/IP', 'HTTP/3', 'DNS', 'TLS'],
    practiceQuestionCount: 24,
    lessons: [
      {
        id: 'net-1',
        title: 'TCP Protocol: 3-Way Handshake, Flow Control & Congestion',
        durationMinutes: 30,
        summary: 'SYN, SYN-ACK, ACK, sliding window flow control, and slow start.',
        keyConcepts: ['TCP 3-way Handshake', 'Sliding Window', 'TCP Fast Retransmit', 'Head-of-Line Blocking'],
        interviewQuestions: [
          'Why does TCP require a 3-way handshake instead of a 2-way handshake?',
          'How does HTTP/3 on top of QUIC solve TCP head-of-line blocking?',
        ],
        contentMarkdown: `### TCP Reliable Transport\n1. Client sends SYN (seq = x)\n2. Server responds with SYN-ACK (seq = y, ack = x + 1)\n3. Client acknowledges with ACK (ack = y + 1)\n\nThis establishes bidirectional sequence numbering and synchronizes buffer windows.`,
      },
    ],
  },
  {
    id: 'oop-design',
    title: 'Object-Oriented Programming & SOLID',
    category: 'Fundamentals',
    difficulty: 'Beginner',
    estimatedHours: 10,
    description: 'The 4 pillars of OOP (Encapsulation, Abstraction, Inheritance, Polymorphism) and the 5 SOLID design principles with concrete refactoring examples.',
    tags: ['OOP', 'SOLID', 'Design Patterns', 'Refactoring'],
    practiceQuestionCount: 22,
    lessons: [
      {
        id: 'oop-1',
        title: 'The SOLID Principles Explained with Code',
        durationMinutes: 35,
        summary: 'Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.',
        keyConcepts: ['Composition over Inheritance', 'Interface Segregation', 'Dependency Injection', 'Loose Coupling'],
        interviewQuestions: [
          'Explain the Liskov Substitution Principle and give a common violation example.',
          'How does Dependency Inversion differ from Dependency Injection?',
        ],
        contentMarkdown: `### SOLID Principles\n- **S:** One reason to change.\n- **O:** Open for extension, closed for modification.\n- **L:** Subtypes must be substitutable for base types without breaking invariants.\n- **I:** Clients should not depend on interfaces they do not use.\n- **D:** High-level modules should depend on abstractions, not concretions.`,
      },
    ],
  },
  {
    id: 'web-dev',
    title: 'Modern Web Development (React & Node)',
    category: 'Web & Systems',
    difficulty: 'Intermediate',
    estimatedHours: 24,
    description: 'Full-stack engineering: React 19 concurrent features, virtual DOM, SSR/SSG, REST vs GraphQL, Node.js event loop, and security headers.',
    tags: ['React', 'TypeScript', 'Node.js', 'REST API', 'Web Vitals'],
    practiceQuestionCount: 40,
    lessons: [
      {
        id: 'web-1',
        title: 'React Fiber Architecture, Hooks & Re-rendering',
        durationMinutes: 40,
        summary: 'Reconciliation algorithm, batching, useMemo, useCallback, and custom hooks.',
        keyConcepts: ['Virtual DOM Reconciliation', 'Automatic Batching', 'Clean-up Effects', 'State immutability'],
        interviewQuestions: [
          'How does React’s reconciliation algorithm achieve O(N) diffing?',
          'What causes unnecessary component re-renders and how do you profile them?',
        ],
        contentMarkdown: `### React Rendering Lifecycle\n1. **Trigger:** State change via useState/useReducer.\n2. **Render phase:** Pure computation generating Virtual DOM tree (can be paused or interrupted in Concurrent mode).\n3. **Commit phase:** Synchronous mutations applied to actual browser DOM.\n\n\`\`\`tsx\n// Custom hook pattern with cleanup:\nfunction useWindowResize() {\n  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });\n  useEffect(() => {\n    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });\n    window.addEventListener('resize', handler);\n    return () => window.removeEventListener('resize', handler);\n  }, []);\n  return size;\n}\n\`\`\``,
      },
    ],
  },
  {
    id: 'technical-interview-prep',
    title: 'Technical Interview Mastery & Live Coding',
    category: 'Interview Prep',
    difficulty: 'Advanced',
    estimatedHours: 15,
    description: 'Strategies for whiteboarding, clarifying problem constraints, trade-off communication, clean code organization, and handling edge cases under pressure.',
    tags: ['Live Coding', 'Problem Solving', 'Trade-offs', 'Edge Cases'],
    practiceQuestionCount: 30,
    lessons: [
      {
        id: 'tip-1',
        title: 'The 6-Step Technical Problem Solving Formula',
        durationMinutes: 25,
        summary: 'Understand, Clarify Inputs/Outputs, Brute Force, Optimize, Dry Run, Implement & Test.',
        keyConcepts: ['Asking clarifying questions', 'Edge cases (empty, overflow, duplicate)', 'Time vs Space tradeoff communication'],
        interviewQuestions: [
          'How do you communicate while coding without slowing down your problem solving?',
          'What do you do if you get completely stuck on an algorithm during an interview?',
        ],
        contentMarkdown: `### The 6-Step Formula\n1. **Clarify:** What is the input range? Can values be negative? Are duplicates allowed?\n2. **Examples:** Manually compute a standard case and an edge case.\n3. **Brute Force:** State the naive O(N^2) solution first to demonstrate a working baseline.\n4. **Optimize:** Identify bottlenecks (repeated calculations, unindexed lookups).\n5. **Pseudocode / Dry Run:** Walk through test cases before writing syntax.\n6. **Code & Unit Test:** Write clean, modular functions with meaningful variable names.`,
      },
    ],
  },
  {
    id: 'hr-behavioral',
    title: 'HR & Behavioral Interview Preparation',
    category: 'Interview Prep',
    difficulty: 'Beginner',
    estimatedHours: 10,
    description: 'Master behavioral questions using the STAR framework. Learn to articulate leadership, conflict resolution, failure lessons, and culture fit.',
    tags: ['HR', 'STAR Framework', 'Behavioral', 'Culture Fit'],
    practiceQuestionCount: 25,
    lessons: [
      {
        id: 'hr-1',
        title: 'Crafting High-Impact Behavioral Stories with STAR',
        durationMinutes: 30,
        summary: 'How to structure Situation, Task, Action, and Measurable Results with authenticity.',
        keyConcepts: ['Situation context', 'Personal agency (I vs We)', 'Quantifiable results', 'Reflective learning'],
        interviewQuestions: [
          'Tell me about a time you had a technical disagreement with a teammate and how you resolved it.',
          'Describe a project failure and what actionable lesson you learned.',
        ],
        contentMarkdown: `### High-Impact Storytelling\nAvoid vague generalities. Pick real scenarios and focus on:\n- **Specific constraints:** Tight deadline, conflicting specs, unexpected bugs.\n- **Your specific contribution:** "I initiated a spike investigation", "I scheduled an alignment sync".\n- **Impact:** Time saved, users impacted, or process improvements established.`,
      },
    ],
  },
  {
    id: 'communication-soft-skills',
    title: 'Communication & Professional Soft Skills',
    category: 'Interview Prep',
    difficulty: 'Beginner',
    estimatedHours: 8,
    description: 'Elevate your verbal clarity, active listening, group discussion leadership, structured presentation, and interview body language.',
    tags: ['Communication', 'Soft Skills', 'Listening', 'Group Discussion'],
    practiceQuestionCount: 20,
    lessons: [
      {
        id: 'css-1',
        title: 'Executive Presence & Structured Verbal Delivery',
        durationMinutes: 25,
        summary: 'Pacing, eliminating filler words, top-down Pyramid Communication, and active listening.',
        keyConcepts: ['Pyramid Principle (Answer first)', 'Eliminating "Um" and "Like"', 'Tone & vocal variety', 'Active listening cues'],
        interviewQuestions: [
          'How do you explain a complex distributed system to a non-technical stakeholder?',
          'What is your approach when you do not know the answer to an interviewer’s question?',
        ],
        contentMarkdown: `### The Pyramid Principle\nIn professional environments, always lead with your recommendation or core answer first, followed by supporting arguments and technical depth.\n\n**Example:**\n*Instead of:* "Well, we looked at Postgres, then we tested Mongo, then we looked at DynamoDB because..."\n*Use:* "We selected PostgreSQL because our domain requires strict relational consistency and complex join transactions. We evaluated two alternatives..."`,
      },
    ],
  },
];
