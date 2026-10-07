const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  try {
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
          if (file === 'bundle') {
            results.push(filePath);
          } else {
            results = results.concat(walk(filePath));
          }
        }
      } catch (e) {}
    });
  } catch (e) {}
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
  let list;
  try {
    list = fs.readdirSync(dir);
  } catch (e) {
    return;
  }

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch (e) {
      return;
    }

    if (stat && stat.isDirectory()) {
      renameFilesInDir(filePath);
    } else {
      // Matches version strings like _2.1.0_, -2.1.0-, _2.1.0-1_, -2.1.0.exe, _2.1.0.msi
      const versionRegex = /([_-])\d+\.\d+\.\d+(?:-\d+)?([._-])/;
      if (versionRegex.test(file)) {
        const newFile = file.replace(versionRegex, (match, p1, p2) => (p2 === '.' ? '.' : p1));
        if (newFile !== file) {
          const newPath = path.join(dir, newFile);
          console.log(`[rename-artifacts] Renaming: ${file} -> ${newFile}`);
          try {
            if (fs.existsSync(newPath) && newPath !== filePath) {
              fs.unlinkSync(newPath);
            }
            fs.renameSync(filePath, newPath);
          } catch (e) {
            console.error(`[rename-artifacts] Failed to rename ${file}: ${e.message}`);
          }
        }
      }
    }
  });
}
console.log('[rename-artifacts] Completed artifact renaming.');
