use std::fs::{self, File};
use std::io::Write;
use locsight_lib::engine::assets::scan_assets;

#[test]
fn test_multimedia_assets_classification() {
    let temp_dir = std::env::temp_dir().join("locsight_test_multimedia_classification");
    let _ = fs::create_dir_all(&temp_dir);

    // List of all supported multimedia extensions from assets.toml
    let img_exts = vec!["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico", "psd", "tiff", "tif", "ai", "heic", "heif"];
    let vid_exts = vec!["mp4", "m4v", "mov", "avi", "mkv", "webm", "flv"];
    let aud_exts = vec!["mp3", "wav", "ogg", "ogv", "oga", "flac", "aac", "m4a"];

    let mut asset_paths = Vec::new();

    // Create a mock file for each image format
    for (i, ext) in img_exts.iter().enumerate() {
        let path = temp_dir.join(format!("test_img_{}.{}", i, ext));
        fs::write(&path, b"mock-image-data").unwrap();
        asset_paths.push(path);
    }

    // Create a mock file for each video format
    for (i, ext) in vid_exts.iter().enumerate() {
        let path = temp_dir.join(format!("test_vid_{}.{}", i, ext));
        fs::write(&path, b"mock-video-data").unwrap();
        asset_paths.push(path);
    }

    // Create a mock file for each audio format
    for (i, ext) in aud_exts.iter().enumerate() {
        let path = temp_dir.join(format!("test_aud_{}.{}", i, ext));
        fs::write(&path, b"mock-audio-data").unwrap();
        asset_paths.push(path);
    }

    let code_paths = vec![];
    let report = scan_assets(&asset_paths, &temp_dir, &code_paths);

    // Verify counts
    assert_eq!(report.summary.total_files, (img_exts.len() + vid_exts.len() + aud_exts.len()) as u32);
    assert_eq!(report.summary.category_counts.get("multimedia").copied(), Some(report.summary.total_files));

    // Verify subcategories
    assert_eq!(report.summary.subcategory_counts.get("image").copied(), Some(img_exts.len() as u32));
    assert_eq!(report.summary.subcategory_counts.get("video").copied(), Some(vid_exts.len() as u32));
    assert_eq!(report.summary.subcategory_counts.get("audio").copied(), Some(aud_exts.len() as u32));

    // Cleanup
    let _ = fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_png_metadata_dimensions() {
    let temp_dir = std::env::temp_dir().join("locsight_test_png_dimensions");
    let _ = fs::create_dir_all(&temp_dir);

    let png_path = temp_dir.join("image.png");
    
    // Write valid PNG header with dimensions 1920x1080
    let mut png_bytes = vec![0u8; 24];
    png_bytes[0..8].copy_from_slice(&[137, 80, 78, 71, 13, 10, 26, 10]);
    png_bytes[8..12].copy_from_slice(&[0, 0, 0, 13]);
    png_bytes[12..16].copy_from_slice(&[73, 72, 68, 82]);
    png_bytes[16..20].copy_from_slice(&[0, 0, 7, 128]); // 1920
    png_bytes[20..24].copy_from_slice(&[0, 0, 4, 56]);  // 1080
    
    fs::write(&png_path, &png_bytes).unwrap();

    let report = scan_assets(&[png_path], &temp_dir, &[]);
    let png_info = report.assets.iter().find(|a| a.name == "image.png").unwrap();
    
    assert_eq!(png_info.metadata.get("dimensions").map(|s| s.as_str()), Some("1920x1080"));
    assert_eq!(png_info.metadata.get("width").map(|s| s.as_str()), Some("1920"));
    assert_eq!(png_info.metadata.get("height").map(|s| s.as_str()), Some("1080"));

    let _ = fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_jpeg_metadata_dimensions() {
    let temp_dir = std::env::temp_dir().join("locsight_test_jpeg_dimensions");
    let _ = fs::create_dir_all(&temp_dir);

    let jpeg_path = temp_dir.join("image.jpg");
    
    // Write mock JPEG bytes: SOI (FF D8), then some segment with SOF0 (FF C0)
    // SOF0 segment format:
    // FF C0 (marker)
    // 00 11 (length: 17 bytes)
    // 08 (data precision: 8)
    // 04 38 (height: 1080)
    // 07 80 (width: 1920)
    // ... rest of SOF0 data
    let jpeg_bytes = vec![
        0xFF, 0xD8, // SOI
        0xFF, 0xE0, // APP0 (to make sure it skips other segments)
        0x00, 0x10, // Segment length: 16
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // padding
        0xFF, 0xC0, // SOF0
        0x00, 0x0B, // SOF0 segment length: 11
        0x08, // Precision
        0x04, 0x38, // Height: 1080 (1080 = 0x0438)
        0x07, 0x80, // Width: 1920 (1920 = 0x0780)
        0x03, 0x01, 0x11, 0x00, // components
    ];

    fs::write(&jpeg_path, &jpeg_bytes).unwrap();

    let report = scan_assets(&[jpeg_path], &temp_dir, &[]);
    let jpeg_info = report.assets.iter().find(|a| a.name == "image.jpg").unwrap();

    assert_eq!(jpeg_info.metadata.get("dimensions").map(|s| s.as_str()), Some("1920x1080"));
    assert_eq!(jpeg_info.metadata.get("width").map(|s| s.as_str()), Some("1920"));
    assert_eq!(jpeg_info.metadata.get("height").map(|s| s.as_str()), Some("1080"));

    let _ = fs::remove_dir_all(&temp_dir);
}

#[test]
fn test_multimedia_optimization_hints() {
    let temp_dir = std::env::temp_dir().join("locsight_test_multimedia_hints");
    let _ = fs::create_dir_all(&temp_dir);

    // Large PNG (> 5MB)
    let png_path = temp_dir.join("large_img.png");
    let mut png_file = File::create(&png_path).unwrap();
    let six_mb = vec![0u8; 6 * 1024 * 1024];
    png_file.write_all(&six_mb).unwrap();

    // Normal PNG (> 500KB but < 5MB)
    let medium_png_path = temp_dir.join("medium_img.png");
    let mut medium_png_file = File::create(&medium_png_path).unwrap();
    let one_mb = vec![0u8; 1 * 1024 * 1024];
    medium_png_file.write_all(&one_mb).unwrap();

    // Large WAV audio (> 10MB)
    let wav_path = temp_dir.join("large_audio.wav");
    let mut wav_file = File::create(&wav_path).unwrap();
    let twelve_mb = vec![0u8; 12 * 1024 * 1024];
    wav_file.write_all(&twelve_mb).unwrap();

    let report = scan_assets(&[png_path, medium_png_path, wav_path], &temp_dir, &[]);

    // Check hints
    let hint_large_png = report.optimization_hints.iter().find(|h| h.name == "large_img.png").unwrap();
    assert_eq!(hint_large_png.severity, "warning");
    assert!(hint_large_png.message.contains("Very large image file"));

    let hint_medium_png = report.optimization_hints.iter().find(|h| h.name == "medium_img.png").unwrap();
    assert_eq!(hint_medium_png.severity, "info");
    assert!(hint_medium_png.message.contains("PNG format occupies a lot of storage"));

    let hint_wav = report.optimization_hints.iter().find(|h| h.name == "large_audio.wav").unwrap();
    assert_eq!(hint_wav.severity, "info");
    assert!(hint_wav.message.contains("Large uncompressed WAV"));

    let _ = fs::remove_dir_all(&temp_dir);
}
