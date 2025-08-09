import { Types } from 'mongoose';

export interface IProviderAdapter {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  userId: Types.ObjectId;
  defaultParameterId: Types.ObjectId;
  aiProviderId: Types.ObjectId;
  mappings: Array<{
    fromField: string;
    toField: string;
    fieldType: 'parameter' | 'header' | 'body' | 'query';
    transformation?: string;
  }>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProviderAdapterMapping {
  fromField: string;
  toField: string;
  fieldType: 'parameter' | 'header' | 'body' | 'query';
  transformation?: string;
} 