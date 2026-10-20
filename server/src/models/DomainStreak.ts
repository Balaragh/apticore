import { Schema, model, Document, Types } from 'mongoose';

export interface IDomainStreak extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  domain: string;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null; // YYYY-MM-DD
  dailyGoal: number;
  todayQuestionsCompleted: number;
  todayCorrectAnswers: number;
  totalQuestionsCompleted: number;
  totalCorrectAnswers: number;
  practiceDates: string[]; // List of YYYY-MM-DD
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const domainStreakSchema = new Schema<IDomainStreak>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastPracticeDate: {
      type: String,
      default: null,
    },
    dailyGoal: {
      type: Number,
      default: 5,
      min: 1,
    },
    todayQuestionsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    todayCorrectAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalQuestionsCompleted: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCorrectAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },
    practiceDates: {
      type: [String],
      default: [],
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
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

// One streak document per user and domain
domainStreakSchema.index({ userId: 1, domain: 1 }, { unique: true });

export const DomainStreak = model<IDomainStreak>(
  'DomainStreak',
  domainStreakSchema
);
