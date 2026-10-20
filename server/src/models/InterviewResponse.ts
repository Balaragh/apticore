import { Schema, model, Document, Types } from 'mongoose';

export interface IInterviewResponse extends Document {
  _id: Types.ObjectId;
  interviewSessionId: Types.ObjectId;
  questionId: string;
  candidateId: Types.ObjectId;
  answerText: string;
  starBreakdown?: {
    situation: string;
    task: string;
    action: string;
    result: string;
    reflection?: string;
  };
  timeSpentSeconds: number;
  interviewerNotes?: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const interviewResponseSchema = new Schema<IInterviewResponse>(
  {
    interviewSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true,
      index: true,
    },
    questionId: {
      type: String,
      required: true,
      index: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    answerText: {
      type: String,
      default: '',
    },
    starBreakdown: {
      situation: { type: String, default: '' },
      task: { type: String, default: '' },
      action: { type: String, default: '' },
      result: { type: String, default: '' },
      reflection: { type: String, default: '' },
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
    },
    interviewerNotes: {
      type: String,
      default: '',
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
        ret.answer = ret.answerText;
        ret.timeSpent = ret.timeSpentSeconds;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index so a candidate can have one response per question in a session
interviewResponseSchema.index({ interviewSessionId: 1, questionId: 1 }, { unique: true });

export const InterviewResponse = model<IInterviewResponse>(
  'InterviewResponse',
  interviewResponseSchema
);
