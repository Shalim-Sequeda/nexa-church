use std::sync::{Arc, Mutex};
use std::thread;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};
use tiny_http::{Header, Method, Response, Server, StatusCode};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BroadcastServerInfo {
    pub is_running: bool,
    pub port: u16,
    pub local_ip: String,
    pub url_lower_third: String,
    pub url_remote: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct BroadcastStatePayload {
    #[serde(default, alias = "isBlackout")]
    pub is_blackout: bool,
    #[serde(default, alias = "liveScene")]
    pub live_scene: Option<serde_json::Value>,
    #[serde(default, alias = "nextScene")]
    pub next_scene: Option<serde_json::Value>,
    #[serde(default, alias = "lowerThirdEnabled")]
    pub lower_third_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BroadcastState {
    pub version: u64,
    pub is_blackout: bool,
    pub live_scene: Option<serde_json::Value>,
    pub next_scene: Option<serde_json::Value>,
    pub lower_third_enabled: bool,
    pub timestamp: u64,
}

impl Default for BroadcastState {
    fn default() -> Self {
        Self {
            version: 1,
            is_blackout: false,
            live_scene: None,
            next_scene: None,
            lower_third_enabled: true,
            timestamp: 0,
        }
    }
}

static SERVER_PORT: Mutex<u16> = Mutex::new(5210);
static BROADCAST_STATE: Mutex<Option<Arc<Mutex<BroadcastState>>>> = Mutex::new(None);
static SERVER_STARTED: Mutex<bool> = Mutex::new(false);
static LOGO_BYTES: &[u8] = include_bytes!("../../../public/logo.png");

pub fn get_local_ip() -> String {
    use std::net::UdpSocket;
    if let Ok(socket) = UdpSocket::bind("0.0.0.0:0") {
        if socket.connect("8.8.8.8:80").is_ok() {
            if let Ok(addr) = socket.local_addr() {
                let ip = addr.ip().to_string();
                if ip != "0.0.0.0" && ip != "127.0.0.1" {
                    return ip;
                }
            }
        }
    }
    "127.0.0.1".to_string()
}

pub fn start_broadcast_server(app_handle: AppHandle) {
    let mut started = SERVER_STARTED.lock().unwrap();
    if *started {
        return;
    }

    let shared_state = Arc::new(Mutex::new(BroadcastState::default()));
    {
        let mut state_guard = BROADCAST_STATE.lock().unwrap();
        *state_guard = Some(shared_state.clone());
    }

    let initial_port = 5210;
    let mut selected_port = initial_port;
    let mut server = None;

    for port_offset in 0..10 {
        let try_port = initial_port + port_offset;
        match Server::http(format!("0.0.0.0:{}", try_port)) {
            Ok(s) => {
                selected_port = try_port;
                server = Some(s);
                break;
            }
            Err(_) => continue,
        }
    }

    let server = match server {
        Some(s) => s,
        None => {
            eprintln!("[NEXA Broadcast] No se pudo enlazar ningún puerto para el servidor local.");
            return;
        }
    };

    {
        let mut p = SERVER_PORT.lock().unwrap();
        *p = selected_port;
    }
    *started = true;

    println!(
        "[NEXA Broadcast] Servidor local iniciado exitosamente en puerto {}",
        selected_port
    );

    let server_state = shared_state.clone();
    let app = app_handle.clone();

    thread::spawn(move || {
        let cors_header = Header::from_bytes(&b"Access-Control-Allow-Origin"[..], &b"*"[..]).unwrap();
        let cors_methods = Header::from_bytes(&b"Access-Control-Allow-Methods"[..], &b"GET, POST, OPTIONS"[..]).unwrap();
        let cors_headers = Header::from_bytes(&b"Access-Control-Allow-Headers"[..], &b"Content-Type, Cache-Control"[..]).unwrap();
        let cache_control = Header::from_bytes(&b"Cache-Control"[..], &b"no-cache, no-store, must-revalidate"[..]).unwrap();

        for mut request in server.incoming_requests() {
            let full_url = request.url().to_string();
            let path = full_url.split('?').next().unwrap_or("").to_string();
            let method = request.method().clone();

            if method == Method::Options {
                let response = Response::empty(StatusCode(204))
                    .with_header(cors_header.clone())
                    .with_header(cors_methods.clone())
                    .with_header(cors_headers.clone());
                let _ = request.respond(response);
                continue;
            }

            if path == "/logo.png" {
                let header_ct = Header::from_bytes(&b"Content-Type"[..], &b"image/png"[..]).unwrap();
                let response = Response::from_data(LOGO_BYTES)
                    .with_header(header_ct)
                    .with_header(cors_header.clone());
                let _ = request.respond(response);
                continue;
            }

            if path == "/api/state" {
                let state_json = {
                    let st = server_state.lock().unwrap();
                    serde_json::to_string(&*st).unwrap_or_else(|_| "{}".to_string())
                };

                let header_ct = Header::from_bytes(&b"Content-Type"[..], &b"application/json; charset=utf-8"[..]).unwrap();
                let response = Response::from_string(state_json)
                    .with_header(header_ct)
                    .with_header(cache_control.clone())
                    .with_header(cors_header.clone());
                let _ = request.respond(response);
                continue;
            }

            if path == "/api/action" && method == Method::Post {
                let mut body = String::new();
                let _ = request.as_reader().read_to_string(&mut body);

                #[derive(Deserialize)]
                struct ActionPayload {
                    action: String,
                }

                let mut action_type = "unknown".to_string();
                if let Ok(parsed) = serde_json::from_str::<ActionPayload>(&body) {
                    action_type = parsed.action;
                }

                // Emit event strictly to Tauri main window
                if let Some(main_win) = app.get_webview_window("main") {
                    let _ = main_win.emit("remote_action", action_type.clone());
                } else {
                    let _ = app.emit("remote_action", action_type.clone());
                }

                let header_ct = Header::from_bytes(&b"Content-Type"[..], &b"application/json"[..]).unwrap();
                let response = Response::from_string(format!("{{\"success\":true,\"action\":\"{}\"}}", action_type))
                    .with_header(header_ct)
                    .with_header(cors_header.clone());
                let _ = request.respond(response);
                continue;
            }

            if path.starts_with("/lower-third") || path.starts_with("/lowerthird") {
                let html = get_lower_third_html();
                let header_ct = Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap();
                let response = Response::from_string(html)
                    .with_header(header_ct)
                    .with_header(cache_control.clone())
                    .with_header(cors_header.clone());
                let _ = request.respond(response);
                continue;
            }

            if path.starts_with("/media") {
                let cors_hdr = cors_header.clone();
                thread::spawn(move || {
                    handle_media_stream(request, &cors_hdr);
                });
                continue;
            }

            // Default route or /remote
            let html = get_remote_control_html();
            let header_ct = Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..]).unwrap();
            let response = Response::from_string(html)
                .with_header(header_ct)
                .with_header(cache_control.clone())
                .with_header(cors_header.clone());
            let _ = request.respond(response);
        }
    });
}

#[tauri::command]
pub fn get_broadcast_server_info() -> BroadcastServerInfo {
    let port = *SERVER_PORT.lock().unwrap();
    let is_running = *SERVER_STARTED.lock().unwrap();
    let local_ip = get_local_ip();

    BroadcastServerInfo {
        is_running,
        port,
        local_ip: local_ip.clone(),
        url_lower_third: format!("http://localhost:{}/lower-third", port),
        url_remote: format!("http://{}:{}/remote", local_ip, port),
    }
}

#[tauri::command]
pub fn update_broadcast_state(payload: BroadcastStatePayload) -> Result<(), String> {
    let guard = BROADCAST_STATE.lock().unwrap();
    if let Some(ref state_arc) = *guard {
        let mut st = state_arc.lock().unwrap();
        st.version += 1;
        st.is_blackout = payload.is_blackout;
        st.live_scene = payload.live_scene;
        st.next_scene = payload.next_scene;
        st.lower_third_enabled = payload.lower_third_enabled;
        st.timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;
    }
    Ok(())
}

fn get_lower_third_html() -> &'static str {
    r#"<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEXA Church — Lower Thirds (OBS / vMix)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800;900&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: transparent !important;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    #stage {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
      padding-bottom: 24px;
      padding-left: 48px;
      padding-right: 48px;
      pointer-events: none;
    }
    .lt-wrapper {
      max-width: 1400px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      transition: opacity 0.32s cubic-bezier(0.16, 1, 0.3, 1), transform 0.32s cubic-bezier(0.16, 1, 0.3, 1);
      opacity: 0;
      transform: translateY(16px);
    }
    .lt-wrapper.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #DC2626;
      color: #FFFFFF;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 12.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 5px 15px;
      border-radius: 5px 5px 0 0;
      box-shadow: 0 3px 10px rgba(220, 38, 38, 0.35);
      margin-left: 12px;
    }
    .content-box {
      width: 100%;
      background: rgba(9, 10, 14, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.10);
      border-left: 5px solid #DC2626;
      border-radius: 6px;
      padding: 13px 22px;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .main-text {
      color: #FFFFFF;
      font-size: 21px;
      font-weight: 700;
      line-height: 1.38;
      letter-spacing: -0.01em;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.95);
      white-space: pre-line;
    }
  </style>
</head>
<body>
  <div id="stage">
    <div id="wrapper" class="lt-wrapper">
      <div id="badge" class="badge-pill">NEXA CHURCH</div>
      <div class="content-box">
        <div id="text" class="main-text"></div>
      </div>
    </div>
  </div>

  <script>
    let lastVersion = 0;
    const wrapper = document.getElementById('wrapper');
    const badge = document.getElementById('badge');
    const mainText = document.getElementById('text');

    async function pollState() {
      try {
        const res = await fetch('/api/state?t=' + Date.now());
        if (!res.ok) return;
        const data = await res.json();
        if (data.version === lastVersion) return;
        lastVersion = data.version;

        if (data.is_blackout || !data.lower_third_enabled || !data.live_scene) {
          wrapper.classList.remove('visible');
          return;
        }

        const scene = data.live_scene;
        let bText = 'NEXA CHURCH';
        let contentText = '';

        // Solo activar Lower Third en escenas de texto, biblia o canciones
        if (scene.type === 'bible' && scene.content && scene.content.bible) {
          const b = scene.content.bible;
          bText = `${b.reference || (b.book + ' ' + b.chapter + ':' + b.verse)} · ${b.version || 'RVR1960'}`;
          contentText = b.text || '';
        } else if (scene.type === 'song' && scene.content && scene.content.song) {
          const s = scene.content.song;
          bText = scene.title || s.title || 'ALABANZA';
          const slides = s.slides || [];
          const idx = s.activeSlideIndex || 0;
          contentText = slides[idx] || '';
        } else if (scene.type === 'text' && scene.content && scene.content.text) {
          bText = scene.title || 'MENSAJE';
          contentText = scene.content.text;
        } else {
          // Si es imagen, video, o diapositiva presencial -> ocultar de inmediato en la transmisión
          wrapper.classList.remove('visible');
          return;
        }

        if (!contentText.trim()) {
          wrapper.classList.remove('visible');
          return;
        }

        badge.textContent = bText;
        mainText.textContent = contentText;
        wrapper.classList.add('visible');
      } catch (err) {
        console.error('Error actualizando Lower Third:', err);
      }
    }

    setInterval(pollState, 150);
    pollState();
  </script>
</body>
</html>"#
}

fn get_remote_control_html() -> &'static str {
    r#"<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>NEXA Church — Control Remoto</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }
    body {
      background: #09090C;
      color: #F4F4F5;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      user-select: none;
      -webkit-user-select: none;
      padding-bottom: env(safe-area-inset-bottom, 20px);
    }
    header {
      background: #111115;
      border-bottom: 1px solid #1F1F26;
      padding: 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 20;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo {
      width: 28px;
      height: 28px;
      object-fit: contain;
      border-radius: 6px;
      border: 1px solid #27272A;
      background: #0C0D11;
      padding: 2px;
    }
    .brand-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.1em;
      color: #FFFFFF;
    }
    .brand-title span {
      color: #EF4444;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(34, 197, 94, 0.12);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #4ADE80;
      font-size: 10.5px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22C55E;
      box-shadow: 0 0 6px #22C55E;
    }
    main {
      flex: 1;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-width: 600px;
      width: 100%;
      margin: 0 auto;
    }
    .card {
      background: #121217;
      border: 1px solid #22222A;
      border-radius: 8px;
      padding: 16px;
      position: relative;
      overflow: hidden;
    }
    .card-label {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
    }
    .card-live {
      border-left: 5px solid #DC2626;
      background: #0D0E13;
    }
    .card-live .card-label {
      color: #EF4444;
    }
    .card-next {
      border-left: 5px solid #3B82F6;
      background: #0D1018;
    }
    .card-next .card-label {
      color: #60A5FA;
    }
    .scene-title {
      font-size: 17px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 6px;
      letter-spacing: -0.01em;
    }
    .scene-text {
      font-size: 14px;
      color: #D4D4D8;
      line-height: 1.45;
      white-space: pre-line;
      max-height: 130px;
      overflow-y: auto;
    }
    .controls-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 6px;
    }
    .btn {
      appearance: none;
      border: none;
      outline: none;
      border-radius: 8px;
      font-family: 'Inter', sans-serif;
      font-weight: 800;
      font-size: 15px;
      letter-spacing: 0.05em;
      padding: 22px 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      cursor: pointer;
      transition: transform 0.08s ease, filter 0.15s ease, background-color 0.15s ease;
      touch-action: manipulation;
    }
    .btn:active {
      transform: scale(0.96);
    }
    .btn-nav {
      background: #1C1C23;
      color: #FFFFFF;
      border: 1px solid #2D2D38;
    }
    .btn-nav:active {
      background: #272732;
    }
    .btn-take {
      grid-column: span 2;
      background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
      color: #FFFFFF;
      box-shadow: 0 4px 18px rgba(220, 38, 38, 0.4);
      padding: 20px 14px;
      font-size: 17px;
    }
    .btn-take:active {
      filter: brightness(0.9);
    }
    .btn-blackout {
      grid-column: span 2;
      background: #18181D;
      color: #D97706;
      border: 1px solid #78350F;
      padding: 16px 14px;
      font-size: 14px;
    }
    .btn-blackout.active {
      background: #D97706;
      color: #000000;
      font-weight: 900;
      border-color: #F59E0B;
    }
    .footer-note {
      text-align: center;
      color: #52525B;
      font-size: 11px;
      letter-spacing: 0.05em;
      margin-top: auto;
      padding-top: 14px;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <img src="/logo.png" alt="NEXA" class="brand-logo" onerror="this.style.display='none'">
      <div class="brand-title">NEXA <span>CHURCH</span></div>
    </div>
  </header>

  <main>
    <div class="card card-live">
      <div class="card-label">● EN PANTALLA (LIVE)</div>
      <div id="liveTitle" class="scene-title">Cargando...</div>
      <div id="liveText" class="scene-text">Esperando señal de la consola...</div>
    </div>

    <div class="card card-next">
      <div class="card-label">▸ SIGUIENTE CUE</div>
      <div id="nextTitle" class="scene-title">—</div>
      <div id="nextText" class="scene-text" style="color: #94A3B8;">—</div>
    </div>

    <div class="controls-grid">
      <button class="btn btn-nav" onclick="sendAction('prev')">
        <span>◀ ANTERIOR</span>
      </button>

      <button class="btn btn-nav" onclick="sendAction('next')">
        <span>SIGUIENTE ▶</span>
      </button>

      <button class="btn btn-take" onclick="sendAction('take')">
        <span>TAKE (EN VIVO)</span>
      </button>

      <button id="btnBlackout" class="btn btn-blackout" onclick="sendAction('blackout')">
        <span>BLACKOUT (CORTAR A NEGRO)</span>
      </button>
    </div>

    <div class="footer-note">
      NEXA CHURCH REMOTE · PRODUCCIÓN EN VIVO
    </div>
  </main>

  <script>
    const liveTitle = document.getElementById('liveTitle');
    const liveText = document.getElementById('liveText');
    const nextTitle = document.getElementById('nextTitle');
    const nextText = document.getElementById('nextText');
    const btnBlackout = document.getElementById('btnBlackout');

    async function sendAction(action) {
      if (navigator.vibrate) navigator.vibrate(25);
      try {
        await fetch('/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
        setTimeout(pollState, 40);
      } catch (err) {
        console.error('Error enviando acción:', err);
      }
    }

    function extractText(scene) {
      if (!scene) return '';
      if (scene.content && scene.content.bible) {
        return scene.content.bible.text || scene.content.bible.reference || '';
      }
      if (scene.content && scene.content.song) {
        const s = scene.content.song;
        const slides = s.slides || [];
        return slides[s.activeSlideIndex || 0] || '';
      }
      if (scene.content && scene.content.text) {
        return scene.content.text;
      }
      if (scene.content && scene.content.announcement) {
        const a = scene.content.announcement.announcement;
        return a.details || a.title || '';
      }
      return scene.title || '';
    }

    async function pollState() {
      try {
        const res = await fetch('/api/state?t=' + Date.now());
        if (!res.ok) return;
        const data = await res.json();

        if (data.is_blackout) {
          btnBlackout.classList.add('active');
          btnBlackout.innerHTML = '<span>BLACKOUT ACTIVO (REANUDAR)</span>';
        } else {
          btnBlackout.classList.remove('active');
          btnBlackout.innerHTML = '<span>BLACKOUT (CORTAR A NEGRO)</span>';
        }

        if (data.live_scene) {
          liveTitle.textContent = data.live_scene.title || 'EN VIVO';
          const txt = extractText(data.live_scene);
          liveText.textContent = txt || '(Sin texto en esta diapositiva)';
        } else {
          liveTitle.textContent = 'Salida Inactiva';
          liveText.textContent = 'No hay escena proyectada en este momento';
        }

        if (data.next_scene) {
          nextTitle.textContent = data.next_scene.title || 'Siguiente';
          const nTxt = extractText(data.next_scene);
          nextText.textContent = nTxt || '(Listo para proyectar)';
        } else {
          nextTitle.textContent = 'Fin del programa';
          nextText.textContent = '(Sin siguiente diapositiva programada)';
        }
      } catch (err) {
        console.error('Error en sondeo remoto:', err);
      }
    }

    setInterval(pollState, 160);
    pollState();
  </script>
</body>
</html>"#
}

fn url_decode(s: &str) -> String {
    let mut result = Vec::new();
    let bytes = s.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(val) = u8::from_str_radix(std::str::from_utf8(&bytes[i + 1..i + 3]).unwrap_or(""), 16) {
                result.push(val);
                i += 3;
                continue;
            }
        } else if bytes[i] == b'+' {
            result.push(b' ');
            i += 1;
            continue;
        }
        result.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&result).to_string()
}

fn get_mime_type(path: &str) -> &'static str {
    let lower = path.to_lowercase();
    if lower.ends_with(".mp4") { "video/mp4" }
    else if lower.ends_with(".webm") { "video/webm" }
    else if lower.ends_with(".mov") || lower.ends_with(".qt") { "video/quicktime" }
    else if lower.ends_with(".mkv") { "video/x-matroska" }
    else if lower.ends_with(".m4v") { "video/x-m4v" }
    else if lower.ends_with(".avi") { "video/x-msvideo" }
    else if lower.ends_with(".mp3") { "audio/mpeg" }
    else if lower.ends_with(".wav") { "audio/wav" }
    else if lower.ends_with(".ogg") { "audio/ogg" }
    else if lower.ends_with(".m4a") || lower.ends_with(".aac") { "audio/mp4" }
    else if lower.ends_with(".flac") { "audio/flac" }
    else if lower.ends_with(".jpg") || lower.ends_with(".jpeg") { "image/jpeg" }
    else if lower.ends_with(".png") { "image/png" }
    else if lower.ends_with(".webp") { "image/webp" }
    else if lower.ends_with(".gif") { "image/gif" }
    else { "application/octet-stream" }
}

fn handle_media_stream(request: tiny_http::Request, cors_header: &Header) {
    use std::fs::File;
    use std::io::{Read, Seek, SeekFrom};
    use std::path::Path;

    let url_str = request.url().to_string();
    let query_param = if let Some(idx) = url_str.find("file=") {
        &url_str[idx + 5..]
    } else if let Some(idx) = url_str.find("path=") {
        &url_str[idx + 5..]
    } else {
        ""
    };

    let raw_param = query_param.split('&').next().unwrap_or("");
    let file_path = url_decode(raw_param);
    let trimmed = file_path.trim();
    let mut clean_path = if trimmed.starts_with("file://") {
        trimmed.strip_prefix("file://").unwrap_or(trimmed).to_string()
    } else {
        trimmed.to_string()
    };
    if clean_path.starts_with('/') && clean_path.chars().nth(2) == Some(':') {
        clean_path.remove(0);
    }

    if clean_path.is_empty() || !Path::new(&clean_path).exists() {
        let _ = request.respond(
            Response::from_string("File not found")
                .with_status_code(StatusCode(404))
                .with_header(cors_header.clone()),
        );
        return;
    }

    let mut file = match File::open(&clean_path) {
        Ok(f) => f,
        Err(_) => {
            let _ = request.respond(
                Response::from_string("Error opening file")
                    .with_status_code(StatusCode(500))
                    .with_header(cors_header.clone()),
            );
            return;
        }
    };

    let total_size = match file.metadata() {
        Ok(m) => m.len(),
        Err(_) => 0,
    };

    let mime_type = get_mime_type(&clean_path);
    let content_type_header = Header::from_bytes(&b"Content-Type"[..], mime_type.as_bytes()).unwrap();
    let accept_ranges_header = Header::from_bytes(&b"Accept-Ranges"[..], &b"bytes"[..]).unwrap();
    let cors_expose = Header::from_bytes(
        &b"Access-Control-Expose-Headers"[..],
        &b"Content-Range, Content-Length, Accept-Ranges"[..],
    ).unwrap();

    let is_head = *request.method() == Method::Head;

    // Check for Range header: e.g. "Range: bytes=0-1024" or "Range: bytes=1024-"
    let range_header = request
        .headers()
        .iter()
        .find(|h| h.field.equiv("Range"))
        .map(|h| h.value.as_str().to_string());

    if let Some(range_val) = range_header {
        if let Some(bytes_range) = range_val.strip_prefix("bytes=") {
            let mut parts = bytes_range.split('-');
            let start: u64 = parts.next().and_then(|s| s.parse().ok()).unwrap_or(0);
            let end: u64 = parts
                .next()
                .and_then(|s| if s.is_empty() { None } else { s.parse().ok() })
                .unwrap_or(total_size.saturating_sub(1));

            let end = end.min(total_size.saturating_sub(1));

            if start <= end && start < total_size {
                let length = end - start + 1;
                let content_range_str = format!("bytes {}-{}/{}", start, end, total_size);
                let content_range_header = Header::from_bytes(
                    &b"Content-Range"[..],
                    content_range_str.as_bytes(),
                ).unwrap();
                let content_len_header = Header::from_bytes(
                    &b"Content-Length"[..],
                    length.to_string().as_bytes(),
                ).unwrap();

                if is_head {
                    let response = Response::empty(StatusCode(206))
                        .with_header(cors_header.clone())
                        .with_header(cors_expose)
                        .with_header(content_type_header)
                        .with_header(accept_ranges_header)
                        .with_header(content_range_header)
                        .with_header(content_len_header);
                    let _ = request.respond(response);
                    return;
                }

                if file.seek(SeekFrom::Start(start)).is_ok() {
                    let reader = file.take(length);
                    let response = Response::new(
                        StatusCode(206),
                        vec![
                            cors_header.clone(),
                            cors_expose,
                            content_type_header,
                            accept_ranges_header,
                            content_range_header,
                            content_len_header,
                        ],
                        reader,
                        Some(length as usize),
                        None,
                    );
                    let _ = request.respond(response);
                    return;
                }
            }
        }
    }

    // Full response (no range or range invalid)
    let content_len_header = Header::from_bytes(
        &b"Content-Length"[..],
        total_size.to_string().as_bytes(),
    ).unwrap();

    if is_head {
        let response = Response::empty(StatusCode(200))
            .with_header(cors_header.clone())
            .with_header(cors_expose)
            .with_header(content_type_header)
            .with_header(accept_ranges_header)
            .with_header(content_len_header);
        let _ = request.respond(response);
        return;
    }

    let response = Response::new(
        StatusCode(200),
        vec![
            cors_header.clone(),
            cors_expose,
            content_type_header,
            accept_ranges_header,
            content_len_header,
        ],
        file,
        Some(total_size as usize),
        None,
    );
    let _ = request.respond(response);
}
