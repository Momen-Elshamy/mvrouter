import mongoose from 'mongoose';
import Connection from '@/Database/Connection';

export interface TransactionOptions {
  session?: mongoose.ClientSession;
  readPreference?: 'primary' | 'primaryPreferred' | 'secondary' | 'secondaryPreferred' | 'nearest';
  writeConcern?: mongoose.WriteConcern;
}

export class DatabaseTransaction {
  private session: mongoose.ClientSession | null = null;

  async startSession(): Promise<mongoose.ClientSession> {
    await Connection.getInstance().connect();
    this.session = await mongoose.startSession();
    return this.session;
  }

  async withTransaction<T>(
    operation: (session: mongoose.ClientSession) => Promise<T>,
    options: TransactionOptions = {}
  ): Promise<T> {
    const session = options.session || await this.startSession();
    
    try {
      const result = await session.withTransaction(async () => {
        return await operation(session);
      }, {
        readPreference: 'primary', // Always use primary for transactions
        writeConcern: options.writeConcern || { w: 'majority' },
      });

      return result as T;
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    } finally {
      if (!options.session) {
        await session.endSession();
      }
    }
  }

  async commit(): Promise<void> {
    if (this.session) {
      await this.session.commitTransaction();
    }
  }

  async abort(): Promise<void> {
    if (this.session) {
      await this.session.abortTransaction();
    }
  }

  async endSession(): Promise<void> {
    if (this.session) {
      await this.session.endSession();
      this.session = null;
    }
  }

  getSession(): mongoose.ClientSession | null {
    return this.session;
  }
}

// Helper function for common transaction patterns
export async function withTransaction<T>(
  operation: (session: mongoose.ClientSession) => Promise<T>,
  options: TransactionOptions = {}
): Promise<T> {
  const transaction = new DatabaseTransaction();
  return await transaction.withTransaction(operation, options);
}

// Helper for read operations
export async function withReadTransaction<T>(
  operation: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  return await withTransaction(operation, {
    readPreference: 'primary',
  });
}

// Helper for write operations
export async function withWriteTransaction<T>(
  operation: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  return await withTransaction(operation, {
    writeConcern: { w: 'majority', j: true },
  });
} 