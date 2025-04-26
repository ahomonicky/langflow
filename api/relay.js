// api/relay.js
export default async function handler(req, res) {
  // Předpokládáme JSON tělo { flowId: "...", ...ostatní data pro flow }
  const { flowId, ...payload } = req.body;

  // Mapa flowId → skutečné webhook URL z ENV
  const hooks = {
    chat1: process.env.WEBHOOK_CHAT1,
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
