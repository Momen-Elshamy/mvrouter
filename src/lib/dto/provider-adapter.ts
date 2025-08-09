import { Types } from 'mongoose';

export interface CreateProviderAdapterDto {
  name: string;
  description?: string;
  defaultParameterId: string;
  providerEndpointId: string;
  mappings: Array<{
    fromField: string;
    toField: string;
    fieldType: 'parameter' | 'header' | 'body' | 'query';
    transformation?: string;
  }>;
}

export interface UpdateProviderAdapterDto {
  name?: string;
  description?: string;
  defaultParameterId?: string;
  providerEndpointId?: string;
  mappings?: Array<{
    fromField: string;
    toField: string;
    fieldType: 'parameter' | 'header' | 'body' | 'query';
    transformation?: string;
  }>;
  isActive?: boolean;
}

export interface ProviderAdapterResponseDto {
  _id: string;
  name: string;
  description?: string;
  userId: string;
  defaultParameterId: string;
  providerEndpointId: string;
  mappings: Array<{
    fromField: string;
    toField: string;
    fieldType: 'parameter' | 'header' | 'body' | 'query';
    transformation?: string;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  defaultParameter?: {
    _id: string;
    name: string;
    parameters: any;
  };
  providerEndpoint?: {
    _id: string;
    name: string;
    parameters: any;
  };
} 