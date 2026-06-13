// api/fal.js — Proxy serverless para fal.ai (CommonJS)
// La API key vive SOLO aqui, del lado del servidor. El navegador del fan nunca la ve.
// El front llama a /api/fal con { accion, endpoint, payload, requestId }.
// acciones soportadas: "submit" | "run" | "status" | "result"
//
// IMPORTANTE (regla de la API de fal.ai):
//   - submit/run usan el endpoint COMPLETO con subpath:  fal-ai/flux-pro/kontext
//   - status/result usan SOLO el model_id base (sin subpath): fal-ai/flux-pro
//   Meter el subpath en status/result hace que fal responda 405.

const FAL_BASE = "https://queue.fal.run";

// Recorta el endpoint a su model_id base (namespace/modelo), quitando el subpath.
// Ej: "fal-ai/flux-pro/kontext" -> "fal-ai/flux-pro"
//     "fal-ai/flux/dev"         -> "fal-ai/flux"
//     "fal-ai/veo3.1/fast/image-to-video" -> "fal-ai/veo3.1"
function modelIdBase(endpoint) {
  const partes = String(endpoint || "").split("/").filter(Boolean);
  if (partes.length <= 2) return partes.join("/");
  return partes[0] + "/" + partes[1];
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  const FAL_KEY = process.env.FAL_KEY;
  if (!FAL_KEY) {
    res.status(500).json({ error: "FAL_KEY no esta configurada en el servidor." });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const accion = body.accion;
  const endpoint = body.endpoint;
  const payload = body.payload;
  const requestId = body.requestId;

  if (!accion) { res.status(400).json({ error: "Falta 'accion'." }); return; }

  const authHeaders = {
    "Authorization": "Key " + FAL_KEY,
    "Content-Type": "application/json"
  };

  try {
    let falUrl;
    let fetchOpts;

    if (accion === "submit" || accion === "run") {
      if (!endpoint) { res.status(400).json({ error: "Falta 'endpoint'." }); return; }
      // submit/run: endpoint COMPLETO con subpath
      falUrl = FAL_BASE + "/" + endpoint;
      fetchOpts = { method: "POST", headers: authHeaders, body: JSON.stringify(payload || {}) };

    } else if (accion === "status") {
      if (!endpoint || !requestId) { res.status(400).json({ error: "Faltan 'endpoint' o 'requestId'." }); return; }
      // status: SOLO model_id base (sin subpath)
      falUrl = FAL_BASE + "/" + modelIdBase(endpoint) + "/requests/" + requestId + "/status";
      fetchOpts = { method: "GET", headers: authHeaders };

    } else if (accion === "result") {
      if (!endpoint || !requestId) { res.status(400).json({ error: "Faltan 'endpoint' o 'requestId'." }); return; }
      // result: SOLO model_id base (sin subpath)
      falUrl = FAL_BASE + "/" + modelIdBase(endpoint) + "/requests/" + requestId;
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
