#pragma once

#include "FileAnalyzer.hpp"

namespace cba {

/**
 * @brief Analyzer for C source files (.c, .h).
 *
 * Handles both single-line (//) and multi-line block comments.
 * Separated from CppAnalyzer for accurate per-language statistics.
 */
class CAnalyzer : public FileAnalyzer {
public:
    explicit CAnalyzer(std::filesystem::path filePath);
    void analyze() override;
    [[nodiscard]] std::string languageName() const override;
    [[nodiscard]] Language language() const override;
};

} // namespace cba
