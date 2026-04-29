use tauri::Manager;

#[tauri::command]
pub fn copy_to_clipboard(app: tauri::AppHandle, text: String) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;
    app.clipboard()
        .write_text(text)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn paste_to_active_app() -> Result<(), String> {
    use enigo::{Enigo, Key, Keyboard, Settings};
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    // Small delay to let window switch complete
    std::thread::sleep(std::time::Duration::from_millis(100));
    #[cfg(target_os = "macos")]
    {
        enigo.key(Key::Meta, enigo::Direction::Press).map_err(|e| e.to_string())?;
        enigo.key(Key::Unicode('v'), enigo::Direction::Click).map_err(|e| e.to_string())?;
        enigo.key(Key::Meta, enigo::Direction::Release).map_err(|e| e.to_string())?;
    }
    #[cfg(not(target_os = "macos"))]
    {
        enigo.key(Key::Control, enigo::Direction::Press).map_err(|e| e.to_string())?;
        enigo.key(Key::Unicode('v'), enigo::Direction::Click).map_err(|e| e.to_string())?;
        enigo.key(Key::Control, enigo::Direction::Release).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn toggle_quick_launcher(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("quicklauncher") {
        if window.is_visible().unwrap_or(false) {
            window.hide().map_err(|e| e.to_string())?;
        } else {
            window.show().map_err(|e| e.to_string())?;
            window.set_focus().map_err(|e| e.to_string())?;
            window.center().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn show_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn hide_main_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}
