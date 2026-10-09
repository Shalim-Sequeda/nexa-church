# Manual de Usuario Oficial — NEXA Church

**Versión:** 1.0.0 Oficial  
**Desarrollado por:** Shalim Technologies  
**Plataforma:** Windows 10 / Windows 11 (64-bit)  
**Sitio Web:** [NEXA Church Landing Page](index.html)  
**Versión Web del Manual:** [manual.html](manual.html)

---

## 1. Introducción y Filosofía del Sistema

**NEXA Church** es un software de presentación profesional para iglesias, diseñado para acompañar la adoración, la proclamación de la Palabra y la producción de cultos y congresos. 

### Principios Fundamentales:
* **100% Offline y Autónomo:** No depende de conexión a internet para bases bíblicas, biblioteca de alabanza ni reproducción multimedia.
* **Cero Latencia y Estabilidad Extrema:** Desarrollado con tecnología nativa en Rust, consumiendo menos de 150 MB de memoria RAM y con tiempos de arranque menores a 2 segundos.
* **Control Dual Broadcast (Preview vs. Live):** Todo cambio puede ser preparado y revisado antes de proyectarse a la congregación.

---

## 2. Requisitos del Sistema e Instalación

### Requisitos Mínimos:
* **Sistema Operativo:** Windows 10 (64-bit) o Windows 11.
* **Procesador:** Intel Core i3 (4ta generación) / AMD Ryzen 3 o superior.
* **Memoria RAM:** 4 GB mínimo.
* **Almacenamiento:** 500 MB libres para instalación y bibliotecas base.
* **Salida de Video:** Al menos 1 puerto HDMI / DisplayPort / VGA para el proyector o pantalla principal.

### Requisitos Recomendados:
* **Procesador:** Intel Core i5 / AMD Ryzen 5 o superior.
* **Memoria RAM:** 8 GB recomendados.
* **Salidas de Video:** 2 o más puertos para pantalla principal (auditorio) y retorno de escenario (Stage Display).

### Pasos de Instalación:
1. Descarga el instalador `NEXA_Church_Installer.exe` desde la web oficial.
2. Ejecuta el archivo instalador y sigue las instrucciones en pantalla.
3. El programa creará un acceso directo en el Escritorio y configurará automáticamente las carpetas de datos locales.

---

## 3. Visión General de la Interfaz

La interfaz de NEXA Church se divide en 3 áreas principales:

1. **Panel de Recursos y Cues (Izquierda):** Navegación entre Motor Bíblico (`F1`), Canciones (`F2`), Multimedia (`F3`) y Pantallas (`F4`), junto al orden del culto programado.
2. **Monitor PREVIEW (Centro):** Muestra el elemento seleccionado en edición o previsualización. Nada en este monitor es visible por la audiencia.
3. **Monitor LIVE / PROGRAM (Derecha):** Muestra con precisión pixel-perfect la señal enviada al proyector, televisores o transmisión de streaming.

### El Comando TAKE
* Presiona la tecla `Espacio` o haz clic en el botón rojo **TAKE** para enviar el contenido activo de Preview directamente a Live con una transición limpia y sincronizada.

---

## 4. Motor Bíblico Multiversión

El motor bíblico permite ubicar y presentar cualquier versículo en menos de 3 segundos:

### Características:
* **Versiones incluidas:** Reina-Valera 1960 (RVR1960), Reina-Valera 1990 (RVR1990), Nueva Versión Internacional (NVI), Nueva Traducción Viviente (NTV), La Biblia de las Américas (LBLA), Traducción en Lenguaje Actual (TLA) y Dios Habla Hoy (DHH).
* **Búsqueda por Teclado:** Escribe el nombre del libro (ej. *Romanos*), capítulo (ej. *8*) y versículo (ej. *28*).
* **Rangos Continuos:** Selecciona el primer versículo y mantén presionada la tecla `Shift` para seleccionar hasta el versículo final (ej. *Romanos 8:28-32*).
* **Presentación Directa:** El botón *Presentar Directo a Live* envía el versículo al proyector sin pasar por Preview para intervenciones espontáneas del pastor.

---

## 5. Gestión de Alabanzas, Letras y Acordes

Diseñado para equipos de adoración dinámicos:

* **Estructura Modular:** Cada canción se divide en etiquetas automáticas: `[Estrofa 1]`, `[Estrofa 2]`, `[Coro]`, `[Puente]`, `[Pre-Coro]`, `[Final]`.
* **Navegación Ágil:** Haz clic directamente en el bloque deseado durante la ministración para repetir coros o puentes sin pasar por las estrofas.
* **Transposición de Acordes:** Sube o baja semitonos con un solo clic (+1 / -1) para reflejar los tonos de guitarra y piano en el monitor de los músicos.
* **Repertorios de Culto:** Agrupa canciones por servicio de domingo mañana, domingo noche o reuniones entre semana.

---

## 6. Flujo de Producción y Cues (Control Room)

El sistema de **Cues** es el corazón de la producción del servicio:

* Añade canciones, lecturas bíblicas, anuncios y videos a la lista de cues con el botón `+ A Cues`.
* Reordena los cues arrastrando y soltando según el programa pastoral.
* Durante el culto, avanza de diapositiva con la tecla `Flecha Derecha (→)` o retrocede con `Flecha Izquierda (←)`.

---

## 7. Multimedia y Motion Backgrounds

* **Videos en Bucle (Motion Loops):** Reproduce fondos de adoración continuos en formatos MP4 y WebM con aceleración gráfica por hardware.
* **Superposición de Texto:** El texto bíblico o de alabanza flota con sombra y contraste calibrado sobre el video o imagen de fondo.
* **Control de Audio:** Faders de volumen integrados con decibeles en tiempo real y transiciones sin saturación.
* **Botones de Emergencia:**
  * `B` (**Blackout**): Apaga instantáneamente la pantalla a negro absoluto.
  * `C` (**Clear Text**): Borra los subtítulos o versos pero mantiene activo el fondo dinámico.

---

## 8. Pantalla de Retorno para Escenario (Stage Display)

El monitor de retorno brinda seguridad y sincronización a los predicadores y músicos:

* **Siguiente Línea en Espera:** Permite que los cantantes lean la siguiente frase antes de cantarla.
* **Reloj en Tiempo Real y Cuenta Regresiva:** Temporizadores configurables para controlar la duración de sermones y avisos.
* **Alertas Privadas:** Envía notas que solo el pastor lee en el púlpito (ej. *"Hermano, terminar en 5 minutos"*).

---

## 9. Integración con Transmisión en Vivo (Streaming)

* Salida limpia dedicada para **OBS Studio** o **vMix**.
* Permite enviar sólo los textos en formato *Lower Thirds* con fondo transparente o croma para superponer sobre las cámaras en vivo.

---

## 10. Editor de Anuncios y Placas de Culto

* Creación de placas sobrias para:
  * Horarios de servicios y grupos de oración.
  * Datos bancarios y códigos QR para diezmos y ofrendas.
  * Bienvenida de visitantes y avisos generales.
* Función de rotación automática durante el pre-servicio (cada 8-15 segundos).

---

## 11. Tabla de Atajos de Teclado (Cheat Sheet)

| Atajo | Acción | Contexto |
|---|---|---|
| `Espacio` / `Enter` | Ejecutar TAKE (Preview → Live) | Global |
| `→` o `↓` | Siguiente diapositiva / estrofa | Proyección activa |
| `←` o `↑` | Diapositiva / estrofa anterior | Proyección activa |
| `B` | **Blackout** (Pantalla negra inmediata) | Emergencia |
| `C` | **Clear** (Ocultar texto, mantener fondo) | Ministración |
| `F1` | Abrir Motor Bíblico | Navegación |
| `F2` | Abrir Canciones y Letras | Navegación |
| `F3` | Abrir Galería Multimedia | Navegación |
| `F4` | Panel de Pantallas y Stage Display | Configuración |
| `Esc` | Cerrar modales o salir de pantalla completa | Global |

---

## 12. Solución de Problemas y Buenas Prácticas

1. **El proyector no muestra la salida de NEXA:**
   * Presiona `Win + P` en Windows y selecciona siempre **"Extender"** (no duplicar).
   * En NEXA Church, abre el panel de Pantallas (`F4`) y selecciona el monitor secundario.

2. **Ruidos de notificaciones de Windows:**
   * Antes del servicio, activa el modo *"No Molestar"* / *"Asistente de concentración"* en Windows.

---

© 2026 NEXA Church. Desarrollado por Shalim Technologies. Todos los derechos reservados.
