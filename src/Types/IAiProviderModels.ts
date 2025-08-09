import { Schema } from "mongoose";

export default interface IAiProviderModels {
    _id?: string;
    ai_provider_id:Schema.Types.ObjectId;
    name: string;
    description: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
  