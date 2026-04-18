"use client";

import { useRef, useEffect } from "react";

export function useMousePosition() {
    const mousePosition = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const updateMousePosition = (e: MouseEvent) => {
            mousePosition.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener("mousemove", updateMousePosition);

        return () => {
            window.removeEventListener("mousemove", updateMousePosition);
        };
    }, []);

    return mousePosition;
}
