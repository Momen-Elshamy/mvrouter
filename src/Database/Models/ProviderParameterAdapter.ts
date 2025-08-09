import { IProviderParameterAdapter } from '@/Types/IProviderParameterAdapter';
import { Schema, model } from 'mongoose';



const ProviderParameterAdapterSchema = new Schema<IProviderParameterAdapter>({
  name: {
    type: String,
    required: true,
    maxlength: 100,
  },
  ai_provider_id: {
    type: Schema.Types.ObjectId,
    ref: 'AiProvider',
    required: true,
  },
  global_default_parameter_id: {
    type: Schema.Types.ObjectId,
    ref: 'GlobalDefaultParameter',
    required: true,
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
  adapter: {
    headers: {
      type: Map,
      of: {
        matchFromProvider: {
          type: String,
          required: true,
        },
        defaultValue: Schema.Types.Mixed,
      },
      default: {},
    },
    body: {
      type: {
        type: String,
        default: null,
      },
      data: {
        type: Map,
        of: {
          matchFromProvider: {
            type: String,
            required: true,
          },
          defaultValue: Schema.Types.Mixed,
        },
        default: {},
      },
    },
    query: {
      type: Map,
      of: {
        matchFromProvider: {
          type: String,
          required: true,
        },
        defaultValue: Schema.Types.Mixed,
      },
      default: {},
    },
    parameters: {
      type: Map,
      of: {
        matchFromProvider: {
          type: String,
          required: true,
        },
        defaultValue: Schema.Types.Mixed,
      },
      default: {},
    },
  },
}, {
  timestamps: true,
});

// Index for efficient queries
ProviderParameterAdapterSchema.index({ ai_provider_id: 1, global_default_parameter_id: 1 });
ProviderParameterAdapterSchema.index({ isActive: 1 });

export default model<IProviderParameterAdapter>('ProviderParameterAdapter', ProviderParameterAdapterSchema); 