import { Schema, model, Document, Types } from 'mongoose';
import { InterviewType, Difficulty } from '../types';

export interface IInterviewQuestion extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  resumeId?: Types.ObjectId;
  interviewSessionId?: Types.ObjectId;
  questionText: string;
  category: InterviewType;
  difficulty: Difficulty;
  sourceContext?: string;
  expectedSkills: string[];
  questionOrder: number;
  generatedBy: 'ai' | 'resume-rule' | 'curated';
  language?: 'en' | 'ta' | 'hi';
  hints: string[];
  expectedPoints: string[];
  sampleStarGuide?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const interviewQuestionSchema = new Schema<IInterviewQuestion>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      index: true,
    },
    interviewSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      index: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['technical', 'behavioral', 'system-design', 'mixed', 'hr'],
      default: 'technical',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    sourceContext: {
      type: String,
      default: '',
    },
    expectedSkills: {
      type: [String],
      default: [],
    },
    questionOrder: {
      type: Number,
      default: 0,
    },
    generatedBy: {
      type: String,
      enum: ['ai', 'resume-rule', 'curated'],
      default: 'resume-rule',
    },
    language: {
      type: String,
      enum: ['en', 'ta', 'hi'],
      default: 'en',
    },
    hints: {
      type: [String],
      default: [],
    },
    expectedPoints: {
      type: [String],
      default: [],
    },
    sampleStarGuide: {
      situation: { type: String, default: '' },
      task: { type: String, default: '' },
      action: { type: String, default: '' },
      result: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.text = ret.questionText; // Alias for frontend compatibility
        ret.type = ret.category; // Alias for frontend compatibility
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const InterviewQuestion = model<IInterviewQuestion>(
  'InterviewQuestion',
  interviewQuestionSchema
);
