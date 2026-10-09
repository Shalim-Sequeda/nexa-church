use lofty::file::AudioFile;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChurchMediaItem {
    pub id: String,
    pub name: String,
    pub path: String,
    pub extension: String,
    pub size: u64,
    pub media_type: String,
    pub duration: Option<f64>,
}

#[tauri::command]
pub async fn scan_church_media(folder_path: String) -> Result<Vec<ChurchMediaItem>, String> {
    let path = Path::new(&folder_path);
    if !path.exists() || !path.is_dir() {
        return Err("Ruta de carpeta no válida".to_string());
    }

    let mut items = Vec::new();

    for entry in WalkDir::new(path).max_depth(3).into_iter().filter_map(|e| e.ok()) {
        let entry_path = entry.path();
        if entry_path.is_file() {
            if let Some(ext) = entry_path.extension().and_then(|e| e.to_str()).map(|e| e.to_lowercase()) {
                let is_audio = matches!(ext.as_str(), "mp3" | "wav" | "m4a" | "aac" | "ogg" | "flac");
                let is_video = matches!(ext.as_str(), "mp4" | "mov" | "m4v" | "webm" | "mkv" | "avi" | "wmv" | "mpg" | "mpeg" | "ts" | "qt");
                let is_image = matches!(ext.as_str(), "png" | "jpg" | "jpeg" | "webp" | "bmp" | "gif");
                let is_pdf = ext.as_str() == "pdf";

                if is_audio || is_video || is_image || is_pdf {
                    let media_type = if is_video {
                        "video"
                    } else if is_audio {
                        "audio"
                    } else if is_pdf {
                        "pdf"
                    } else {
                        "image"
                    };

                    let file_name = entry_path
                        .file_name()
                        .and_then(|f| f.to_str())
                        .unwrap_or("")
                        .to_string();
                    let full_path = entry_path.to_string_lossy().to_string();
                    let file_size = entry.metadata().map(|m| m.len()).unwrap_or(0);

                    let mut duration = None;
                    if (is_audio || is_video) && file_size > 0 {
                        if let Ok(tagged_file) = lofty::read_from_path(entry_path) {
                            let properties = tagged_file.properties();
                            let dur_sec = properties.duration().as_secs_f64();
                            if dur_sec > 0.0 {
                                duration = Some(dur_sec);
                            }
                        }
                    }

                    items.push(ChurchMediaItem {
                        id: full_path.replace('\\', "/").to_lowercase(),
                        name: file_name,
                        path: full_path,
                        extension: ext,
                        size: file_size,
                        media_type: media_type.to_string(),
                        duration,
                    });
                }
            }
        }
    }

    items.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(items)
}

#[tauri::command]
pub async fn read_project_file(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path).map_err(|e| format!("Error al leer proyecto: {}", e))
}

#[tauri::command]
pub async fn write_project_file(file_path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&file_path).parent() {
        let _ = fs::create_dir_all(parent);
    }
    fs::write(&file_path, content).map_err(|e| format!("Error al guardar proyecto: {}", e))
}

#[tauri::command]
pub async fn check_file_accessible(file_path: String) -> Result<bool, String> {
    let path = Path::new(&file_path);
    Ok(path.exists() && path.is_file())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaFilePayload {
    pub mime_type: String,
    pub base64_data: String,
}

#[tauri::command]
pub fn read_file_binary(file_path: String) -> Result<Vec<u8>, String> {
    let path = Path::new(&file_path);
    if !path.exists() || !path.is_file() {
        return Err(format!("Archivo no encontrado o no válido: {}", file_path));
    }
    fs::read(path).map_err(|e| format!("Error al leer archivo binario: {}", e))
}

#[tauri::command]
pub fn read_media_file(file_path: String) -> Result<MediaFilePayload, String> {
    use base64::Engine;
    let path = Path::new(&file_path);
    if !path.exists() || !path.is_file() {
        return Err(format!("Archivo no encontrado o no válido: {}", file_path));
    }

    let bytes = fs::read(path).map_err(|e| format!("Error al leer archivo: {}", e))?;
    let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
    let mime_type = match ext.as_str() {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "pdf" => "application/pdf",
        "mp4" => "video/mp4",
        "mov" | "qt" => "video/quicktime",
        "m4v" => "video/x-m4v",
        "webm" => "video/webm",
        "mkv" => "video/x-matroska",
        "avi" => "video/x-msvideo",
        "wmv" => "video/x-ms-wmv",
        "mpg" | "mpeg" => "video/mpeg",
        "ts" => "video/mp2t",
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "ogg" => "audio/ogg",
        "m4a" => "audio/mp4",
        "flac" => "audio/flac",
        _ => "application/octet-stream",
    };

    let base64_data = base64::engine::general_purpose::STANDARD.encode(&bytes);

    Ok(MediaFilePayload {
        mime_type: mime_type.to_string(),
        base64_data,
    })
}

fn get_pdf_pages_dir(subfolder: &str) -> Option<std::path::PathBuf> {
    dirs::config_dir().map(|mut p| {
        p.push("SHALIM_TECHNOLOGIES");
        p.push("NEXA_Church");
        p.push("pdf_pages");
        p.push(subfolder);
        let _ = fs::create_dir_all(&p);
        p
    })
}

#[tauri::command]
pub async fn save_pdf_page_image(
    subfolder: String,
    page_number: usize,
    base64_data: String,
) -> Result<String, String> {
    let mut dir = get_pdf_pages_dir(&subfolder).ok_or_else(|| "No se pudo obtener directorio de caché para PDF".to_string())?;
    let file_name = format!("page_{:03}.jpg", page_number);
    dir.push(&file_name);

    let clean_b64 = if let Some(idx) = base64_data.find(',') {
        &base64_data[idx + 1..]
    } else {
        &base64_data
    };

    use base64::Engine;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(clean_b64)
        .map_err(|e| format!("Error decodificando imagen base64 de página {}: {}", page_number, e))?;

    fs::write(&dir, bytes).map_err(|e| format!("Error guardando imagen de página {}: {}", page_number, e))?;

    Ok(dir.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_exists_and_readable() {
        let test_file = r"C:\Users\Shalim\Downloads\Por organizar\23.jpeg";
        let path = Path::new(test_file);
        if path.exists() {
            let bytes = fs::read(path).expect("Should be able to read file");
            assert!(!bytes.is_empty());
        }
    }

    #[test]
    fn test_read_media_file_command() {
        let test_file = r"C:\Users\Shalim\Downloads\Por organizar\23.jpeg".to_string();
        let result = read_media_file(test_file);
        match result {
            Ok(payload) => {
                println!("read_media_file SUCCESS!");
                println!("MIME type: {}", payload.mime_type);
                println!("Base64 length: {}", payload.base64_data.len());
                assert_eq!(payload.mime_type, "image/jpeg");
                assert!(!payload.base64_data.is_empty());
            }
            Err(e) => {
                panic!("read_media_file failed: {}", e);
            }
        }
    }
}