/**
 * Auth Module - Validation Schemas
 * Zod schemas for authentication forms and data validation
 */

import { z } from 'zod';

/**
 * Password validation regex
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

/**
 * Login credentials schema
 */
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address'),
    password: z
        .string()
        .min(1, 'Password is required'),
    remember: z.boolean(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration schema
 */
export const registerSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            passwordRegex,
            'Password must contain uppercase, lowercase, and numbers'
        ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    name: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    acceptTerms: z
        .boolean()
        .refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address'),
});

export type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password reset confirmation schema
 */
export const passwordResetConfirmSchema = z.object({
    token: z.string().min(1, 'Token is required'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
            passwordRegex,
            'Password must contain uppercase, lowercase, and numbers'
        ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

export type PasswordResetConfirmData = z.infer<typeof passwordResetConfirmSchema>;

/**
 * Profile update schema
 */
export const profileUpdateSchema = z.object({
    name: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    image: z.string().url().optional(),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

/**
 * Email validation
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Password strength checker
 */
export function checkPasswordStrength(password: string): {
    strength: 'weak' | 'medium' | 'strong' | 'very-strong';
    score: number;
    feedback: string[];
} {
    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');

    if (password.length >= 12) score += 1;

    // Complexity checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Add numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
    if (score < 3) strength = 'weak';
    else if (score < 5) strength = 'medium';
    else if (score < 6) strength = 'strong';
    else strength = 'very-strong';

    return { strength, score, feedback };
}
