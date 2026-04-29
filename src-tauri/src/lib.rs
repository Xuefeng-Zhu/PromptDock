mod commands;

use tauri::Manager;
use tauri_plugin_global_shortcut::ShortcutState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::copy_to_clipboard,
            commands::paste_to_active_app,
            commands::register_hotkey,
            commands::unregister_hotkey,
            commands::toggle_quick_launcher,
            commands::show_main_window,
            commands::hide_main_window,
        ])
        .setup(|app| {
            // ---------------------------------------------------------------
            // System tray icon with "Quit" context menu
            // ---------------------------------------------------------------
            let quit_item = tauri::menu::MenuItemBuilder::with_id("quit", "Quit")
                .build(app)?;

            let tray_menu = tauri::menu::MenuBuilder::new(app)
                .item(&quit_item)
                .build()?;

            let _tray = tauri::tray::TrayIconBuilder::new()
                .icon(app.default_window_icon().cloned().expect("no app icon configured"))
                .menu(&tray_menu)
                .tooltip("PromptDock")
                .on_tray_icon_event(|tray_icon, event| {
                    // Toggle main window visibility on left click.
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray_icon.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .on_menu_event(|app, event| {
                    if event.id().as_ref() == "quit" {
                        app.exit(0);
                    }
                })
                .build(app)?;

            // ---------------------------------------------------------------
            // Register the default global hotkey (Cmd+Shift+P / Ctrl+Shift+P)
            // on app startup so the quick launcher is immediately accessible.
            // ---------------------------------------------------------------
            use tauri_plugin_global_shortcut::GlobalShortcutExt;

            let handle = app.handle().clone();
            let gs = app.handle().global_shortcut();
            let default_shortcut = "CommandOrControl+Shift+P";

            if let Err(e) = gs.on_shortcut(default_shortcut, move |_app, _shortcut, event| {
                if event.state == ShortcutState::Pressed {
                    let _ = commands::toggle_quick_launcher(handle.clone());
                }
            }) {
                eprintln!("Failed to register default hotkey: {e}");
            }

            Ok(())
        })
        // ---------------------------------------------------------------
        // Intercept window close on the main window: hide instead of quit
        // so the app stays in the system tray.
        // ---------------------------------------------------------------
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    // Prevent the window from actually closing.
                    api.prevent_close();
                    // Hide the window (minimize to tray).
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running PromptDock");
}
