pub mod models;
pub mod engine;
pub mod commands;

use commands::{
    scan_directory,
    get_cocomo_estimate,
    export_report,
    read_locignore,
    write_locignore,
    read_gitignore,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Check for --disable-gpu or --vm arguments to enable software rendering compatibility mode for Virtual Machines (VMware/VirtualBox)
    let args: Vec<String> = std::env::args().collect();
    if args.iter().any(|arg| arg == "--disable-gpu" || arg == "--vm" || arg == "-vm") {
        #[cfg(target_os = "windows")]
        std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--disable-gpu --disable-software-rasterizer");
        
        #[cfg(target_os = "linux")]
        {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
            std::env::set_var("WEBKIT_FORCE_SANDBOX", "0");
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            scan_directory,
            get_cocomo_estimate,
            export_report,
            read_locignore,
            write_locignore,
            read_gitignore
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


