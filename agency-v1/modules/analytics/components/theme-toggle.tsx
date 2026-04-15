'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check initial theme
        const timer = setTimeout(() => {
            const savedTheme = localStorage.getItem('analytics-theme');
            if (savedTheme === 'dark') {
                setIsDark(true);
                document.documentElement.classList.add('dark');
            }
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    const toggleTheme = () => {
        const newDark = !isDark;
        setIsDark(newDark);

        if (newDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('analytics-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('analytics-theme', 'light');
        }
    };

    return (
        <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isDark ? 'bg-slate-700' : 'bg-gray-200'
                }`}
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
            <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${isDark ? 'translate-x-7' : 'translate-x-0.5'
                    }`}
            >
                {isDark ? (
                    <Moon className="h-3.5 w-3.5 text-slate-700" />
                ) : (
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                )}
            </div>
        </button>
    );
}
