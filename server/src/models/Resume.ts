import { Schema, model, Document, Types } from 'mongoose';

export interface IResume extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  originalFilename: string;
  detectedMimeType: string;
  fileSize: number;
  storageKey: string;
  extractedText: string;
  parsedSkills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    source: 'resume' | 'inferred';
  }>;
  parsedProjects: Array<{
    title: string;
    description: string;
    technologies: string[];
  }>;
  parsedExperience: Array<{
    role: string;
    company: string;
    duration: string;
    highlights: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  certifications: string[];
  targetRole: string;
  overallScore: number;
  parsingStatus: 'processing' | 'completed' | 'failed';
  parsingError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    detectedMimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      default: '',
      select: false, // Don't return raw huge text unless explicitly requested
    },
    parsedSkills: [
      {
        name: { type: String, required: true },
        level: {
          type: String,
          enum: ['beginner', 'intermediate', 'advanced'],
          default: 'intermediate',
        },
        source: {
          type: String,
          enum: ['resume', 'inferred'],
          default: 'resume',
        },
      },
    ],
    parsedProjects: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        technologies: { type: [String], default: [] },
      },
    ],
    parsedExperience: [
      {
        role: { type: String, required: true },
        company: { type: String, required: true },
        duration: { type: String, default: '' },
        highlights: { type: [String], default: [] },
      },
    ],
    education: [
      {
        degree: { type: String, default: '' },
        institution: { type: String, default: '' },
        year: { type: String, default: '' },
      },
    ],
    certifications: {
      type: [String],
      default: [],
    },
    targetRole: {
      type: String,
      default: 'Full Stack Engineer',
    },
    overallScore: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },
    parsingStatus: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
      index: true,
    },
    parsingError: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Resume = model<IResume>('Resume', resumeSchema);
