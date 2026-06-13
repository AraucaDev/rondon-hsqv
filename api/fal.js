// api/fal.js — Proxy serverless para fal.ai (CommonJS)
// La API key vive SOLO aqui, del lado del servidor. El navegador del fan nunca la ve.
// El front llama a /api/fal con { accion, endpoint, payload, requestId }.
// acciones soportadas: "submit" | "run" | "status" | "result"

const FAL_BASE = "https://queue.fal.run";

module.exports = async function handler(req, res) {
  // CORS basico
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  const FAL_KEY = process.env.FAL_KEY;
  if (!FAL_KEY) {
    res.status(500).json({ error: "FAL_KEY no esta configurada en el servidor." });
    return;
  }

  // El body puede venir como objeto (Vercel lo parsea) o como string.
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const { accion, endpoint, payload, requestId } = body;

  if (!accion) {
    res.status(400).json({ error: "Falta 'accion'." });
    return;
  }

  const authHeaders = {
    "Authorization": "Key " + FAL_KEY,
    "Content-Type": "application/json"
  };

  try {
    let falUrl;
    let fetchOpts;

    if (accion === "submit") {
      if (!endpoint) { res.status(400).json({ error: "Falta 'endpoint' para submit." }); return; }
      falUrl = FAL_BASE + "/" + endpoint;
      fetchOpts = { method: "POST", headers: authHeaders, body: JSON.stringify(payload || {}) };

    } else if (accion === "run") {
      if (!endpoint) { res.status(400).json({ error: "Falta 'endpoint' para run." }); return; }
      falUrl = FAL_BASE + "/" + endpoint;
      fetchOpts = { method: "POST", headers: authHeaders, body: JSON.stringify(payload || {}) };

    } else if (accion === "status") {
      if (!endpoint || !requestId) { res.status(400).json({ error: "Faltan 'endpoint' o 'requestId' para status." }); return; }
      falUrl = FAL_BASE + "/" + endpoint + "/requests/" + requestId + "/status";
      fetchOpts = { method: "GET", headers: authHeaders };

    } else if (accion === "result") {
      if (!endpoint || !requestId) { res.status(400).json({ error: "Faltan 'endpoint' o 'requestId' para result." }); return; }
      falUrl = FAL_BASE + "/" + endpoint + "/requests/" + requestId;
      fetchOpts = { method: "GET", headers: authHeaders };

    } else {
      res.status(400).json({ error: "Accion desconocida: " + accion });
      return;
    }

    const falRes = await fetch(falUrl, fetchOpts);
    const text = await falRes.text();

    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    res.status(falRes.status).json(data);

  } catch (err) {
    res.status(502).json({ error: "Error al contactar fal.ai", detalle: String(err && err.message || err) });
  }
};
