import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { QuickLauncherApp } from "./screens/QuickLauncherApp";
import "./styles.css";

/**
 * Detect the Tauri window label so the quick-launcher window renders
 * QuickLauncherWindow instead of the full App shell.
 */
async function getWindowLabel(): Promise<string | null> {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    return getCurrentWindow().label;
  } catch {
    // Not running inside Tauri (e.g. browser dev, tests)
    return null;
  }
}

async function mount() {
  const label = await getWindowLabel();

  const root = ReactDOM.createRoot(
    document.getElementById("root") as HTMLElement,
  );

  if (label === "quick-launcher") {
    root.render(
      <React.StrictMode>
        <QuickLauncherApp />
      </React.StrictMode>,
    );
  } else {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
}

mount();
