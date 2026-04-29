use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

// ---------------------------------------------------------------------------
// Clipboard & Paste Commands
// ---------------------------------------------------------------------------

/// Copy text to the system clipboard.
#[tauri::command]
pub fn copy_to_clipboard<R: Runtime>(app: AppHandle<R>, text: String) -> Result<(), String> {
    app.clipboard()
        .write_text(text)
        .map_err(|e| format!("Failed to copy to clipboard: {e}"))
}

/// Simulate Cmd+V (macOS) or Ctrl+V (Windows/Linux) paste into the currently
/// active application.  Uses the `enigo` crate for cross-platform keyboard
/// simulation.  A small delay is inserted before the key-press so the calling
/// window has time to hide and the target app can receive focus.
#[tauri::command]
pub fn paste_to_active_app() -> Result<(), String> {
    use enigo::{Direction, Enigo, Key, Keyboard, Settings};

    // Small delay to let the window hide and the target app gain focus.
    std::thread::sleep(std::time::Duration::from_millis(150));

    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create Enigo: {e}"))?;

    #[cfg(target_os = "macos")]
    {
        enigo
            .key(Key::Meta, Direction::Press)
            .map_err(|e| format!("Paste failed: {e}"))?;
        enigo
            .key(Key::Unicode('v'), Direction::Click)
            .map_err(|e| format!("Paste failed: {e}"))?;
        enigo
            .key(Key::Meta, Direction::Release)
            .map_err(|e| format!("Paste failed: {e}"))?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        enigo
            .key(Key::Control, Direction::Press)
            .map_err(|e| format!("Paste failed: {e}"))?;
        enigo
            .key(Key::Unicode('v'), Direction::Click)
            .map_err(|e| format!("Paste failed: {e}"))?;
        enigo
            .key(Key::Control, Direction::Release)
            .map_err(|e| format!("Paste failed: {e}"))?;
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Hotkey Registration Commands
// ---------------------------------------------------------------------------

/// Register a global hotkey that toggles the quick launcher window.
#[tauri::command]
pub fn register_hotkey<R: Runtime>(app: AppHandle<R>, shortcut: String) -> Result<(), String> {
    let gs = app.global_shortcut();

    // Unregister all existing shortcuts first to avoid conflicts.
    gs.unregister_all()
        .map_err(|e| format!("Failed to unregister existing shortcuts: {e}"))?;

    let app_handle = app.clone();
    gs.on_shortcut(shortcut.as_str(), move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let _ = do_toggle_quick_launcher(&app_handle);
        }
    })
    .map_err(|e| format!("Failed to register hotkey '{shortcut}': {e}"))?;

    Ok(())
}

/// Unregister the current global hotkey.
#[tauri::command]
pub fn unregister_hotkey<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    app.global_shortcut()
        .unregister_all()
        .map_err(|e| format!("Failed to unregister hotkey: {e}"))
}

// ---------------------------------------------------------------------------
// Window Management Commands
// ---------------------------------------------------------------------------

/// Toggle the quick launcher window visibility.
#[tauri::command]
pub fn toggle_quick_launcher<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    do_toggle_quick_launcher(&app)
}

/// Show the main application window and bring it to focus.
#[tauri::command]
pub fn show_main_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    window
        .show()
        .map_err(|e| format!("Failed to show main window: {e}"))?;
    window
        .set_focus()
        .map_err(|e| format!("Failed to focus main window: {e}"))?;

    Ok(())
}

/// Hide the main application window (minimize to tray).
#[tauri::command]
pub fn hide_main_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;

    window
        .hide()
        .map_err(|e| format!("Failed to hide main window: {e}"))?;

    Ok(())
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Shared logic for toggling the quick launcher window.
fn do_toggle_quick_launcher<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    let window = app
        .get_webview_window("quick-launcher")
        .ok_or_else(|| "Quick launcher window not found".to_string())?;

    if window.is_visible().unwrap_or(false) {
        window
            .hide()
            .map_err(|e| format!("Failed to hide quick launcher: {e}"))?;
    } else {
        // Center, show, and focus the quick launcher.
        window
            .center()
            .map_err(|e| format!("Failed to center quick launcher: {e}"))?;
        window
            .show()
            .map_err(|e| format!("Failed to show quick launcher: {e}"))?;
        window
            .set_focus()
            .map_err(|e| format!("Failed to focus quick launcher: {e}"))?;
    }

    Ok(())
}
