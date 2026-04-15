import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@/types/auth";
import { z } from "zod";

const signInSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export const authConfig: NextAuthConfig = {
    pages: {
        signIn: "/auth/login",
        error: "/auth/error", // Error code passed in query string as ?error=
        verifyRequest: "/auth/verify-request", // (used for check email message)
        newUser: "/auth/register", // New users will be directed here on first sign in (leave the property out if not of interest)
    },
    callbacks: {
        async jwt({ token, user }) {
            // User is available during sign-in
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.permissions = (user as any).permissions;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as UserRole;
                // session.user.permissions = token.permissions; 
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/admin');

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
                // return true; // DEBUG: Allow access to test redirect
            }
            return true;
        },
    },
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        LinkedIn({
            clientId: process.env.LINKEDIN_CLIENT_ID,
            clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        }),
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = signInSchema.safeParse(credentials);

                if (parsedCredentials.success) {
                    const { email, password } = parsedCredentials.data;

                    const user = await prisma.user.findUnique({
                        where: { email },
                        include: { companies: true }
                    });

                    if (!user || !user.passwordHash) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

                    if (passwordsMatch) {
                        // Return user object compatible with NextAuth
                        return {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            role: user.role,
                            // Add any other custom properties you need in the token
                        } as any;
                    }
                }

                console.log("Invalid credentials");
                return null;
            },
        }),
    ],
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
