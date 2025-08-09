import { Schema } from "mongoose";

export default interface IAiProviderToken {
  _id?: string;
  name: string;
  userId: Schema.Types.ObjectId;
  hashToken: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
      