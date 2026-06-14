# rondon-elefantesrosa — Hub de canciones

## Estructura
```
public/
  index.html                      → landing del hub (rondon.elefantesrosa.com/)
  hazmesentirquevuelo/index.html  → app HSQV (.../hazmesentirquevuelo)
  fugaz/index.html                → (pendiente, replicar)
  diosa/index.html                → (pendiente, replicar)
api/
  fal.js                          → proxy fal.ai (compartido por todas las canciones)
  stats.js                        → estadísticas Supabase (compartido)
vercel.json
```

## Rutas que sirve Vercel automáticamente
- `/`                       → public/index.html (hub)
- `/hazmesentirquevuelo`    → public/hazmesentirquevuelo/index.html
- `/api/fal`                → api/fal.js
- `/api/stats`              → api/stats.js

## Variables de entorno (ya configuradas en el proyecto actual)
- FAL_KEY (obligatoria)
- SUPABASE_URL, SUPABASE_KEY (opcionales, para stats)

## Para sumar Fugaz/Diosa
Crear `public/fugaz/index.html` siguiendo la guía de replicación.
El proxy /api/fal es el mismo para todas (no se duplica).
