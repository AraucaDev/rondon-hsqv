// api/fal.js — Proxy serverless para fal.ai
// La API key vive SOLO aquí, del lado del servidor. El navegador del fan nunca la ve.
// El front llama a /api/fal con { accion, endpoint, payload, requestId }.
// acciones soportadas: "submit" | "run" | "status" | "result"

const FAL_BASE = "https://queue.fal.run";

export default async function handler(req, res) {
  // CORS básico (mismo origen en producción; permisivo para pruebas)
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
    res.status(500).json({ error: "FAL_KEY no está configurada en el servidor." });
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
    "Authorization": `Key ${FAL_KEY}`,
    "Content-Type": "application/json"
  };

  try {
    let falUrl;
    let fetchOpts;

    if (accion === "submit") {
      // Encolar un trabajo. Devuelve { request_id, ... }
      if (!endpoint) return res.status(400).json({ error: "Falta 'endpoint' para submit." });
      falUrl = `${FAL_BASE}/${endpoint}`;
      fetchOpts = { method: "POST", headers: authHeaders, body: JSON.stringify(payload || {}) };

    } else if (accion === "run") {
      // Ejecución síncrona (espera el resultado). Mismo endpoint que submit.
      if (!endpoint) return res.status(400).json({ error: "Falta 'endpoint' para run." });
      falUrl = `${FAL_BASE}/${endpoint}`;
      fetchOpts = { method: "POST", headers: authHeaders, body: JSON.stringify(payload || {}) };

    } else if (accion === "status") {
      // Consultar estado de un trabajo encolado.
      if (!endpoint || !requestId) {
        return res.status(400).json({ error: "Faltan 'endpoint' o 'requestId' para status." });
      }
      falUrl = `${FAL_BASE}/${endpoint}/requests/${requestId}/status`;
      fetchOpts = { method: "GET", headers: authHeaders };

    } else if (accion === "result") {
      // Traer el resultado de un trabajo terminado.
      if (!endpoint || !requestId) {
        return res.status(400).json({ error: "Faltan 'endpoint' o 'requestId' para result." });
      }
      falUrl = `${FAL_BASE}/${endpoint}/requests/${requestId}`;
      fetchOpts = { method: "GET", headers: authHeaders };

    } else {
      return res.status(400).json({ error: `Acción desconocida: ${accion}` });
    }

    const falRes = await fetch(falUrl, fetchOpts);
    const text = await falRes.text();

    // Reenviar tal cual el JSON de fal (o el texto si no es JSON).
    let data;
    try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }

    res.status(falRes.status).json(data);

  } catch (err) {
    res.status(502).json({ error: "Error al contactar fal.ai", detalle: String(err && err.message || err) });
  }
}
