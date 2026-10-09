mod commands;

use commands::{
    broadcast::{get_broadcast_server_info, start_broadcast_server, update_broadcast_state},
    config::{
        delete_announcement, delete_song, import_bible_file, load_church_config, load_installed_bibles,
        load_installed_bibles_metadata, load_bible_verses,
        load_saved_announcements, load_saved_songs, save_announcement, save_church_config,
        save_installed_bible, save_song,
    },
    displays::{
        close_presentation_window, close_stage_window, get_available_displays,
        open_presentation_window, open_stage_window, toggle_presentation_fullscreen,
    },
    filesystem::{check_file_accessible, read_file_binary, read_media_file, read_project_file, save_pdf_page_image, scan_church_media, write_project_file},
};

#[tauri::command]
fn exit_app(app_handle: tauri::AppHandle) {
    app_handle.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            start_broadcast_server(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            exit_app,
            get_broadcast_server_info,
            update_broadcast_state,
            get_available_displays,
            open_presentation_window,
            close_presentation_window,
            toggle_presentation_fullscreen,
            open_stage_window,
            close_stage_window,
            scan_church_media,
            read_file_binary,
            read_media_file,
            read_project_file,
            write_project_file,
            save_pdf_page_image,
            check_file_accessible,
            load_church_config,
            save_church_config,
            load_installed_bibles,
            load_installed_bibles_metadata,
            load_bible_verses,
            save_installed_bible,
            import_bible_file,
            load_saved_announcements,
            save_announcement,
            delete_announcement,
            load_saved_songs,
            save_song,
            delete_song,
        ])
        .run(tauri::generate_context!())
        .expect("error while running NEXA Church application");
}