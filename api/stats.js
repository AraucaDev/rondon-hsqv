// api/stats.js — Endpoint opcional de estadisticas (CommonJS).
// Si configuras SUPABASE_URL y SUPABASE_KEY, registra eventos en hsqv_eventos.
// Si NO las configuras, responde OK sin hacer nada (no rompe la app).

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(200).end(); return; }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    res.status(200).json({ ok: true, logged: false, note: "Supabase no configurado." });
    return;
  }

  const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY,
    "Content-Type": "application/json"
  };

  try {
    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
      body = body || {};

      const ciudad = body.ciudad || req.headers["x-vercel-ip-city"] || "desconocida";
      const evento = {
        tipo: body.tipo || "video_generado",
        ciudad: ciudad,
        creditos_estimados: body.creditos_estimados || null,
        creado_en: new Date().toISOString()
      };

      const r = await fetch(SUPABASE_URL + "/rest/v1/hsqv_eventos", {
        method: "POST",
        headers: Object.assign({}, headers, { "Prefer": "return=minimal" }),
        body: JSON.stringify(evento)
      });

      res.status(r.ok ? 200 : 500).json({ ok: r.ok, logged: r.ok });
      return;
    }

    if (req.method === "GET") {
      const r = await fetch(SUPABASE_URL + "/rest/v1/hsqv_eventos?select=ciudad", { headers });
      const rows = await r.json();
      const total = Array.isArray(rows) ? rows.length : 0;
      const porCiudad = {};
      if (Array.isArray(rows)) rows.forEach(function(x){ porCiudad[x.ciudad] = (porCiudad[x.ciudad] || 0) + 1; });
      res.status(200).json({ total: total, porCiudad: porCiudad });
      return;
    }

    res.status(405).json({ error: "Metodo no permitido." });
  } catch (err) {
    res.status(502).json({ error: "Error con Supabase", detalle: String(err && err.message || err) });
  }
};
