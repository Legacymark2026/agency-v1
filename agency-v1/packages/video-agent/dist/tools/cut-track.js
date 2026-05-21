export async function cutTrack(args, memory) {
    const { trackId, startTime, endTime, sessionId } = args;
    const currentState = await memory.getState(sessionId);
    if (!currentState) {
        throw new Error('No timeline state found for session');
    }
    const beforeState = JSON.parse(JSON.stringify(currentState));
    const clipIndex = currentState.clips.findIndex((c) => c.id === trackId);
    if (clipIndex === -1) {
        throw new Error(`Track ${trackId} not found`);
    }
    const clip = currentState.clips[clipIndex];
    const originalDuration = clip.duration || clip.endTime - clip.startTime;
    const beforeDuration = endTime - startTime;
    const removedDuration = originalDuration - beforeDuration;
    currentState.clips[clipIndex] = Object.assign(Object.assign({}, clip), { startTime: clip.startTime + startTime, duration: beforeDuration, cut: true, cutInfo: { originalStart: clip.startTime, originalDuration, cutAt: startTime, cutEnd: endTime } });
    await memory.saveState(sessionId, currentState);
    await memory.pushHistory(sessionId, {
        id: `cut_${Date.now()}`,
        action: 'cut',
        description: `Cut track ${trackId} from ${startTime}s to ${endTime}s (removed ${removedDuration.toFixed(2)}s)`,
        beforeState: { clips: [beforeState.clips[clipIndex]] },
        afterState: { clips: [currentState.clips[clipIndex]] },
        timestamp: new Date().toISOString(),
        undone: false,
    });
    return {
        success: true,
        trackId,
        originalDuration,
        newDuration: beforeDuration,
        removedDuration,
        timeline: currentState,
    };
}
export async function removeSilenceSegments(sessionId, silenceSegments, memory) {
    const currentState = await memory.getState(sessionId);
    if (!currentState)
        throw new Error('No timeline state found');
    let cutsApplied = 0;
    let totalRemoved = 0;
    for (const silence of silenceSegments) {
        const duration = silence.end - silence.start;
        if (duration < 0.3)
            continue;
        for (let i = 0; i < currentState.clips.length; i++) {
            const clip = currentState.clips[i];
            const clipStart = clip.startTime || 0;
            const clipEnd = clipStart + (clip.duration || 0);
            if (silence.start >= clipStart && silence.end <= clipEnd) {
                const beforeState = JSON.parse(JSON.stringify(currentState));
                currentState.clips[i] = Object.assign(Object.assign({}, clip), { duration: clip.duration - duration, silenceRemoved: true, silenceInfo: { removedAt: silence.start - clipStart, duration } });
                await memory.pushHistory(sessionId, {
                    id: `silence_cut_${Date.now()}_${i}`,
                    action: 'cut',
                    description: `Removed ${duration.toFixed(2)}s silence from clip ${clip.id}`,
                    beforeState: { clips: [beforeState.clips[i]] },
                    afterState: { clips: [currentState.clips[i]] },
                    timestamp: new Date().toISOString(),
                    undone: false,
                });
                cutsApplied++;
                totalRemoved += duration;
            }
        }
    }
    await memory.saveState(sessionId, currentState);
    return { cutsApplied, totalRemoved: Math.round(totalRemoved * 100) / 100 };
}
