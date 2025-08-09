import { Document } from 'mongoose';

export interface IGlobalDefaultParameter extends Document {
    name: string;
    description: string;
    isActive: boolean;
    parameters: {
      headers: Record<string, {
        type: string;
        required: boolean;
        placeholder?: string;
        description?: string;
      }>;
      body: {
        type: string | null;
        data: Record<string, {
          type: string;
          required: boolean;
          placeholder?: string;
          description?: string;
        }>;
      };
      query: Record<string, {
        type: string;
        required: boolean;
        placeholder?: string;
        description?: string;
      }>;
      parameters: Record<string, {
        type: string;
        required: boolean;
        placeholder?: string;
        description?: string;
      }>;
    };
    createdAt: Date;
    updatedAt: Date;
  }