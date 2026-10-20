export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'AptiCore API Documentation',
    version: '1.0.0',
    description: 'Backend REST API & Signalling Services for AptiCore Interview Preparation Platform',
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'apticore_session',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Server Health Check',
        responses: { 200: { description: 'Server is healthy' } },
      },
    },
    '/ready': {
      get: {
        summary: 'Database Readiness Check',
        responses: { 200: { description: 'Database connected and ready' }, 503: { description: 'Database disconnected' } },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  role: { type: 'string', enum: ['candidate', 'interviewer'] },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Registration successful' }, 409: { description: 'Email already exists' } },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login with credentials and obtain session cookie',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Login successful' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Verify current session and get user profile',
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: 'User profile retrieved' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Revoke active session and clear cookie',
        responses: { 200: { description: 'Logged out' } },
      },
    },
    '/resumes': {
      post: {
        summary: 'Upload PDF/DOCX resume file with magic byte validation',
        security: [{ cookieAuth: [] }],
        responses: { 201: { description: 'Resume analyzed and parsed' } },
      },
      get: {
        summary: 'List authenticated user resumes',
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: 'List of resumes' } },
      },
    },
    '/resumes/{id}': {
      get: {
        summary: 'Retrieve single resume analysis',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Resume analysis' } },
      },
      delete: {
        summary: 'Delete resume and unlink private file',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Resume deleted' } },
      },
    },
    '/resumes/{id}/questions/generate': {
      post: {
        summary: 'Generate grounded personalized interview questions based on resume content',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 201: { description: 'Questions generated' } },
      },
    },
    '/interviews': {
      post: {
        summary: 'Schedule live or practice interview session',
        security: [{ cookieAuth: [] }],
        responses: { 201: { description: 'Interview scheduled' } },
      },
      get: {
        summary: 'List user upcoming and past interviews',
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: 'List of interviews' } },
      },
    },
    '/interviews/room/{roomCode}': {
      get: {
        summary: 'Get interview room session details by room code',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'roomCode', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Interview details' } },
      },
    },
    '/interviews/{id}/feedback': {
      post: {
        summary: 'Submit official interviewer evaluation and confidential notes',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 201: { description: 'Feedback submitted' } },
      },
      get: {
        summary: 'Retrieve session feedback (redacts private notes for candidates)',
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Feedback details' } },
      },
    },
    '/analytics/dashboard': {
      get: {
        summary: 'Get candidate performance metrics derived from real database records',
        security: [{ cookieAuth: [] }],
        responses: { 200: { description: 'Dashboard stats and topic scores' } },
      },
    },
  },
};
