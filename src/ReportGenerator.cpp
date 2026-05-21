#include "ReportGenerator.hpp"
#include <iostream>
#include <fstream>
#include <map>
#include <iomanip>
#include <algorithm>

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
    
    std::map<std::string, std::size_t> languageLines;

    for (const auto& file : files) {
        totalCodeLines += file->codeLines();
        totalCommentLines += file->commentLines();
        totalBlankLines += file->blankLines();
        totalLines += file->totalLines();
        languageLines[file->languageName()] += file->codeLines();
    }

    out << "# Codebase Analyzer Report\n\n";
    out << "**Root Path:** `" << scanner_.getRootPath().string() << "`\n\n";
    out << "**Supported Files Analyzed:** " << files.size() << "\n";
    out << "**Ignored Directories:** " << scanner_.ignoredDirectoriesCount() << "\n";
    out << "**Ignored Files:** " << scanner_.ignoredFilesCount() << "\n";
    out << "**Unsupported Files Skipped:** " << scanner_.unsupportedFilesCount() << "\n";
    out << "**.gitignore Rules Detected:** " << scanner_.gitignoreRules().size() << "\n\n";

    out << "## Overall Statistics\n\n";
    out << "| Metric | Count |\n";
    out << "|---|---|\n";
    out << "| Total Lines | " << totalLines << " |\n";
    out << "| Code Lines | " << totalCodeLines << " |\n";
    out << "| Comment Lines | " << totalCommentLines << " |\n";
    out << "| Blank Lines | " << totalBlankLines << " |\n\n";

    out << "## Language Distribution\n\n";
    out << "| Language | Lines of Code | Percentage |\n";
    out << "|---|---|---|\n";
    if (totalCodeLines > 0) {
        for (const auto& [lang, loc] : languageLines) {
            double percentage = (static_cast<double>(loc) / totalCodeLines) * 100.0;
            out << "| " << lang << " | " << loc << " | " 
                << std::fixed << std::setprecision(2) << percentage << "% |\n";
        }
    } else {
        out << "| N/A | 0 | 0.00% |\n";
    }

    out << "## Scan Scope\n\n";
    out << "| Ignore Rule | Source |\n";
    out << "|---|---|\n";
    for (const auto& rule : scanner_.appliedIgnoreRules()) {
        bool fromGitignore = std::find(scanner_.gitignoreRules().begin(), scanner_.gitignoreRules().end(), rule) != scanner_.gitignoreRules().end();
        out << "| `" << rule << "` | " << (fromGitignore ? ".gitignore" : "default") << " |\n";
    }

    out << "\n## File Details\n\n";
    out << "| File | Language | Total | Code | Comments | Blank |\n";
    out << "|---|---|---|---|---|---|\n";
    for (const auto& file : files) {
        out << "| `" << file->fileName() << "` | " 
            << file->languageName() << " | "
            << file->totalLines() << " | "
            << file->codeLines() << " | "
            << file->commentLines() << " | "
            << file->blankLines() << " |\n";
    }
}

} // namespace cba
