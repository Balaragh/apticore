import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthenticatedRequest } from '../types';
import { Resume } from '../models/Resume';
import { ResumeParserService } from '../services/resume-parser.service';
import { sendSuccess, sendError } from '../utils/response';
import { env } from '../config/env';

export class ResumeController {
  static async uploadResume(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const file = req.file;
      if (!file) {
        sendError(res, 'No file uploaded', 400, 'NO_FILE');
        return;
      }

      const detectedMime = (file as any).detectedMimeType || file.mimetype;

      // 1. Create initial Resume record
      const resume = await Resume.create({
        userId: req.user.id,
        originalFilename: file.originalname,
        detectedMimeType: detectedMime,
        fileSize: file.size,
        storageKey: file.filename,
        parsingStatus: 'processing',
        targetRole: req.user.targetJobRoles[0] || 'Full Stack Engineer',
      });

      // 2. Process and extract text
      await ResumeParserService.processResumeFile(resume, file.path);

      sendSuccess(res, resume.toJSON(), 'Resume uploaded and analyzed successfully', 201);
    } catch (error: any) {
      console.error('Resume upload controller error:', error);
      sendError(res, error.message || 'Failed to process resume', 500, 'PROCESSING_ERROR');
    }
  }

  static async listResumes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }
      const resumes = await Resume.find({ userId: req.user.id }).sort({ createdAt: -1 });
      sendSuccess(res, resumes.map((r) => r.toJSON()), 'Resumes retrieved successfully');
    } catch (error: any) {
      sendError(res, 'Failed to retrieve resumes', 500, 'RETRIEVE_ERROR');
    }
  }

  static async getResume(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }
      const resume = await Resume.findById(req.params.id);
      if (!resume) {
        sendError(res, 'Resume not found', 404, 'NOT_FOUND');
        return;
      }

      // Ownership check
      if (resume.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        sendError(res, 'Access denied. You do not own this resume.', 403, 'FORBIDDEN');
        return;
      }

      sendSuccess(res, resume.toJSON(), 'Resume analysis retrieved');
    } catch (error: any) {
      sendError(res, 'Failed to fetch resume', 500, 'RETRIEVE_ERROR');
    }
  }

  static async updateResumeProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const resume = await Resume.findById(req.params.id);
      if (!resume) {
        sendError(res, 'Resume not found', 404, 'NOT_FOUND');
        return;
      }

      // Ownership check
      if (resume.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        sendError(res, 'Access denied.', 403, 'FORBIDDEN');
        return;
      }

      const { targetRole, parsedSkills, parsedProjects, parsedExperience } = req.body;
      if (targetRole) resume.targetRole = targetRole;
      if (parsedSkills) resume.parsedSkills = parsedSkills;
      if (parsedProjects) resume.parsedProjects = parsedProjects;
      if (parsedExperience) resume.parsedExperience = parsedExperience;

      await resume.save();
      sendSuccess(res, resume.toJSON(), 'Resume profile updated successfully');
    } catch (error: any) {
      sendError(res, 'Failed to update resume profile', 400, 'UPDATE_FAILED');
    }
  }

  static async reanalyzeResume(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const resume = await Resume.findById(req.params.id);
      if (!resume) {
        sendError(res, 'Resume not found', 404, 'NOT_FOUND');
        return;
      }

      if (resume.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        sendError(res, 'Access denied.', 403, 'FORBIDDEN');
        return;
      }

      const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR, resume.storageKey);
      if (!fs.existsSync(filePath)) {
        sendError(res, 'Underlying resume document file no longer exists.', 404, 'FILE_NOT_FOUND');
        return;
      }

      resume.parsingStatus = 'processing';
      await resume.save();

      await ResumeParserService.processResumeFile(resume, filePath);
      sendSuccess(res, resume.toJSON(), 'Resume re-analyzed successfully');
    } catch (error: any) {
      sendError(res, 'Failed to re-analyze resume', 500, 'REANALYZE_ERROR');
    }
  }

  static async deleteResume(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const resume = await Resume.findById(req.params.id);
      if (!resume) {
        sendError(res, 'Resume not found', 404, 'NOT_FOUND');
        return;
      }

      // Ownership check
      if (resume.userId.toString() !== req.user.id && req.user.role !== 'admin') {
        sendError(res, 'Access denied.', 403, 'FORBIDDEN');
        return;
      }

      // 1. Remove file from private storage
      const filePath = path.resolve(process.cwd(), env.UPLOAD_DIR, resume.storageKey);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.warn('Could not delete resume file from disk:', unlinkErr);
        }
      }

      // 2. Remove document from MongoDB
      await Resume.findByIdAndDelete(resume._id);

      sendSuccess(res, null, 'Resume and associated private document deleted successfully');
    } catch (error: any) {
      sendError(res, 'Failed to delete resume', 500, 'DELETE_ERROR');
    }
  }
}
