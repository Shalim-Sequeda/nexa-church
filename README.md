# NEXA Church — Church Presentation System v1.0.0
### Desarrollado por SHALIM TECHNOLOGIES

Sistema profesional de presentación y control audiovisual para iglesias y cultos en vivo, diseñado específicamente para **Windows 11 x64** bajo el concepto de diseño **Dark Editorial Control Room**.

---

## 🏛️ Arquitectura de Marca

NEXA es una línea de software desarrollada por **SHALIM TECHNOLOGIES** enfocada en reproducción multimedia, presentación y gestión audiovisual.

```
SHALIM TECHNOLOGIES
│
└── NEXA
    ├── NEXA Media Player (Media Canvas)
    └── NEXA Church (Church Presentation System)
```

- **Línea de software**: NEXA
- **Producto**: NEXA Church
- **Descriptor**: Church Presentation System
- **Versión**: 1.0.0
- **Desarrollado por**: SHALIM TECHNOLOGIES
- **Copyright**: © 2026 SHALIM TECHNOLOGIES

---

## 🎯 Flujo de Operación del Culto

```
PREPARAR ───► PREVISUALIZAR ───► PRESENTAR ───► PROYECTAR
 (Escenas)        (Preview)         (Enter)     (Proyector)
```

1. **Preparar**: El operador organiza el culto antes de comenzar mediante grupos temáticos (`BIENVENIDA`, `ALABANZA`, `PALABRA`, `OFRENDA`, `ANUNCIOS`, `DESPEDIDA`).
2. **Previsualizar (PREVIEW)**: Monitor amplio e independiente para verificar texto, márgenes, proporciones y ortografía. Modificar PREVIEW jamás afecta la salida al público.
3. **Presentar (LIVE)**: Al presionar `PRESENTAR` (o la tecla `Enter`), el contenido pasa instantáneamente a la pantalla de la congregación.
4. **Proyectar**: Salida limpia en segundo monitor o proyector.

---

## 🖥️ Dos Espacios Completamente Separados

### A. Ventana de Operador (Consola de Control)
- **Navigation Rail Lateral**: Acceso a Escenas/Culto, Biblia offline, Biblioteca multimedia y Ajustes de pantalla.
- **Doble Monitor Central**:
  - **PREVIEW MONITOR**: Inspección previa y botón `PRESENTAR`.
  - **LIVE MONITOR**: Visualización idéntica a lo que ve la iglesia con indicador `● LIVE`.
- **Barra de Transporte**:
  - `[◄ ANTERIOR]` (Flecha Izquierda)
  - `[► PRESENTAR PREVIEW (Enter)]`
  - `[SIGUIENTE ►]` (Flecha Derecha)
  - `[⬛ CORTE A NEGRO (B)]`
  - Control de reproducción de video (Play/Pause, Barra de progreso, Tiempo, Volumen).
  - Selector de transición (`Corte` o `Fade`).

### B. Ventana de Presentación (Salida Proyector)
- **100% Limpia**: Cero botones, cero barras de título, cero controles y cero menús.
- **Segunda Pantalla Nativa**: Detecta automáticamente el proyector conectado, se posiciona en las coordenadas físicas del monitor secundario y activa pantalla completa.
- **Garantía de Ventana Única**: Reutilización de la misma ventana de presentación, evitando ventanas duplicadas.

---

## 📖 Biblia Local Offline (Reina Valera 1960)

- Funciona **100% sin Internet**.
- 66 libros del Antiguo y Nuevo Testamento.
- Navegación rápida: Libro $\rightarrow$ Capítulo $\rightarrow$ Versículo.
- Buscador inteligente de referencias: soporta entradas directas como `Salmos 23:1`, `Juan 3:16`, `Gn 1:1`, `1 Corintios 13:4`.
- Botones de acción inmediata:
  - `+ Agregar a Escenas` (guarda en el culto actual).
  - `👁 Enviar a Preview` (inspección previa).
  - `► Presentar Ahora al Proyector` (salida en vivo).

---

## 🎬 Cambio Atómico de Medios (Garantía Cero Video Fantasma)

- **Prioridad Absoluta**: La selección de un nuevo medio detiene de inmediato el medio anterior, limpia buffers y arranca estrictamente desde `00:00`.
- **Reemplazo Total entre Tipos**:
  $$\text{Versículo} \longrightarrow \text{Canción} \longrightarrow \text{Video} \longrightarrow \text{Imagen} \longrightarrow \text{Texto} \longrightarrow \text{Negro}$$
  Ningún audio ni video queda reproduciéndose en segundo plano al cambiar de escena.

---

## ⌨️ Atajos de Teclado Profesionales

| Tecla | Acción |
|---|---|
| `Enter` | **Presentar** Preview a Live |
| `B` / `b` | Activar / Desactivar **Corte a Negro** |
| `Espacio` | Play / Pause de medios (Videos y Canciones) |
| `Flecha Izquierda` | Escena Anterior |
| `Flecha Derecha` | Escena Siguiente |
| `P` / `p` | Enfocar Preview |
| `L` / `l` | Enfocar Live |

*Nota: Los atajos se desactivan automáticamente cuando el operador escribe en campos de texto o búsqueda.*

---

## 📦 Compilación y Generación del Instalador

### 1. Pruebas Unitarias
```cmd
npm.cmd test
```

### 2. Verificación de Tipos
```cmd
npm.cmd run typecheck
```

### 3. Compilación del Instalador de Producción (NSIS Windows 11 x64)
Ejecute el script de empaquetado optimizado para MSVC y Windows SDK:
```cmd
build_installer.cmd
```

El instalador oficial se generará en:
```
src-tauri\target\release\bundle\nsis\NEXA Church_1.0.0_x64-setup.exe
```

---

## ⚖️ Propiedad y Derechos

**NEXA Church** es un producto registrado de **SHALIM TECHNOLOGIES**.  
© 2026 SHALIM TECHNOLOGIES. Todos los derechos reservados.