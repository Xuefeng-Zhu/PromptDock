use std::sync::Mutex;

use tauri::{AppHandle, Manager, Runtime, State};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

#[derive(Default)]
pub struct CurrentHotkey(pub Mutex<Option<String>>);

#[derive(Default)]
pub struct LastActiveApp(pub Mutex<Option<i32>>);

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
pub fn paste_to_active_app<R: Runtime>(
    app: AppHandle<R>,
    last_active_app: State<'_, LastActiveApp>,
) -> Result<(), String> {
    use enigo::{Direction, Enigo, Key, Keyboard, Settings};

    remember_frontmost_app(&last_active_app);

    let mut enigo =
        Enigo::new(&Settings::default()).map_err(|e| format!("Failed to create Enigo: {e}"))?;

    hide_promptdock_for_paste(&app)?;
    activate_last_active_app(&last_active_app);

    // Small delay to let the window hide and the target app gain focus.
    std::thread::sleep(std::time::Duration::from_millis(350));

    #[cfg(target_os = "macos")]
    {
        enigo
            .key(Key::Meta, Direction::Press)
            .map_err(format_paste_error)?;
        // macOS virtual keycode 9 is the physical V key. Using the raw keycode
        // avoids layout-dependent Unicode synthesis while Command is held.
        let click_result = enigo.raw(9, Direction::Click);
        let release_result = enigo.key(Key::Meta, Direction::Release);

        click_result.map_err(format_paste_error)?;
        release_result.map_err(format_paste_error)?;
    }

    #[cfg(not(target_os = "macos"))]
    {
        enigo
            .key(Key::Control, Direction::Press)
            .map_err(format_paste_error)?;
        let click_result = enigo.key(Key::Unicode('v'), Direction::Click);
        let release_result = enigo.key(Key::Control, Direction::Release);

        click_result.map_err(format_paste_error)?;
        release_result.map_err(format_paste_error)?;
    }

    Ok(())
}

// ---------------------------------------------------------------------------
// Hotkey Registration Commands
// ---------------------------------------------------------------------------

/// Register a global hotkey that toggles the quick launcher window.
#[tauri::command]
pub fn register_hotkey<R: Runtime>(
    app: AppHandle<R>,
    current_hotkey: State<'_, CurrentHotkey>,
    shortcut: String,
) -> Result<(), String> {
    let shortcut = shortcut.trim().to_string();
    if shortcut.is_empty() {
        return unregister_hotkey(app, current_hotkey);
    }

    let existing = current_hotkey
        .0
        .lock()
        .map_err(|_| "Failed to access current hotkey state".to_string())?
        .clone();

    if existing.as_deref() == Some(shortcut.as_str()) {
        return Ok(());
    }

    let gs = app.global_shortcut();
    let app_handle = app.clone();

    gs.on_shortcut(shortcut.as_str(), move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            let last_active_app = app_handle.state::<LastActiveApp>();
            let _ = do_toggle_quick_launcher(&app_handle, &last_active_app);
        }
    })
    .map_err(|e| format!("Failed to register hotkey '{shortcut}': {e}"))?;

    if let Some(old_shortcut) = existing {
        if let Err(e) = gs.unregister(old_shortcut.as_str()) {
            let _ = gs.unregister(shortcut.as_str());
            return Err(format!(
                "Registered hotkey '{shortcut}', but failed to unregister previous hotkey '{old_shortcut}': {e}"
            ));
        }
    }

    *current_hotkey
        .0
        .lock()
        .map_err(|_| "Failed to update current hotkey state".to_string())? = Some(shortcut);

    Ok(())
}

/// Unregister the current global hotkey.
#[tauri::command]
pub fn unregister_hotkey<R: Runtime>(
    app: AppHandle<R>,
    current_hotkey: State<'_, CurrentHotkey>,
) -> Result<(), String> {
    let existing = current_hotkey
        .0
        .lock()
        .map_err(|_| "Failed to access current hotkey state".to_string())?
        .clone();

    let gs = app.global_shortcut();
    if let Some(shortcut) = existing {
        gs.unregister(shortcut.as_str())
            .map_err(|e| format!("Failed to unregister hotkey '{shortcut}': {e}"))?;
    } else {
        gs.unregister_all()
            .map_err(|e| format!("Failed to unregister hotkey: {e}"))?;
    }

    *current_hotkey
        .0
        .lock()
        .map_err(|_| "Failed to update current hotkey state".to_string())? = None;

    Ok(())
}

// ---------------------------------------------------------------------------
// Window Management Commands
// ---------------------------------------------------------------------------

/// Toggle the quick launcher window visibility.
#[tauri::command]
pub fn toggle_quick_launcher<R: Runtime>(
    app: AppHandle<R>,
    last_active_app: State<'_, LastActiveApp>,
) -> Result<(), String> {
    do_toggle_quick_launcher(&app, &last_active_app)
}

pub fn toggle_quick_launcher_from_hotkey<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    let last_active_app = app.state::<LastActiveApp>();
    do_toggle_quick_launcher(&app, &last_active_app)
}

/// Show the main application window and bring it to focus.
#[tauri::command]
pub fn show_main_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    show_promptdock(&app)?;

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
fn do_toggle_quick_launcher<R: Runtime>(
    app: &AppHandle<R>,
    last_active_app: &LastActiveApp,
) -> Result<(), String> {
    let window = app
        .get_webview_window("quick-launcher")
        .ok_or_else(|| "Quick launcher window not found".to_string())?;

    if window.is_visible().unwrap_or(false) {
        window
            .hide()
            .map_err(|e| format!("Failed to hide quick launcher: {e}"))?;
    } else {
        remember_frontmost_app(last_active_app);
        show_promptdock(app)?;

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

#[cfg(target_os = "macos")]
fn remember_frontmost_app(last_active_app: &LastActiveApp) {
    let Some(pid) = macos_frontmost_app_pid() else {
        return;
    };

    if pid <= 0 || pid == current_process_id() {
        return;
    }

    if let Ok(mut stored_pid) = last_active_app.0.lock() {
        *stored_pid = Some(pid);
    }
}

#[cfg(not(target_os = "macos"))]
fn remember_frontmost_app(_last_active_app: &LastActiveApp) {}

#[cfg(target_os = "macos")]
fn activate_last_active_app(last_active_app: &LastActiveApp) {
    use objc2_app_kit::{NSApplicationActivationOptions, NSRunningApplication};

    let stored_pid = last_active_app.0.lock().ok().and_then(|pid| *pid);

    let Some(pid) = stored_pid else {
        return;
    };

    if pid <= 0 || pid == current_process_id() {
        return;
    }

    let Some(target_app) = NSRunningApplication::runningApplicationWithProcessIdentifier(pid)
    else {
        if let Ok(mut stored_pid) = last_active_app.0.lock() {
            *stored_pid = None;
        }
        return;
    };

    if target_app.isTerminated() {
        if let Ok(mut stored_pid) = last_active_app.0.lock() {
            *stored_pid = None;
        }
        return;
    }

    let _ = target_app.unhide();
    #[allow(deprecated)]
    let options = NSApplicationActivationOptions::ActivateAllWindows
        | NSApplicationActivationOptions::ActivateIgnoringOtherApps;
    let _ = target_app.activateWithOptions(options);
}

#[cfg(not(target_os = "macos"))]
fn activate_last_active_app(_last_active_app: &LastActiveApp) {}

#[cfg(target_os = "macos")]
fn macos_frontmost_app_pid() -> Option<i32> {
    use objc2_app_kit::NSWorkspace;

    NSWorkspace::sharedWorkspace()
        .frontmostApplication()
        .map(|app| app.processIdentifier())
}

#[cfg(target_os = "macos")]
fn current_process_id() -> i32 {
    i32::try_from(std::process::id()).unwrap_or(-1)
}

fn format_paste_error<E: std::fmt::Display>(error: E) -> String {
    #[cfg(target_os = "macos")]
    {
        format!(
            "Paste failed: {error}. On macOS, enable PromptDock in System Settings > Privacy & Security > Accessibility."
        )
    }

    #[cfg(not(target_os = "macos"))]
    {
        format!("Paste failed: {error}")
    }
}

#[cfg(target_os = "macos")]
fn hide_promptdock_for_paste<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    app.hide()
        .map_err(|e| format!("Failed to hide PromptDock before paste: {e}"))
}

#[cfg(not(target_os = "macos"))]
fn hide_promptdock_for_paste<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    for label in ["quick-launcher", "main"] {
        if let Some(window) = app.get_webview_window(label) {
            if window.is_visible().unwrap_or(false) {
                window
                    .hide()
                    .map_err(|e| format!("Failed to hide {label} before paste: {e}"))?;
            }
        }
    }

    Ok(())
}

#[cfg(target_os = "macos")]
fn show_promptdock<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
    app.show()
        .map_err(|e| format!("Failed to show PromptDock: {e}"))
}

#[cfg(not(target_os = "macos"))]
fn show_promptdock<R: Runtime>(_app: &AppHandle<R>) -> Result<(), String> {
    Ok(())
}
