import { Schema, model, Document, Types } from 'mongoose';

export interface IAptitudeAttempt extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  questionId: Types.ObjectId;
  canonicalId: string;
  domain: string;
  selectedOption: number;
  isCorrect: boolean;
  timeSpentSeconds: number;
  practiceDate: string; // YYYY-MM-DD
  createdAt: Date;
  updatedAt: Date;
}

const aptitudeAttemptSchema = new Schema<IAptitudeAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'AptitudeQuestion',
      required: true,
      index: true,
    },
    canonicalId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      index: true,
    },
    selectedOption: {
      type: Number,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    timeSpentSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    practiceDate: {
      type: String,
      required: true,
      trim: true,
      index: true,
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

// A user must never record the same question multiple times as an unanswered candidate
aptitudeAttemptSchema.index({ userId: 1, questionId: 1 }, { unique: true });
aptitudeAttemptSchema.index({ userId: 1, domain: 1 });
aptitudeAttemptSchema.index({ userId: 1, domain: 1, practiceDate: 1 });

export const AptitudeAttempt = model<IAptitudeAttempt>(
  'AptitudeAttempt',
  aptitudeAttemptSchema
);
