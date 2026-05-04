/**
 * lib/inbox/socket.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Socket.IO helper singleton for emitting inbox events.
 * Note: In Serverless environments this attaches to globalThis to persist.
 */

import { Server as IOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import { logger } from "@/lib/logger";

declare global {
  // eslint-disable-next-line no-var
  var __io__: IOServer | undefined;
}

let io: IOServer | undefined = (global as any).__io__;

export function initSocket(server?: HTTPServer) {
  try {
    if (io) return io;
    if (!server) {
      // running in environment without HTTP server (e.g., dev), create ephemeral in-memory server is not ideal
      logger.info("[Socket] No HTTP server provided; skipping init");
      return undefined;
    }

    io = new IOServer(server, {
      path: "/api/socket.io",
      cors: { origin: true },
    });

    (global as any).__io__ = io;

    io.on("connection", socket => {
      logger.info("[Socket] client connected", { id: socket.id });
      socket.on("joinCompany", (companyId: string) => {
        socket.join(`company:${companyId}`);
      });
      socket.on("leaveCompany", (companyId: string) => {
        socket.leave(`company:${companyId}`);
      });
    });

    logger.info("[Socket] Initialized");
    return io;
  } catch (error) {
    logger.error("[Socket] init error", { error: error instanceof Error ? error.message : String(error) });
    return undefined;
  }
}

export function emitSocketEvent(companyId: string, event: string, payload: any) {
  try {
    const inst = io || (global as any).__io__;
    if (!inst) {
      logger.debug("[Socket] No socket instance available to emit event", { companyId, event });
      return false;
    }

    inst.to(`company:${companyId}`).emit(event, payload);
    return true;
  } catch (error) {
    logger.error("[Socket] emit error", { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

export default initSocket;
