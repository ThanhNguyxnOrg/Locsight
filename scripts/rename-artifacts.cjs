const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file === 'bundle') {
        results.push(filePath);
      } else {
        results = results.concat(walk(filePath));
      }
    }
  });
  return results;
}

const targetDir = path.join(__dirname, '../src-tauri/target');
console.log(`[rename-artifacts] Scanning for bundle folders in: ${targetDir}`);

if (fs.existsSync(targetDir)) {
  const bundleDirs = walk(targetDir);
  console.log(`[rename-artifacts] Found bundle folders: ${JSON.stringify(bundleDirs)}`);
  bundleDirs.forEach((bundleDir) => {
    renameFilesInDir(bundleDir);
  });
} else {
  console.log('[rename-artifacts] Target directory does not exist yet.');
}

function renameFilesInDir(dir) {
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      renameFilesInDir(filePath);
    } else {
      // Matches version strings like _1.1.0_ or -1.1.0- or _1.0.0-
      const versionRegex = /([_-])\d+\.\d+\.\d+([_-])/;
      if (versionRegex.test(file)) {
        const newFile = file.replace(versionRegex, '$1');
        const newPath = path.join(dir, newFile);
        console.log(`[rename-artifacts] Renaming: ${file} -> ${newFile}`);
        try {
          fs.renameSync(filePath, newPath);
        } catch (e) {
          console.error(`[rename-artifacts] Failed to rename ${file}: ${e.message}`);
        }
      }
    }
  });
}
console.log('[rename-artifacts] Completed artifact renaming.');
