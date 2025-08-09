import { Schema, model, models } from 'mongoose';
import IRole from '@/Types/IRole';

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['admin', 'user'],
      default: 'user',
    },
    description: {
      type: String,
      required: false,
    },
  },
  {
    strict: true,
    timestamps: true,
  },
);

// Avoid model overwrite in Next.js dev mode
const Role = models.Role || model<IRole>('Role', RoleSchema);

export default Role; 