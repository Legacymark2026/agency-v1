
interface WebhookPayload {
    url: string;
    message: string;
}

export async function sendSlackMessage(webhookUrl: string, message: string) {
    console.log(`💬 Sending Slack Message to ${webhookUrl}`);
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message }),
        });
        return response.ok;
    } catch (e) {
        console.error("Slack Error", e);
        return false;
    }
}

export async function sendDiscordMessage(webhookUrl: string, message: string) {
    console.log(`🎮 Sending Discord Message to ${webhookUrl}`);
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message }),
        });
        return response.ok;
    } catch (e) {
        console.error("Discord Error", e);
        return false;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function makeHttpRequest(url: string, method: 'GET' | 'POST', body?: any) {
    console.log(`🌐 HTTP Request: ${method} ${url}`);
    try {
        const options: RequestInit = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (method === 'POST' && body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({})); // Handle non-json response
        return { success: response.ok, status: response.status, data };
    } catch (e: any) /* eslint-disable-line @typescript-eslint/no-explicit-any */ {
        return { success: false, error: e.message };
    }
}

export async function sendSMS(to: string, message: string) {
    console.log(`📱 Sending SMS to ${to}: "${message}"`);
    // Mock Twilio
    return { success: true, sid: 'SM' + Math.random().toString(36).substring(7) };
}

export async function sendWhatsApp(to: string, message: string) {
    console.log(`💚 Sending WhatsApp to ${to}: "${message}"`);
    // Mock Meta API
    return { success: true, mid: 'WAM' + Math.random().toString(36).substring(7) };
}
