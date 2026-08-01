import { Request, Response, NextFunction } from "express";
export declare class MarketingController {
    /**
     * GET /api/v1/email-blast
     */
    static getEmailBlasts(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/email-blast
     */
    static createEmailBlast(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/v1/email-blast/:id
     */
    static getEmailBlast(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * DELETE /api/v1/email-blast/:id
     */
    static deleteEmailBlast(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/email-blast/bulk-delete
     */
    static bulkDeleteEmailBlasts(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/email-blast/:id/clone
     */
    static cloneEmailBlast(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/email-blast/:id/send
     */
    static sendEmailBlast(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/v1/email-blast/dns-check
     */
    static checkDns(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/email-blast/spam-check
     */
    static analyzeSpam(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/email-blast/ai-generate
     */
    static aiGenerateSubjects(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/v1/email-blast/suppression-list
     */
    static getSuppressionList(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/email-blast/suppression-list
     */
    static addToSuppression(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * DELETE /api/v1/email-blast/suppression-list
     */
    static removeFromSuppression(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/email-blast/timezone-schedule
     */
    static timezoneSchedule(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/email-blast/rss-generate
     */
    static rssGenerate(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/email-blast/ab-evaluate
     */
    static evaluateAbTest(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/v1/email-blast/:id/heatmap
     */
    static getHeatmap(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/email-blast/client-matrix
     */
    static checkClientMatrix(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/v1/email-blast/components/presets
     * Catálogo de componentes pre-diseñados y reutilizables
     */
    static getPresets(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/email-blast/compile-preview
     * Compilar bloques e interpolar variables dinámicas para vista previa en tiempo real
     */
    static compilePreview(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/email-blast/compile
     * Compilar bloques JSON a HTML responsive en tiempo real
     */
    static compileBlocks(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * GET /api/v1/email-blast/images
     */
    static getImages(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/v1/email-blast/images/upload
     */
    static uploadImage(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
