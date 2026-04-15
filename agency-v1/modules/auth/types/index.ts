/**
 * Auth Module - Type Definitions
 * Centralized authentication types for the application
 */

/**
 * User roles
 */
export type UserRole = 'admin' | 'manager' | 'sales' | 'marketing' | 'guest';

/**
 * Authenticated user data
 */
export interface AuthUser {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
    image?: string | null;
    firstName?: string | null;
    lastName?: string | null;
}

/**
 * Authentication session
 */
export interface AuthSession {
    user: AuthUser;
    expires: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
    email: string;
    password: string;
    remember?: boolean;
}

/**
 * Registration data
 */
export interface RegisterData {
    email: string;
    password: string;
    confirmPassword: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    acceptTerms: boolean;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
    email: string;
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirm {
    token: string;
    password: string;
    confirmPassword: string;
}

/**
 * Authentication error codes
 */
export type AuthError =
    | 'CredentialsSignin'
    | 'EmailNotVerified'
    | 'AccountNotFound'
    | 'InvalidCredentials'
    | 'EmailAlreadyExists'
    | 'WeakPassword'
    | 'InvalidToken'
    | 'TokenExpired'
    | 'TooManyAttempts'
    | 'UnknownError';

/**
 * Authentication state
 */
export interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: AuthError | null;
}

/**
 * OAuth provider types
 */
export type OAuthProvider = 'google' | 'github' | 'facebook';

/**
 * Password strength level
 */
export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong';
