# AptiCore Backend — Production REST API & Real-Time Signalling Server

A complete, production-grade Express.js, TypeScript, and MongoDB backend for **AptiCore** — the full-stack interview preparation and real-time video interview platform.

## 🚀 Key Architectural Highlights

1. **Server-Managed Authentication Sessions**:
   - Secure HttpOnly, SameSite cookies with SHA-256 session token hashing.
   - User registration, login, logout, password resets, and session verification (`/api/auth/me`).
   - Role-based authorization (`candidate`, `interviewer`, `admin`).
   - Zero storage of raw tokens or credentials in browser `localStorage`.

2. **MongoDB Schemas with Validation & Lifecycle**:
   - Validated Mongoose models with appropriate compound indexes and TTL cleanup.
   - Document models: `User`, `Session`, `VerificationToken`, `Resume`, `InterviewQuestion`, `InterviewSession`, `InterviewResponse`, `InterviewFeedback`, `PracticeProgress`, `Notification`.
   - Ownership verification on all private data access.

3. **Secure Resume Ingestion & Parsing**:
   - Multer streaming file upload with binary magic-byte verification (rejects renamed scripts/executables).
   - Text extraction via `pdf-parse` (PDF) and `mammoth` (DOCX).
   - Scanned PDF detection (prompts for OCR when document has non-selectable image text).
   - Detection of skills, projects, employment experience, and education.

4. **Resume-Grounded Personalized Question Generation**:
   - Questions generated strictly from reviewed resume skills, projects, and target role.
   - Defends against prompt injection in untrusted resume content.
   - Configurable AI service (Gemini, OpenAI, Groq) with genuine grounded rule-based heuristics fallback when no API key is configured.

5. **Socket.IO Real-Time WebRTC Signalling**:
   - Authenticated WebSocket signalling server for WebRTC audio/video calls.
   - Candidate waiting room with host admission workflow.
   - Real-time exchange of SDP offers, answers, ICE candidates, synchronized questions, shared code, and in-room chat.

6. **Interview Answers, Feedback & Analytics**:
   - Candidate response saving with STAR method breakdown.
   - Interviewer rubric scoring (Technical, Problem Solving, Communication 1-5 stars) and recommendation.
   - Separation of public feedback from confidential interviewer notes.
   - Metrics and performance trends derived directly from MongoDB records.

7. **OpenAPI / Swagger Documentation**:
   - Interactive API reference hosted at `http://localhost:5000/api/docs`.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose ODM
- **Validation**: Zod
- **Security**: bcryptjs, crypto, HttpOnly cookies, express-rate-limit, cors
- **Real-Time**: Socket.IO
- **File Parsing**: Multer, pdf-parse, mammoth
- **Testing**: Vitest, Supertest
- **Documentation**: Swagger UI Express / OpenAPI 3.0

---

## 📁 Directory Structure

```text
server/
├── src/
│   ├── config/          # Environment validation (Zod), DB connection, Swagger OpenAPI
│   ├── controllers/     # HTTP request handlers (auth, resume, question, interview, analytics)
│   ├── jobs/            # Seed scripts and background tasks
│   ├── middleware/      # Auth, rate limiting, Multer upload, error handling, Zod validation
│   ├── models/          # Mongoose schemas & indexes (User, Resume, InterviewSession, etc.)
│   ├── routes/          # Express route declarations
│   ├── services/        # Business logic (AuthService, ResumeParser, QuestionGenerator, etc.)
│   ├── sockets/         # Socket.IO real-time signalling handlers
│   ├── types/           # Shared backend TypeScript types
│   ├── utils/           # Crypto hashing, standardized JSON response helpers
│   ├── app.ts           # Express application setup
│   └── server.ts        # HTTP server & Socket.IO initialization
├── tests/               # Vitest + Supertest integration tests
├── uploads/resumes/     # Private resume document storage
├── .env.example         # Environment template
├── package.json
└── tsconfig.json
```

---

## ⚙️ Environment Variables (`.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Backend listening port | `5000` |
| `NODE_ENV` | Environment (`development`, `test`, `production`) | `development` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb://localhost:27017/apticore` |
| `FRONTEND_ORIGIN` | Allowed CORS origin for credentials | `http://localhost:5173` |
| `SESSION_SECRET` | Secret key for session security | Min 16 chars |
| `SESSION_COOKIE_NAME` | Cookie name for session identifier | `apticore_session` |
| `SESSION_MAX_AGE_DAYS` | Session lifetime in days | `7` |
| `MAX_UPLOAD_SIZE_MB` | Maximum resume file upload size | `5` |
| `UPLOAD_DIR` | Private disk storage path | `uploads/resumes` |
| `AI_PROVIDER` | AI provider (`gemini`, `openai`, `groq`, `mock`) | `mock` |
| `AI_API_KEY` | Optional AI provider API key | `""` |
| `EMAIL_PROVIDER` | Email delivery service (`console`, `smtp`, `resend`) | `console` |

---

## 🏃 Quick Start Commands

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

### 3. Seed Database (Development)

Populates MongoDB with realistic test candidates, interviewers, resumes, questions, and scheduled sessions:

```bash
npm run seed
```

**Fictional Accounts Created:**

- Candidate: `alex.johnson@example.com` / `CandidatePass123!`
- Interviewer: `sarah.lead@example.com` / `InterviewerPass123!`
- Default Live Room: `apti-meet-801`

### 4. Run Development Server

```bash
npm run dev
```

Server starts on `http://localhost:5000`.

### 5. Run Automated Tests

```bash
npm run test
```

Executes 17 end-to-end integration tests with Vitest and Supertest covering Auth, Session Cookies, Resume Uploads, Grounded Question Generation, Interview Scheduling, Evaluations, and Analytics.

### 6. Build Production Bundle

```bash
npm run build
npm start
```

---

## 📖 Interactive API Documentation

Visit `http://localhost:5000/api/docs` in your browser to inspect and test all API endpoints via Swagger UI.
