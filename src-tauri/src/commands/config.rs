use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChurchConfig {
    pub selected_display_id: Option<usize>,
    pub last_media_folder: Option<String>,
    pub last_project_path: Option<String>,
    pub default_bible_version: Option<String>,
    pub presentation_fullscreen: Option<bool>,
}

impl Default for ChurchConfig {
    fn default() -> Self {
        Self {
            selected_display_id: None,
            last_media_folder: None,
            last_project_path: None,
            default_bible_version: Some("RVR1960".to_string()),
            presentation_fullscreen: Some(true),
        }
    }
}

fn get_config_path() -> Option<PathBuf> {
    dirs::config_dir().map(|mut p| {
        p.push("SHALIM_TECHNOLOGIES");
        p.push("NEXA_Church");
        let _ = fs::create_dir_all(&p);
        p.push("config.json");
        p
    })
}

fn get_bibles_dir() -> Option<PathBuf> {
    dirs::config_dir().map(|mut p| {
        p.push("SHALIM_TECHNOLOGIES");
        p.push("NEXA_Church");
        p.push("bibles");
        let _ = fs::create_dir_all(&p);
        p
    })
}

fn get_canonical_book_name(usfm: &str, fallback: &str) -> String {
    match usfm.to_uppercase().as_str() {
        "GEN" => "Génesis", "EXO" => "Éxodo", "LEV" => "Levítico", "NUM" => "Números", "DEU" => "Deuteronomio",
        "JOS" => "Josué", "JDG" => "Jueces", "RUT" => "Rut", "1SA" => "1 Samuel", "2SA" => "2 Samuel",
        "1KI" => "1 Reyes", "2KI" => "2 Reyes", "1CH" => "1 Crónicas", "2CH" => "2 Crónicas",
        "EZR" => "Esdras", "NEH" => "Nehemías", "EST" => "Ester", "JOB" => "Job", "PSA" => "Salmos",
        "PRO" => "Proverbios", "ECC" => "Eclesiastés", "SNG" => "Cantares", "ISA" => "Isaías",
        "JER" => "Jeremías", "LAM" => "Lamentaciones", "EZK" => "Ezequiel", "DAN" => "Daniel",
        "HOS" => "Oseas", "JOL" => "Joel", "AMO" => "Amós", "OBA" => "Abdías", "JON" => "Jonás",
        "MIC" => "Miqueas", "NAM" => "Nahúm", "HAB" => "Habacuc", "ZEP" => "Sofonías", "HAG" => "Hageo",
        "ZEC" => "Zacarías", "MAL" => "Malaquías", "MAT" => "Mateo", "MRK" => "Marcos", "LUK" => "Lucas",
        "JHN" => "Juan", "ACT" => "Hechos", "ROM" => "Romanos", "1CO" => "1 Corintios", "2CO" => "2 Corintios",
        "GAL" => "Gálatas", "EPH" => "Efesios", "PHP" => "Filipenses", "COL" => "Colosenses",
        "1TH" => "1 Tesalonicenses", "2TH" => "2 Tesalonicenses", "1TI" => "1 Timoteo",
        "2TI" => "2 Timoteo", "TIT" => "Tito", "PHM" => "Filemón", "HEB" => "Hebreos", "JAS" => "Santiago",
        "1PE" => "1 Pedro", "2PE" => "2 Pedro", "1JN" => "1 Juan", "2JN" => "2 Juan", "3JN" => "3 Juan",
        "JUD" => "Judas", "REV" => "Apocalipsis",
        _ => if !fallback.is_empty() { fallback } else { usfm },
    }.to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledBibleData {
    pub id: String,
    pub name: String,
    pub copyright: String,
    pub verses: std::collections::HashMap<String, String>,
}

#[tauri::command]
pub async fn load_installed_bibles(app_handle: tauri::AppHandle) -> Result<Vec<InstalledBibleData>, String> {
    let target_dir = get_bibles_dir().ok_or_else(|| "No se pudo determinar el directorio de biblias".to_string())?;

    // 1. Si faltan biblias en target_dir, copiar automáticamente las empaquetadas con el instalador
    let mut candidate_bundled = Vec::new();
    if let Ok(res) = app_handle.path().resource_dir() {
        candidate_bundled.push(res.join("bundled_bibles"));
        candidate_bundled.push(res.join("resources").join("bundled_bibles"));
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(p) = exe.parent() {
            candidate_bundled.push(p.join("bundled_bibles"));
            candidate_bundled.push(p.join("resources").join("bundled_bibles"));
        }
    }
    candidate_bundled.push(PathBuf::from("src-tauri/bundled_bibles"));
    candidate_bundled.push(PathBuf::from("bundled_bibles"));

    for b_dir in candidate_bundled {
        if b_dir.exists() && b_dir.is_dir() {
            if let Ok(entries) = fs::read_dir(&b_dir) {
                for entry in entries.filter_map(|e| e.ok()) {
                    let p = entry.path();
                    if p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("json") {
                        if let Some(file_name) = p.file_name() {
                            let dest = target_dir.join(file_name);
                            if !dest.exists() {
                                let _ = fs::copy(&p, &dest);
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. Cargar todas las biblias presentes en target_dir
    let mut bibles = Vec::new();
    if let Ok(entries) = fs::read_dir(&target_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|e| e.to_str()) == Some("json") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(bible) = serde_json::from_str::<InstalledBibleData>(&content) {
                        bibles.push(bible);
                    }
                }
            }
        }
    }

    // 3. Fallback retrocompatible si aún estuviera vacío
    if bibles.is_empty() {
        if let Some(doc_dir) = dirs::document_dir() {
            let bi_file = doc_dir.join("Reina Valera 1960 - RV1960.bi");
            if bi_file.exists() {
                if let Ok(imported) = import_bible_file(bi_file.to_string_lossy().to_string()).await {
                    bibles.push(imported);
                }
            }
        }
    }

    // 4. Ordenar con jerarquía preferente: RVR1960, NTV, NVI, etc.
    bibles.sort_by(|a, b| {
        let rank = |id: &str| match id {
            "RVR1960" => 0,
            "NTV" => 1,
            "NVI" => 2,
            "TLA" => 3,
            "LBLA" => 4,
            "NBLA" => 5,
            "RVC" => 6,
            "RVA2015" => 7,
            "DHH94I" => 8,
            "DHHS94" => 9,
            "TLAI" => 10,
            "NVI_CAST" => 11,
            _ => 99,
        };
        rank(&a.id).cmp(&rank(&b.id)).then_with(|| a.name.cmp(&b.name))
    });

    Ok(bibles)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstalledBibleMeta {
    pub id: String,
    pub name: String,
    pub copyright: String,
}

#[tauri::command]
pub async fn load_installed_bibles_metadata(app_handle: tauri::AppHandle) -> Result<Vec<InstalledBibleMeta>, String> {
    let target_dir = get_bibles_dir().ok_or_else(|| "No se pudo determinar el directorio de biblias".to_string())?;

    // Copiar automáticamente las empaquetadas con el instalador si no están en target_dir
    let mut candidate_bundled = Vec::new();
    if let Ok(res) = app_handle.path().resource_dir() {
        candidate_bundled.push(res.join("bundled_bibles"));
        candidate_bundled.push(res.join("resources").join("bundled_bibles"));
    }
    if let Ok(exe) = std::env::current_exe() {
        if let Some(p) = exe.parent() {
            candidate_bundled.push(p.join("bundled_bibles"));
            candidate_bundled.push(p.join("resources").join("bundled_bibles"));
        }
    }
    candidate_bundled.push(PathBuf::from("src-tauri/bundled_bibles"));
    candidate_bundled.push(PathBuf::from("bundled_bibles"));

    for b_dir in candidate_bundled {
        if b_dir.exists() && b_dir.is_dir() {
            if let Ok(entries) = fs::read_dir(&b_dir) {
                for entry in entries.filter_map(|e| e.ok()) {
                    let p = entry.path();
                    if p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("json") {
                        if let Some(file_name) = p.file_name() {
                            let dest = target_dir.join(file_name);
                            if !dest.exists() {
                                let _ = fs::copy(&p, &dest);
                            }
                        }
                    }
                }
            }
        }
    }

    let mut bibles = Vec::new();
    if let Ok(entries) = fs::read_dir(&target_dir) {
        for entry in entries.filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|e| e.to_str()) == Some("json") {
                if let Ok(file) = fs::File::open(&path) {
                    let reader = std::io::BufReader::new(file);
                    #[derive(Deserialize)]
                    struct PartialBible {
                        id: String,
                        name: String,
                        copyright: Option<String>,
                    }
                    if let Ok(partial) = serde_json::from_reader::<_, PartialBible>(reader) {
                        bibles.push(InstalledBibleMeta {
                            id: partial.id,
                            name: partial.name,
                            copyright: partial.copyright.unwrap_or_else(|| "Copia local".to_string()),
                        });
                    }
                }
            }
        }
    }

    bibles.sort_by(|a, b| {
        let rank = |id: &str| match id {
            "RVR1960" => 0,
            "NTV" => 1,
            "NVI" => 2,
            "TLA" => 3,
            "LBLA" => 4,
            "NBLA" => 5,
            "RVC" => 6,
            "RVA2015" => 7,
            "DHH94I" => 8,
            "DHHS94" => 9,
            "TLAI" => 10,
            "NVI_CAST" => 11,
            _ => 99,
        };
        rank(&a.id).cmp(&rank(&b.id)).then_with(|| a.name.cmp(&b.name))
    });

    Ok(bibles)
}

#[tauri::command]
pub async fn load_bible_verses(bible_id: String) -> Result<std::collections::HashMap<String, String>, String> {
    let target_dir = get_bibles_dir().ok_or_else(|| "No se pudo determinar el directorio de biblias".to_string())?;
    let safe_id = bible_id.replace(|c: char| !c.is_alphanumeric() && c != '-' && c != '_', "_");
    let path = target_dir.join(format!("{}.json", safe_id));
    if !path.exists() {
        return Err(format!("Biblia no encontrada: {}", bible_id));
    }
    let file = fs::File::open(&path).map_err(|e| e.to_string())?;
    let reader = std::io::BufReader::new(file);
    #[derive(Deserialize)]
    struct VersesOnly {
        verses: std::collections::HashMap<String, String>,
    }
    let parsed: VersesOnly = serde_json::from_reader(reader).map_err(|e| e.to_string())?;
    Ok(parsed.verses)
}

#[tauri::command]
pub async fn save_installed_bible(bible: InstalledBibleData) -> Result<(), String> {
    if let Some(mut path) = get_bibles_dir() {
        let safe_id = bible.id.replace(|c: char| !c.is_alphanumeric() && c != '-' && c != '_', "_");
        path.push(format!("{}.json", safe_id));
        let json = serde_json::to_string(&bible).map_err(|e| e.to_string())?;
        fs::write(&path, json).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("No se pudo determinar el directorio de biblias".to_string())
    }
}

#[tauri::command]
pub async fn import_bible_file(file_path: String) -> Result<InstalledBibleData, String> {
    let path = Path::new(&file_path);
    if !path.exists() || !path.is_file() {
        return Err(format!("Archivo no encontrado o no válido: {}", file_path));
    }

    let file_stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("Biblia").to_string();
    let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();

    // 1. Archivo JSON estructurado
    if ext == "json" {
        let content = fs::read_to_string(path).map_err(|e| format!("Error al leer JSON: {}", e))?;
        let parsed: serde_json::Value = serde_json::from_str(&content).map_err(|e| format!("Formato JSON no válido: {}", e))?;

        let id = parsed.get("local_abbreviation")
            .or_else(|| parsed.get("id"))
            .and_then(|v| v.as_str())
            .unwrap_or(&file_stem)
            .to_string();

        let name = parsed.get("local_title")
            .or_else(|| parsed.get("name"))
            .or_else(|| parsed.get("title"))
            .or_else(|| parsed.get("version"))
            .and_then(|v| v.as_str())
            .unwrap_or(&file_stem)
            .to_string();

        let copyright = if let Some(c_obj) = parsed.get("copyright").and_then(|c| c.as_object()) {
            c_obj.get("text").or_else(|| c_obj.get("html")).and_then(|v| v.as_str()).unwrap_or("Copia de usuario").to_string()
        } else {
            parsed.get("copyright").and_then(|v| v.as_str()).unwrap_or("Copia de usuario").to_string()
        };

        let mut verses = std::collections::HashMap::new();

        // 1a. Formato plano {"verses": {"Juan 3:16": "..."}}
        if let Some(v_obj) = parsed.get("verses").and_then(|v| v.as_object()) {
            for (k, v) in v_obj {
                if let Some(txt) = v.as_str() {
                    verses.insert(k.clone(), txt.to_string());
                }
            }
        }

        // 1b. Formato estructurado con 'books'
        if verses.is_empty() {
            if let Some(books_arr) = parsed.get("books").and_then(|b| b.as_array()) {
                for book in books_arr {
                    let usfm = book.get("usfm").and_then(|v| v.as_str()).unwrap_or("");
                    let human = book.get("human").or_else(|| book.get("name")).and_then(|v| v.as_str()).unwrap_or("");
                    let canonical = get_canonical_book_name(usfm, human);

                    if let Some(chapters) = book.get("chapters").and_then(|c| c.as_array()) {
                        for (ch_idx, ch) in chapters.iter().enumerate() {
                            let ch_num = ch.get("number")
                                .or_else(|| ch.get("chapter"))
                                .and_then(|v| v.as_u64())
                                .map(|n| n as usize)
                                .or_else(|| {
                                    ch.get("usfm").and_then(|v| v.as_str()).and_then(|u| {
                                        u.rsplit('.').next().and_then(|s| s.parse::<usize>().ok())
                                    })
                                })
                                .or_else(|| {
                                    ch.get("human").and_then(|v| v.as_str()).and_then(|h| {
                                        h.split_whitespace().last().and_then(|s| s.parse::<usize>().ok())
                                    })
                                })
                                .unwrap_or(ch_idx + 1);

                            // Formato bible-data con 'items'
                            if let Some(items) = ch.get("items").and_then(|i| i.as_array()) {
                                for it in items {
                                    if it.get("type").and_then(|t| t.as_str()) == Some("verse") {
                                        let text = if let Some(lines) = it.get("lines").and_then(|l| l.as_array()) {
                                            lines.iter().filter_map(|l| l.as_str()).collect::<Vec<_>>().join(" ")
                                        } else if let Some(txt) = it.get("text").and_then(|t| t.as_str()) {
                                            txt.to_string()
                                        } else {
                                            String::new()
                                        };
                                        let text = text.trim().to_string();
                                        if !text.is_empty() {
                                            if let Some(nums) = it.get("verse_numbers").and_then(|v| v.as_array()) {
                                                for n in nums.iter().filter_map(|num| num.as_u64()) {
                                                    verses.insert(format!("{} {}:{}", canonical, ch_num, n), text.clone());
                                                    if !human.is_empty() && human != canonical {
                                                        verses.insert(format!("{} {}:{}", human, ch_num, n), text.clone());
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            // Formato estándar con 'verses' array
                            if let Some(verses_arr) = ch.get("verses").and_then(|v| v.as_array()) {
                                for v in verses_arr {
                                    if let (Some(num), Some(txt)) = (
                                        v.get("number").or_else(|| v.get("verse")).and_then(|n| n.as_u64()),
                                        v.get("text").and_then(|t| t.as_str()),
                                    ) {
                                        let clean_txt = txt.trim().to_string();
                                        verses.insert(format!("{} {}:{}", canonical, ch_num, num), clean_txt.clone());
                                        if !human.is_empty() && human != canonical {
                                            verses.insert(format!("{} {}:{}", human, ch_num, num), clean_txt);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        if verses.is_empty() {
            return Err("El archivo JSON no contiene versículos en un formato reconocido (requiere 'verses' o 'books')".to_string());
        }

        let bible = InstalledBibleData { id, name, copyright, verses };
        save_installed_bible(bible.clone()).await?;
        return Ok(bible);
    }

    // 2. Archivo .bi (comprimido ZIP o texto plano delimitado por |)
    let raw_bytes = fs::read(path).map_err(|e| format!("Error al leer archivo: {}", e))?;
    let bi_text = if raw_bytes.starts_with(b"PK\x03\x04") {
        let temp_dir = std::env::temp_dir().join(format!(
            "nexa_bi_{}",
            std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis()
        ));
        let _ = fs::create_dir_all(&temp_dir);

        #[cfg(windows)]
        {
            use std::process::Command;
            let status = Command::new("tar")
                .args(["-xf", &file_path, "-C", temp_dir.to_str().unwrap_or(".")])
                .status();

            if status.map(|s| s.success()).unwrap_or(false) {
                let mut found_text = None;
                if let Ok(entries) = fs::read_dir(&temp_dir) {
                    for entry in entries.filter_map(|e| e.ok()) {
                        let ep = entry.path();
                        if ep.is_file() {
                            if let Ok(txt) = fs::read_to_string(&ep) {
                                found_text = Some(txt);
                                break;
                            }
                        }
                    }
                }
                let _ = fs::remove_dir_all(&temp_dir);
                found_text.ok_or_else(|| "No se pudo extraer el contenido del archivo .bi".to_string())?
            } else {
                let _ = fs::remove_dir_all(&temp_dir);
                return Err("Error al descomprimir archivo .bi".to_string());
            }
        }
        #[cfg(not(windows))]
        {
            return Err("Extracción ZIP no disponible en este sistema operativo".to_string());
        }
    } else {
        String::from_utf8_lossy(&raw_bytes).to_string()
    };

    let canonical_books = [
        "Génesis", "Éxodo", "Levítico", "Números", "Deuteronomio",
        "Josué", "Jueces", "Rut", "1 Samuel", "2 Samuel",
        "1 Reyes", "2 Reyes", "1 Crónicas", "2 Crónicas", "Esdras",
        "Nehemías", "Ester", "Job", "Salmos", "Proverbios",
        "Eclesiastés", "Cantares", "Isaías", "Jeremías", "Lamentaciones",
        "Ezequiel", "Daniel", "Oseas", "Joel", "Amós",
        "Abdías", "Jonás", "Miqueas", "Nahúm", "Habacuc",
        "Sofonías", "Hageo", "Zacarías", "Malaquías",
        "Mateo", "Marcos", "Lucas", "Juan", "Hechos",
        "Romanos", "1 Corintios", "2 Corintios", "Gálatas", "Efesios",
        "Filipenses", "Colosenses", "1 Tesalonicenses", "2 Tesalonicenses", "1 Timoteo",
        "2 Timoteo", "Tito", "Filemón", "Hebreos", "Santiago",
        "1 Pedro", "2 Pedro", "1 Juan", "2 Juan", "3 Juan",
        "Judas", "Apocalipsis",
    ];

    let mut verses = std::collections::HashMap::new();
    for line in bi_text.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() { continue; }
        let parts: Vec<&str> = trimmed.split('|').collect();
        if parts.len() >= 4 {
            if let (Ok(book_num), Ok(ch), Ok(v)) = (parts[0].parse::<usize>(), parts[1].parse::<u32>(), parts[2].parse::<u32>()) {
                if book_num >= 1 && book_num <= canonical_books.len() {
                    let book_name = canonical_books[book_num - 1];
                    let text = parts[3..].join("|").trim().to_string();
                    verses.insert(format!("{} {}:{}", book_name, ch, v), text);
                }
            }
        }
    }

    if verses.is_empty() {
        return Err("No se encontraron versículos válidos en el archivo .bi (formato requerido: Libro|Capítulo|Versículo|Texto)".to_string());
    }

    let id = if file_stem.to_lowercase().contains("1960") {
        "RVR1960".to_string()
    } else {
        file_stem.replace(|c: char| !c.is_alphanumeric(), "_")
    };

    let name = if id == "RVR1960" {
        "Reina-Valera 1960".to_string()
    } else {
        file_stem.clone()
    };

    let copyright = "Sociedades Bíblicas Unidas (Copia local de la iglesia)".to_string();

    let bible = InstalledBibleData { id, name, copyright, verses };
    save_installed_bible(bible.clone()).await?;

    Ok(bible)
}

fn get_announcements_dir() -> Option<PathBuf> {
    dirs::config_dir().map(|mut p| {
        p.push("SHALIM_TECHNOLOGIES");
        p.push("NEXA_Church");
        p.push("announcements");
        let _ = fs::create_dir_all(&p);
        p
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedAnnouncementData {
    pub id: String,
    pub name: String,
    pub background: Option<serde_json::Value>,
    pub layers: Vec<serde_json::Value>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[tauri::command]
pub async fn load_saved_announcements() -> Result<Vec<SavedAnnouncementData>, String> {
    let mut announcements = Vec::new();
    if let Some(dir) = get_announcements_dir() {
        if dir.exists() {
            if let Ok(entries) = fs::read_dir(&dir) {
                for entry in entries.filter_map(|e| e.ok()) {
                    let path = entry.path();
                    if path.is_file() && path.extension().and_then(|e| e.to_str()) == Some("json") {
                        if let Ok(content) = fs::read_to_string(&path) {
                            if let Ok(item) = serde_json::from_str::<SavedAnnouncementData>(&content) {
                                announcements.push(item);
                            }
                        }
                    }
                }
            }
        }
    }
    announcements.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(announcements)
}

#[tauri::command]
pub async fn save_announcement(announcement: SavedAnnouncementData) -> Result<(), String> {
    if let Some(mut path) = get_announcements_dir() {
        let safe_id = announcement.id.replace(|c: char| !c.is_alphanumeric() && c != '-' && c != '_', "_");
        path.push(format!("{}.json", safe_id));
        let json = serde_json::to_string_pretty(&announcement).map_err(|e| e.to_string())?;
        fs::write(&path, json).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("No se pudo determinar el directorio de anuncios".to_string())
    }
}

#[tauri::command]
pub async fn delete_announcement(id: String) -> Result<(), String> {
    if let Some(mut path) = get_announcements_dir() {
        let safe_id = id.replace(|c: char| !c.is_alphanumeric() && c != '-' && c != '_', "_");
        path.push(format!("{}.json", safe_id));
        if path.exists() {
            fs::remove_file(&path).map_err(|e| e.to_string())?;
        }
        Ok(())
    } else {
        Err("No se pudo determinar el directorio de anuncios".to_string())
    }
}

fn get_songs_dir() -> Option<PathBuf> {
    dirs::config_dir().map(|mut p| {
        p.push("SHALIM_TECHNOLOGIES");
        p.push("NEXA_Church");
        p.push("songs");
        let _ = fs::create_dir_all(&p);
        p
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SavedSongData {
    pub id: String,
    pub title: String,
    pub artist: Option<String>,
    pub author: Option<String>,
    #[serde(rename = "originalKey")]
    pub original_key: Option<String>,
    pub tempo: Option<u32>,
    #[serde(rename = "timeSignature")]
    pub time_signature: Option<String>,
    #[serde(rename = "ccliNumber")]
    pub ccli_number: Option<String>,
    pub tags: Option<Vec<String>>,
    pub sections: Vec<serde_json::Value>,
    pub arrangements: Vec<serde_json::Value>,
    #[serde(rename = "defaultArrangementId")]
    pub default_arrangement_id: Option<String>,
    pub theme: Option<serde_json::Value>,
    #[serde(rename = "createdAt")]
    pub created_at: Option<String>,
    #[serde(rename = "updatedAt")]
    pub updated_at: Option<String>,
}

#[tauri::command]
pub async fn load_saved_songs() -> Result<Vec<SavedSongData>, String> {
    let mut songs = Vec::new();
    if let Some(dir) = get_songs_dir() {
        if dir.exists() {
            if let Ok(entries) = fs::read_dir(&dir) {
                for entry in entries.filter_map(|e| e.ok()) {
                    let path = entry.path();
                    if path.is_file() && path.extension().and_then(|e| e.to_str()) == Some("json") {
                        if let Ok(content) = fs::read_to_string(&path) {
                            if let Ok(item) = serde_json::from_str::<SavedSongData>(&content) {
                                songs.push(item);
                            }
                        }
                    }
                }
            }
        }
    }
    songs.sort_by(|a, b| a.title.to_lowercase().cmp(&b.title.to_lowercase()));
    Ok(songs)
}

#[tauri::command]
pub async fn save_song(song: SavedSongData) -> Result<(), String> {
    if let Some(mut path) = get_songs_dir() {
        let safe_id = song.id.replace(|c: char| !c.is_alphanumeric() && c != '-' && c != '_', "_");
        path.push(format!("{}.json", safe_id));
        let json = serde_json::to_string_pretty(&song).map_err(|e| e.to_string())?;
        fs::write(&path, json).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("No se pudo determinar el directorio de canciones".to_string())
    }
}

#[tauri::command]
pub async fn delete_song(id: String) -> Result<(), String> {
    if let Some(mut path) = get_songs_dir() {
        let safe_id = id.replace(|c: char| !c.is_alphanumeric() && c != '-' && c != '_', "_");
        path.push(format!("{}.json", safe_id));
        if path.exists() {
            fs::remove_file(&path).map_err(|e| e.to_string())?;
        }
        Ok(())
    } else {
        Err("No se pudo determinar el directorio de canciones".to_string())
    }
}

#[tauri::command]
pub async fn load_church_config() -> Result<ChurchConfig, String> {
    if let Some(path) = get_config_path() {
        if path.exists() {
            if let Ok(content) = fs::read_to_string(&path) {
                if let Ok(config) = serde_json::from_str::<ChurchConfig>(&content) {
                    return Ok(config);
                }
            }
        }
    }
    Ok(ChurchConfig::default())
}

#[tauri::command]
pub async fn save_church_config(config: ChurchConfig) -> Result<(), String> {
    if let Some(path) = get_config_path() {
        let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
        fs::write(&path, json).map_err(|e| e.to_string())?;
        Ok(())
    } else {
        Err("No se pudo determinar el directorio de configuración".to_string())
    }
}