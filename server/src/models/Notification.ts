import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipientId: Types.ObjectId;
  type: 'info' | 'success' | 'warning' | 'interview_invite';
  title: string;
  message: string;
  relatedResourceId?: string;
  readAt?: Date | null;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'interview_invite'],
      default: 'info',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedResourceId: {
      type: String,
      default: '',
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        ret.read = Boolean(ret.readAt);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Auto-clean notifications older than 60 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 });

export const Notification = model<INotification>('Notification', notificationSchema);
