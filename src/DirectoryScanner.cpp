#include "DirectoryScanner.hpp"
#include "CppAnalyzer.hpp"
#include "CAnalyzer.hpp"
#include "PythonAnalyzer.hpp"
#include "HtmlAnalyzer.hpp"
#include "CssAnalyzer.hpp"
#include "JavaScriptAnalyzer.hpp"
#include "TypeScriptAnalyzer.hpp"
#include "JavaAnalyzer.hpp"
#include "CSharpAnalyzer.hpp"
#include <algorithm>

namespace cba {

DirectoryScanner::DirectoryScanner(std::filesystem::path rootPath)
    : rootPath_(std::move(rootPath)) {}

bool DirectoryScanner::shouldIgnore(const std::filesystem::path& path) const {
    std::string filename = path.filename().string();
    if (filename == ".git" || filename == "node_modules" || 
        filename == "build" || filename == "dist" || 
        filename == "bin" || filename == "venv") {
        return true;
    }
    return false;
}

std::unique_ptr<FileAnalyzer> DirectoryScanner::createAnalyzer(const std::filesystem::path& path) const {
    if (!std::filesystem::is_regular_file(path)) {
        return nullptr;
    }

    std::string ext = path.extension().string();
    std::transform(ext.begin(), ext.end(), ext.begin(), [](unsigned char c) { return std::tolower(c); });

    // ── C++ ──
    if (ext == ".cpp" || ext == ".hpp" || ext == ".cxx" || ext == ".cc" || ext == ".hxx" || ext == ".hh") {
        return std::make_unique<CppAnalyzer>(path);
    }
    // ── C ── (.c and .h are C by convention; .hpp is C++)
    if (ext == ".c" || ext == ".h") {
        return std::make_unique<CAnalyzer>(path);
    }
    // ── Python ──
    if (ext == ".py") {
        return std::make_unique<PythonAnalyzer>(path);
    }
    // ── HTML ──
    if (ext == ".html" || ext == ".htm") {
        return std::make_unique<HtmlAnalyzer>(path);
    }
    // ── CSS ──
    if (ext == ".css") {
        return std::make_unique<CssAnalyzer>(path);
    }
    // ── JavaScript ──
    if (ext == ".js" || ext == ".jsx") {
        return std::make_unique<JavaScriptAnalyzer>(path);
    }
    // ── TypeScript ──
    if (ext == ".ts" || ext == ".tsx") {
        return std::make_unique<TypeScriptAnalyzer>(path);
    }
    // ── Java ──
    if (ext == ".java") {
        return std::make_unique<JavaAnalyzer>(path);
    }
    // ── C# ──
    if (ext == ".cs") {
        return std::make_unique<CSharpAnalyzer>(path);
    }

    return nullptr;
}

void DirectoryScanner::scanDirectory() {
    if (!std::filesystem::exists(rootPath_)) {
        return;
    }

    auto it = std::filesystem::recursive_directory_iterator(rootPath_, std::filesystem::directory_options::skip_permission_denied);
    for (auto& entry : it) {
        if (entry.is_directory() && shouldIgnore(entry.path())) {
            it.disable_recursion_pending();
            continue;
        }

        if (entry.is_regular_file()) {
            if (auto analyzer = createAnalyzer(entry.path())) {
                files_.push_back(std::move(analyzer));
            }
        }
    }
}

void DirectoryScanner::runAnalysis() {
    for (auto& file : files_) {
        file->analyze();
    }
}

const std::vector<std::unique_ptr<FileAnalyzer>>& DirectoryScanner::getFiles() const {
    return files_;
}

const std::filesystem::path& DirectoryScanner::getRootPath() const {
    return rootPath_;
}

} // namespace cba
