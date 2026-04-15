'use client';

import { useState, useEffect } from 'react';
import { Heart, Eye, MessageCircle, Bookmark, BookmarkCheck, Share2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    recordPostView,
    getPostViewCount,
    togglePostLike,
    getPostLikeStatus
} from '@/actions/blog';

// ==================== SESSION ID HOOK ====================

function useSessionId() {
    const [sessionId, setSessionId] = useState<string>('');

    useEffect(() => {
        let id = localStorage.getItem('blog_session_id');
        if (!id) {
            id = Math.random().toString(36).substring(2) + Date.now().toString(36);
            localStorage.setItem('blog_session_id', id);
        }
        const timer = setTimeout(() => setSessionId(id || ''), 0);
        return () => clearTimeout(timer);
    }, []);

    return sessionId;
}

// ==================== VIEW COUNTER ====================

interface ViewCounterProps {
    postId: string;
    initialCount?: number;
}

export function ViewCounter({ postId, initialCount = 0 }: ViewCounterProps) {
    const [count, setCount] = useState(initialCount);
    const [tracked, setTracked] = useState(false);

    useEffect(() => {
        // Record view once
        if (!tracked) {
            recordPostView(postId);
            const timer = setTimeout(() => setTracked(true), 0);
            // Get updated count
            getPostViewCount(postId).then(setCount);
            return () => clearTimeout(timer);
        } else {
            getPostViewCount(postId).then(setCount);
        }
    }, [postId, tracked]);

    const formatCount = (n: number) => {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toString();
    };

    return (
        <div className="flex items-center gap-1.5 text-gray-500">
            <Eye className="h-4 w-4" />
            <span className="text-sm font-medium">{formatCount(count)} vistas</span>
        </div>
    );
}

// ==================== LIKE BUTTON ====================

interface LikeButtonProps {
    postId: string;
    initialCount?: number;
    initialLiked?: boolean;
}

export function LikeButton({ postId, initialCount = 0, initialLiked = false }: LikeButtonProps) {
    const sessionId = useSessionId();
    const [count, setCount] = useState(initialCount);
    const [isLiked, setIsLiked] = useState(initialLiked);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (sessionId) {
            getPostLikeStatus(postId, sessionId).then(({ count, isLiked }) => {
                setCount(count);
                setIsLiked(isLiked);
            });
        }
    }, [postId, sessionId]);

    const handleLike = async () => {
        if (!sessionId || isLoading) return;

        setIsLoading(true);
        setIsAnimating(true);

        const result = await togglePostLike(postId, sessionId);

        if (result.success) {
            setIsLiked(result.liked);
            setCount(prev => result.liked ? prev + 1 : prev - 1);
        }

        setIsLoading(false);
        setTimeout(() => setIsAnimating(false), 300);
    };

    return (
        <button
            onClick={handleLike}
            disabled={isLoading || !sessionId}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
                ${isLiked
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
                ${isAnimating ? 'scale-110' : 'scale-100'}
            `}
            aria-label={isLiked ? 'Quitar me gusta' : 'Me gusta'}
        >
            <Heart
                className={`h-5 w-5 transition-all duration-300 ${isLiked ? 'fill-red-500 text-red-500' : ''} ${isAnimating ? 'scale-125' : ''}`}
            />
            <span className="font-medium">{count}</span>
        </button>
    );
}

// ==================== BOOKMARK BUTTON ====================

interface BookmarkButtonProps {
    postSlug: string;
}

export function BookmarkButton({ postSlug }: BookmarkButtonProps) {
    const [isSaved, setIsSaved] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const readingList = JSON.parse(localStorage.getItem('reading_list') || '[]');
        const timer = setTimeout(() => setIsSaved(readingList.includes(postSlug)), 0);
        return () => clearTimeout(timer);
    }, [postSlug]);

    const toggleBookmark = () => {
        setIsAnimating(true);
        const readingList = JSON.parse(localStorage.getItem('reading_list') || '[]');

        if (isSaved) {
            const newList = readingList.filter((slug: string) => slug !== postSlug);
            localStorage.setItem('reading_list', JSON.stringify(newList));
            setIsSaved(false);
        } else {
            readingList.push(postSlug);
            localStorage.setItem('reading_list', JSON.stringify(readingList));
            setIsSaved(true);
        }

        setTimeout(() => setIsAnimating(false), 300);
    };

    const Icon = isSaved ? BookmarkCheck : Bookmark;

    return (
        <button
            onClick={toggleBookmark}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
                ${isSaved
                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
                ${isAnimating ? 'scale-110' : 'scale-100'}
            `}
            aria-label={isSaved ? 'Quitar de lista de lectura' : 'Guardar para después'}
        >
            <Icon className={`h-5 w-5 transition-transform duration-300 ${isAnimating ? 'scale-125' : ''}`} />
            <span className="font-medium hidden sm:inline">
                {isSaved ? 'Guardado' : 'Guardar'}
            </span>
        </button>
    );
}

// ==================== TEXT TO SPEECH ====================

interface TextToSpeechProps {
    content: string;
    title: string;
}

export function TextToSpeech({ content, title }: TextToSpeechProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);
    const [isSupported, setIsSupported] = useState(false);

    // Check for browser support after mount to avoid hydration mismatch
    useEffect(() => {
        const timer = setTimeout(() => setIsSupported('speechSynthesis' in window), 0);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isSupported) return;

        // Clean text from HTML tags
        const cleanText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const fullText = `${title}. ${cleanText}`;

        const speech = new SpeechSynthesisUtterance(fullText);
        speech.lang = 'es-ES';
        speech.rate = 1;
        speech.pitch = 1;

        speech.onend = () => {
            setIsPlaying(false);
            setIsPaused(false);
        };

        const timer = setTimeout(() => setUtterance(speech), 0);

        return () => {
            clearTimeout(timer);
            window.speechSynthesis.cancel();
        };
    }, [content, title, isSupported]);

    const togglePlay = () => {
        if (!utterance) return;

        if (isPlaying && !isPaused) {
            window.speechSynthesis.pause();
            setIsPaused(true);
        } else if (isPaused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        } else {
            window.speechSynthesis.speak(utterance);
            setIsPlaying(true);
        }
    };

    const stop = () => {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        setIsPaused(false);
    };

    // Don't render until we've checked browser support (prevents hydration mismatch)
    if (!isSupported) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={togglePlay}
                className={`
                    flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
                    ${isPlaying
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                `}
                aria-label={isPlaying ? (isPaused ? 'Continuar' : 'Pausar') : 'Escuchar artículo'}
            >
                {isPlaying ? (
                    isPaused ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />
                ) : (
                    <Volume2 className="h-5 w-5" />
                )}
                <span className="font-medium hidden sm:inline">
                    {isPlaying ? (isPaused ? 'Continuar' : 'Pausar') : 'Escuchar'}
                </span>
            </button>
            {isPlaying && (
                <button
                    onClick={stop}
                    className="px-3 py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm"
                >
                    Detener
                </button>
            )}
        </div>
    );
}

// ==================== ENGAGEMENT BAR ====================

interface EngagementBarProps {
    postId: string;
    postSlug: string;
    postTitle: string;
    content: string;
}

export function EngagementBar({ postId, postSlug, postTitle, content }: EngagementBarProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <ViewCounter postId={postId} />
            <LikeButton postId={postId} />
            <BookmarkButton postSlug={postSlug} />
            <TextToSpeech content={content} title={postTitle} />
        </div>
    );
}
