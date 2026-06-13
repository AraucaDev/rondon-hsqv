# Rondón · App de video para fans — HSQV

App de un solo archivo donde el fan sube una foto y recibe un video vertical 9:16
con el concepto visual de "Hazme Sentir Que Vuelo" y el coro pegado como audio.

## Estructura

```
rondon-app/
├── api/
│   ├── fal.js        Proxy serverless (esconde la API key de fal.ai)
│   └── stats.js      Estadísticas opcionales (Supabase)
├── public/
│   └── index.html    La app (landing + generador)
├── vercel.json       Configuración de Vercel
├── package.json
├── .gitignore        Evita subir la API key y node_modules
└── .env.example      Plantilla de variables de entorno
```

## Cómo funciona la seguridad

La API key de fal.ai **nunca está en el HTML**. El navegador del fan llama a
`/api/fal`, que corre en el servidor de Vercel y reenvía a fal.ai con la key
guardada como variable de entorno. Por eso la app **no funciona abriendo el
archivo con doble clic** — necesita el servidor.

## Variables de entorno necesarias

| Variable       | Obligatoria | Para qué                          |
|----------------|-------------|-----------------------------------|
| `FAL_KEY`      | Sí          | Tu API key de fal.ai              |
| `SUPABASE_URL` | No          | Estadísticas (URL del proyecto)   |
| `SUPABASE_KEY` | No          | Estadísticas (service role key)   |

---

## DESPLIEGUE — Opción A: GitHub + Vercel (recomendada)

Esta es la mejor ruta: subes el código a GitHub una vez, conectas Vercel, y
cada cambio futuro se despliega solo con un `git push`.

### 1. Crea el repo en GitHub

- Entra a https://github.com/new
- Nombre: `rondon-hsqv` (privado o público, da igual)
- NO marques "Add a README" (ya tienes uno)
- Crea el repositorio y copia la URL que te da (ej. `https://github.com/TU_USUARIO/rondon-hsqv.git`)

### 2. Sube la carpeta a GitHub

Desde la Terminal, dentro de la carpeta `rondon-app/`:

```bash
cd ruta/a/rondon-app
git init
git add .
git commit -m "App HSQV inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/rondon-hsqv.git
git push -u origin main
```

> El `.gitignore` ya evita que se suba la API key. Verifica que NO exista un
> archivo `.env` en la carpeta antes de hacer push (solo debe estar `.env.example`).

### 3. Conecta Vercel a GitHub

- Entra a https://vercel.com y entra con tu cuenta de GitHub
- Click en **Add New… → Project**
- Selecciona el repo `rondon-hsqv` y dale **Import**
- En **Framework Preset** deja "Other"
- NO toques Build Command ni Output (es estático + funciones)

### 4. Carga la API key ANTES de desplegar

En la misma pantalla de import, abre **Environment Variables** y agrega:

- Name: `FAL_KEY`  ·  Value: *(pega tu API key de fal.ai)*
- (Opcional) `SUPABASE_URL` y `SUPABASE_KEY` si vas a usar estadísticas

Luego dale **Deploy**.

### 5. Listo

Vercel te da una URL tipo `https://rondon-hsqv.vercel.app`. Ábrela y prueba:
sube foto → "Crear mi video" → genera imagen, anima y pega el coro.

### Cambios futuros

Cada vez que edites algo (por ejemplo al replicar para Fugaz):

```bash
git add .
git commit -m "lo que cambiaste"
git push
```

Vercel detecta el push y redespliega solo. No vuelves a tocar la API key.

---

## DESPLIEGUE — Opción B: Vercel CLI (sin GitHub)

Si prefieres no usar GitHub:

```bash
npm install -g vercel
cd ruta/a/rondon-app
vercel login
vercel
vercel env add FAL_KEY      # pega tu key, marca los 3 entornos
vercel --prod
```

---

## Probar en tu Mac antes de desplegar

El doble clic NO sirve. Para probar local con el proxy funcionando:

```bash
cd ruta/a/rondon-app
cp .env.example .env         # y rellena FAL_KEY dentro de .env
vercel dev
```

Abre `http://localhost:3000` (no `file://`).

---

## Replicar para otra canción (Fugaz, Diosa…)

Sigue la guía `GUIA_Replicar_App_Video_Fans.md`: copia `public/index.html`,
cambia SOLO el contenido creativo (prompts, audio, textos), nunca la
arquitectura ni los parámetros de los modelos. Luego `git push` y Vercel
despliega la versión nueva.
