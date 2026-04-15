"use client";

/**
 * hooks/use-exit-intent.ts
 * ─────────────────────────────────────────────────────────────
 * Algoritmo predictivo de Exit Intent usando cinemática del cursor.
 * 
 * A diferencia del clásico "onMouseLeave", este hook calcula la 
 * velocidad Y del mouse para predecir si el usuario lleva trayectoria 
 * decidida hacia el botón de "Cerrar Tab" o la barra de direcciones, 
 * disparando la retención antes de que el ratón salga de la página.
 */

import { useEffect, useState, useRef } from "react";

interface Vector2D {
  x: number;
  y: number;
  time: number;
}

interface ExitIntentOptions {
  thresholdVelocityY?: number; // Pixels per millisecond upwards (negative Y in DOM)
  sensitivityZone?: number; // Distance from top of viewport in pixels
  cooldownMs?: number; // Only trigger once every X ms to prevent spam
}

export function useExitIntent(options: ExitIntentOptions = {}) {
  const {
    thresholdVelocityY = -2.5, // Fuerte movimiento hacia arriba
    sensitivityZone = 100, // Top 100px of screen
    cooldownMs = 60000 // 1 minute default cooldown
  } = options;

  const [hasTriggered, setHasTriggered] = useState(false);
  const positionQueue = useRef<Vector2D[]>([]);
  const lastTriggeredAt = useRef<number>(0);

  useEffect(() => {
    // Only run on desktop where precision cursor movement exists
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const currentPos: Vector2D = { x: e.clientX, y: e.clientY, time: now };
      
      // Keep only last 100ms of history for accurate instantaneous velocity
      positionQueue.current.push(currentPos);
      positionQueue.current = positionQueue.current.filter(p => now - p.time < 100);

      // Need at least 2 points to calculate velocity
      if (positionQueue.current.length < 2) return;

      const oldest = positionQueue.current[0];
      const timeDelta = now - oldest.time;
      
      if (timeDelta === 0) return;

      const velocityY = (currentPos.y - oldest.y) / timeDelta;

      // Check algorithmic conditions:
      // 1. Cursor is moving strongly UPWARDS (negative Y velocity > threshold)
      // 2. Cursor is currently in the upper sensitivity zone
      // 3. Cooldown has passed
      if (
        velocityY <= thresholdVelocityY && 
        currentPos.y <= sensitivityZone &&
        now - lastTriggeredAt.current > cooldownMs
      ) {
        lastTriggeredAt.current = now;
        setHasTriggered(true);
      }
    };

    // Fallback estándar por si el usuario saca el cursor lenta pero deliberadamente
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        const now = Date.now();
        if (now - lastTriggeredAt.current > cooldownMs) {
          lastTriggeredAt.current = now;
          setHasTriggered(true);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [thresholdVelocityY, sensitivityZone, cooldownMs]);

  // Permite a la UI resetear el estado después de mostrar el modal
  const resetExitIntent = () => setHasTriggered(false);

  return { isExiting: hasTriggered, resetExitIntent };
}
