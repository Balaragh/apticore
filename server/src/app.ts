import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerDocument } from './config/swagger';
import authRoutes from './routes/auth.routes';
import resumeRoutes from './routes/resume.routes';
import questionRoutes from './routes/question.routes';
import interviewRoutes from './routes/interview.routes';
import analyticsRoutes from './routes/analytics.routes';
import healthRoutes from './routes/health.routes';
import avatarRoutes from './routes/avatar.routes';
import aptitudeRoutes from './routes/aptitude.routes';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';

export const app = express();

// Security & CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or tests) or trusted frontend origin
      if (!origin || origin === env.FRONTEND_ORIGIN || origin.startsWith('http://localhost:')) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Standard parsers
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Route Handlers
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/interview/avatar', avatarRoutes);
app.use('/api/interviews/avatar', avatarRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/aptitude', aptitudeRoutes);
app.use('/api', questionRoutes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);
