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
#include <cctype>
#include <fstream>
#include <regex>
#include <set>
#include <sstream>

namespace {

std::string trim(std::string value) {
    auto notSpace = [](unsigned char c) { return !std::isspace(c); };
    value.erase(value.begin(), std::find_if(value.begin(), value.end(), notSpace));
    value.erase(std::find_if(value.rbegin(), value.rend(), notSpace).base(), value.end());
    return value;
}

std::string normalizePath(std::string value) {
    std::replace(value.begin(), value.end(), '\\', '/');
    while (!value.empty() && value.front() == '/') value.erase(value.begin());
    while (value.find("//") != std::string::npos) value.replace(value.find("//"), 2, "/");
    return value;
}

std::vector<std::string> splitPath(const std::string& path) {
    std::vector<std::string> parts;
    std::stringstream ss(path);
    std::string item;
    while (std::getline(ss, item, '/')) {
        if (!item.empty()) parts.push_back(item);
    }
    return parts;
}

bool containsWildcard(const std::string& value) {
    return value.find('*') != std::string::npos || value.find('?') != std::string::npos;
}

std::string wildcardToRegex(std::string pattern) {
    std::string out;
    for (std::size_t i = 0; i < pattern.size(); ++i) {
        const char c = pattern[i];
        if (c == '*') {
            if (i + 1 < pattern.size() && pattern[i + 1] == '*') {
                out += ".*";
                ++i;
            } else {
                out += "[^/]*";
            }
        } else if (c == '?') {
            out += "[^/]";
        } else if (std::string(".\\+^$(){}[]|").find(c) != std::string::npos) {
            out += '\\';
            out += c;
        } else {
            out += c;
        }
    }
    return out;
}

bool regexMatchesPath(const std::string& pattern, const std::string& path, bool basenameOnly, bool anchored) {
    const std::string body = wildcardToRegex(pattern);
    const std::string regexText = basenameOnly ? "^" + body + "$" : (anchored ? "^" + body + "($|/)" : "(^|/)" + body + "($|/)");
    return std::regex_search(path, std::regex(regexText));
}

bool ruleMatches(std::string rawRule, const std::string& relativePath, bool isDirectory) {
    if (rawRule.empty()) return false;

    const bool negate = rawRule.front() == '!';
    if (negate) rawRule.erase(rawRule.begin());

    const bool dirOnly = !rawRule.empty() && rawRule.back() == '/';
    const bool anchored = !rawRule.empty() && rawRule.front() == '/';

    while (!rawRule.empty() && rawRule.front() == '/') rawRule.erase(rawRule.begin());
    while (!rawRule.empty() && rawRule.back() == '/') rawRule.pop_back();

    const std::string rule = normalizePath(rawRule);
    if (rule.empty()) return false;
    if (dirOnly && !isDirectory) return false;

    const bool hasSlash = rule.find('/') != std::string::npos;
    const bool hasWildcard = containsWildcard(rule);
    const auto segments = splitPath(relativePath);

    if (!hasSlash && !anchored) {
        if (hasWildcard) {
            return std::any_of(segments.begin(), segments.end(), [&](const std::string& segment) {
                return regexMatchesPath(rule, segment, true, false);
            });
        }
        return std::find(segments.begin(), segments.end(), rule) != segments.end();
    }

    if (hasWildcard) {
        return regexMatchesPath(rule, relativePath, false, anchored);
    }

    if (anchored) {
        return relativePath == rule || (isDirectory && relativePath.rfind(rule + '/', 0) == 0);
    }

    return relativePath == rule ||
           relativePath.ends_with('/' + rule) ||
           (isDirectory && relativePath.find('/' + rule + '/') != std::string::npos);
}

} // namespace

namespace cba {

DirectoryScanner::DirectoryScanner(std::filesystem::path rootPath)
    : rootPath_(std::move(rootPath)),
      defaultIgnoreRules_{".git", "build", "release", "bin", "dist", "node_modules", "venv", ".next", "coverage"} {}

void DirectoryScanner::loadIgnoreRules() {
    gitignoreRules_.clear();
    appliedIgnoreRules_ = defaultIgnoreRules_;
    std::set<std::string> seen(defaultIgnoreRules_.begin(), defaultIgnoreRules_.end());

    std::ifstream gitignore(rootPath_ / ".gitignore");
    if (!gitignore.is_open()) return;

    std::string line;
    while (std::getline(gitignore, line)) {
        line = trim(line);
        if (line.empty() || line.front() == '#') continue;
        gitignoreRules_.push_back(line);
        if (seen.insert(line).second) {
            appliedIgnoreRules_.push_back(line);
        }
    }
}

bool DirectoryScanner::shouldIgnore(const std::filesystem::path& path, bool isDirectory) const {
    std::string relative = normalizePath(std::filesystem::relative(path, rootPath_).string());
    bool ignored = false;

    for (const auto& rule : appliedIgnoreRules_) {
        const bool negate = !rule.empty() && rule.front() == '!';
        if (ruleMatches(rule, relative, isDirectory)) {
            ignored = !negate;
        }
    }

    return ignored;
}

std::unique_ptr<FileAnalyzer> DirectoryScanner::createAnalyzer(const std::filesystem::path& path) const {
    if (!std::filesystem::is_regular_file(path)) {
        return nullptr;
    }

    std::string ext = path.extension().string();
    std::transform(ext.begin(), ext.end(), ext.begin(), [](unsigned char c) {
        return static_cast<char>(std::tolower(c));
    });

    if (ext == ".cpp" || ext == ".hpp" || ext == ".cxx" || ext == ".cc" || ext == ".hxx" || ext == ".hh") {
        return std::make_unique<CppAnalyzer>(path);
    }
    if (ext == ".c" || ext == ".h") {
        return std::make_unique<CAnalyzer>(path);
    }
    if (ext == ".py") {
        return std::make_unique<PythonAnalyzer>(path);
    }
    if (ext == ".html" || ext == ".htm") {
        return std::make_unique<HtmlAnalyzer>(path);
    }
    if (ext == ".css") {
        return std::make_unique<CssAnalyzer>(path);
    }
    if (ext == ".js" || ext == ".jsx" || ext == ".mjs" || ext == ".cjs") {
        return std::make_unique<JavaScriptAnalyzer>(path);
    }
    if (ext == ".ts" || ext == ".tsx" || ext == ".mts" || ext == ".cts") {
        return std::make_unique<TypeScriptAnalyzer>(path);
    }
    if (ext == ".java") {
        return std::make_unique<JavaAnalyzer>(path);
    }
    if (ext == ".cs") {
        return std::make_unique<CSharpAnalyzer>(path);
    }

    return nullptr;
}

void DirectoryScanner::scanDirectory() {
    files_.clear();
    ignoredDirectories_ = 0;
    ignoredFiles_ = 0;
    unsupportedFiles_ = 0;
    loadIgnoreRules();

    if (!std::filesystem::exists(rootPath_)) {
        return;
    }

    auto it = std::filesystem::recursive_directory_iterator(rootPath_, std::filesystem::directory_options::skip_permission_denied);
    for (auto& entry : it) {
        if (entry.is_directory() && shouldIgnore(entry.path(), true)) {
            ignoredDirectories_++;
            it.disable_recursion_pending();
            continue;
        }

        if (entry.is_regular_file()) {
            if (shouldIgnore(entry.path(), false)) {
                ignoredFiles_++;
                continue;
            }

            if (auto analyzer = createAnalyzer(entry.path())) {
                files_.push_back(std::move(analyzer));
            } else {
                unsupportedFiles_++;
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

std::size_t DirectoryScanner::ignoredDirectoriesCount() const {
    return ignoredDirectories_;
}

std::size_t DirectoryScanner::ignoredFilesCount() const {
    return ignoredFiles_;
}

std::size_t DirectoryScanner::unsupportedFilesCount() const {
    return unsupportedFiles_;
}

const std::vector<std::string>& DirectoryScanner::gitignoreRules() const {
    return gitignoreRules_;
}

const std::vector<std::string>& DirectoryScanner::appliedIgnoreRules() const {
    return appliedIgnoreRules_;
}

} // namespace cba
