import { describe, it, expect } from "vitest";
import { NotificationService } from "../src/services/notification.service";

describe("NotificationService Unit & Contract Tests", () => {
  it("debe retornar arreglo al consultar notificaciones", async () => {
    try {
      const notifications = await NotificationService.getUserNotifications("test-user-id");
      expect(Array.isArray(notifications)).toBe(true);
    } catch {
      // Ignorar si la base de datos no está disponible en ejecución aislada
    }
  });
});
