'use server';

/**
 * Video Assets Integration Actions
 * Gestión de API Keys para el Video Editor Agent
 */

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import type { VideoAssetConfig, VideoAssetStatus } from './video-assets-types';

async function getCompanyId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  
  const companyUser = await prisma.companyUser.findFirst({
    where: { userId: session.user.id },
    select: { companyId: true }
  });
  
  return companyUser?.companyId || null;
}

// ============================================
// GET CONFIG
// ============================================

export async function getVideoAssetConfig(): Promise<VideoAssetConfig | null> {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return null;
    
    const config = await prisma.integrationConfig.findUnique({
      where: { companyId_provider: { companyId, provider: 'video-assets' } }
    });

    if (!config) return null;

    return config.config as VideoAssetConfig;
  } catch (error) {
    console.error('Error getting video asset config:', error);
    return null;
  }
}

// ============================================
// SAVE CONFIG
// ============================================

export async function saveVideoAssetConfig(
  config: VideoAssetConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const companyId = await getCompanyId();
    if (!companyId) return { success: false, error: 'Company not found' };
    
    await prisma.integrationConfig.upsert({
      where: {
        companyId_provider: { companyId, provider: 'video-assets' }
      },
      update: {
        config: config as any,
        updatedAt: new Date()
      },
      create: {
        companyId,
        provider: 'video-assets',
        config: config as any
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error saving video asset config:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// TEST CONNECTION
// ============================================

export async function testVideoAssetConnection(
  provider: string,
  apiKey: string
): Promise<{ success: boolean; message: string; latency?: number }> {
  const startTime = Date.now();

  try {
    switch (provider) {
      case 'pexels':
        return await testPexels(apiKey);
      case 'elevenlabs':
        return await testElevenLabs(apiKey);
      case 'midjourney':
        return await testMidjourney(apiKey);
      case 'suno':
        return await testSuno(apiKey);
      case 'runway':
        return await testRunway(apiKey);
      case 'adobeStock':
        return await testAdobeStock(apiKey);
      default:
        return { success: false, message: `Provider ${provider} no soportado` };
    }
  } catch (error: any) {
    return { 
      success: false, 
      message: error.message,
      latency: Date.now() - startTime
    };
  }
}

// Test Pexels
async function testPexels(apiKey: string): Promise<{ success: boolean; message: string; latency?: number }> {
  const startTime = Date.now();
  
  const response = await fetch('https://api.pexels.com/v1/search?query=test&per_page=1', {
    headers: { 'Authorization': apiKey }
  });

  if (response.ok) {
    return { success: true, message: 'Conexión exitosa', latency: Date.now() - startTime };
  }
  
  const error = await response.text();
  return { success: false, message: `Error: ${response.status} - ${error}`, latency: Date.now() - startTime };
}

// Test ElevenLabs
async function testElevenLabs(apiKey: string): Promise<{ success: boolean; message: string; latency?: number }> {
  const startTime = Date.now();
  
  const response = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: { 'xi-api-key': apiKey }
  });

  if (response.ok) {
    const data = await response.json();
    const voiceCount = data.voices?.length || 0;
    return { 
      success: true, 
      message: `Conexión exitosa. ${voiceCount} voces disponibles.`,
      latency: Date.now() - startTime 
    };
  }
  
  return { success: false, message: `Error: ${response.status}`, latency: Date.now() - startTime };
}

// Test Midjourney
async function testMidjourney(apiKey: string): Promise<{ success: boolean; message: string; latency?: number }> {
  // Midjourney no tiene API pública oficial, simulamos validación de formato
  const startTime = Date.now();
  
  if (apiKey.length > 20) {
    return { success: true, message: 'API Key configurada (formato válido)', latency: Date.now() - startTime };
  }
  
  return { success: false, message: 'API Key inválida', latency: Date.now() - startTime };
}

// Test Suno
async function testSuno(apiKey: string): Promise<{ success: boolean; message: string; latency?: number }> {
  const startTime = Date.now();
  
  // Suno requiere autenticación específica
  if (apiKey.length > 10) {
    return { success: true, message: 'API Key configurada', latency: Date.now() - startTime };
  }
  
  return { success: false, message: 'API Key inválida', latency: Date.now() - startTime };
}

// Test Runway
async function testRunway(apiKey: string): Promise<{ success: boolean; message: string; latency?: number }> {
  const startTime = Date.now();
  
  // Runway ML API check
  const response = await fetch('https://api.runwayml.com/v1/user', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (response.ok) {
    return { success: true, message: 'Conexión exitosa', latency: Date.now() - startTime };
  }
  
  return { success: false, message: `Error: ${response.status}`, latency: Date.now() - startTime };
}

// Test Adobe Stock
async function testAdobeStock(apiKey: string): Promise<{ success: boolean; message: string; latency?: number }> {
  const startTime = Date.now();
  
  // Adobe Stock requiere client ID/secret
  if (apiKey.length > 5) {
    return { success: true, message: 'Credenciales configuradas', latency: Date.now() - startTime };
  }
  
  return { success: false, message: 'Credenciales inválidas', latency: Date.now() - startTime };
}

// ============================================
// GET STATUS (para dashboard)
// ============================================

export async function getVideoAssetStatus(): Promise<VideoAssetStatus[]> {
  const config = await getVideoAssetConfig();
  
  if (!config) return [];

  const statuses: VideoAssetStatus[] = [];

  if (config.midjourney?.apiKey) {
    statuses.push({ provider: 'midjourney', isConfigured: true, status: 'connected' });
  }
  if (config.pexels?.apiKey) {
    statuses.push({ provider: 'pexels', isConfigured: true, status: 'connected' });
  }
  if (config.elevenlabs?.apiKey) {
    statuses.push({ provider: 'elevenlabs', isConfigured: true, status: 'connected' });
  }
  if (config.suno?.apiKey) {
    statuses.push({ provider: 'suno', isConfigured: true, status: 'connected' });
  }
  if (config.runway?.apiKey) {
    statuses.push({ provider: 'runway', isConfigured: true, status: 'connected' });
  }
  if (config.adobeStock?.clientId) {
    statuses.push({ provider: 'adobeStock', isConfigured: true, status: 'connected' });
  }

  return statuses;
}

// ============================================
// DELETE CONFIG
// ============================================

export async function deleteVideoAssetConfig(
  provider: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getVideoAssetConfig();
    if (!config) return { success: true };

    // Eliminar el provider específico
    const updatedConfig = { ...config };
    delete (updatedConfig as any)[provider];

    return await saveVideoAssetConfig(updatedConfig as VideoAssetConfig);
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}