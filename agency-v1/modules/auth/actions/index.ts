/**
 * Auth Module - Server Actions
 */

'use server';

import { signIn, signOut } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { registerSchema, type RegisterFormData } from '../lib/validations';

/**
 * Register a new user
 */
export async function registerUser(data: RegisterFormData) {
    try {
        // Validate data
        const validData = registerSchema.parse(data);

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validData.email },
        });

        if (existingUser) {
            return {
                success: false,
                error: 'Email already registered',
            };
        }

        // Hash password
        const hashedPassword = await hash(validData.password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: validData.email,
                passwordHash: hashedPassword,
                name: validData.name,
                firstName: validData.firstName,
                lastName: validData.lastName,
                role: 'guest', // Default role
            },
        });

        return {
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            error: 'Registration failed. Please try again.',
        };
    }
}

/**
 * Placeholder for actions - these use NextAuth directly
 */
export async function loginAction(email: string, password: string) {
    // This is handled by NextAuth signIn
    // Just a placeholder for module completeness
    return { success: true };
}

export async function logoutAction() {
    // This is handled by NextAuth signOut
    await signOut();
    return { success: true };
}
