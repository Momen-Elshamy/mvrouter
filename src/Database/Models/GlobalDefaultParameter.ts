import { IGlobalDefaultParameter } from '@/Types/IGlobalDefaultParameter';
import { Schema, model, models } from 'mongoose';



const GlobalDefaultParameterSchema = new Schema<IGlobalDefaultParameter>({
  name: {
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
  parameters: {
    headers: {
      type: Map,
      of: {
        type: {
          type: String,
          required: true,
          enum: ['string', 'number', 'boolean', 'json', 'array', 'object', 'any'],
        },
        required: {
          type: Boolean,
          default: false,
        },
        placeholder: String,
        description: String,
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
            type: {
              type: String,
              required: true,
              enum: ['string', 'number', 'boolean', 'json', 'array', 'object', 'any'],
            },
          required: {
            type: Boolean,
            default: false,
          },
          placeholder: String,
          description: String,
        },
        default: {},
      },
    },
    query: {
      type: Map,
      of: {
        type: {
          type: String,
          required: true,
          enum: ['string', 'number', 'boolean', 'json', 'array', 'object', 'any'],
        },
        required: {
          type: Boolean,
          default: false,
        },
        placeholder: String,
        description: String,
      },
      default: {},
    },
    parameters: {
      type: Map,
      of: {
        type: {
          type: String,
          required: true,
          enum: ['string', 'number', 'boolean', 'json', 'array', 'object', 'any'],
        },
        required: {
          type: Boolean,
          default: false,
        },
        placeholder: String,
        description: String,
      },
      default: {},
    },
  },
}, {
  timestamps: true,
});

// Index for efficient queries
GlobalDefaultParameterSchema.index({ name: 1 });

// Check if model already exists to prevent compilation errors
const GlobalDefaultParameter = models.GlobalDefaultParameter || model<IGlobalDefaultParameter>('GlobalDefaultParameter', GlobalDefaultParameterSchema);

export default GlobalDefaultParameter;