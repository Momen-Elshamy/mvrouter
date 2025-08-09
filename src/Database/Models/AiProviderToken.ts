import { Schema, model, models } from 'mongoose';
import IAiProviderToken from '@/Types/IAiProviderToken';

const AiProviderTokenSchema = new Schema<IAiProviderToken>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hashToken: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    strict: true,
    timestamps: true,
  },
);

// Create unique compound index on userId and name
AiProviderTokenSchema.index({ userId: 1, name: 1 }, { unique: true });

// Avoid model overwrite in Next.js dev mode
const AiProviderToken = models.AiProviderToken || model<IAiProviderToken>('AiProviderToken', AiProviderTokenSchema);
export default AiProviderToken;
