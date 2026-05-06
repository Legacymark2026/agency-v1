'use server';

/**
 * Video Agent Server Actions - The Editing Nexus
 * Backend completo con enjambre de agentes
 */

import { createCoordinator, initDatabase, VideoDbInterface, CoordinatorInput } from '../src/index';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================
// INICIALIZACIÓN
// ============================================

// Inicializar la base de datos al cargar el módulo
initDatabase(prisma as unknown as VideoDbInterface);

async function getApiKey(companyId: string): Promise<string> {
  const config = await prisma.integrationConfig.findUnique({
    where: { companyId_provider: { companyId, provider: 'gemini' } }
  });
  
  return (config?.config as any)?.geminiApiKey || 
         process.env.GOOGLE_GENERATIVE_AI_API_KEY || 
         process.env.GEMINI_API_KEY ||
         '';
}

// ============================================
// ACTIONS PRINCIPALES
// ============================================

/**
 * Crea un nuevo proyecto de video
 */
export async function createVideoProject(
  companyId: string,
  data: {
    name: string;
    description?: string;
    outputFormat?: '9:16' | '16:9' | '4:5' | '1:1';
    platform?: 'tiktok' | 'reels' | 'youtube' | 'instagram-feed' | 'facebook';
    style?: 'cinematic' | 'viral' | 'corporate' | 'luxury' | 'bohemian';
    duration?: number;
    hookDuration?: number;
    clips?: any[];
    audioUrl?: string;
    voiceover?: string;
  }
): Promise<{ success: boolean; projectId?: string; error?: string }> {
  try {
    const project = await prisma.videoProject.create({
      data: {
        companyId,
        name: data.name,
        description: data.description,
        outputFormat: data.outputFormat || '9:16',
        platform: data.platform || 'reels',
        style: data.style || 'cinematic',
        duration: data.duration || 20,
        hookDuration: data.hookDuration || 3,
        status: 'draft',
        clips: data.clips || [],
        audioUrl: data.audioUrl,
        voiceover: data.voiceover,
        textOverlays: [],
        manualOverrides: [],
        metadata: {}
      }
    });

    revalidatePath('/dashboard/video');
    return { success: true, projectId: project.id };
  } catch (error: any) {
    console.error('Error creating video project:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Ejecuta el flujo completo de edición con los 4 agentes
 */
export async function executeFullEditWorkflow(
  projectId: string
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    // 1. Obtener proyecto
    const project = await prisma.videoProject.findUnique({ 
      where: { id: projectId } 
    });
    
    if (!project) {
      return { success: false, error: 'Proyecto no encontrado' };
    }

    // 2. Obtener API key
    const apiKey = await getApiKey(project.companyId);
    
    if (!apiKey) {
      return { success: false, error: 'API Key de Gemini no configurada' };
    }

    // 3. Actualizar estado
    await prisma.videoProject.update({
      where: { id: projectId },
      data: { status: 'processing' }
    });

    // 4. Crear coordinator y ejecutar workflow
    const coordinator = createCoordinator(project.companyId, apiKey);
    
    const input: CoordinatorInput = {
      projectId,
      companyId: project.companyId,
      clips: project.clips as any[] || [],
      audioUrl: project.audioUrl,
      outputFormat: project.outputFormat,
      platform: project.platform as any,
      style: project.style as any,
      duration: project.duration,
      hookDuration: project.hookDuration,
      voiceover: project.voiceover
    };

    const result = await coordinator.executeFullWorkflow(input);

    // 5. Guardar resultados en la base de datos
    await prisma.videoProject.update({
      where: { id: projectId },
      data: {
        status: result.qualityCheck?.passed ? 'completed' : 'review',
        timeline: result.timeline,
        colorGrade: result.colorGrade,
        textOverlays: result.textOverlays,
        metadata: {
          ...project.metadata as any,
          qualityCheck: result.qualityCheck,
          versions: result.versions,
          seoTitle: result.metadata?.seoTitle,
          seoDescription: result.metadata?.seoDescription,
          generatedHashtags: result.metadata?.hashtags,
          generatedCTA: result.metadata?.suggestedCTA,
          agentLogs: coordinator.getLogs()
        }
      }
    });

    // 6. Guardar versiones
    if (result.versions && result.versions.length > 0) {
      for (const version of result.versions) {
        await prisma.editVersion.upsert({
          where: { id: `${projectId}-${version.version}` },
          update: {
            timeline: version.timeline,
            status: 'preview'
          },
          create: {
            id: `${projectId}-${version.version}`,
            projectId,
            version: version.version,
            name: version.name,
            description: version.description,
            timeline: version.timeline,
            status: 'preview'
          }
        });
      }
    }

    revalidatePath(`/dashboard/video/${projectId}`);
    return { success: true, result };

  } catch (error: any) {
    console.error('Workflow execution failed:', error);
    
    // Marcar como fallido
    await prisma.videoProject.update({
      where: { id: projectId },
      data: { status: 'failed' }
    });

    return { success: false, error: error.message };
  }
}

/**
 * Ejecuta un agente específico
 */
export async function executeAgent(
  projectId: string,
  agentName: string,
  action: string,
  params?: any
): Promise<{ success: boolean; result?: any; error?: string; agent?: string }> {
  try {
    const project = await prisma.videoProject.findUnique({ where: { id: projectId } });
    if (!project) return { success: false, error: 'Proyecto no encontrado' };

    const apiKey = await getApiKey(project.companyId);
    if (!apiKey) return { success: false, error: 'API Key no configurada' };

    const coordinator = createCoordinator(project.companyId, apiKey);
    
    // Ejecutar comando
    const command = params?.command || `${agentName}: ${action}`;
    const result = await coordinator.processCommand(projectId, command);

    return { 
      success: result.success, 
      result: result.result,
      agent: result.agent as string | undefined
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Procesa un comando de usuario libre
 */
export async function processUserCommand(
  projectId: string,
  command: string
): Promise<{ success: boolean; agent?: string; result?: any; error?: string }> {
  try {
    const project = await prisma.videoProject.findUnique({ where: { id: projectId } });
    if (!project) return { success: false, error: 'Proyecto no encontrado' };

    const apiKey = await getApiKey(project.companyId);
    if (!apiKey) return { success: false, error: 'API Key no configurada' };

    const coordinator = createCoordinator(project.companyId, apiKey);
    const result = await coordinator.processCommand(projectId, command);

    revalidatePath(`/dashboard/video/${projectId}`);
    
    return {
      success: result.success,
      agent: result.agent,
      result: result.result
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Genera versiones alternativas (A, B, C)
 */
export async function generateVersions(
  projectId: string
): Promise<{ success: boolean; versions?: any[]; error?: string }> {
  try {
    const project = await prisma.videoProject.findUnique({ where: { id: projectId } });
    if (!project) return { success: false, error: 'Proyecto no encontrado' };

    const apiKey = await getApiKey(project.companyId);
    if (!apiKey) return { success: false, error: 'API Key no configurada' };

    const coordinator = createCoordinator(project.companyId, apiKey);
    
    // Ya tenemos las versiones del workflow completo
    const metadata = project.metadata as any;
    const versions = metadata?.versions || [];

    return { success: true, versions };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Aprueba una versión específica
 */
export async function approveVersion(
  versionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.editVersion.update({
      where: { id: versionId },
      data: { status: 'approved' }
    });

    revalidatePath('/dashboard/video');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene un proyecto específico
 */
export async function getVideoProject(
  projectId: string
): Promise<{ success: boolean; project?: any; error?: string }> {
  try {
    const project = await prisma.videoProject.findUnique({
      where: { id: projectId },
      include: { versions: true }
    });

    if (!project) {
      return { success: false, error: 'Proyecto no encontrado' };
    }

    return { success: true, project };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Lista todos los proyectos
 */
export async function listVideoProjects(
  companyId: string,
  options?: { status?: string; limit?: number }
): Promise<{ success: boolean; projects?: any[]; error?: string }> {
  try {
    const projects = await prisma.videoProject.findMany({
      where: { 
        companyId,
        ...(options?.status ? { status: options.status } : {})
      },
      orderBy: { updatedAt: 'desc' },
      take: options?.limit || 50,
      include: { versions: true }
    });

    return { success: true, projects };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Completa el proyecto (marca como terminado)
 */
export async function completeProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.videoProject.update({
      where: { id: projectId },
      data: { status: 'completed' }
    });

    revalidatePath('/dashboard/video');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Elimina un proyecto
 */
export async function deleteVideoProject(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Eliminar versiones primero
    await prisma.editVersion.deleteMany({ where: { projectId } });
    
    // Eliminar proyecto
    await prisma.videoProject.delete({ where: { id: projectId } });

    revalidatePath('/dashboard/video');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene los logs del agente
 */
export async function getAgentLogs(
  projectId: string
): Promise<{ success: boolean; logs?: string[]; error?: string }> {
  try {
    const project = await prisma.videoProject.findUnique({
      where: { id: projectId },
      select: { metadata: true }
    });

    const logs = (project?.metadata as any)?.agentLogs || [];
    return { success: true, logs: Array.isArray(logs) ? logs : [logs] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene metadata SEO generada
 */
export async function getProjectMetadata(
  projectId: string
): Promise<{ success: boolean; metadata?: any; error?: string }> {
  try {
    const project = await prisma.videoProject.findUnique({
      where: { id: projectId },
      select: { metadata: true }
    });

    const metadata = (project?.metadata as any) || {};
    return { 
      success: true, 
      metadata: {
        seoTitle: metadata.seoTitle,
        seoDescription: metadata.seoDescription,
        hashtags: metadata.generatedHashtags,
        cta: metadata.generatedCTA,
        qualityCheck: metadata.qualityCheck
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export default {
  createVideoProject,
  executeFullEditWorkflow,
  executeAgent,
  processUserCommand,
  generateVersions,
  approveVersion,
  getVideoProject,
  listVideoProjects,
  completeProject,
  deleteVideoProject,
  getAgentLogs,
  getProjectMetadata
};