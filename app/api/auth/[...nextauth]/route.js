import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '../../../../components/lib/mongodb';
import User from '../../../../models/User';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await dbConnect();
          
          const user = await User.findOne({ email: credentials.email.toLowerCase() }).select('+password');
          
          if (!user || !user.isActive) {
            return null;
          }

          const isPasswordValid = await user.comparePassword(credentials.password);
          
          if (!isPasswordValid) {
            return null;
          }

          // Update last login
          user.lastLogin = new Date();
          await user.save();

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName,
            role: user.role,
            permissions: user.permissions,
            department: user.department,
            position: user.position,
            avatar: user.avatar
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.permissions = user.permissions;
        token.department = user.department;
        token.position = user.position;
        token.avatar = user.avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
        session.user.department = token.department;
        session.user.position = token.position;
        session.user.avatar = token.avatar;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST }; 