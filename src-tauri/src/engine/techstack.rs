use std::fs;
use std::path::Path;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};
use regex::Regex;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TechStackItem {
    pub name: String,
    pub version: String,
    pub category: String,
    pub icon: Option<String>,
}

fn get_tech_icon(name: &str) -> Option<String> {
    let icon_name = match name.to_lowercase().as_str() {
        "react" | "react dom" | "react js api" => "react",
        "vue" => "vue",
        "svelte" | "sveltekit" => "svelte",
        "angular" => "angular",
        "next.js" => "nextjs",
        "nuxt.js" => "nuxtjs",
        "astro" => "astro",
        "solidjs" => "solid",
        "preact" => "preact",
        "tauri" | "tauri js api" | "wry (tauri)" | "tao (tauri)" => "tauri",
        "electron" => "electron",
        "express" => "express",
        "nestjs" | "nestjs core" => "nestjs",
        "fastify" => "fastify",
        "koa" => "koa",
        "actix web" => "actix",
        "axum" => "rust",
        "rocket" | "warp" => "rust",
        "gin" | "echo" | "fiber" => "go",
        "django" | "django rest framework" => "django",
        "flask" => "flask",
        "fastapi" => "fastapi",
        "laravel" => "laravel",
        "symfony" => "symfony",
        "spring boot" | "spring boot web" | "spring cloud" => "spring",
        "ktor" | "ktor core" => "kotlin",
        "phoenix" => "elixir",
        "rails" | "ruby on rails" | "sinatra" => "ruby",
        "prisma" | "prisma client" => "prisma",
        "mongoose" | "sequelize" | "typeorm" | "diesel" | "sqlx" | "seaorm" | "gorm" | "sqlalchemy" | "hibernate" | "ecto" => "database",
        "vite" => "vite",
        "webpack" => "webpack",
        "rollup" => "rollup",
        "esbuild" => "esbuild",
        "cargo" => "rust",
        "gradle" => "gradle",
        "maven" => "maven",
        "turborepo" => "turborepo",
        "nx" => "nx",
        "lerna" => "lerna",
        "tailwindcss" | "tailwind css" => "tailwind",
        "sass" | "scss" => "sass",
        "less" => "less",
        "bootstrap" => "bootstrap",
        "jest" => "jest",
        "vitest" => "vitest",
        "playwright" => "playwright",
        "cypress" => "cypress",
        "pytest" => "pytest",
        "rspec" => "ruby",
        "junit" | "junit 5" => "java",
        "tokio" | "serde" | "rayon" | "lodash" | "axios" | "recharts" | "zod" | "yup" | "joi" | "sentry" | "stripe" | "redis" | "kafka" | "rabbitmq" => "library",
        "docker" | "docker compose" => "docker",
        "github actions" => "github",
        "gitlab ci" => "gitlab",
        "jenkins" => "jenkins",
        "circleci" => "circleci",
        "azure devops" | "azure pipelines" => "azure",
        "terraform" => "terraform",
        "kubernetes" => "kubernetes",
        "nginx" => "nginx",
        "apache" => "apache",
        "node.js" => "node",
        "rust" => "rust",
        "go" => "go",
        "python" => "python",
        "php" => "php",
        "ruby" => "ruby",
        "swift" => "swift",
        "dart" | "flutter" => "dart",
        "elixir" => "elixir",
        "java" => "java",
        "kotlin" => "kotlin",
        "c#" | ".net" => "csharp",
        _ => "code",
    };
    Some(icon_name.to_string())
}

fn new_item(name: String, version: String, category: String) -> TechStackItem {
    let icon = get_tech_icon(&name);
    TechStackItem { name, version, category, icon }
}

fn add_if_known(
    items: &mut Vec<TechStackItem>,
    known_tech: &HashMap<&'static str, (&'static str, &'static str)>,
    dep_name: &str,
    version: &str,
) -> bool {
    let dep_lower = dep_name.to_lowercase();
    if let Some(&(friendly, cat)) = known_tech.get(dep_lower.as_str()) {
        items.push(new_item(friendly.to_string(), version.to_string(), cat.to_string()));
        true
    } else {
        false
    }
}

fn check_dotnet_file(
    path: &Path,
    items: &mut Vec<TechStackItem>,
    known_tech: &HashMap<&'static str, (&'static str, &'static str)>,
    has_dotnet: &mut bool,
) {
    if let Ok(content) = fs::read_to_string(path) {
        if !*has_dotnet {
            items.push(new_item(".NET".to_string(), "".to_string(), "Environment".to_string()));
            *has_dotnet = true;
        }
        let pr_regex = Regex::new(r#"<PackageReference\s+Include="([^"]+)"(?:\s+Version="([^"]+)")?"#).unwrap();
        for cap in pr_regex.captures_iter(&content) {
            let dep_name = cap[1].split('.').last().unwrap_or(&cap[1]);
            let ver = cap.get(2).map(|m| m.as_str()).unwrap_or("");
            add_if_known(items, known_tech, dep_name, ver);
        }
    }
}

fn get_known_tech_map() -> HashMap<&'static str, (&'static str, &'static str)> {
    let mut m = HashMap::new();
    
    // Frontend Frameworks
    m.insert("react", ("React", "Frontend"));
    m.insert("react-dom", ("React DOM", "Frontend"));
    m.insert("vue", ("Vue", "Frontend"));
    m.insert("svelte", ("Svelte", "Frontend"));
    m.insert("@angular/core", ("Angular", "Frontend"));
    m.insert("next", ("Next.js", "Frontend"));
    m.insert("nuxt", ("Nuxt.js", "Frontend"));
    m.insert("@sveltejs/kit", ("SvelteKit", "Frontend"));
    m.insert("astro", ("Astro", "Frontend"));
    m.insert("solid-js", ("SolidJS", "Frontend"));
    m.insert("preact", ("Preact", "Frontend"));
    
    // Desktop Frameworks
    m.insert("tauri", ("Tauri", "Desktop Framework"));
    m.insert("@tauri-apps/api", ("Tauri JS API", "Desktop Framework"));
    m.insert("electron", ("Electron", "Desktop Framework"));
    m.insert("wry", ("Wry (Tauri)", "Desktop Framework"));
    m.insert("tao", ("Tao (Tauri)", "Desktop Framework"));
    
    // Backend Frameworks
    m.insert("express", ("Express", "Backend"));
    m.insert("nestjs", ("NestJS", "Backend"));
    m.insert("@nestjs/core", ("NestJS Core", "Backend"));
    m.insert("fastify", ("Fastify", "Backend"));
    m.insert("koa", ("Koa", "Backend"));
    m.insert("actix-web", ("Actix Web", "Backend"));
    m.insert("axum", ("Axum", "Backend"));
    m.insert("rocket", ("Rocket", "Backend"));
    m.insert("warp", ("Warp", "Backend"));
    m.insert("gin", ("Gin", "Backend"));
    m.insert("echo", ("Echo", "Backend"));
    m.insert("fiber", ("Fiber", "Backend"));
    m.insert("django", ("Django", "Backend"));
    m.insert("flask", ("Flask", "Backend"));
    m.insert("fastapi", ("FastAPI", "Backend"));
    m.insert("laravel", ("Laravel", "Backend"));
    m.insert("symfony", ("Symfony", "Backend"));
    m.insert("spring-boot", ("Spring Boot", "Backend"));
    m.insert("ktor", ("Ktor", "Backend"));
    
    // Database & ORM
    m.insert("prisma", ("Prisma", "Database/ORM"));
    m.insert("@prisma/client", ("Prisma Client", "Database/ORM"));
    m.insert("mongoose", ("Mongoose", "Database/ORM"));
    m.insert("sequelize", ("Sequelize", "Database/ORM"));
    m.insert("typeorm", ("TypeORM", "Database/ORM"));
    m.insert("diesel", ("Diesel", "Database/ORM"));
    m.insert("sqlx", ("SQLx", "Database/ORM"));
    m.insert("sea-orm", ("SeaORM", "Database/ORM"));
    m.insert("gorm", ("GORM", "Database/ORM"));
    m.insert("sqlalchemy", ("SQLAlchemy", "Database/ORM"));
    
    // Build Tools
    m.insert("vite", ("Vite", "Build Tool"));
    m.insert("webpack", ("Webpack", "Build Tool"));
    m.insert("rollup", ("Rollup", "Build Tool"));
    m.insert("esbuild", ("esbuild", "Build Tool"));
    m.insert("cargo", ("Cargo", "Build Tool"));
    m.insert("gradle", ("Gradle", "Build Tool"));
    
    // Styling
    m.insert("tailwindcss", ("Tailwind CSS", "Styling"));
    m.insert("sass", ("Sass", "Styling"));
    m.insert("less", ("Less", "Styling"));
    m.insert("bootstrap", ("Bootstrap", "Styling"));
    
    // Testing
    m.insert("jest", ("Jest", "Testing"));
    m.insert("vitest", ("Vitest", "Testing"));
    m.insert("playwright", ("Playwright", "Testing"));
    m.insert("cypress", ("Cypress", "Testing"));
    m.insert("pytest", ("Pytest", "Testing"));
    
    // Utilities & Libraries
    m.insert("tokio", ("Tokio", "Library"));
    m.insert("serde", ("Serde", "Library"));
    m.insert("rayon", ("Rayon", "Library"));
    m.insert("lodash", ("Lodash", "Library"));
    m.insert("axios", ("Axios", "Library"));
    m.insert("recharts", ("Recharts", "Library"));

    // State Management
    m.insert("redux", ("Redux", "Frontend"));
    m.insert("@reduxjs/toolkit", ("Redux Toolkit", "Frontend"));
    m.insert("zustand", ("Zustand", "Frontend"));
    m.insert("mobx", ("MobX", "Frontend"));
    m.insert("pinia", ("Pinia", "Frontend"));
    m.insert("vuex", ("Vuex", "Frontend"));
    m.insert("recoil", ("Recoil", "Frontend"));
    m.insert("jotai", ("Jotai", "Frontend"));
    m.insert("xstate", ("XState", "Frontend"));
    
    // Auth
    m.insert("next-auth", ("NextAuth.js", "Library"));
    m.insert("clerk", ("Clerk", "Library"));
    m.insert("@clerk/nextjs", ("Clerk Auth", "Library"));
    m.insert("@clerk/clerk-react", ("Clerk Auth", "Library"));
    m.insert("auth0", ("Auth0", "Library"));
    m.insert("firebase-admin", ("Firebase Admin", "Library"));
    m.insert("@supabase/supabase-js", ("Supabase JS", "Library"));
    m.insert("passport", ("Passport.js", "Library"));
    
    // API & GraphQL
    m.insert("graphql", ("GraphQL", "Library"));
    m.insert("apollo-client", ("Apollo Client", "Library"));
    m.insert("@apollo/client", ("Apollo Client", "Library"));
    m.insert("urql", ("urql", "Library"));
    m.insert("trpc", ("tRPC", "Library"));
    m.insert("@trpc/server", ("tRPC Server", "Library"));
    m.insert("@trpc/client", ("tRPC Client", "Library"));
    m.insert("graphql-yoga", ("GraphQL Yoga", "Library"));
    m.insert("hasura", ("Hasura", "Library"));
    
    // Validation
    m.insert("zod", ("Zod", "Library"));
    m.insert("yup", ("Yup", "Library"));
    m.insert("joi", ("Joi", "Library"));
    m.insert("class-validator", ("class-validator", "Library"));
    
    // CSS & Styling
    m.insert("styled-components", ("Styled Components", "Styling"));
    m.insert("@emotion/react", ("Emotion", "Styling"));
    m.insert("@emotion/styled", ("Emotion", "Styling"));
    m.insert("@stitches/react", ("Stitches", "Styling"));
    m.insert("@vanilla-extract/css", ("Vanilla Extract", "Styling"));
    m.insert("postcss", ("PostCSS", "Build Tool"));
    m.insert("autoprefixer", ("Autoprefixer", "Build Tool"));
    m.insert("sass-loader", ("Sass Loader", "Build Tool"));
    
    // Mobile
    m.insert("react-native", ("React Native", "Frontend"));
    m.insert("expo", ("Expo", "Frontend"));
    m.insert("flutter", ("Flutter", "Frontend"));
    m.insert("@capacitor/core", ("Capacitor", "Frontend"));
    m.insert("cordova", ("Cordova", "Frontend"));
    m.insert("ionic", ("Ionic", "Frontend"));
    
    // Monitoring & Sentry
    m.insert("@sentry/react", ("Sentry React", "Library"));
    m.insert("@sentry/node", ("Sentry Node", "Library"));
    m.insert("sentry", ("Sentry", "Library"));
    m.insert("datadog-metrics", ("Datadog", "Library"));
    m.insert("winston", ("Winston", "Library"));
    m.insert("pino", ("Pino", "Library"));
    m.insert("morgan", ("Morgan", "Library"));
    m.insert("prometheus", ("Prometheus", "Library"));
    
    // Cache & DB & Messaging
    m.insert("amqplib", ("RabbitMQ JS", "Library"));
    m.insert("kafkajs", ("KafkaJS", "Library"));
    m.insert("bullmq", ("BullMQ", "Library"));
    m.insert("redis", ("Redis", "Database/ORM"));
    m.insert("ioredis", ("ioRedis", "Database/ORM"));
    m.insert("elasticsearch", ("Elasticsearch", "Database/ORM"));
    m.insert("@elastic/elasticsearch", ("Elasticsearch JS", "Database/ORM"));
    m.insert("algoliasearch", ("Algolia Search", "Library"));
    m.insert("meilisearch", ("Meilisearch", "Database/ORM"));
    
    // Payments & Services
    m.insert("stripe", ("Stripe", "Library"));
    m.insert("@stripe/stripe-js", ("Stripe JS", "Library"));
    m.insert("paypal", ("PayPal SDK", "Library"));
    m.insert("strapi", ("Strapi CMS", "Backend"));
    m.insert("contentful", ("Contentful CMS", "Library"));
    m.insert("sanity", ("Sanity CMS", "Library"));
    m.insert("ghost", ("Ghost CMS", "Backend"));
    
    // More Rust
    m.insert("reqwest", ("Reqwest", "Library"));
    m.insert("hyper", ("Hyper", "Library"));
    m.insert("clap", ("Clap", "Library"));
    m.insert("tracing", ("Tracing", "Library"));
    m.insert("anyhow", ("Anyhow", "Library"));
    m.insert("thiserror", ("Thiserror", "Library"));
    m.insert("lazy_static", ("Lazy Static", "Library"));
    m.insert("once_cell", ("Once Cell", "Library"));
    m.insert("chrono", ("Chrono", "Library"));
    m.insert("futures", ("Futures", "Library"));
    m.insert("sea-orm", ("SeaORM", "Database/ORM"));
    
    // More Python
    m.insert("numpy", ("NumPy", "Library"));
    m.insert("pandas", ("Pandas", "Library"));
    m.insert("scikit-learn", ("Scikit-Learn", "Library"));
    m.insert("tensorflow", ("TensorFlow", "Library"));
    m.insert("torch", ("PyTorch", "Library"));
    m.insert("celery", ("Celery", "Library"));
    m.insert("pydantic", ("Pydantic", "Library"));
    m.insert("uvicorn", ("Uvicorn", "Library"));
    m.insert("gunicorn", ("Gunicorn", "Library"));
    m.insert("requests", ("Requests", "Library"));
    m.insert("raw_input", ("Python 2 Input", "Library"));
    m.insert("jinja2", ("Jinja2", "Library"));
    m.insert("django-rest-framework", ("Django REST Framework", "Backend"));
    m.insert("djangorestframework", ("Django REST Framework", "Backend"));
    
    // More Go
    m.insert("zap", ("Zap Logger", "Library"));
    m.insert("logrus", ("Logrus", "Library"));
    m.insert("cobra", ("Cobra CLI", "Library"));
    m.insert("viper", ("Viper Config", "Library"));
    m.insert("protobuf", ("Protobuf", "Library"));
    m.insert("grpc", ("gRPC", "Library"));
    
    // Ruby
    m.insert("rails", ("Ruby on Rails", "Backend"));
    m.insert("sinatra", ("Sinatra", "Backend"));
    m.insert("rspec", ("RSpec", "Testing"));
    m.insert("sidekiq", ("Sidekiq", "Library"));
    m.insert("puma", ("Puma Server", "Library"));
    m.insert("devise", ("Devise Auth", "Library"));
    
    // C# / .NET
    m.insert("entityframework", ("Entity Framework", "Database/ORM"));
    m.insert("newtonsoft.json", ("Newtonsoft JSON", "Library"));
    m.insert("dapper", ("Dapper", "Database/ORM"));
    m.insert("nunit", ("NUnit", "Testing"));
    m.insert("xunit", ("xUnit", "Testing"));
    m.insert("serilog", ("Serilog", "Library"));
    m.insert("mediatr", ("MediatR", "Library"));
    m.insert("automapper", ("AutoMapper", "Library"));
    
    // Swift
    m.insert("alamofire", ("Alamofire", "Library"));
    m.insert("rxswift", ("RxSwift", "Library"));
    m.insert("snapkit", ("SnapKit", "Library"));
    m.insert("swiftyjson", ("SwiftyJSON", "Library"));
    m.insert("kingfisher", ("Kingfisher", "Library"));
    
    // Java / Kotlin / Scala
    m.insert("spring-boot-starter-web", ("Spring Boot Web", "Backend"));
    m.insert("spring-cloud", ("Spring Cloud", "Backend"));
    m.insert("hibernate-core", ("Hibernate", "Database/ORM"));
    m.insert("junit-jupiter-api", ("JUnit 5", "Testing"));
    m.insert("junit", ("JUnit", "Testing"));
    m.insert("jackson-databind", ("Jackson", "Library"));
    m.insert("gson", ("Gson", "Library"));
    m.insert("lombok", ("Lombok", "Library"));
    m.insert("kotlinx-coroutines-core", ("Kotlin Coroutines", "Library"));
    m.insert("ktor-server-core", ("Ktor Core", "Backend"));
    
    // Elixir
    m.insert("phoenix", ("Phoenix", "Backend"));
    m.insert("ecto", ("Ecto", "Database/ORM"));
    m.insert("plug", ("Plug", "Library"));
    m.insert("jason", ("Jason", "Library"));
    
    m
}

pub fn detect_tech_stack(root: &Path) -> Vec<TechStackItem> {
    let mut items = Vec::new();
    let known_tech = get_known_tech_map();

    // 1. Node.js (package.json)
    let pkg_json_path = root.join("package.json");
    if pkg_json_path.exists() {
        if let Ok(content) = fs::read_to_string(&pkg_json_path) {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                items.push(new_item("Node.js".to_string(), "".to_string(), "Environment".to_string()));
                
                let check_deps = |deps_val: &serde_json::Value| {
                    let mut found = Vec::new();
                    if let Some(obj) = deps_val.as_object() {
                        for (k, v) in obj {
                            let k_lower = k.to_lowercase();
                            if let Some(version_str) = v.as_str() {
                                if let Some(&(friendly, cat)) = known_tech.get(k_lower.as_str()) {
                                    found.push(new_item(friendly.to_string(), version_str.to_string(), cat.to_string()));
                                } else if k_lower.contains("react") || k_lower.contains("vue") || k_lower.contains("svelte") || k_lower.contains("tauri") {
                                    found.push(new_item(k.clone(), version_str.to_string(), "Library".to_string()));
                                }
                            }
                        }
                    }
                    found
                };
                
                if let Some(deps) = val.get("dependencies") {
                    items.extend(check_deps(deps));
                }
                if let Some(dev_deps) = val.get("devDependencies") {
                    items.extend(check_deps(dev_deps));
                }
            }
        }
    }
    
    // 2. Rust (Cargo.toml)
    let cargo_toml_path = root.join("Cargo.toml");
    if cargo_toml_path.exists() {
        if let Ok(content) = fs::read_to_string(&cargo_toml_path) {
            items.push(new_item("Rust".to_string(), "".to_string(), "Environment".to_string()));
            
            let mut in_deps = false;
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with('[') {
                    in_deps = trimmed.contains("dependencies");
                    continue;
                }
                
                if in_deps && trimmed.contains('=') {
                    let parts: Vec<&str> = trimmed.split('=').collect();
                    if parts.len() >= 2 {
                        let dep_name = parts[0].trim().trim_matches('"').trim_matches('\'');
                        let dep_val = parts[1].trim();
                        let version = if dep_val.starts_with('{') {
                            if let Some(idx) = dep_val.find("version") {
                                let after_ver = &dep_val[idx..];
                                if let Some(v_start) = after_ver.find('"') {
                                    let v_after = &after_ver[v_start+1..];
                                    if let Some(v_end) = v_after.find('"') {
                                        v_after[..v_end].to_string()
                                    } else {
                                        "".to_string()
                                    }
                                } else {
                                    "".to_string()
                                }
                            } else {
                                "workspace".to_string()
                            }
                        } else {
                            dep_val.trim_matches('"').trim_matches('\'').to_string()
                        };
                        
                        add_if_known(&mut items, &known_tech, dep_name, &version);
                    }
                }
            }
        }
    }
    
    // 3. Go (go.mod)
    let go_mod_path = root.join("go.mod");
    if go_mod_path.exists() {
        if let Ok(content) = fs::read_to_string(&go_mod_path) {
            items.push(new_item("Go".to_string(), "".to_string(), "Environment".to_string()));
            
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("require") {
                    let parts: Vec<&str> = trimmed.split_whitespace().collect();
                    if parts.len() >= 3 {
                        let full_path = parts[1];
                        let version = parts[2];
                        let dep_name = full_path.split('/').last().unwrap_or(full_path);
                        add_if_known(&mut items, &known_tech, dep_name, version);
                    }
                }
            }
        }
    }
    
    // 4. Python (requirements.txt / pyproject.toml)
    let reqs_path = root.join("requirements.txt");
    let mut has_python = false;
    if reqs_path.exists() {
        if let Ok(content) = fs::read_to_string(&reqs_path) {
            items.push(new_item("Python".to_string(), "".to_string(), "Environment".to_string()));
            has_python = true;
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.is_empty() || trimmed.starts_with('#') {
                    continue;
                }
                
                let split_chars = &['=', '>', '<', '~'][..];
                if let Some(idx) = trimmed.find(split_chars) {
                    let dep_name = trimmed[..idx].trim();
                    let version = trimmed[idx..].trim_start_matches(split_chars).trim();
                    add_if_known(&mut items, &known_tech, dep_name, version);
                }
            }
        }
    }

    let pyproject_path = root.join("pyproject.toml");
    if pyproject_path.exists() {
        if !has_python {
            items.push(new_item("Python".to_string(), "".to_string(), "Environment".to_string()));
        }
        if let Ok(content) = fs::read_to_string(&pyproject_path) {
            if content.contains("[tool.poetry.dependencies]") {
                items.push(new_item("Poetry".to_string(), "".to_string(), "Build Tool".to_string()));
            }
            let dep_regex = Regex::new(r#"([a-zA-Z0-9_\-]+)\s*=\s*['"]([^'"]+)['"]"#).unwrap();
            for cap in dep_regex.captures_iter(&content) {
                let dep_name = &cap[1];
                let version = &cap[2];
                add_if_known(&mut items, &known_tech, dep_name, version);
            }
        }
    }
    
    // 5. PHP (composer.json)
    let composer_path = root.join("composer.json");
    if composer_path.exists() {
        if let Ok(content) = fs::read_to_string(&composer_path) {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                items.push(new_item("PHP".to_string(), "".to_string(), "Environment".to_string()));
                
                let check_composer_deps = |deps_val: &serde_json::Value| {
                    let mut found = Vec::new();
                    if let Some(obj) = deps_val.as_object() {
                        for (k, v) in obj {
                            let name_only = k.split('/').last().unwrap_or(k);
                            let k_lower = name_only.to_lowercase();
                            if let Some(version_str) = v.as_str() {
                                if let Some(&(friendly, cat)) = known_tech.get(k_lower.as_str()) {
                                    found.push(new_item(friendly.to_string(), version_str.to_string(), cat.to_string()));
                                }
                            }
                        }
                    }
                    found
                };
                
                if let Some(require) = val.get("require") {
                    items.extend(check_composer_deps(require));
                }
                if let Some(require_dev) = val.get("require-dev") {
                    items.extend(check_composer_deps(require_dev));
                }
            }
        }
    }

    // 8. Java/Maven (pom.xml)
    let pom_path = root.join("pom.xml");
    if pom_path.exists() {
        items.push(new_item("Java".to_string(), "".to_string(), "Environment".to_string()));
        items.push(new_item("Maven".to_string(), "".to_string(), "Build Tool".to_string()));
        if let Ok(content) = fs::read_to_string(&pom_path) {
            let art_regex = Regex::new(r"<artifactId>([^<]+)</artifactId>").unwrap();
            for cap in art_regex.captures_iter(&content) {
                let dep_name = &cap[1];
                add_if_known(&mut items, &known_tech, dep_name, "");
            }
        }
    }

    // 9. Java/Gradle (build.gradle, build.gradle.kts)
    let build_gradle = root.join("build.gradle");
    let build_gradle_kts = root.join("build.gradle.kts");
    if build_gradle.exists() || build_gradle_kts.exists() {
        items.push(new_item("Java".to_string(), "".to_string(), "Environment".to_string()));
        items.push(new_item("Gradle".to_string(), "".to_string(), "Build Tool".to_string()));
        let content_path = if build_gradle.exists() { build_gradle } else { build_gradle_kts };
        if let Ok(content) = fs::read_to_string(content_path) {
            let gradle_regex = Regex::new(r#"(?:implementation|compile|testImplementation|api)\s+['"](?:group:\s*)?([^'"]+)['"]"#).unwrap();
            for cap in gradle_regex.captures_iter(&content) {
                let dep_name = cap[1].split(':').last().unwrap_or(cap[1].split(',').last().unwrap_or(&cap[1])).trim();
                add_if_known(&mut items, &known_tech, dep_name, "");
            }
        }
    }

    // 10. Ruby (Gemfile)
    let gemfile_path = root.join("Gemfile");
    if gemfile_path.exists() {
        items.push(new_item("Ruby".to_string(), "".to_string(), "Environment".to_string()));
        if let Ok(content) = fs::read_to_string(&gemfile_path) {
            let gem_regex = Regex::new(r#"gem\s+['"]([^'"]+)['"]"#).unwrap();
            for cap in gem_regex.captures_iter(&content) {
                let dep_name = &cap[1];
                add_if_known(&mut items, &known_tech, dep_name, "");
            }
        }
    }

    // 11. .NET (csproj, Directory.Packages.props)
    let mut has_dotnet = false;
    if let Ok(entries) = fs::read_dir(root) {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                if ext == "csproj" {
                    check_dotnet_file(&path, &mut items, &known_tech, &mut has_dotnet);
                }
            }
        }
    }
    let dpp_path = root.join("Directory.Packages.props");
    if dpp_path.exists() {
        check_dotnet_file(&dpp_path, &mut items, &known_tech, &mut has_dotnet);
    }

    // 12. Swift (Package.swift)
    let pkg_swift = root.join("Package.swift");
    if pkg_swift.exists() {
        items.push(new_item("Swift".to_string(), "".to_string(), "Environment".to_string()));
        if let Ok(content) = fs::read_to_string(&pkg_swift) {
            let swift_regex = Regex::new(r#"\.package\(\s*(?:url:\s*|name:\s*)['"]([^'"]+)['"]"#).unwrap();
            for cap in swift_regex.captures_iter(&content) {
                let dep_name = cap[1].split('/').last().unwrap_or(&cap[1]).trim_end_matches(".git");
                add_if_known(&mut items, &known_tech, dep_name, "");
            }
        }
    }

    // 13. Dart / Flutter (pubspec.yaml)
    let pubspec_path = root.join("pubspec.yaml");
    if pubspec_path.exists() {
        if let Ok(content) = fs::read_to_string(&pubspec_path) {
            let is_flutter = content.contains("sdk: flutter") || content.contains("flutter:");
            if is_flutter {
                items.push(new_item("Flutter".to_string(), "".to_string(), "Environment".to_string()));
            } else {
                items.push(new_item("Dart".to_string(), "".to_string(), "Environment".to_string()));
            }
            let pub_regex = Regex::new(r#"\n\s{2}([a-zA-Z0-9_\-]+):\s*['"]?([^'"\s]+)?['"]?"#).unwrap();
            for cap in pub_regex.captures_iter(&content) {
                let dep_name = &cap[1];
                if dep_name != "dependencies" && dep_name != "dev_dependencies" && dep_name != "flutter" {
                    let ver = cap.get(2).map(|m| m.as_str()).unwrap_or("");
                    add_if_known(&mut items, &known_tech, dep_name, ver);
                }
            }
        }
    }

    // 14. Elixir (mix.exs)
    let mix_path = root.join("mix.exs");
    if mix_path.exists() {
        items.push(new_item("Elixir".to_string(), "".to_string(), "Environment".to_string()));
        if let Ok(content) = fs::read_to_string(&mix_path) {
            let mix_regex = Regex::new(r#"\{:([a-zA-Z0-9_]+),\s*['"]?([^'"\s]+)['"]?\}"#).unwrap();
            for cap in mix_regex.captures_iter(&content) {
                let dep_name = &cap[1];
                let ver = &cap[2];
                add_if_known(&mut items, &known_tech, dep_name, ver);
            }
        }
    }
    
    // 6. Docker (Dockerfile or docker-compose.yml)
    let dockerfile_path = root.join("Dockerfile");
    if dockerfile_path.exists() {
        items.push(new_item("Docker".to_string(), "".to_string(), "DevOps".to_string()));
    }
    
    let docker_compose_path = root.join("docker-compose.yml");
    let docker_compose_yaml_path = root.join("docker-compose.yaml");
    if docker_compose_path.exists() || docker_compose_yaml_path.exists() {
        items.push(new_item("Docker Compose".to_string(), "".to_string(), "DevOps".to_string()));
    }
    
    // 7. GitHub Actions
    let gha_dir = root.join(".github").join("workflows");
    if gha_dir.exists() && gha_dir.is_dir() {
        items.push(new_item("GitHub Actions".to_string(), "".to_string(), "DevOps".to_string()));
    }

    // 15. More CI/CD
    if root.join(".gitlab-ci.yml").exists() {
        items.push(new_item("GitLab CI".to_string(), "".to_string(), "DevOps".to_string()));
    }
    if root.join("Jenkinsfile").exists() {
        items.push(new_item("Jenkins".to_string(), "".to_string(), "DevOps".to_string()));
    }
    if root.join(".circleci").join("config.yml").exists() {
        items.push(new_item("CircleCI".to_string(), "".to_string(), "DevOps".to_string()));
    }
    if root.join("azure-pipelines.yml").exists() || root.join("azure-pipelines.yaml").exists() {
        items.push(new_item("Azure Pipelines".to_string(), "".to_string(), "DevOps".to_string()));
    }

    // 16. Infrastructure & Monorepos
    // Terraform
    let mut has_tf = false;
    if let Ok(entries) = fs::read_dir(root) {
        for entry in entries.flatten() {
            if entry.path().extension().and_then(|s| s.to_str()) == Some("tf") {
                has_tf = true;
                break;
            }
        }
    }
    if has_tf {
        items.push(new_item("Terraform".to_string(), "".to_string(), "DevOps".to_string()));
    }

    // Kubernetes
    if root.join("k8s").exists() || root.join("kubernetes").exists() || root.join("kustomization.yaml").exists() {
        items.push(new_item("Kubernetes".to_string(), "".to_string(), "DevOps".to_string()));
    }
    // Nginx
    if root.join("nginx.conf").exists() {
        items.push(new_item("Nginx".to_string(), "".to_string(), "Infrastructure".to_string()));
    }
    // Apache
    if root.join(".htaccess").exists() {
        items.push(new_item("Apache".to_string(), "".to_string(), "Infrastructure".to_string()));
    }
    // Turborepo
    if root.join("turbo.json").exists() {
        items.push(new_item("Turborepo".to_string(), "".to_string(), "Build Tool".to_string()));
    }
    // Nx
    if root.join("nx.json").exists() {
        items.push(new_item("Nx".to_string(), "".to_string(), "Build Tool".to_string()));
    }
    // Lerna
    if root.join("lerna.json").exists() {
        items.push(new_item("Lerna".to_string(), "".to_string(), "Build Tool".to_string()));
    }
    // pnpm workspace
    if root.join("pnpm-workspace.yaml").exists() {
        items.push(new_item("pnpm Workspaces".to_string(), "".to_string(), "Build Tool".to_string()));
    }

    // De-duplicate items by name
    let mut unique_items: Vec<TechStackItem> = Vec::new();
    for item in items {
        if !unique_items.iter().any(|x| x.name == item.name) {
            unique_items.push(item);
        }
    }
    
    unique_items
}
