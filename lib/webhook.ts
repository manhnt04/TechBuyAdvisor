export interface OpsAlertPayload {
  level: 'INFO' | 'WARN' | 'ERROR';
  title: string;
  message: string;
  meta?: Record<string, unknown>;
  timestamp?: string;
}

export async function sendOpsAlert(payload: OpsAlertPayload): Promise<boolean> {
  const webhookUrl = process.env.OPS_WEBHOOK_URL;
  const timestamp = payload.timestamp || new Date().toISOString();

  // In development without configured webhook, log to console
  if (!webhookUrl) {
    console.log(`\n[OPS ALERT - ${payload.level}] ${payload.title} (${timestamp})`);
    console.log(`Message: ${payload.message}`);
    if (payload.meta) console.log(`Meta:`, JSON.stringify(payload.meta, null, 2));
    console.log('');
    return true;
  }

  try {
    // Supports Discord / Slack / custom webhook format
    const body = {
      content: `**[OPS ${payload.level}] ${payload.title}**\n${payload.message}\n\`${timestamp}\``,
      embeds: [
        {
          title: payload.title,
          description: payload.message,
          color: payload.level === 'ERROR' ? 15158332 : payload.level === 'WARN' ? 16753920 : 3066993,
          fields: payload.meta
            ? Object.entries(payload.meta).map(([name, value]) => ({
                name,
                value: String(value),
                inline: true,
              }))
            : [],
          timestamp,
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return res.ok;
  } catch (err) {
    console.error('Failed to dispatch ops webhook:', err);
    return false;
  }
}
