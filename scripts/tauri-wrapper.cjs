const { spawnSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
console.log(`[tauri-wrapper] Intercepted Tauri command: tauri ${args.join(' ')}`);

// Run the real tauri command using npx
const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(cmd, ['tauri', ...args], {
  stdio: 'inherit',
  shell: true
});

if (result.status === 0 && args.includes('build')) {
  if (process.env.CI) {
    console.log('[tauri-wrapper] CI environment detected. Skipping artifact renaming (handled by CI release pipeline).');
  } else {
    console.log('[tauri-wrapper] Build succeeded. Running artifact renaming...');
    try {
      require('./rename-artifacts.cjs');
    } catch (err) {
      console.error(`[tauri-wrapper] Renaming failed: ${err.message}`);
    }
  }
}

process.exit(result.status !== null ? result.status : 1);
