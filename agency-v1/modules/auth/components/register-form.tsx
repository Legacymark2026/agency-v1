/**
 * Register Form Component
 * Professional registration form with password strength indicator
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { registerSchema, type RegisterFormData, checkPasswordStrength } from '../lib/validations';
import { Loader2, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegisterFormProps {
    callbackUrl?: string;
    onSuccess?: () => void;
    showLoginLink?: boolean;
}

export function RegisterForm({
    callbackUrl = '/dashboard',
    onSuccess,
    showLoginLink = true,
}: RegisterFormProps) {
    const router = useRouter();
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [password, setPassword] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            acceptTerms: false,
        },
    });

    const watchPassword = watch('password', '');
    const passwordStrength = watchPassword ? checkPasswordStrength(watchPassword) : null;

    const onSubmit = async (data: RegisterFormData) => {
        try {
            setIsLoading(true);
            setError('');

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                    name: data.name,
                    firstName: data.firstName,
                    lastName: data.lastName,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Registration failed');
                return;
            }

            if (onSuccess) {
                onSuccess();
            } else {
                // Auto sign in after registration
                router.push('/auth/login?registered=true');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getStrengthColor = () => {
        if (!passwordStrength) return 'bg-gray-200';
        switch (passwordStrength.strength) {
            case 'weak': return 'bg-red-500';
            case 'medium': return 'bg-yellow-500';
            case 'strong': return 'bg-blue-500';
            case 'very-strong': return 'bg-green-500';
            default: return 'bg-gray-200';
        }
    };

    const getStrengthText = () => {
        if (!passwordStrength) return '';
        return passwordStrength.strength.replace('-', ' ').toUpperCase();
    };

    return (
        <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold">Create an account</h1>
                <p className="text-muted-foreground">
                    Enter your information to get started
                </p></div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            id="firstName"
                            placeholder="John"
                            {...register('firstName')}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            placeholder="Doe"
                            {...register('lastName')}
                            disabled={isLoading}
                        />
                    </div>
                </div>

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
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        {...register('password')}
                        disabled={isLoading}
                    />
                    {watchPassword && passwordStrength && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span>Password strength:</span>
                                <span className={cn(
                                    "font-medium",
                                    passwordStrength.strength === 'weak' && "text-red-500",
                                    passwordStrength.strength === 'medium' && "text-yellow-500",
                                    passwordStrength.strength === 'strong' && "text-blue-500",
                                    passwordStrength.strength === 'very-strong' && "text-green-500"
                                )}>
                                    {getStrengthText()}
                                </span>
                            </div>
                            <Progress
                                value={(passwordStrength.score / 6) * 100}
                                className={cn("h-2", getStrengthColor())}
                            />
                            {passwordStrength.feedback.length > 0 && (
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    {passwordStrength.feedback.map((item, i) => (
                                        <li key={i}>• {item}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                    {errors.password && (
                        <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        {...register('confirmPassword')}
                        disabled={isLoading}
                    />
                    {errors.confirmPassword && (
                        <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                    )}
                </div>

                <div className="flex items-start space-x-2">
                    <Checkbox id="acceptTerms" {...register('acceptTerms')} />
                    <label
                        htmlFor="acceptTerms"
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        I agree to the{' '}
                        <a href="/terms" className="text-primary hover:underline">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-primary hover:underline">
                            Privacy Policy
                        </a>
                    </label>
                </div>
                {errors.acceptTerms && (
                    <p className="text-sm text-destructive">{errors.acceptTerms.message}</p>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create account
                </Button>
            </form>

            {showLoginLink && (
                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <a href="/auth/login" className="text-primary hover:underline font-medium">
                        Sign in
                    </a>
                </p>
            )}
        </div>
    );
}
