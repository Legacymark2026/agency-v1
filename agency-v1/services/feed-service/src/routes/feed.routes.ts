/**
 * Enterprise Feed REST Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * HTTP Inbound adapter for posts, feed aggregation, comments, and reactions.
 */
import { Router, Request, Response } from "express";
import { IFeedUseCases } from "../core/ports/feed.ports";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  mediaUrls: z.array(z.string()).optional(),
  audienceScope: z.enum(["COMPANY_WIDE", "DEPARTMENT", "CONFIDENTIAL_MANAGEMENT"]).default("COMPANY_WIDE"),
  departmentId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPinned: z.boolean().optional()
});

const addCommentSchema = z.object({
  content: z.string().min(1),
  parentId: z.string().optional()
});

const reactionSchema = z.object({
  type: z.enum(["LIKE", "LOVE", "CELEBRATE", "INSIGHTFUL", "CURIOUS"])
});

export function createFeedRouter(feedUseCases: IFeedUseCases): Router {
  const router = Router();

  const getContext = (req: Request) => {
    const companyId = (req.headers["x-company-id"] as string) || (req.query.companyId as string);
    const userId = (req.headers["x-user-id"] as string) || (req.query.userId as string);
    const userName = (req.headers["x-user-name"] as string) || "Employee";
    const userRole = (req.headers["x-user-role"] as string) || "MEMBER";
    const departmentId = (req.headers["x-department-id"] as string) || (req.query.departmentId as string);

    if (!companyId) throw new Error("Missing x-company-id header");
    if (!userId) throw new Error("Missing x-user-id header");

    return { companyId, userId, userName, userRole, departmentId };
  };

  // Get company feed
  router.get("/posts", async (req: Request, res: Response) => {
    try {
      const ctx = getContext(req);
      const limit = parseInt(req.query.limit as string) || 20;
      const beforeCursor = req.query.before as string | undefined;

      const posts = await feedUseCases.getCompanyFeed({
        companyId: ctx.companyId,
        userId: ctx.userId,
        departmentId: ctx.departmentId,
        userRoles: [ctx.userRole],
        limit,
        beforeCursor
      });

      res.json({ success: true, data: posts, count: posts.length });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Create post
  router.post("/posts", async (req: Request, res: Response) => {
    try {
      const ctx = getContext(req);
      const parsed = createPostSchema.parse(req.body);

      const post = await feedUseCases.createPost({
        companyId: ctx.companyId,
        authorId: ctx.userId,
        authorName: ctx.userName,
        title: parsed.title,
        content: parsed.content,
        mediaUrls: parsed.mediaUrls,
        audienceScope: parsed.audienceScope,
        departmentId: parsed.departmentId,
        tags: parsed.tags,
        isPinned: parsed.isPinned
      });

      res.status(201).json({ success: true, data: post });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Get post by ID
  router.get("/posts/:id", async (req: Request, res: Response) => {
    try {
      const ctx = getContext(req);
      const post = await feedUseCases.getPostById(ctx.companyId, req.params.id);
      res.json({ success: true, data: post });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // Add comment
  router.post("/posts/:id/comments", async (req: Request, res: Response) => {
    try {
      const ctx = getContext(req);
      const parsed = addCommentSchema.parse(req.body);

      const comment = await feedUseCases.addComment({
        companyId: ctx.companyId,
        postId: req.params.id,
        authorId: ctx.userId,
        authorName: ctx.userName,
        content: parsed.content,
        parentId: parsed.parentId
      });

      res.status(201).json({ success: true, data: comment });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Get comments
  router.get("/posts/:id/comments", async (req: Request, res: Response) => {
    try {
      const ctx = getContext(req);
      const comments = await feedUseCases.getPostComments(ctx.companyId, req.params.id);
      res.json({ success: true, data: comments });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Toggle reaction
  router.post("/posts/:id/reactions", async (req: Request, res: Response) => {
    try {
      const ctx = getContext(req);
      const parsed = reactionSchema.parse(req.body);

      const result = await feedUseCases.toggleReaction({
        companyId: ctx.companyId,
        postId: req.params.id,
        userId: ctx.userId,
        type: parsed.type
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Delete post
  router.delete("/posts/:id", async (req: Request, res: Response) => {
    try {
      const ctx = getContext(req);
      const isAdmin = ctx.userRole === "ADMIN" || ctx.userRole === "SUPERADMIN";

      await feedUseCases.deletePost(ctx.companyId, req.params.id, ctx.userId, isAdmin);
      res.json({ success: true, message: "Post deleted successfully" });
    } catch (err: any) {
      res.status(403).json({ success: false, error: err.message });
    }
  });

  return router;
}
