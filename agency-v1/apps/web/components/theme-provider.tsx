'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = 'theme'
}: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(defaultTheme);
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
    const [mounted, setMounted] = useState(false);

    // Initialize theme from localStorage
    useEffect(() => {
        const stored = localStorage.getItem(storageKey) as Theme | null;
        if (stored) {
            setThemeState(stored);
        }
        setMounted(true);
    }, [storageKey]);

    // Resolve system theme and apply to document
    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = (resolved: 'light' | 'dark') => {
            root.classList.remove('light', 'dark');
            root.classList.add(resolved);
            setResolvedTheme(resolved);
        };

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(mediaQuery.matches ? 'dark' : 'light');

            const listener = (e: MediaQueryListEvent) => {
                applyTheme(e.matches ? 'dark' : 'light');
            };

            mediaQuery.addEventListener('change', listener);
            return () => mediaQuery.removeEventListener('change', listener);
        } else {
            applyTheme(theme);
        }
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        localStorage.setItem(storageKey, newTheme);
        setThemeState(newTheme);
    };

    // Prevent flash of wrong theme
    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// ==================== THEME TOGGLE BUTTON ====================

interface ThemeToggleProps {
    className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();

    const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
        { value: 'light', icon: <Sun className="h-4 w-4" />, label: 'Claro' },
        { value: 'dark', icon: <Moon className="h-4 w-4" />, label: 'Oscuro' },
        { value: 'system', icon: <Monitor className="h-4 w-4" />, label: 'Sistema' },
    ];

    return (
        <div className={`flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={`
                        flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all
                        ${theme === option.value
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }
                    `}
                    title={option.label}
                >
                    {option.icon}
                    <span className="sr-only sm:not-sr-only">{option.label}</span>
                </button>
            ))}
        </div>
    );
}

// ==================== SIMPLE TOGGLE BUTTON ====================

export function ThemeToggleSimple({ className = '' }: ThemeToggleProps) {
    const { resolvedTheme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className={`
                p-2 rounded-lg transition-all
                bg-gray-100 dark:bg-gray-800 
                text-gray-600 dark:text-gray-300
                hover:bg-gray-200 dark:hover:bg-gray-700
                ${className}
            `}
            title={resolvedTheme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
        >
            {resolvedTheme === 'light' ? (
                <Moon className="h-5 w-5" />
            ) : (
                <Sun className="h-5 w-5" />
            )}
        </button>
    );
}
