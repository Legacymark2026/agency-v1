'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { toggleCommentLike, getCommentLikeStatus } from '@/actions/blog';

interface CommentLikeButtonProps {
    commentId: string;
    initialCount?: number;
    initialLiked?: boolean;
}

export function CommentLikeButton({ commentId, initialCount = 0, initialLiked = false }: CommentLikeButtonProps) {
    const [count, setCount] = useState(initialCount);
    const [isLiked, setIsLiked] = useState(initialLiked);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setCount(initialCount);
        setIsLiked(initialLiked);
    }, [initialCount, initialLiked]);

    const handleLike = async () => {
        if (isLoading) return;
        
        setIsLoading(true);
        
        // Optimistic update
        const previousCount = count;
        const previousLiked = isLiked;
        
        setCount(prev => isLiked ? prev - 1 : prev + 1);
        setIsLiked(!isLiked);

        try {
            const result = await toggleCommentLike(commentId);
            
            if (!result.success) {
                // Revert on error
                setCount(previousCount);
                setIsLiked(previousLiked);
            }
        } catch {
            // Revert on error
            setCount(previousCount);
            setIsLiked(previousLiked);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleLike}
            disabled={isLoading}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
                isLiked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-gray-500 hover:text-red-500'
            } ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
            aria-label={isLiked ? 'Quitar me gusta' : 'Dar me gusta'}
        >
            <Heart 
                className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`}
            />
            <span>{count}</span>
        </button>
    );
}
