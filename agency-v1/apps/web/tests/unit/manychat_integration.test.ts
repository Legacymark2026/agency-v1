import { describe, test, expect, vi, beforeEach } from "vitest";
import { ManyChatService } from "@/lib/integrations/manychat";

describe("ManyChat Integration Unit Suite", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    // ─────────────────────────────────────────────────────────────
    // 1. Dynamic Response Builder Unit Tests
    // ─────────────────────────────────────────────────────────────
    describe("ManyChat Dynamic Block v2 Builder", () => {
        test("should generate valid ManyChat v2 text response", () => {
            const res = ManyChatService.buildDynamicResponse({
                text: "¡Hola! Gracias por contactarnos.",
            });

            expect(res.version).toBe("v2");
            expect(res.content.messages).toHaveLength(1);
            expect(res.content.messages[0]).toEqual({
                type: "text",
                text: "¡Hola! Gracias por contactarnos.",
                buttons: [],
            });
            expect(res.content.actions).toEqual([]);
            expect(res.content.quick_replies).toEqual([]);
        });

        test("should include actions, buttons and quick replies in ManyChat dynamic response", () => {
            const res = ManyChatService.buildDynamicResponse({
                text: "Tu consulta ha sido procesada con éxito.",
                buttons: [
                    { type: "url", caption: "Ver Catálogo", url: "https://agencia.com/servicios" },
                ],
                actions: [
                    { action: "set_field_value", field_name: "crm_lead_id", value: "lead_abc123" },
                    { action: "add_tag", tag_name: "cliente_calificado" },
                ],
                quickReplies: [
                    { type: "node", caption: "Hablar con asesor" },
                ],
            });

            expect(res.version).toBe("v2");
            expect(res.content.messages[0].type).toBe("text");
            expect((res.content.messages[0] as any).buttons).toHaveLength(1);
            expect((res.content.messages[0] as any).buttons[0].caption).toBe("Ver Catálogo");

            expect(res.content.actions).toHaveLength(2);
            expect(res.content.actions?.[0]).toEqual({
                action: "set_field_value",
                field_name: "crm_lead_id",
                value: "lead_abc123",
            });
            expect(res.content.actions?.[1]).toEqual({
                action: "add_tag",
                tag_name: "cliente_calificado",
            });

            expect(res.content.quick_replies).toHaveLength(1);
            expect(res.content.quick_replies?.[0].caption).toBe("Hablar con asesor");
        });
    });

    // ─────────────────────────────────────────────────────────────
    // 2. ManyChat API v2 Client Tests
    // ─────────────────────────────────────────────────────────────
    describe("ManyChat API Client", () => {
        test("should throw or return error if apiToken is missing when performing HTTP calls", async () => {
            delete process.env.MANYCHAT_API_TOKEN;
            const client = new ManyChatService();

            const result = await client.pauseBot(123456);
            expect(result.status).toBe("error");
            expect(result.error).toContain("ManyChat API Token is missing");
        });

        test("should call pauseBot endpoint with subscriber_id and bearer token", async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ status: "success", data: { paused: true } }),
            });
            globalThis.fetch = mockFetch;

            const client = new ManyChatService("test_token_123");
            const result = await client.pauseBot(987654);

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [url, options] = mockFetch.mock.calls[0];

            expect(url).toBe("https://api.manychat.com/fb/subscriber/pauseBot");
            expect(options.method).toBe("POST");
            expect(options.headers["Authorization"]).toBe("Bearer test_token_123");
            expect(JSON.parse(options.body)).toEqual({ subscriber_id: 987654 });
            expect(result.status).toBe("success");
        });

        test("should call resumeBot endpoint correctly", async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ status: "success" }),
            });
            globalThis.fetch = mockFetch;

            const client = new ManyChatService("test_token_123");
            const result = await client.resumeBot("subscriber_abc");

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [url, options] = mockFetch.mock.calls[0];
            expect(url).toBe("https://api.manychat.com/fb/subscriber/resumeBot");
            expect(JSON.parse(options.body)).toEqual({ subscriber_id: "subscriber_abc" });
            expect(result.status).toBe("success");
        });

        test("should call setCustomFieldByName with field_name and field_value", async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ status: "success" }),
            });
            globalThis.fetch = mockFetch;

            const client = new ManyChatService("test_token_123");
            const result = await client.setCustomField("user_100", "deal_stage", "proposal_sent");

            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [url, options] = mockFetch.mock.calls[0];
            expect(url).toBe("https://api.manychat.com/fb/subscriber/setCustomFieldByName");
            expect(JSON.parse(options.body)).toEqual({
                subscriber_id: "user_100",
                field_name: "deal_stage",
                field_value: "proposal_sent",
            });
            expect(result.status).toBe("success");
        });

        test("should call addTagByName and removeTagByName correctly", async () => {
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ status: "success" }),
            });
            globalThis.fetch = mockFetch;

            const client = new ManyChatService("test_token_123");

            // Add tag
            await client.addTag(112233, "vip_customer");
            expect(mockFetch).toHaveBeenLastCalledWith(
                "https://api.manychat.com/fb/subscriber/addTagByName",
                expect.objectContaining({
                    body: JSON.stringify({ subscriber_id: 112233, tag_name: "vip_customer" }),
                })
            );

            // Remove tag
            await client.removeTag(112233, "prospecto_frio");
            expect(mockFetch).toHaveBeenLastCalledWith(
                "https://api.manychat.com/fb/subscriber/removeTagByName",
                expect.objectContaining({
                    body: JSON.stringify({ subscriber_id: 112233, tag_name: "prospecto_frio" }),
                })
            );
        });
    });
});
