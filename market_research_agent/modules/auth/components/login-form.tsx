/**
 * Login Form Component
 * Professional login form with validation and error handling
 */

'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { loginSchema, type LoginFormData } from '../lib/validations';
import { Loader2, AlertCircle } from 'lucide-react';

interface LoginFormProps {
    callbackUrl?: string;
    onSuccess?: () => void;
    showRegisterLink?: boolean;
}

export function LoginForm({
    callbackUrl = '/dashboard',
    onSuccess,
    showRegisterLink = true,
}: LoginFormProps) {
    const router = useRouter();
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            remember: false,
        },
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            setIsLoading(true);
            setError('');

            const result = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                setError('Invalid email or password');
                return;
            }

            if (result?.ok) {
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.push(callbackUrl);
                    router.refresh();
                }
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground">
                    Enter your credentials to access your account
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        {...register('email')}
                        disabled={isLoading}
                    />
                    {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <a
                            href="/auth/forgot-password"
                            className="text-sm text-primary hover:underline"
                        >
                            Forgot password?
                        </a>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...register('password')}
                        disabled={isLoading}
                    />
                    {errors.password && (
                        <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox id="remember" {...register('remember')} />
                    <label
                        htmlFor="remember"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        Remember me
                    </label>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in
                </Button>
            </form>

            {showRegisterLink && (
                <p className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{' '}
                    <a href="/auth/register" className="text-primary hover:underline font-medium">
                        Sign up
                    </a>
                </p>
            )}
        </div>
    );
}
