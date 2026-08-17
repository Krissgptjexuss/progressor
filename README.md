# 🏋️ Progresor

Tu coach de hipertrofia con IA, como app independiente. Registras cada sesión, y Claude te devuelve feedback y objetivos comparando con tu semana anterior — igual que en el chat, pero en tu teléfono.

Es una **PWA** (app web instalable): cero compilación, se despliega en **GitHub Pages** y se instala en Android como una app normal.

---

## Qué hace

- **Días**: elige Upper A / Lower A / Upper B / Lower B y registra peso, reps y RIR por serie.
- **Feedback**: al registrar, Claude compara con tu última sesión de ese día, celebra los récords 🔥, detecta cuándo un peso ya "maduró", vigila el RIR, avisa de cambios de máquina y de banderas de salud (hombro, agarre), y te deja **objetivos concretos** para la próxima.
- **Progreso**: historial de todas tus sesiones con su feedback.
- **Coach**: chat libre ("¿qué toca hoy?", "¿cuánto peso uso?").
- Tu historial **ya viene precargado** con las sesiones del chat, así las comparaciones funcionan desde el día uno.
- Todo se guarda **en tu teléfono** (no hay servidor).

---

## 🔐 Seguridad de tu API key (léelo)

- Tu API key se guarda **solo en el almacenamiento local de tu navegador**, en tu dispositivo. Se envía **únicamente** a `api.anthropic.com`.
- **Nunca la escribas en el código ni la subas al repositorio.** La pones dentro de la app (pestaña Ajustes) la primera vez.
- Por eso el repo puede ser **público sin riesgo**: el código no contiene ningún secreto. (GitHub Pages gratuito requiere repo público; como la key no está en el código, es seguro.)
- La llamada usa la cabecera `anthropic-dangerous-direct-browser-access` porque el navegador habla directo con Anthropic. Es lo esperado para una app personal como esta.

---

## 🚀 Desplegar en GitHub Pages (5 min)

1. Crea un repositorio nuevo en GitHub, por ejemplo `progresor`.
2. Sube **todos** estos archivos a la raíz del repo (arrastrándolos en la web de GitHub → *Add file* → *Upload files*, o por git):
   ```
   index.html
   styles.css
   app.js
   seed.js
   manifest.webmanifest
   sw.js
   icons/icon-192.png
   icons/icon-512.png
   icons/icon-maskable-512.png
   README.md
   ```
3. En el repo: **Settings → Pages**.
4. En *Build and deployment* → *Source*: elige **Deploy from a branch**, rama `main`, carpeta `/ (root)`. Guarda.
5. Espera ~1 minuto. GitHub te dará una URL tipo:
   `https://TU-USUARIO.github.io/progresor/`

Por git, si prefieres:
```bash
git init
git add .
git commit -m "Progresor PWA"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/progresor.git
git push -u origin main
```

---

## 📱 Instalar en Android

1. Abre la URL de GitHub Pages en **Chrome** (en el teléfono).
2. Menú **⋮ → Instalar app** (o *Añadir a pantalla de inicio*).
3. Ábrela desde el ícono. Se ve y funciona como una app nativa (pantalla completa, offline para navegar).
4. Entra a **Ajustes** dentro de la app, pega tu **API key de Anthropic**, elige el modelo y toca **Probar conexión**.

Listo. Ya puedes registrar tu primera sesión.

---

## Obtener una API key

En [console.anthropic.com](https://console.anthropic.com) → *API Keys* → *Create Key*. Necesitas saldo/crédito en la cuenta. Cada feedback consume muy pocos tokens.

**Modelos** (elige en Ajustes):
- `claude-sonnet-5` — recomendado (rápido y muy capaz).
- `claude-opus-4-8` — el más potente.
- `claude-haiku-4-5` — el más rápido y barato.

---

## Backup

En **Ajustes** puedes **Exportar** tu historial a un `.json` y volver a **Importarlo** (por si cambias de teléfono o limpias el navegador).

---

## Personalizar

- **Rutina**: edita `seed.js` → `DEFAULT_ROUTINE` (borra `progresor_seeded_v1` del localStorage o usa "Borrar todo" para re-sembrar).
- **Estilo del coach / metodología**: edita `SYSTEM_PROMPT` en `app.js`.
- **Colores/tipografía**: `styles.css` (variables `:root`).

Hecho para uso personal. Progresa 💪
