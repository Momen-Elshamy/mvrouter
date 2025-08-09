import { Document, Types } from "mongoose";

export interface IProviderParameterAdapter extends Document {
    name: string;
    ai_provider_id: Types.ObjectId;
    global_default_parameter_id: Types.ObjectId;
    description: string;
    isActive: boolean;
    adapter: {
      headers: Record<string, {
        matchFromProvider: string; // The key in provider parameters to map from
        defaultValue?: unknown; // Optional default value if provider doesn't have this parameter
      }>;
      body: {
        type: string | null;
        data: Record<string, {
          matchFromProvider: string;
          defaultValue?: unknown;
        }>;
      };
      query: Record<string, {
        matchFromProvider: string;
        defaultValue?: unknown;
      }>;
      parameters: Record<string, {
        matchFromProvider: string;
        defaultValue?: unknown;
      }>;
    };
    createdAt: Date;
    updatedAt: Date;
  }