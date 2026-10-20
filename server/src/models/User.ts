import { Schema, model, Document, Types } from 'mongoose';
import { UserRole, AccountStatus } from '../types';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerifiedAt?: Date;
  profile: {
    avatar?: string;
    bio?: string;
    github?: string;
    linkedin?: string;
    phone?: string;
  };
  targetJobRoles: string[];
  preferences: {
    emailNotifications: boolean;
    practiceReminders: boolean;
    weeklyReport: boolean;
    theme: 'light' | 'dark' | 'system';
    profileVisibility: 'public' | 'private';
    dailyGoal: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never return password hash in regular queries
    },
    role: {
      type: String,
      enum: ['candidate', 'interviewer', 'admin'],
      default: 'candidate',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active',
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    profile: {
      avatar: { type: String, default: '' },
      bio: { type: String, default: '' },
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      phone: { type: String, default: '' },
    },
    targetJobRoles: {
      type: [String],
      default: ['Full Stack Engineer'],
    },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      practiceReminders: { type: Boolean, default: true },
      weeklyReport: { type: Boolean, default: true },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
      profileVisibility: { type: String, enum: ['public', 'private'], default: 'private' },
      dailyGoal: { type: Number, default: 3 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

export const User = model<IUser>('User', userSchema);
