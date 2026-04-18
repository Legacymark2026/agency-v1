'use client';

import { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export function FullscreenButton() {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
            {isFullscreen ? (
                <Minimize2 className="h-4 w-4 text-gray-600" />
            ) : (
                <Maximize2 className="h-4 w-4 text-gray-600" />
            )}
        </button>
    );
}
