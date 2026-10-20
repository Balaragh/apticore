import { Schema, model, Document, Types } from 'mongoose';
import { InterviewType, Difficulty, MeetingStatus } from '../types';

export interface IInterviewSession extends Document {
  _id: Types.ObjectId;
  candidateId: Types.ObjectId;
  interviewerId?: Types.ObjectId;
  resumeId?: Types.ObjectId;
  title: string;
  jobRole: string;
  interviewType: InterviewType;
  difficulty: Difficulty;
  scheduledAt: Date;
  durationMinutes: number;
  status: MeetingStatus;
  roomCode: string;
  invitationTokenHash?: string;
  questionIds: Types.ObjectId[];
  startedAt?: Date;
  endedAt?: Date;
  meetingNotes?: string;
  interviewerName: string;
  interviewerEmail: string;
  interviewerCompany?: string;
  candidateName: string;
  candidateEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const interviewSessionSchema = new Schema<IInterviewSession>(
  {
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    interviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    jobRole: {
      type: String,
      required: true,
      trim: true,
    },
    interviewType: {
      type: String,
      enum: ['technical', 'behavioral', 'system-design', 'mixed', 'hr'],
      default: 'technical',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 45,
    },
    status: {
      type: String,
      enum: ['scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'expired'],
      default: 'scheduled',
      index: true,
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invitationTokenHash: {
      type: String,
    },
    questionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'InterviewQuestion',
      },
    ],
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    meetingNotes: {
      type: String,
      default: '',
    },
    interviewerName: {
      type: String,
      default: 'Technical Interviewer',
    },
    interviewerEmail: {
      type: String,
      default: '',
    },
    interviewerCompany: {
      type: String,
      default: 'AptiCore Enterprise',
    },
    candidateName: {
      type: String,
      required: true,
    },
    candidateEmail: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.role = ret.jobRole; // Frontend compatibility
        ret.type = ret.interviewType; // Frontend compatibility
        ret.scheduledFor = ret.scheduledAt ? ret.scheduledAt.toISOString() : undefined;
        delete ret._id;
        delete ret.__v;
        delete ret.invitationTokenHash;
        return ret;
      },
    },
  }
);

export const InterviewSession = model<IInterviewSession>(
  'InterviewSession',
  interviewSessionSchema
);
