#include "ReportGenerator.hpp"
#include <iostream>
#include <fstream>
#include <map>
#include <iomanip>
#include <algorithm>
#include <ctime>

namespace cba {

ReportGenerator::ReportGenerator(const DirectoryScanner& scanner)
    : scanner_(scanner) {}

void ReportGenerator::printConsoleReport() const {
    const auto& files = scanner_.getFiles();
    
    std::size_t totalCodeLines = 0;
    std::size_t totalCommentLines = 0;
    std::size_t totalBlankLines = 0;
    std::size_t totalLines = 0;
    
    std::map<std::string, std::size_t> languageLines;

    for (const auto& file : files) {
        totalCodeLines += file->codeLines();
        totalCommentLines += file->commentLines();
        totalBlankLines += file->blankLines();
        totalLines += file->totalLines();
        languageLines[file->languageName()] += file->codeLines();
    }

    std::cout << "=========================================\n";
    std::cout << "          CODEBASE ANALYZER REPORT       \n";
    std::cout << "=========================================\n";
    std::cout << "Root Path: " << scanner_.getRootPath().string() << "\n";
    std::cout << "Supported Files Analyzed: " << files.size() << "\n";
    std::cout << "Ignored Directories: " << scanner_.ignoredDirectoriesCount() << "\n";
    std::cout << "Ignored Files: " << scanner_.ignoredFilesCount() << "\n";
    std::cout << "Unsupported Files Skipped: " << scanner_.unsupportedFilesCount() << "\n";
    std::cout << ".gitignore Rules Detected: " << scanner_.gitignoreRules().size() << "\n\n";

    std::cout << "--- Overall Statistics ---\n";
    std::cout << "Total Lines:   " << totalLines << "\n";
    std::cout << "Code Lines:    " << totalCodeLines << "\n";
    std::cout << "Comment Lines: " << totalCommentLines << "\n";
    std::cout << "Blank Lines:   " << totalBlankLines << "\n\n";

    std::cout << "--- Language Distribution (by LOC) ---\n";
    if (totalCodeLines > 0) {
        for (const auto& [lang, loc] : languageLines) {
            double percentage = (static_cast<double>(loc) / totalCodeLines) * 100.0;
            std::cout << std::left << std::setw(10) << lang << ": " 
                      << std::right << std::setw(8) << loc << " LOC (" 
                      << std::fixed << std::setprecision(2) << percentage << "%)\n";
        }
    } else {
        std::cout << "No code lines found.\n";
    }
    std::cout << "=========================================\n";
}

void ReportGenerator::generateMarkdownReport(const std::string& outputPath) const {
    std::ofstream out(outputPath);
    if (!out.is_open()) {
        std::cerr << "Failed to open output file: " << outputPath << "\n";
        return;
    }

    const auto& files = scanner_.getFiles();
    
    std::size_t totalCodeLines = 0;
    std::size_t totalCommentLines = 0;
    std::size_t totalBlankLines = 0;
    std::size_t totalLines = 0;
    
    struct LangStat {
        std::string name;
        std::size_t files = 0;
        std::size_t lines = 0;
        std::size_t code = 0;
        std::size_t comments = 0;
        std::size_t blanks = 0;
    };

    std::map<std::string, LangStat> langMap;

    for (const auto& file : files) {
        totalCodeLines += file->codeLines();
        totalCommentLines += file->commentLines();
        totalBlankLines += file->blankLines();
        totalLines += file->totalLines();

        auto& stat = langMap[file->languageName()];
        stat.name = file->languageName();
        stat.files++;
        stat.lines += file->totalLines();
        stat.code += file->codeLines();
        stat.comments += file->commentLines();
        stat.blanks += file->blankLines();
    }

    std::vector<LangStat> langList;
    for (const auto& [name, stat] : langMap) {
        langList.push_back(stat);
    }
    std::sort(langList.begin(), langList.end(), [](const LangStat& a, const LangStat& b) {
        if (a.lines != b.lines) return a.lines > b.lines;
        return a.name < b.name;
    });

    std::time_t now = std::time(nullptr);
    char timeStr[100];
    std::string timestamp = "N/A";
    if (std::strftime(timeStr, sizeof(timeStr), "%Y-%m-%d %H:%M", std::localtime(&now))) {
        timestamp = timeStr;
    }

    std::string projectFolder = scanner_.getRootPath().filename().string();
    if (projectFolder.empty()) {
        projectFolder = scanner_.getRootPath().string();
    }

    std::size_t scannedFiles = files.size() + scanner_.unsupportedFilesCount();

    out << "# Codebase Analyzer Report\n\n";
    out << "**Project Folder:** `" << projectFolder << "`  \n";
    out << "**Scan Timestamp:** `" << timestamp << "`  \n";
    out << "**Directory Path:** `" << scanner_.getRootPath().string() << "`  \n\n";

    out << "## Summary Metrics\n\n";
    out << "| Metric | Count |\n";
    out << "| :--- | :--- |\n";
    out << "| Scanned Files | " << scannedFiles << " |\n";
    out << "| Supported Source Files | " << files.size() << " |\n";
    out << "| Ignored Folders | " << scanner_.ignoredDirectoriesCount() << " |\n";
    out << "| Ignored Files | " << scanner_.ignoredFilesCount() << " |\n";
    out << "| Unsupported Files Skipped | " << scanner_.unsupportedFilesCount() << " |\n";
    out << "| Total Lines | " << totalLines << " |\n";
    out << "| Code Lines | " << totalCodeLines << " |\n";
    out << "| Comment Lines | " << totalCommentLines << " |\n";
    out << "| Blank Lines | " << totalBlankLines << " |\n\n";

    out << "## Language Distribution\n\n";
    out << "| Language | Files | Total Lines | Code Lines | Comment Lines | Blank Lines | Percentage |\n";
    out << "| :--- | :---: | :---: | :---: | :---: | :---: | :---: |\n";
    for (const auto& l : langList) {
        double percentage = totalCodeLines > 0 ? (static_cast<double>(l.code) / totalCodeLines) * 100.0 : 0.0;
        out << "| " << l.name << " | " << l.files << " | " << l.lines << " | " << l.code << " | " << l.comments << " | " << l.blanks << " | "
            << std::fixed << std::setprecision(2) << percentage << "% |\n";
    }

    out << "\n## Applied Ignore Rules\n\n";
    out << "| Ignore Rule | Source |\n";
    out << "| :--- | :--- |\n";
    for (const auto& rule : scanner_.appliedIgnoreRules()) {
        bool fromGitignore = std::find(scanner_.gitignoreRules().begin(), scanner_.gitignoreRules().end(), rule) != scanner_.gitignoreRules().end();
        out << "| `" << rule << "` | " << (fromGitignore ? ".gitignore" : "default") << " |\n";
    }

    out << "\n## File Details\n\n";
    out << "| File | Language | Total | Code | Comments | Blank |\n";
    out << "| :--- | :--- | :---: | :---: | :---: | :---: |\n";
    for (const auto& file : files) {
        std::string relativePath = std::filesystem::relative(file->filePath(), scanner_.getRootPath()).string();
        std::replace(relativePath.begin(), relativePath.end(), '\\', '/');

        out << "| `" << relativePath << "` | " 
            << file->languageName() << " | "
            << file->totalLines() << " | "
            << file->codeLines() << " | "
            << file->commentLines() << " | "
            << file->blankLines() << " |\n";
    }
}

} // namespace cba
