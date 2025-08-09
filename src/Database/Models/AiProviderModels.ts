import { Schema, Document, model, models } from 'mongoose';

export interface IAiProviderModel extends Document {
  name: string;
  description: string;
  ai_provider_id: string; // References the new AiProvider model
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AiProviderModelSchema = new Schema<IAiProviderModel>({
  name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  ai_provider_id: {
    type: String,
    ref: 'AiProvider',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
AiProviderModelSchema.index({ ai_provider_id: 1 });
AiProviderModelSchema.index({ name: 1 });

const AiProviderModel = models.AiProviderModel || model<IAiProviderModel>('AiProviderModel', AiProviderModelSchema);

export default AiProviderModel;
