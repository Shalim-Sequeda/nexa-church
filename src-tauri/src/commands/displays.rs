use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplayInfo {
    pub id: usize,
    pub name: String,
    pub is_primary: bool,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub scale_factor: f64,
}

#[tauri::command]
pub async fn get_available_displays(app: AppHandle) -> Result<Vec<DisplayInfo>, String> {
    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    let primary = app.primary_monitor().map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for (i, m) in monitors.into_iter().enumerate() {
        let is_primary = if let Some(ref p) = primary {
            p.name() == m.name() && p.position() == m.position()
        } else {
            i == 0
        };
        let pos = m.position();
        let size = m.size();
        let name = m.name().cloned().unwrap_or_else(|| format!("Pantalla {}", i + 1));

        result.push(DisplayInfo {
            id: i,
            name,
            is_primary,
            x: pos.x,
            y: pos.y,
            width: size.width,
            height: size.height,
            scale_factor: m.scale_factor(),
        });
    }
    Ok(result)
}

#[tauri::command]
pub async fn open_presentation_window(
    app: AppHandle,
    display_id: Option<usize>,
    fullscreen: Option<bool>,
) -> Result<(), String> {
    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    let target_monitor = if let Some(id) = display_id {
        monitors.get(id).cloned()
    } else {
        if monitors.len() > 1 {
            let primary_name = app.primary_monitor().ok().flatten().and_then(|p| p.name().cloned());
            monitors.into_iter().find(|m| {
                if let Some(ref pname) = primary_name {
                    m.name() != Some(pname)
                } else {
                    true
                }
            })
        } else {
            app.primary_monitor().map_err(|e| e.to_string())?
        }
    };

    let presentation_win = if let Some(win) = app.get_webview_window("presentation") {
        win
    } else {
        WebviewWindowBuilder::new(
            &app,
            "presentation",
            WebviewUrl::App("index.html?window=presentation".into()),
        )
        .title("NEXA Church — Presentation")
        .decorations(false)
        .resizable(true)
        .always_on_top(false)
        .inner_size(1280.0, 720.0)
        .center()
        .build()
        .map_err(|e| format!("Error al crear ventana de presentación: {}", e))?
    };

    if let Some(m) = target_monitor {
        let pos = m.position();
        let size = m.size();
        let _ = presentation_win.set_position(tauri::Position::Physical(*pos));
        let _ = presentation_win.set_size(tauri::Size::Physical(*size));
    }

    if fullscreen.unwrap_or(true) {
        let _ = presentation_win.set_fullscreen(true);
    } else {
        let _ = presentation_win.set_fullscreen(false);
    }

    presentation_win.show().map_err(|e| e.to_string())?;
    presentation_win.unminimize().map_err(|e| e.to_string())?;
    presentation_win.set_focus().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn close_presentation_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("presentation") {
        win.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn toggle_presentation_fullscreen(app: AppHandle) -> Result<bool, String> {
    if let Some(win) = app.get_webview_window("presentation") {
        let current = win.is_fullscreen().unwrap_or(false);
        let next = !current;
        win.set_fullscreen(next).map_err(|e| e.to_string())?;
        Ok(next)
    } else {
        Err("La ventana de presentación no está abierta".to_string())
    }
}

#[tauri::command]
pub async fn open_stage_window(
    app: AppHandle,
    display_id: Option<usize>,
    fullscreen: Option<bool>,
) -> Result<(), String> {
    let monitors = app.available_monitors().map_err(|e| e.to_string())?;
    let target_monitor = if let Some(id) = display_id {
        monitors.get(id).cloned()
    } else {
        if monitors.len() > 2 {
            monitors.get(2).cloned()
        } else if monitors.len() > 1 {
            let primary_name = app.primary_monitor().ok().flatten().and_then(|p| p.name().cloned());
            monitors.into_iter().find(|m| {
                if let Some(ref pname) = primary_name {
                    m.name() != Some(pname)
                } else {
                    true
                }
            })
        } else {
            app.primary_monitor().map_err(|e| e.to_string())?
        }
    };

    let stage_win = if let Some(win) = app.get_webview_window("stage") {
        win
    } else {
        WebviewWindowBuilder::new(
            &app,
            "stage",
            WebviewUrl::App("index.html?window=stage".into()),
        )
        .title("NEXA Church — Stage Display")
        .decorations(true)
        .resizable(true)
        .always_on_top(false)
        .inner_size(1280.0, 720.0)
        .center()
        .build()
        .map_err(|e| format!("Error al crear ventana de retorno de escenario: {}", e))?
    };

    if let Some(m) = target_monitor {
        let pos = m.position();
        let size = m.size();
        let _ = stage_win.set_position(tauri::Position::Physical(*pos));
        let _ = stage_win.set_size(tauri::Size::Physical(*size));
    }

    if fullscreen.unwrap_or(false) {
        let _ = stage_win.set_fullscreen(true);
    } else {
        let _ = stage_win.set_fullscreen(false);
    }

    stage_win.show().map_err(|e| e.to_string())?;
    stage_win.unminimize().map_err(|e| e.to_string())?;
    stage_win.set_focus().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn close_stage_window(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window("stage") {
        win.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}