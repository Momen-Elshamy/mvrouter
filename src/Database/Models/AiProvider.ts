import { Schema, Document, model, models } from 'mongoose';

export interface IAiProvider extends Document {
  name: string;
  provider: string; // e.g., "OpenAI", "Anthropic", "Google"
  description: string;
  isActive: boolean;
  slug: string; // Add slug field here
  createdAt: Date;
  updatedAt: Date;
}

const AiProviderSchema = new Schema<IAiProvider>({
  name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  provider: {
    type: String,
    required: true,
    maxlength: 100,
  },

  description: {
    type: String,
    required: true,
    maxlength: 500,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  slug: { // Add slug schema definition
    type: String,
    required: true,
    maxlength: 100,
    unique: true,
    lowercase: true,
    trim: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
AiProviderSchema.index({ provider: 1 });
AiProviderSchema.index({ isActive: 1 });
AiProviderSchema.index({ name: 1 });
AiProviderSchema.index({ slug: 1 }); // Index the slug for uniqueness and lookup

const AiProviderModelParameters = models.AiProvider || model<IAiProvider>('AiProvider', AiProviderSchema);

export default AiProviderModelParameters;
