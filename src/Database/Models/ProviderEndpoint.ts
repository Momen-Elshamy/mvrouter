import mongoose, { Schema, Document , model, models  } from 'mongoose';

export interface IProviderEndpoint extends Document {
  name: string;
  path_to_api: string;
  icon: string;
  slug: string;
  description: string;
  isActive: boolean;
  ai_provider_id: mongoose.Types.ObjectId; // References the AiProvider model
  createdAt: Date;
  updatedAt: Date;
}

const ProviderEndpointSchema = new Schema<IProviderEndpoint>({
  name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  path_to_api: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
    maxlength: 50,
  },

  slug: {
    type: String,
    required: true,
    maxlength: 100,
    unique: true,
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
  ai_provider_id: {
    type: Schema.Types.ObjectId,
    ref: 'AiProvider',
    required: true,
  },
}, {
  timestamps: true,
});

// Index for efficient queries
ProviderEndpointSchema.index({ slug: 1 });
ProviderEndpointSchema.index({ isActive: 1 });

const ProviderEndpoint = models.ProviderEndpoint || model<IProviderEndpoint>('ProviderEndpoint', ProviderEndpointSchema);

export default ProviderEndpoint;