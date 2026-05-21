#pragma once

#include "FileAnalyzer.hpp"
#include <filesystem>
#include <memory>
#include <string>
#include <vector>

namespace cba {

class DirectoryScanner {
public:
    explicit DirectoryScanner(std::filesystem::path rootPath);
    
    void scanDirectory();
    void runAnalysis();
    
    [[nodiscard]] const std::vector<std::unique_ptr<FileAnalyzer>>& getFiles() const;
    [[nodiscard]] const std::filesystem::path& getRootPath() const;
    [[nodiscard]] std::size_t ignoredDirectoriesCount() const;
    [[nodiscard]] std::size_t ignoredFilesCount() const;
    [[nodiscard]] std::size_t unsupportedFilesCount() const;
    [[nodiscard]] const std::vector<std::string>& gitignoreRules() const;
    [[nodiscard]] const std::vector<std::string>& appliedIgnoreRules() const;

private:
    std::filesystem::path rootPath_;
    std::vector<std::unique_ptr<FileAnalyzer>> files_;
    std::size_t ignoredDirectories_ = 0;
    std::size_t ignoredFiles_ = 0;
    std::size_t unsupportedFiles_ = 0;
    std::vector<std::string> defaultIgnoreRules_;
    std::vector<std::string> gitignoreRules_;
    std::vector<std::string> appliedIgnoreRules_;
    
    void loadIgnoreRules();
    bool shouldIgnore(const std::filesystem::path& path, bool isDirectory) const;
    std::unique_ptr<FileAnalyzer> createAnalyzer(const std::filesystem::path& path) const;
};

} // namespace cba
