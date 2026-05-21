#include "JavaScriptAnalyzer.hpp"
#include <fstream>
#include <string>

namespace cba {

JavaScriptAnalyzer::JavaScriptAnalyzer(std::filesystem::path filePath)
    : FileAnalyzer(std::move(filePath)) {}

std::string JavaScriptAnalyzer::languageName() const {
    return "JavaScript";
}

Language JavaScriptAnalyzer::language() const {
    return Language::JavaScript;
}

void JavaScriptAnalyzer::analyze() {
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
            size_t endPos = line.find("*/");
            if (endPos != std::string::npos) {
                inBlockComment = false;
                std::string remainder = line.substr(endPos + 2);
                trim(remainder);
                if (!remainder.empty()) isCommentLine = false;
            }
        } else {
            if (line.starts_with("/*")) {
                isCommentLine = true;
                size_t endPos = line.find("*/");
                if (endPos == std::string::npos) {
                    inBlockComment = true;
                } else {
                    std::string remainder = line.substr(endPos + 2);
                    trim(remainder);
                    if (!remainder.empty()) isCommentLine = false;
                }
            } else if (line.starts_with("//")) {
                isCommentLine = true;
            }
        }

        if (isCommentLine) commentLines_++;
        else codeLines_++;
    }
}

} // namespace cba
