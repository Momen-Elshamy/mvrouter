import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import Connection from '@/Database/Connection';
import User from '@/Database/Models/User';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await Connection.getInstance().connect();
          const user = await User.findOne({ email: credentials.email }).populate('role');

          if (!user) return null;

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) return null;

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role.name,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      } else if (token.id && (!token.role || !token.createdAt)) {
        // On subsequent requests, if role or timestamps are missing, fetch from database
        try {
          await Connection.getInstance().connect();
          const dbUser = await User.findById(token.id).populate('role');
          if (dbUser) {
            if (dbUser.role) {
              token.role = dbUser.role.name;
            }
            if (dbUser.createdAt) {
              token.createdAt = dbUser.createdAt;
            }
            if (dbUser.updatedAt) {
              token.updatedAt = dbUser.updatedAt;
            }
          }
        } catch (error) {
          console.error('JWT callback - error fetching user data from DB:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.createdAt = token.createdAt as Date;
        session.user.updatedAt = token.updatedAt as Date;
      }
      
      return session;
    },
    async redirect({ url, baseUrl }: any) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl + "/dashboard";
    },
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/dashboard',
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 