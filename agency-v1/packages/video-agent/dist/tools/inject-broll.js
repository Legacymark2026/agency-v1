export async function injectBRoll(args, memory) {
    const { keywords, insertTime, sessionId, maxDuration = 5, source = 'pexels' } = args;
    const currentState = await memory.getState(sessionId);
    if (!currentState) {
        throw new Error('No timeline state found for session');
    }
    const asset = await searchBRollAsset(keywords, source);
    if (!asset) {
        throw new Error(`No B-roll asset found for keywords: ${keywords.join(', ')}`);
    }
    const beforeState = JSON.parse(JSON.stringify(currentState));
    const brollClip = {
        id: `broll_${Date.now()}`,
        type: 'broll',
        url: asset.url,
        startTime: insertTime,
        duration: Math.min(asset.duration, maxDuration),
        width: asset.width,
        height: asset.height,
        tags: asset.tags,
        source: asset.source,
        isBRoll: true,
    };
    currentState.clips.push(brollClip);
    currentState.clips.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
    await memory.saveState(sessionId, currentState);
    await memory.pushHistory(sessionId, {
        id: `inject_broll_${Date.now()}`,
        action: 'inject_broll',
        description: `Injected B-roll "${asset.id}" at ${insertTime}s with keywords: ${keywords.join(', ')}`,
        beforeState: { clips: beforeState.clips },
        afterState: { clips: currentState.clips },
        timestamp: new Date().toISOString(),
        undone: false,
    });
    return {
        success: true,
        asset,
        insertTime,
        duration: Math.min(asset.duration, maxDuration),
    };
}
async function searchBRollAsset(keywords, source) {
    if (source === 'pexels') {
        return await searchPexels(keywords);
    }
    return generateMockBRollAsset(keywords);
}
async function searchPexels(keywords) {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
        console.warn('[inject_broll] No Pexels API key, using mock asset');
        return generateMockBRollAsset(keywords);
    }
    try {
        const query = keywords.join(' ');
        const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`, {
            headers: { Authorization: apiKey },
        });
        if (!response.ok) {
            throw new Error(`Pexels API error: ${response.status}`);
        }
        const data = await response.json();
        if (data.videos && data.videos.length > 0) {
            const video = data.videos[0];
            const videoFile = video.video_files.find((f) => f.quality === 'hd') || video.video_files[0];
            return {
                id: `pexels_${video.id}`,
                url: (videoFile === null || videoFile === void 0 ? void 0 : videoFile.link) || '',
                thumbnail: video.image || '',
                duration: video.duration,
                width: (videoFile === null || videoFile === void 0 ? void 0 : videoFile.width) || 1080,
                height: (videoFile === null || videoFile === void 0 ? void 0 : videoFile.height) || 1920,
                tags: video.tags || keywords,
                source: 'pexels',
            };
        }
    }
    catch (error) {
        console.error('[inject_broll] Pexels search error:', error);
    }
    return generateMockBRollAsset(keywords);
}
function generateMockBRollAsset(keywords) {
    return {
        id: `mock_broll_${Date.now()}`,
        url: `/mock/broll/${keywords.join('_')}.mp4`,
        thumbnail: `/mock/broll/${keywords.join('_')}.jpg`,
        duration: 5,
        width: 1080,
        height: 1920,
        tags: keywords,
        source: 'mock',
    };
}
