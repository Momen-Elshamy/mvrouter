import { Schema, model, models } from 'mongoose';
import IUser from '@/Types/IUser';
import Role from './Role';

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
  },
  {
    strict: true,
    timestamps: true,
  },
);

// Middleware to assign default role before validation
UserSchema.pre('validate', async function(next) {
  try {
    console.log('🔧 Pre-validate middleware running...');
    console.log('Current role before validation:', this.role);
    
    // Only assign role if it's not already set
    if (!this.role) {
      console.log('No role set, looking for default user role...');
      const defaultRole = await Role.findOne({ name: 'user' });
      if (defaultRole) {
        console.log('Found default role:', defaultRole._id);
        this.role = defaultRole._id;
      } else {
        console.error('Default user role not found!');
        throw new Error('Default user role not found. Please run the seeder first.');
      }
    } else {
      console.log('Role already set:', this.role);
    }
    next();
  } catch (error) {
    console.error('Pre-validate middleware error:', error);
    next(error as Error);
  }
});

// Middleware to assign default role before saving
UserSchema.pre('save', async function(next) {
  try {
    console.log('🔧 Pre-save middleware running...');
    console.log('Current role:', this.role);
    
    // Only assign role if it's not already set
    if (!this.role) {
      console.log('No role set, looking for default user role...');
      const defaultRole = await Role.findOne({ name: 'user' });
      if (defaultRole) {
        console.log('Found default role:', defaultRole._id);
        this.role = defaultRole._id;
      } else {
        console.error('Default user role not found!');
        throw new Error('Default user role not found. Please run the seeder first.');
      }
    } else {
      console.log('Role already set:', this.role);
    }
    next();
  } catch (error) {
    console.error('Pre-save middleware error:', error);
    next(error as Error);
  }
});

// Middleware for findOneAndUpdate operations
UserSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const update = this.getUpdate() as { role?: unknown; $set?: { role?: unknown } };
    
    // Only assign role if it's not already set in the update
    if (!update.role && !update.$set?.role) {
      const defaultRole = await Role.findOne({ name: 'user' });
      if (defaultRole) {
        if (update.$set) {
          (update.$set as Record<string, unknown>).role = defaultRole._id;
        } else {
          (update as Record<string, unknown>).role = defaultRole._id;
        }
      } else {
        throw new Error('Default user role not found. Please run the seeder first.');
      }
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Middleware for insertMany operations
UserSchema.pre('insertMany', async function(next, docs) {
  try {
    const defaultRole = await Role.findOne({ name: 'user' });
    if (!defaultRole) {
      throw new Error('Default user role not found. Please run the seeder first.');
    }
    
    // Assign default role to all documents that don't have a role
    for (const doc of docs) {
      if (!doc.role) {
        doc.role = defaultRole._id;
      }
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Avoid model overwrite in Next.js dev mode
const User = models.User || model<IUser>('User', UserSchema);
export default User;
