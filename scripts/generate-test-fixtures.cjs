const fs = require('fs');
const path = require('path');

const languagesTomlPath = path.join(__dirname, '../src-tauri/languages.toml');
const techstackTomlPath = path.join(__dirname, '../src-tauri/techstack.toml');
const fixturesDir = path.join(__dirname, '../src-tauri/tests/fixtures');
const langFixturesDir = path.join(fixturesDir, 'languages');
const techFixturesDir = path.join(fixturesDir, 'techstacks');

console.log('--- Locsight Fixtures Generator ---');

// Helper to parse TOML
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
    
    const sectionMatch = line.match(/^\["?(.*?)"?\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      sections[currentSection] = {};
      continue;
    }
    
    if (currentSection) {
      const eqIdx = line.indexOf('=');
      if (eqIdx !== -1) {
        let key = line.substring(0, eqIdx).trim();
        if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
          key = key.substring(1, key.length - 1);
        }
        let valStr = line.substring(eqIdx + 1).trim();
        
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

// 1. Create Directories
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(langFixturesDir, { recursive: true });
fs.mkdirSync(techFixturesDir, { recursive: true });

// Helper to generate a code line that does not contain or start with any comment delimiters of the language
function generateSafeCodeLine(lang, index) {
  const delimiters = [];
  if (lang.single_line) {
    for (const sl of lang.single_line) {
      if (sl) delimiters.push(sl.trim());
    }
  }
  if (lang.multi_line) {
    for (const pair of lang.multi_line) {
      if (Array.isArray(pair)) {
        if (pair[0]) delimiters.push(pair[0].trim());
        if (pair[1]) delimiters.push(pair[1].trim());
      }
    }
  }

  const candidates = [
    `val_${index} = ${index}`,
    `var_${index} = ${index}`,
    `let_${index} = ${index}`,
    `x = ${index}`,
    `a = ${index}`,
    `print(${index})`,
    `echo_${index}`,
    `show_${index}`
  ];

  for (const candidate of candidates) {
    let ok = true;
    for (const d of delimiters) {
      if (d === '') continue;
      if (candidate.startsWith(d) || candidate.includes(d)) {
        ok = false;
        break;
      }
    }
    if (ok) {
      return candidate;
    }
  }

  return `code_${index}`;
}

// Simulator of Rust scanner's line counting logic
function simulateCountLines(content, lang) {
  let code = 0;
  let comments = 0;
  let blanks = 0;
  let inMultiline = false;
  let activeMlEnd = '';

  const singleLineComments = lang.single_line || [];
  const multiLineComments = lang.multi_line || [];

  const lines = content.split(/\r?\n/);
  // Rust lines() does not yield a trailing empty line if it ends with \n
  if (content.endsWith('\n') && lines[lines.length - 1] === '') {
    lines.pop();
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      blanks++;
      continue;
    }

    if (inMultiline) {
      comments++;
      if (activeMlEnd !== '' && trimmed.includes(activeMlEnd)) {
        inMultiline = false;
        activeMlEnd = '';
      }
      continue;
    }

    let isSl = false;
    for (const sl of singleLineComments) {
      if (sl !== '' && trimmed.startsWith(sl)) {
        comments++;
        isSl = true;
        break;
      }
    }
    if (isSl) {
      continue;
    }

    let isMlStart = false;
    for (const pair of multiLineComments) {
      if (Array.isArray(pair) && pair.length === 2) {
        const start = pair[0];
        const end = pair[1];
        if (start !== '' && trimmed.startsWith(start)) {
          comments++;
          isMlStart = true;
          if (end !== '' && !trimmed.endsWith(end)) {
            inMultiline = true;
            activeMlEnd = end;
          }
          break;
        }
      }
    }
    if (isMlStart) {
      continue;
    }

    code++;
  }

  return { code, comments, blanks };
}

// 2. Generate Language Fixtures
console.log('Generating language fixtures...');
const languages = parseSimpleToml(languagesTomlPath);
const langExpected = {};

for (const langName of Object.keys(languages)) {
  const lang = languages[langName];
  if (!lang.extensions || lang.extensions.length === 0) {
    continue;
  }
  
  const ext = lang.extensions[0].toLowerCase();
  // Safe filename, e.g. "rust.rs", replacing spaces
  const safeLangName = langName.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
  const filename = `${safeLangName}.${ext}`;
  const filepath = path.join(langFixturesDir, filename);
  
  let content = '';
  
  // Line 1: Code
  const code1 = generateSafeCodeLine(lang, 1);
  content += `${code1}\n`;
  
  // Line 2: Blank
  content += '\n';
  
  // Line 3+: Single-line comments
  if (lang.single_line && lang.single_line.length > 0) {
    for (const sl of lang.single_line) {
      if (sl.trim() !== '') {
        content += `${sl} This is a single-line comment\n`;
      }
    }
  }
  
  // Line 4+: Multi-line comments
  if (lang.multi_line && lang.multi_line.length > 0) {
    for (const pair of lang.multi_line) {
      if (Array.isArray(pair) && pair.length === 2) {
        const start = pair[0];
        const end = pair[1];
        // Append suffix text after the start token so that start doesn't equal end on the same line,
        // which prevents the scanner from treating it as a single-line block.
        content += `${start} start of comment\nThis is a multi-line comment block\n${end}\n`;
      }
    }
  }
  
  // Final Line: Code
  const code2 = generateSafeCodeLine(lang, 2);
  content += `${code2}\n`;
  
  fs.writeFileSync(filepath, content, 'utf8');
  
  const metrics = simulateCountLines(content, lang);
  
  langExpected[filename] = {
    language: langName,
    extension: ext,
    code: metrics.code,
    comments: metrics.comments,
    blanks: metrics.blanks
  };
}

fs.writeFileSync(
  path.join(fixturesDir, 'languages_expected.json'),
  JSON.stringify(langExpected, null, 2),
  'utf8'
);
console.log(`Generated ${Object.keys(langExpected).length} language sample files.`);

// 3. Generate Tech Stack Fixtures
console.log('Generating techstack fixtures...');
const techstack = parseSimpleToml(techstackTomlPath);
const deps = techstack['dependencies'] || {};
const fileDetections = techstack['file_detections'] || {};
const techExpected = new Set();

// We will write various dependencies into the respective config files
const jsDeps = {};
const rustDeps = [];
const pythonDeps = [];
const phpDeps = {};
const goDeps = [];
const mavenDeps = [];
const gradleDeps = [];
const rubyDeps = [];
const swiftDeps = [];
const dartDeps = [];
const elixirDeps = [];
const dotnetDeps = [];

// Separate dependencies into their respective files based on known conventions
for (const depKey of Object.keys(deps)) {
  const item = deps[depKey];
  techExpected.add(item.name);
  
  // Heuristically distribute to test all parsers
  if (depKey.startsWith('@') || depKey === 'react' || depKey === 'vue' || depKey === 'svelte' || depKey === 'next' || depKey === 'express') {
    jsDeps[depKey] = '^1.0.0';
  } else if (depKey === 'tokio' || depKey === 'serde' || depKey === 'axum' || depKey === 'rayon') {
    rustDeps.push(depKey);
  } else if (depKey === 'flask' || depKey === 'django' || depKey === 'numpy' || depKey === 'requests') {
    pythonDeps.push(depKey);
  } else if (depKey === 'laravel/framework' || depKey === 'symfony/symfony' || depKey === 'phpunit/phpunit') {
    phpDeps[depKey] = '^1.0.0';
  } else if (depKey === 'gin' || depKey === 'gorm' || depKey === 'cobra') {
    goDeps.push(depKey);
  } else if (depKey.startsWith('spring-') || depKey === 'junit' || depKey === 'hibernate-core') {
    mavenDeps.push(depKey);
  } else if (depKey.startsWith('kotlinx-') || depKey === 'koin-core' || depKey === 'exposed') {
    gradleDeps.push(depKey);
  } else if (depKey === 'rails' || depKey === 'sinatra' || depKey === 'rspec') {
    rubyDeps.push(depKey);
  } else if (depKey === 'vapor' || depKey === 'realm-swift' || depKey === 'moya') {
    swiftDeps.push(depKey);
  } else if (depKey === 'flutter_bloc' || depKey === 'riverpod' || depKey === 'dio') {
    dartDeps.push(depKey);
  } else if (depKey === 'phoenix' || depKey === 'ecto' || depKey === 'plug') {
    elixirDeps.push(depKey);
  } else if (depKey === 'entityframework' || depKey === 'nunit' || depKey === 'newtonsoft.json') {
    dotnetDeps.push(depKey);
  } else {
    // Put remaining into package.json to guarantee detection coverage!
    jsDeps[depKey] = '^1.0.0';
  }
}

// Write package.json
fs.writeFileSync(
  path.join(techFixturesDir, 'package.json'),
  JSON.stringify({ dependencies: jsDeps }, null, 2),
  'utf8'
);

// Write Cargo.toml
let cargoContent = '[dependencies]\n';
for (const dep of rustDeps) {
  cargoContent += `${dep} = "1.0"\n`;
}
fs.writeFileSync(path.join(techFixturesDir, 'Cargo.toml'), cargoContent, 'utf8');

// Write requirements.txt
fs.writeFileSync(
  path.join(techFixturesDir, 'requirements.txt'),
  pythonDeps.map(d => `${d}==1.0`).join('\n'),
  'utf8'
);

// Write composer.json
fs.writeFileSync(
  path.join(techFixturesDir, 'composer.json'),
  JSON.stringify({ require: phpDeps }, null, 2),
  'utf8'
);

// Write go.mod
let goModContent = 'module test\n\ngo 1.21\n\nrequire (\n';
for (const dep of goDeps) {
  goModContent += `\tgithub.com/test/${dep} v1.0.0\n`;
}
goModContent += ')\n';
fs.writeFileSync(path.join(techFixturesDir, 'go.mod'), goModContent, 'utf8');

// Write pom.xml
let pomContent = '<project>\n  <dependencies>\n';
for (const dep of mavenDeps) {
  pomContent += `    <dependency>\n      <artifactId>${dep}</artifactId>\n    </dependency>\n`;
}
pomContent += '  </dependencies>\n</project>\n';
fs.writeFileSync(path.join(techFixturesDir, 'pom.xml'), pomContent, 'utf8');

// Write build.gradle
let gradleContent = 'dependencies {\n';
for (const dep of gradleDeps) {
  gradleContent += `    implementation 'org.test:${dep}:1.0'\n`;
}
gradleContent += '}\n';
fs.writeFileSync(path.join(techFixturesDir, 'build.gradle'), gradleContent, 'utf8');

// Write Gemfile
let gemContent = '';
for (const dep of rubyDeps) {
  gemContent += `gem "${dep}"\n`;
}
fs.writeFileSync(path.join(techFixturesDir, 'Gemfile'), gemContent, 'utf8');

// Write Package.swift
let swiftContent = 'dependencies: [\n';
for (const dep of swiftDeps) {
  swiftContent += `    .package(url: "https://github.com/test/${dep}", from: "1.0.0"),\n`;
}
swiftContent += ']\n';
fs.writeFileSync(path.join(techFixturesDir, 'Package.swift'), swiftContent, 'utf8');

// Write pubspec.yaml
let pubspecContent = 'dependencies:\n  flutter:\n    sdk: flutter\n';
for (const dep of dartDeps) {
  pubspecContent += `  ${dep}: ^1.0.0\n`;
}
fs.writeFileSync(path.join(techFixturesDir, 'pubspec.yaml'), pubspecContent, 'utf8');

// Write mix.exs
let mixContent = 'defp deps do\n  [\n';
for (const dep of elixirDeps) {
  mixContent += `    {:${dep}, "~> 1.0"},\n`;
}
mixContent += '  ]\nend\n';
fs.writeFileSync(path.join(techFixturesDir, 'mix.exs'), mixContent, 'utf8');

// Write test.csproj
let csprojContent = '<Project Sdk="Microsoft.NET.Sdk">\n  <ItemGroup>\n';
for (const dep of dotnetDeps) {
  csprojContent += `    <PackageReference Include="Test.${dep}" Version="1.0.0" />\n`;
}
csprojContent += '  </ItemGroup>\n</Project>\n';
fs.writeFileSync(path.join(techFixturesDir, 'test.csproj'), csprojContent, 'utf8');

// Generate all file detections
for (const fileKey of Object.keys(fileDetections)) {
  const item = fileDetections[fileKey];
  techExpected.add(item.name);
  
  // Create empty file/directory only if it doesn't already exist
  const filepath = path.join(techFixturesDir, fileKey);
  if (!fs.existsSync(filepath)) {
    // Ensure parent dirs exist (e.g. .github/workflows/...)
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, '', 'utf8');
  }
}

// Add language environments that get auto-added if lockfiles exist
techExpected.add('Node.js');
techExpected.add('Rust');
techExpected.add('Python');
techExpected.add('PHP');
techExpected.add('Go');
techExpected.add('Java');
techExpected.add('Maven');
techExpected.add('Gradle');
techExpected.add('Ruby');
techExpected.add('Swift');
techExpected.add('Flutter');
techExpected.add('Elixir');
techExpected.add('.NET');

fs.writeFileSync(
  path.join(fixturesDir, 'techstacks_expected.json'),
  JSON.stringify(Array.from(techExpected), null, 2),
  'utf8'
);

console.log(`Generated techstack fixtures with ${techExpected.size} expected detections.`);
console.log('Done successfully!');
