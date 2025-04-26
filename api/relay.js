// api/relay.js
export default async function handler(req, res) {
  // Předpokládáme JSON tělo { flowId: "...", ...ostatní data pro flow }
  const { flowId, ...payload } = req.body;

  // Mapa flowId → skutečné webhook URL z ENV
  const hooks = {
    chat1: http://23.88.120.170:7860/api/v1/run/0e668343-e19f-4f6c-8853-2bc8efa69f3f,
    chat2: process.env.WEBHOOK_CHAT2,
    // přidej sem další podle potřeby
  };

  const target = hooks[flowId];
  if (!target) {
    return res.status(400).json({ error: `Unknown flowId: ${flowId}` });
  }

  // Přepošleme požadavek na tvůj skutečný server
  const response = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  res.status(response.status).send(text);
}
