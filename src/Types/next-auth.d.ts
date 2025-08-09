// NextAuth type extensions

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      createdAt?: Date;
      updatedAt?: Date;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt?: Date;
    updatedAt?: Date;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    createdAt?: Date;
    updatedAt?: Date;
  }
} 