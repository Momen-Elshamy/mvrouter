import mongoose from 'mongoose';
import { env } from '../config/env';

class Connection {
  private static instance: Connection;
  private isConnected: boolean = false;
  private connectionPromise: Promise<typeof mongoose> | null = null;

  private constructor() {}

  public static getInstance(): Connection {
    if (!Connection.instance) {
        Connection.instance = new Connection();
    }
    return Connection.instance;
  }

  public async connect(): Promise<typeof mongoose> {
    if (this.isConnected) {
      return mongoose;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.initializeConnection();
    return this.connectionPromise;
  }

  private async initializeConnection(): Promise<typeof mongoose> {
    try {
      if (!env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in environment variables');
      }

      await mongoose.connect(env.MONGODB_URI, {
        autoIndex: true,
        serverSelectionTimeoutMS: 5000, // 5 seconds
        socketTimeoutMS: 45000, // 45 seconds
        bufferCommands: false, // Disable mongoose buffering
      });
      this.isConnected = true;
      
      console.log('✅ Database connected successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        console.error('❌ Database connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ Database disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('🔄 Database reconnected');
        this.isConnected = true;
      });

      return mongoose;
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      this.isConnected = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      this.connectionPromise = null;
      console.log('🔌 Database disconnected');
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getMongoose(): typeof mongoose {
    return mongoose;
  }
}

export default Connection;
