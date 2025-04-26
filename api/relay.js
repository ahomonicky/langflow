// api/relay.js
export default async function handler(req, res) {
  const { flowId, ...payload } = req.body;
  const hooks = {
    chat1: process.env.WEBHOOK_CHAT1,
    chat2: process.env.WEBHOOK_CHAT2,
  };
  const target = hooks[flowId];
  if (!target) {
    return res.status(400).json({ error: `Unknown flowId: ${flowId}` });
  }
  const response = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  res.status(response.status).send(text);
}

