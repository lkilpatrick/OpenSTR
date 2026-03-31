interface PushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushNotification(payload: PushPayload): Promise<void> {
  const message = {
    to: payload.token,
    sound: 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  };

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    console.error('Push notification failed:', await response.text());
  }
}
