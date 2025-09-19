import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '../components/lib/mongodb';
import User from '../models/User';

export const authOptions = {
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
          if (!user || !user.isActive) return null;
          const isPasswordValid = await user.comparePassword(credentials.password);
          if (!isPasswordValid) return null;

          // Update last login without triggering schema validation on legacy records
          try { await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } }); } catch(e) { console.warn('lastLogin update error', e?.message); }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.fullName,
            role: user.role,
            permissions: user.permissions,
            department: user.department,
            position: user.position,
            avatar: user.avatar,
            organization: user.organization
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async signIn({ account, profile }) {
      // Google OAuth: auto-provision @mertzcrew.com users if not found
      if (account?.provider === 'google') {
        try {
          await dbConnect();
          const email = (profile?.email || '').toLowerCase();
          let user = await User.findOne({ email });

          if (email.endsWith('@mertzcrew.com')) {
            if (!user) {
              // Derive names
              const given = (profile?.given_name || (profile?.name || '').split(' ')[0] || '').trim();
              const family = (profile?.family_name || (profile?.name || '').split(' ').slice(1).join(' ') || '').trim();
              user = new User({
                email,
                password: 'Mertz1234',
                first_name: given || 'User',
                last_name: family || 'Mertzcrew',
                role: 'associate',
                organization: 'mertzcrew',
                permissions: []
              });
            }
            try { await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } }); } catch(e) { console.warn('lastLogin update error', e?.message); }
            return true;
          } else if (email.endsWith('@mertzproductions.com')) {
            if (!user) {
              // Derive names
              const given = (profile?.given_name || (profile?.name || '').split(' ')[0] || '').trim();
              const family = (profile?.family_name || (profile?.name || '').split(' ').slice(1).join(' ') || '').trim();
              user = new User({
                email,
                password: 'Mertz1234',
                first_name: given || 'User',
                last_name: family || 'Productions',
                role: 'associate',
                organization: 'mertz_production',
                permissions: []
              });
            }
            try { await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } }); } catch(e) { console.warn('lastLogin update error', e?.message); }
            return true;
          } else {
            throw new Error('Invalid email domain');
          }

          // Non-mertzcrew: require existing active user
          if (!user || !user.isActive) return false;
          try { await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } }); } catch(e) { console.warn('lastLogin update error', e?.message); }
          return true;
        } catch (e) {
          console.error('Google signIn validation error:', e);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      try {
        // For credentials, user carries our fields already
        if (user) {
          token.id = user.id || token.id;
          token.role = user.role || token.role;
          token.permissions = user.permissions || token.permissions;
          token.department = user.department || token.department;
          token.position = user.position || token.position;
          token.avatar = user.avatar || token.avatar;
          token.organization = user.organization || token.organization;
        }

        // For Google or when token lacks our fields, hydrate from DB using email
        if ((account?.provider === 'google' || !token.role) && token?.email) {
          await dbConnect();
          const dbUser = await User.findOne({ email: token.email.toLowerCase() });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.role = dbUser.role;
            token.permissions = dbUser.permissions;
            token.department = dbUser.department;
            token.position = dbUser.position;
            token.avatar = dbUser.avatar;
            token.organization = dbUser.organization;
          }
        }
      } catch (e) {
        console.error('JWT callback error:', e);
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub || token.id;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
        session.user.department = token.department;
        session.user.position = token.position;
        session.user.avatar = token.avatar;
        session.user.organization = token.organization;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 