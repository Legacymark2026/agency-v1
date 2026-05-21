"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWebSocket = initWebSocket;
exports.broadcastProgress = broadcastProgress;
exports.broadcastComplete = broadcastComplete;
exports.broadcastFailed = broadcastFailed;
exports.broadcastTimelineUpdate = broadcastTimelineUpdate;
exports.broadcastAgentMessage = broadcastAgentMessage;
exports.getConnectedClients = getConnectedClients;
exports.closeWebSocket = closeWebSocket;
const ws_1 = require("ws");
let wss = null;
const clients = new Map();
function initWebSocket(server) {
    wss = new ws_1.WebSocketServer({ server, path: '/ws/video' });
    wss.on('connection', (ws, req) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const clientId = url.searchParams.get('clientId') || `client_${Date.now()}`;
        const companyId = url.searchParams.get('companyId') || undefined;
        const projectId = url.searchParams.get('projectId') || undefined;
        const clientInfo = {
            ws,
            companyId,
            projectId,
            jobIds: new Set(),
        };
        clients.set(clientId, clientInfo);
        ws.send(JSON.stringify({
            type: 'connected',
            clientId,
            timestamp: Date.now(),
        }));
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'subscribe') {
                    clientInfo.jobIds.add(msg.jobId);
                }
                else if (msg.type === 'unsubscribe') {
                    clientInfo.jobIds.delete(msg.jobId);
                }
            }
            catch {
                // Ignore invalid messages
            }
        });
        ws.on('close', () => {
            clients.delete(clientId);
        });
        ws.on('error', (err) => {
            console.error('[ws] Client error:', err);
            clients.delete(clientId);
        });
    });
    return wss;
}
function sendToClient(clientId, data) {
    const client = clients.get(clientId);
    if (client && client.ws.readyState === ws_1.WebSocket.OPEN) {
        client.ws.send(JSON.stringify(data));
    }
}
function sendToCompany(companyId, data) {
    for (const [id, client] of clients.entries()) {
        if (client.companyId === companyId && client.ws.readyState === ws_1.WebSocket.OPEN) {
            client.ws.send(JSON.stringify(data));
        }
    }
}
function sendToProject(projectId, data) {
    for (const [id, client] of clients.entries()) {
        if (client.projectId === projectId && client.ws.readyState === ws_1.WebSocket.OPEN) {
            client.ws.send(JSON.stringify(data));
        }
    }
}
function sendToJobSubscribers(jobId, data) {
    for (const [id, client] of clients.entries()) {
        if (client.jobIds.has(jobId) && client.ws.readyState === ws_1.WebSocket.OPEN) {
            client.ws.send(JSON.stringify(data));
        }
    }
}
function broadcastProgress(jobId, progress, status) {
    const data = {
        type: 'progress',
        jobId,
        progress,
        status,
        timestamp: Date.now(),
    };
    sendToJobSubscribers(jobId, data);
}
function broadcastComplete(jobId, result) {
    const data = {
        type: 'complete',
        jobId,
        result,
        timestamp: Date.now(),
    };
    sendToJobSubscribers(jobId, data);
}
function broadcastFailed(jobId, error) {
    const data = {
        type: 'failed',
        jobId,
        error,
        timestamp: Date.now(),
    };
    sendToJobSubscribers(jobId, data);
}
function broadcastTimelineUpdate(projectId, timeline) {
    sendToProject(projectId, {
        type: 'timeline_update',
        projectId,
        timeline,
        timestamp: Date.now(),
    });
}
function broadcastAgentMessage(sessionId, message) {
    for (const [id, client] of clients.entries()) {
        if (client.ws.readyState === ws_1.WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
                type: 'agent_message',
                sessionId,
                message,
                timestamp: Date.now(),
            }));
        }
    }
}
function getConnectedClients() {
    return clients.size;
}
function closeWebSocket() {
    if (wss) {
        wss.close();
        clients.clear();
    }
}
//# sourceMappingURL=index.js.map