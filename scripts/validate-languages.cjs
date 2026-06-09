const fs = require('fs');
const path = require('path');

const languagesTomlPath = path.join(__dirname, '../src-tauri/languages.toml');
const techstackTomlPath = path.join(__dirname, '../src-tauri/techstack.toml');

console.log('--- Locsight Validation Script ---');

function parseSimpleToml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  
  const sections = {};
  let currentSection = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#') || line === '') {
      continue;
    }
    
    // Check section header: [Section] or ["Section"]
    const sectionMatch = line.match(/^\["?(.*?)"?\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      sections[currentSection] = {};
      continue;
    }
    
    if (currentSection) {
      // Check property: key = value
      const eqIdx = line.indexOf('=');
      if (eqIdx !== -1) {
        let key = line.substring(0, eqIdx).trim();
        // remove surrounding quotes from key
        if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
          key = key.substring(1, key.length - 1);
        }
        let valStr = line.substring(eqIdx + 1).trim();
        
        // Basic parsing of string or array
        let parsedVal = valStr;
        if (valStr.startsWith('[') && valStr.endsWith(']')) {
          try {
            let cleaned = valStr.replace(/,\s*]/g, ']');
            parsedVal = JSON.parse(cleaned);
          } catch (e) {
            parsedVal = valStr;
          }
        } else if (valStr.startsWith('"') && valStr.endsWith('"')) {
          parsedVal = valStr.substring(1, valStr.length - 1);
        } else if (valStr.startsWith('{') && valStr.endsWith('}')) {
          // Inline table, e.g. { name = "React", category = "Frontend" }
          const inner = valStr.substring(1, valStr.length - 1);
          const obj = {};
          const pairs = inner.split(',');
          for (const pair of pairs) {
            const parts = pair.split('=');
            if (parts.length === 2) {
              const k = parts[0].trim();
              const v = parts[1].trim().replace(/^"(.*)"$/, '$1');
              obj[k] = v;
            }
          }
          parsedVal = obj;
        }
        
        sections[currentSection][key] = parsedVal;
      }
    }
  }
  
  return sections;
}

try {
  // 1. Validate Languages
  console.log(`Parsing languages.toml from ${languagesTomlPath}...`);
  const languages = parseSimpleToml(languagesTomlPath);
  const langNames = Object.keys(languages);
  console.log(`Successfully parsed ${langNames.length} language configurations.`);
  
  if (langNames.length < 500) {
    console.error(`Error: Expected at least 500 languages, but found ${langNames.length}.`);
    process.exit(1);
  }
  
  // Verify basic structure of languages
  for (const name of langNames) {
    const lang = languages[name];
    if (!lang.extensions) {
      console.error(`Error: Language "${name}" has no extensions defined.`);
      process.exit(1);
    }
    if (!Array.isArray(lang.extensions)) {
      console.error(`Error: Language "${name}" extensions is not an array.`);
      process.exit(1);
    }
  }
  console.log('Language configurations validation: OK.');

  // 2. Validate Tech Stack
  console.log(`Parsing techstack.toml from ${techstackTomlPath}...`);
  const techstack = parseSimpleToml(techstackTomlPath);
  
  const deps = techstack['dependencies'] || {};
  const fileDetections = techstack['file_detections'] || {};
  
  const totalTech = Object.keys(deps).length + Object.keys(fileDetections).length;
  console.log(`Successfully parsed ${Object.keys(deps).length} dependencies and ${Object.keys(fileDetections).length} file detections.`);
  console.log(`Total tech stack entries: ${totalTech}`);
  
  if (totalTech < 1000) {
    console.error(`Error: Expected at least 1000 tech stack entries, but found ${totalTech}.`);
    process.exit(1);
  }
  
  // Verify basic structures
  for (const dep of Object.keys(deps)) {
    const item = deps[dep];
    if (!item.name || !item.category) {
      console.error(`Error: Dependency "${dep}" is missing name or category.`);
      process.exit(1);
    }
  }
  
  for (const file of Object.keys(fileDetections)) {
    const item = fileDetections[file];
    if (!item.name || !item.category) {
      console.error(`Error: File detection "${file}" is missing name or category.`);
      process.exit(1);
    }
  }
  
  console.log('Tech stack configurations validation: OK.');
  console.log('\nAll checks PASSED successfully! Locsight registry is valid.');
  process.exit(0);

} catch (error) {
  console.error('Validation failed with exception:', error);
  process.exit(1);
}
