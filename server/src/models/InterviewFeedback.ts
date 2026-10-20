import { Schema, model, Document, Types } from 'mongoose';
import { InterviewType } from '../types';

export interface IInterviewFeedback extends Document {
  _id: Types.ObjectId;
  interviewSessionId: Types.ObjectId;
  candidateId: Types.ObjectId;
  interviewerId: Types.ObjectId;
  roomCode: string;
  candidateName: string;
  interviewerName: string;
  role: string;
  interviewType: InterviewType;
  technicalKnowledge: number;
  problemSolving: number;
  communication: number;
  overallRating: number;
  recommendation: 'strong-hire' | 'hire' | 'weak-hire' | 'no-hire';
  strengths: string[];
  improvementAreas: string[];
  writtenFeedback: string;
  confidentialNotes: string;
  isSubmitted: boolean;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const interviewFeedbackSchema = new Schema<IInterviewFeedback>(
  {
    interviewSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true,
      unique: true,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    interviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roomCode: {
      type: String,
      default: '',
    },
    candidateName: {
      type: String,
      required: true,
    },
    interviewerName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'Full Stack Engineer',
    },
    interviewType: {
      type: String,
      enum: ['technical', 'behavioral', 'system-design', 'mixed', 'hr'],
      default: 'technical',
    },
    technicalKnowledge: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    problemSolving: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    communication: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    recommendation: {
      type: String,
      enum: ['strong-hire', 'hire', 'weak-hire', 'no-hire'],
      default: 'hire',
    },
    strengths: {
      type: [String],
      default: [],
    },
    improvementAreas: {
      type: [String],
      default: [],
    },
    writtenFeedback: {
      type: String,
      default: '',
    },
    confidentialNotes: {
      type: String,
      default: '',
    },
    isSubmitted: {
      type: Boolean,
      default: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.sessionId = ret.interviewSessionId?.toString();
        ret.technicalScore = ret.technicalKnowledge; // Frontend compatibility
        ret.problemSolvingScore = ret.problemSolving; // Frontend compatibility
        ret.communicationScore = ret.communication; // Frontend compatibility
        ret.improvements = ret.improvementAreas; // Frontend compatibility
        ret.publicFeedback = ret.writtenFeedback; // Frontend compatibility
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const InterviewFeedback = model<IInterviewFeedback>(
  'InterviewFeedback',
  interviewFeedbackSchema
);
