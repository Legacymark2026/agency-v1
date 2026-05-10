import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { trainModel, VideoFeatures } from '@/lib/ml/video-retention-model';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, companyId, actualRetentionRate, apiKey } = body;

    // Basic security validation
    if (!apiKey || apiKey !== process.env.AGENCY_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!projectId || !companyId || actualRetentionRate === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the project to extract its timeline features
    const project = await prisma.videoEditorProject.findUnique({
      where: { id: projectId }
    });

    if (!project || !project.timeline) {
      return NextResponse.json({ error: 'Project or timeline not found' }, { status: 404 });
    }

    const config = project.config as any;
    const timeline = project.timeline as any;

    // Extract features for the model
    const features: VideoFeatures = {
      totalDuration: timeline.totalDuration || 0,
      hookDuration: timeline.segments?.hook?.duration || 0,
      cutsCount: timeline.cuts || 0,
      averageCutDuration: timeline.averageCutDuration || 0,
      platform: config.platform || 'tiktok',
      style: config.style || 'viral',
      hasSpeedRamps: !!timeline.segments?.hook?.speedRamp
    };

    // Run Gradient Descent to train the model with this specific company's new data
    const newWeights = await trainModel(companyId, projectId, features, actualRetentionRate);

    return NextResponse.json({
      success: true,
      message: 'Model trained successfully via Backpropagation',
      updatedWeights: newWeights
    });
  } catch (error: any) {
    console.error('[VIDEO_ANALYTICS_WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
