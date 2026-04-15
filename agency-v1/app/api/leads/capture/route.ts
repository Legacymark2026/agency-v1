import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectLeadSource, calculateLeadScore, type UTMParams } from "@/lib/lead-source-detector";
import { scoreLeadAndDispatch } from "@/lib/services/ml/lead-scorer";

/**
 * Public Lead Capture API
 * 
 * POST /api/leads/capture
 * 
 * This endpoint is designed to be called from:
 * - Landing pages
 * - External forms
 * - Webhooks (Facebook Lead Ads, etc.)
 * - Contact forms
 * 
 * It automatically detects the lead source from UTM parameters and referer.
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.email) {
            return NextResponse.json(
                { success: false, error: "Email is required" },
                { status: 400 }
            );
        }

        if (!body.companyId) {
            return NextResponse.json(
                { success: false, error: "Company ID is required" },
                { status: 400 }
            );
        }

        // Extract headers for tracking
        const referer = request.headers.get('referer') || body.referer;
        const userAgent = request.headers.get('user-agent') || body.userAgent;
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ipAddress = forwardedFor?.split(',')[0] || body.ipAddress || 'unknown';

        // Build UTM params from body
        const utmParams: UTMParams = {
            utm_source: body.utm_source || body.utmSource,
            utm_medium: body.utm_medium || body.utmMedium,
            utm_campaign: body.utm_campaign || body.utmCampaign,
            utm_term: body.utm_term || body.utmTerm,
            utm_content: body.utm_content || body.utmContent,
        };

        // Detect lead source
        const sourceResult = detectLeadSource(utmParams, referer);

        // Try to match campaign by code or utm_campaign
        let campaignId: string | undefined;
        const campaignCode = body.campaignCode || body.campaign_code || utmParams.utm_campaign;

        if (campaignCode) {
            const campaign = await prisma.campaign.findFirst({
                where: {
                    OR: [
                        { code: campaignCode },
                        { code: { contains: campaignCode, mode: 'insensitive' } }
                    ],
                    companyId: body.companyId
                }
            });

            if (campaign) {
                campaignId = campaign.id;
                // Increment campaign conversions
                await prisma.campaign.update({
                    where: { id: campaign.id },
                    data: { conversions: { increment: 1 } }
                });
            }
        }

        // Calculate lead score
        const score = calculateLeadScore({
            email: body.email,
            name: body.name,
            phone: body.phone,
            company: body.company,
            jobTitle: body.jobTitle || body.job_title,
            source: sourceResult.source,
        });

        // Create the lead
        const lead = await prisma.lead.create({
            data: {
                // Contact info
                email: body.email,
                name: body.name,
                phone: body.phone,
                company: body.company,
                jobTitle: body.jobTitle || body.job_title,
                message: body.message,

                // Source tracking
                source: sourceResult.source,
                medium: sourceResult.medium,
                utmSource: sourceResult.utmSource || utmParams.utm_source,
                utmMedium: sourceResult.utmMedium || utmParams.utm_medium,
                utmCampaign: sourceResult.utmCampaign || utmParams.utm_campaign,
                utmTerm: sourceResult.utmTerm || utmParams.utm_term,
                utmContent: sourceResult.utmContent || utmParams.utm_content,
                referer,
                landingPage: body.landingPage || body.landing_page,

                // Campaign attribution
                campaignId,

                // Metadata
                ipAddress,
                userAgent,
                formId: body.formId || body.form_id,
                formData: body.customFields || body.custom_fields,
                tags: body.tags || [],
                score,

                // Company
                companyId: body.companyId,
            },
            include: {
                campaign: {
                    select: { id: true, name: true, code: true }
                }
            }
        });

        // Trigger ML Predictive Scoring (Async)
        scoreLeadAndDispatch(lead.id).catch(e => console.error("ML Scoring Error:", e));

        return NextResponse.json({
            success: true,
            data: {
                id: lead.id,
                source: lead.source,
                score: lead.score,
                campaign: lead.campaign?.name || null,
            }
        });

    } catch (error: any) {
        console.error("Lead capture error:", error);

        // Handle duplicate email if needed
        if (error.code === 'P2002') {
            return NextResponse.json(
                { success: false, error: "Lead with this email already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: error.message || "Failed to capture lead" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/leads/capture
 * 
 * Simple health check / info endpoint
 */
export async function GET() {
    return NextResponse.json({
        endpoint: "/api/leads/capture",
        method: "POST",
        description: "Public lead capture API with automatic source detection",
        required_fields: ["email", "companyId"],
        optional_fields: [
            "name", "phone", "company", "jobTitle", "message",
            "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
            "campaignCode", "landingPage", "formId", "customFields", "tags"
        ],
        features: [
            "Automatic source detection from UTM and referer",
            "Campaign attribution by code",
            "Lead scoring",
            "Form data capture"
        ]
    });
}
