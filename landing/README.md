# NEXA CHURCH — Landing Page Oficial

Esta carpeta contiene la landing page oficial de **NEXA CHURCH**, diseñada con máxima fidelidad visual respecto al diseño de referencia (estética oscura, grafito, plateado, acento rojo `#FF1E2D`, tipografía Inter moderna e iconografía Phosphor Icons).

---

## 🚀 Despliegue en Netlify (2 Métodos)

### Opción 1: Arrastrar y Soltar (Sin comandos, 30 segundos)
1. Inicia sesión en tu cuenta de [Netlify](https://app.netlify.com).
2. Ve a la sección **Sites** (Sitios).
3. Arrastra la carpeta `landing/` directamente sobre el recuadro que dice **"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"**.
4. ¡Listo! Tu landing page estará activa de inmediato con HTTPS automático.

---

### Opción 2: Conectar con GitHub / Git
Si tu repositorio está en GitHub o GitLab:
1. En Netlify, haz clic en **"Add new site"** → **"Import an existing project"**.
2. Selecciona tu repositorio `Nexa_Church`.
3. En la configuración de construcción:
   - **Base directory:** `landing`
   - **Build command:** *(dejar vacío)*
   - **Publish directory:** `.` (o dejar vacío, ya que `netlify.toml` lo configura automáticamente)
4. Haz clic en **Deploy**. Cada vez que hagas `git push`, Netlify actualizará el sitio automáticamente.

---

### 🌐 Conectar Dominio Propio (ej. `nexachurch.com` o `descarga.nexachurch.com`)
1. En el panel de tu sitio en Netlify, ve a **Domain Management** → **Add a domain**.
2. Ingresa tu dominio o subdominio.
3. Configura los registros DNS que Netlify te indique (CNAME o registros A).
4. Netlify generará automáticamente el certificado SSL gratuito (HTTPS).

---

## 📁 Estructura de Archivos
- `index.html`: Código principal responsivo (Desktop y Móvil) con Tailwind CSS, Phosphor Icons y soporte para modales.
- `netlify.toml`: Cabeceras de seguridad y optimización de caché para Netlify.
- `assets/`:
  - `logo.png`: Logo oficial de NEXA Church.
  - `hero-laptop.png`: Portátil con interfaz real de NEXA Church (Motor Bíblico y Salmos 23:1).
  - `hero-stage-glow.jpg`: Fondo cinematográfico de escenario y luces de adoración.
  - `sec2-laptop.png`: Portátil en perspectiva con badge *Interfaz clara y organizada*.
  - `sec3-screen.png`: Pantalla de proyección en perspectiva para la sección *Diseñado para la realidad de tu iglesia*.
  - `app-full-interface.png`: Captura de pantalla en alta resolución para el modal de demostración.
