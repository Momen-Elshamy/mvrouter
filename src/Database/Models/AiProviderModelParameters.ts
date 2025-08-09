import { Schema, model, models } from 'mongoose';
import IAiProviderModelParameters from '@/Types/IAiProviderModelParameters';

const AiProviderModelParametersSchema = new Schema<IAiProviderModelParameters>(
  {
    provider_endpoint_id: {
        type: Schema.Types.ObjectId,
        ref:'ProviderEndpoint',
        required:true
    },
    paramter: {
        type: Schema.Types.Mixed,
        required: true
    }
  },
  {
    strict: true,
    timestamps: true,
  },
);

AiProviderModelParametersSchema.virtual('provider_endpoint', {
    ref: 'ProviderEndpoint',
    localField: 'provider_endpoint_id',
    foreignField: '_id',
    justOne: true,
});

// Avoid model overwrite in Next.js dev mode
const AiProviderModelParameters = models.AiProviderModelParameters || model<IAiProviderModelParameters>('AiProviderModelParameters', AiProviderModelParametersSchema);
export default AiProviderModelParameters;
