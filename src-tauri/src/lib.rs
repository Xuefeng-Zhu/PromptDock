mod commands;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(commands::CurrentHotkey::default())
        .manage(commands::LastActiveApp::default())
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
            let quit_item = tauri::menu::MenuItemBuilder::with_id("quit", "Quit").build(app)?;

            let tray_menu = tauri::menu::MenuBuilder::new(app)
                .item(&quit_item)
                .build()?;

            let _tray = tauri::tray::TrayIconBuilder::new()
                .icon(
                    app.default_window_icon()
                        .cloned()
                        .expect("no app icon configured"),
                )
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
                                #[cfg(target_os = "macos")]
                                let _ = app.show();
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
