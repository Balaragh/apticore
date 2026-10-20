import { Schema, model, Document, Types } from 'mongoose';

export interface IPracticeProgress extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  targetRole: string;
  practiceGoal: {
    targetQuestions: number;
    targetMinutes: number;
    streakDays: number;
  };
  completedSessions: number;
  bookmarkedQuestionIds: Types.ObjectId[];
  skillProgress: Array<{
    skill: string;
    level: string;
    score: number;
    questionsPracticed: number;
  }>;
  learningRoadmap: Array<{
    id: string;
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'available' | 'locked';
    category: string;
    estimatedHours: number;
  }>;
  streakDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const practiceProgressSchema = new Schema<IPracticeProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    targetRole: {
      type: String,
      default: 'Full Stack Engineer',
    },
    practiceGoal: {
      targetQuestions: { type: Number, default: 5 },
      targetMinutes: { type: Number, default: 30 },
      streakDays: { type: Number, default: 0 },
    },
    completedSessions: {
      type: Number,
      default: 0,
    },
    bookmarkedQuestionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'InterviewQuestion',
      },
    ],
    skillProgress: [
      {
        skill: { type: String, required: true },
        level: { type: String, default: 'intermediate' },
        score: { type: Number, default: 70 },
        questionsPracticed: { type: Number, default: 0 },
      },
    ],
    learningRoadmap: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        status: {
          type: String,
          enum: ['completed', 'in-progress', 'available', 'locked'],
          default: 'available',
        },
        category: { type: String, default: 'Core' },
        estimatedHours: { type: Number, default: 4 },
      },
    ],
    streakDays: {
      type: Number,
      default: 0,
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

export const PracticeProgress = model<IPracticeProgress>(
  'PracticeProgress',
  practiceProgressSchema
);
