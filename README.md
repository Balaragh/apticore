# AptiCore — Prepare Smarter. Interview Better

AptiCore is a modern, production-grade interview preparation and career acceleration SaaS platform. Built specifically for developers, engineering freshers, and job seekers, AptiCore pairs interactive video-call interview training with structured behavioral frameworks (STAR method), intelligent resume-to-interview gap bridges, and personalized learning roadmaps.

---

## 🌟 Key Features

### 1. Live Corporate Face-to-Face Interview Platform (`/interview/schedule` & `/interview/live/:roomId`)

- **Enterprise White Corporate Design**: Inspired by Google Meet and modern enterprise hiring software, with a clean white/soft-grey palette, deep navy typography, and restrained professional blue accents.
- **Genuine Real-Time WebRTC Video & Audio**:
  - Peer-to-peer media streams using native browser `RTCPeerConnection` and public STUN servers.
  - Multi-tab and cross-window peer-to-peer signaling via `BroadcastChannel` (`apticore_room_*`), ready for pluggable WebSocket signaling in production.
  - Immediate track cleanup upon call termination.
- **Role-Aware Interviewer & Candidate Experiences**:
  - **Host / Lead Interviewer**: Full room control, candidate waiting room admission, question navigator, private rating rubric (Technical, Problem Solving, Communication 1-5 stars), and confidential hiring notes.
  - **Candidate**: Waiting room lobby with camera diagnostics, real-time question display synchronized with interviewer, personal scratchpad, and shared live coding workspace.
- **In-Call Enterprise Tools**:
  - Real-time in-call text chat.
  - Synchronized monospace coding workspace with language support (TypeScript, Python, Java, JavaScript).
  - Screen sharing support via `getDisplayMedia`.
  - Audio and video device switcher with hardware enumeration.
- **Session Scheduling & Two-Tab Testing Assistant**:
  - Meeting manager at `/interview/schedule` to create rooms, schedule sessions, and generate candidate invite links.
  - One-click **"Launch 2-Tab Live Test"** opens Host and Candidate tabs side-by-side on localhost for instant verification of real peer-to-peer audio and video!

### 2. Dedicated Practice Interview Simulation (`/interview/video`)

- **Solo Training Drills**: Transparently labeled simulation for candidates practicing alone without a live interviewer.
- **Hardware Integration via `getUserMedia`**:
  - User-triggered camera and microphone activation with audio input metering.
  - Pre-interview device check modal (camera preview, mic volume test, speaker chime).
- **Interviewer Personas**:
  - **Sarah Chen** (Staff Software Engineer • Technical Architecture)
  - **David Miller** (Engineering Director • Behavioral & Leadership)
  - **Alex Rivera** (Principal Full Stack Architect • Full Stack Systems)
- **Speech Synthesis Support**: Browser Web Speech API reads interviewer questions aloud with animated waveform indicators.
- **STAR Answer Coach**: Interactive builder structuring answers across **Situation**, **Task**, **Action**, and **Result**.
- **Post-Session Self-Review**: Record delivery confidence, clarity, and takeaways.

### 3. Supported Engineering Job Roles

- **Frontend Developer**: React, TypeScript, JavaScript, Performance, CSS/Tailwind, Virtual DOM, Core Web Vitals.
- **Backend Developer**: Node.js, Express, Databases (SQL vs NoSQL), REST APIs, Rate Limiting, Event Loop, Caching.
- **Full Stack Developer**: Microservices, WebSockets, SSR vs SSG, Security, Full-stack system design.
- **Python Developer**: GIL internals, Generators, `multiprocessing` vs `asyncio`, Memory management.
- **Java Developer**: JVM Memory Model (Heap/Stack, GC generations), Spring Boot Dependency Injection & Bean Scopes.
- **Custom Role**: Customizable role titles with tailor-fit questions.

### 4. Extra Interview Preparation Features

- **Interview Practice Modes**:
  1. *Video Practice*: Interactive camera/audio call simulation.
  2. *Timed Mock Interview*: Standard timed multi-question exam.
  3. *Question-by-Question*: Step-by-step focused drills.
- **STAR Answer Coach**: Interactive builder structuring answers across **Situation**, **Task**, **Action**, and **Result** with sentence starters and sample answer models.
- **Answer Notes & Auto-Save**: Candidate practice responses auto-save locally to training history with word counts and copy support.
- **Interview Preparation Checklist**: Interactive pre-interview checklist tracking equipment (camera, mic, lighting), environment (quiet room, internet), and mindset (STAR stories, resume).
- **Post-Session Self-Review**: Record delivery confidence (1-5 stars), clarity (1-5 stars), perceived difficulty, and personal improvement takeaways.
- **Resume-to-Interview Bridge**: Upload and parse resumes to calculate ATS compatibility, identify skill gaps, and launch interview sessions targeting those gaps with 1 click.
- **Question Bank**: Searchable and filterable by engineering role, category, difficulty, and bookmark status.
- **Personalized Roadmap**: Milestone progress tracking across fundamentals, quality, frontend, backend, and architecture.
- **Daily Practice Goals**: Customizable daily target (e.g. 3 questions / 20 mins) with streak preservation.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Tooling**: Vite 8, Tailwind CSS v4 (@tailwindcss/vite)
- **Icons**: Lucide React
- **Animations**: Framer Motion (subtle, purposeful micro-interactions)
- **Charts**: Recharts (Weekly practice trajectories, skill proficiency radars)
- **Routing**: React Router DOM v7
- **Forms & Validation**: React Hook Form + Zod
- **Toasts**: React Hot Toast
- **Audio & Media**: WebRTC `getUserMedia`, Web Audio API, Web Speech Synthesis & Recognition

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher recommended)
- MongoDB instance running locally on `localhost:27017` or via Docker: `docker run -d -p 27017:27017 mongo:latest`

### 1. Backend Setup & Run

```bash
cd server
npm install
npm run seed     # Seeds fictional candidates, interviewers, resumes & questions
npm run dev      # Starts Express & Socket.IO server on http://localhost:5000
```

Interactive API docs available at: `http://localhost:5000/api/docs`

To run backend tests:

```bash
npm run test     # Executes 17 integration tests via Vitest & Supertest
```

### 2. Frontend Setup & Run

In the project root (`d:\papa`):

```bash
npm install
npm run dev      # Starts Vite React dev server on http://localhost:5173
```

Visit `http://localhost:5173` in your browser.

### Default Fictional Development Accounts

- **Candidate**: `alex.johnson@example.com` (Password: `CandidatePass123!`)
- **Interviewer**: `sarah.lead@example.com` (Password: `InterviewerPass123!`)
- **Live Room Code**: `apti-meet-801`

---

## 🛡️ Architecture & Security Principles

- **Server-Managed Session Cookies**: Session tokens are cryptographically generated, hashed with SHA-256 in MongoDB, and dispatched via `HttpOnly`, `SameSite` cookies with zero storage of tokens in `localStorage`.
- **Private Data Ownership**: All resumes, question generations, interview sessions, and responses enforce rigorous ownership checks.
- **Binary Magic-Byte File Validation**: Uploaded resumes must pass signature inspection (`%PDF` / `PK\x03\x04`), preventing executable injection.
- **Confidential Feedback Separation**: Interviewer private internal notes are strictly redacted from candidate-facing feedback endpoints.
- **Genuine Resume-Grounded Generation**: Interview questions are directly grounded in parsed resume skills and projects, never invented.
- **Dual-Layer Signalling**: Live video interviews negotiate WebRTC peer connections via Socket.IO across independent devices, with local BroadcastChannel fallback.
