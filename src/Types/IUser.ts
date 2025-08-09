import { Schema } from "mongoose";

export default interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
  