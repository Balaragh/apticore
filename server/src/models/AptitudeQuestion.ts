import { Schema, model, Document, Types } from 'mongoose';

export type AptitudeDomain =
  | 'Quantitative Aptitude'
  | 'Logical Reasoning'
  | 'Verbal Ability'
  | 'Data Interpretation'
  | 'Programming Fundamentals'
  | 'Technical MCQs';

export type AptitudeDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface IAptitudeQuestion extends Document {
  _id: Types.ObjectId;
  canonicalId: string;
  domain: AptitudeDomain;
  topic: string;
  difficulty: AptitudeDifficulty;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  verified: boolean;
  source: 'curated' | 'ai-generated';
  createdAt: Date;
  updatedAt: Date;
}

const aptitudeQuestionSchema = new Schema<IAptitudeQuestion>(
  {
    canonicalId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      enum: [
        'Quantitative Aptitude',
        'Logical Reasoning',
        'Verbal Ability',
        'Data Interpretation',
        'Programming Fundamentals',
        'Technical MCQs',
      ],
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      default: 'General',
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
      index: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length >= 2,
        message: 'A question must provide at least two options.',
      },
    },
    correctIndex: {
      type: Number,
      required: true,
      min: 0,
    },
    explanation: {
      type: String,
      default: '',
    },
    verified: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      enum: ['curated', 'ai-generated'],
      default: 'curated',
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

aptitudeQuestionSchema.index({ domain: 1, difficulty: 1 });
aptitudeQuestionSchema.index({ domain: 1, canonicalId: 1 });

export const AptitudeQuestion = model<IAptitudeQuestion>(
  'AptitudeQuestion',
  aptitudeQuestionSchema
);
