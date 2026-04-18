import { useState, useEffect } from "react";

export function useGlitchText(messages: string[], changeInterval = 4000) {
    const [glitchText, setGlitchText] = useState(messages[0]);
    const [glitchIndex, setGlitchIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (glitchIndex + 1) % messages.length;
            setGlitchIndex(nextIndex);

            let steps = 0;
            const glitchInterval = setInterval(() => {
                setGlitchText(prev =>
                    prev.split('').map(() => String.fromCharCode(65 + Math.random() * 26)).join('')
                );
                steps++;
                if (steps > 5) {
                    clearInterval(glitchInterval);
                    setGlitchText(messages[nextIndex]);
                }
            }, 50);

        }, changeInterval);
        return () => clearInterval(interval);
    }, [glitchIndex, messages, changeInterval]);

    return glitchText;
}
