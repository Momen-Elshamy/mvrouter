import mongoose, { Schema, Document , model , models } from 'mongoose';

export interface IProviderAdapter extends Document {
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  defaultParameterId: mongoose.Types.ObjectId;
  providerEndpointId: mongoose.Types.ObjectId;
  mappings: Array<{
    fromField: string;
    toField: string;
    fieldType: 'parameter' | 'header' | 'body' | 'query';
    transformation?: string; // Optional transformation logic
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProviderAdapterSchema = new Schema<IProviderAdapter>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  defaultParameterId: {
    type: Schema.Types.ObjectId,
    ref: 'GlobalDefaultParameter',
    required: true
  },
  providerEndpointId: {
    type: Schema.Types.ObjectId,
    ref: 'ProviderEndpoint',
    required: true
  },
  mappings: [{
    fromField: {
      type: String,
      required: true
    },
    toField: {
      type: String,
      required: true
    },
    fieldType: {
      type: String,
      enum: ['parameter', 'header', 'body', 'query'],
      required: true
    },
    transformation: {
      type: String
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ProviderAdapterSchema.index({ userId: 1, isActive: 1 });
ProviderAdapterSchema.index({ defaultParameterId: 1 });
ProviderAdapterSchema.index({ providerEndpointId: 1 });

const ProviderAdapter = models.ProviderAdapter || model<IProviderAdapter>('ProviderAdapter', ProviderAdapterSchema);

export default ProviderAdapter;