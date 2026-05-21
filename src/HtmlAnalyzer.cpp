#include "HtmlAnalyzer.hpp"
#include <fstream>
#include <string>

namespace cba {

HtmlAnalyzer::HtmlAnalyzer(std::filesystem::path filePath)
    : FileAnalyzer(std::move(filePath)) {}

std::string HtmlAnalyzer::languageName() const {
    return "HTML";
}

Language HtmlAnalyzer::language() const {
    return Language::HTML;
}

void HtmlAnalyzer::analyze() {
    std::ifstream file(filePath_);
    if (!file.is_open()) return;

    std::string line;
    bool inBlockComment = false;

    while (std::getline(file, line)) {
        trim(line);
        if (line.empty()) { blankLines_++; continue; }

        bool isCommentLine = false;

        if (inBlockComment) {
            isCommentLine = true;
            size_t endPos = line.find("-->");
            if (endPos != std::string::npos) {
                inBlockComment = false;
                std::string remainder = line.substr(endPos + 3);
                trim(remainder);
                if (!remainder.empty()) isCommentLine = false;
            }
        } else if (line.starts_with("<!--")) {
            isCommentLine = true;
            size_t endPos = line.find("-->");
            if (endPos == std::string::npos) {
                inBlockComment = true;
            } else {
                std::string remainder = line.substr(endPos + 3);
                trim(remainder);
                if (!remainder.empty()) isCommentLine = false;
            }
        }

        if (isCommentLine) commentLines_++;
        else codeLines_++;
    }
}

} // namespace cba
