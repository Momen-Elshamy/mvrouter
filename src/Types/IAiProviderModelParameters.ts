import { Schema } from "mongoose";

interface ParameterField {
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
}

interface BodyStructure {
  type: string | null;
  data: Record<string, ParameterField>;
}

interface StructuredParameters {
  headers: Record<string, ParameterField>;
  body: BodyStructure;
  query: Record<string, ParameterField>;
  parameters: Record<string, ParameterField>;
}

export default interface IAiProviderModelParameters {
    _id?: string;
    provider_endpoint_id: Schema.Types.ObjectId;
    paramter: StructuredParameters;
    createdAt?: Date;
    updatedAt?: Date;
  }
  