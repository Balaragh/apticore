import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { sendError } from '../utils/response';

// Ensure private upload directory exists
const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer disk storage using random UUID keys
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueKey = `${crypto.randomUUID()}${ext}`;
    cb(null, uniqueKey);
  },
});

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new Error('INVALID_FILE_TYPE'));
    return;
  }

  cb(null, true);
}

const multerUpload = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  },
  fileFilter,
});

/**
 * Validates actual binary magic bytes of the uploaded file to ensure it's not a renamed executable/script.
 */
export async function verifyFileSignature(filePath: string): Promise<{ isValid: boolean; detectedMime: string }> {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    // PDF magic bytes: %PDF (25 50 44 46)
    if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
      return { isValid: true, detectedMime: 'application/pdf' };
    }

    // DOCX (ZIP archive magic bytes: PK\x03\x04 -> 50 4b 03 04)
    if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
      return {
        isValid: true,
        detectedMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      };
    }

    return { isValid: false, detectedMime: 'unknown' };
  } catch (error) {
    console.error('File signature verification error:', error);
    return { isValid: false, detectedMime: 'error' };
  }
}

export function handleResumeUpload(req: Request, res: Response, next: NextFunction): void {
  const upload = multerUpload.single('resume');

  upload(req, res, async (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        sendError(
          res,
          `File size exceeds the limit of ${env.MAX_UPLOAD_SIZE_MB}MB`,
          400,
          'FILE_TOO_LARGE'
        );
        return;
      }
      if (err.message === 'INVALID_FILE_TYPE') {
        sendError(
          res,
          'Unsupported file type. Please upload a PDF or DOCX document.',
          400,
          'INVALID_FILE_TYPE'
        );
        return;
      }
      sendError(res, 'File upload failed: ' + err.message, 400, 'UPLOAD_FAILED');
      return;
    }

    if (!req.file) {
      sendError(res, 'No resume file provided in the request', 400, 'NO_FILE_PROVIDED');
      return;
    }

    // Verify magic bytes
    const { isValid, detectedMime } = await verifyFileSignature(req.file.path);
    if (!isValid) {
      // Delete malicious or invalid file immediately
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      sendError(
        res,
        'File signature mismatch. The file content does not match a valid PDF or DOCX document.',
        400,
        'INVALID_FILE_SIGNATURE'
      );
      return;
    }

    // Store verified detected mime
    (req.file as any).detectedMimeType = detectedMime;
    next();
  });
}
