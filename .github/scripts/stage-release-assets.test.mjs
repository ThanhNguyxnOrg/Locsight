import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./stage-release-assets.mjs', import.meta.url));
const cases = [
  ['windows-x64', '', [
    ['nsis/Locsight_1.2.3_x64-setup.exe'],
    ['msi/Locsight_1.2.3_x64_en-US.msi'],
  ]],
  ['windows-arm64', 'aarch64-pc-windows-msvc', [
    ['nsis/Locsight_1.2.3_arm64-setup.exe'],
    ['msi/Locsight_1.2.3_arm64_en-US.msi'],
  ]],
  ['macos-arm64', 'aarch64-apple-darwin', [
    ['macos/Locsight.app.tar.gz', 'Locsight_1.2.3_aarch64.app.tar.gz'],
    ['dmg/Locsight_1.2.3_aarch64.dmg'],
  ]],
  ['macos-x64', 'x86_64-apple-darwin', [
    ['macos/Locsight.app.tar.gz', 'Locsight_1.2.3_x64.app.tar.gz'],
    ['dmg/Locsight_1.2.3_x64.dmg'],
  ]],
  ['linux-x64', '', [
    ['appimage/Locsight_1.2.3_amd64.AppImage'],
    ['deb/Locsight_1.2.3_amd64.deb'],
    ['rpm/Locsight-1.2.3-1.x86_64.rpm'],
  ]],
  ['linux-arm64', '', [
    ['appimage/Locsight_1.2.3_aarch64.AppImage'],
    ['deb/Locsight_1.2.3_arm64.deb'],
    ['rpm/Locsight-1.2.3-1.aarch64.rpm'],
  ]],
];

for (const [variant, target, files] of cases) {
  test(`stage ${variant} from its Tauri bundle directory`, (t) => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'locsight-stage-'));
    t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
    const stale = path.join(cwd, 'src-tauri/target/other-target/release/bundle', files[0][0]);
    fs.mkdirSync(path.dirname(stale), { recursive: true });
    fs.writeFileSync(stale, 'wrong target');
    for (const [source] of files) {
      const file = path.join(cwd, 'src-tauri/target', target, 'release/bundle', source);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, source);
    }

    execFileSync(process.execPath, [script], {
      cwd,
      env: { ...process.env, VERSION: '1.2.3', VARIANT: variant },
    });

    const staged = path.join(cwd, 'dist/release');
    const expected = files.map(([source, name = path.basename(source)]) => name);
    assert.deepEqual(fs.readdirSync(staged).sort(), expected.sort());
    for (const [source, name = path.basename(source)] of files) {
      assert.equal(fs.readFileSync(path.join(staged, name), 'utf8'), source);
    }
  });
}
