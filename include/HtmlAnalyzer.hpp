#pragma once

#include "FileAnalyzer.hpp"

namespace cba {

/// Analyzer for HTML files (.html, .htm). Comment syntax: <!-- ... -->
class HtmlAnalyzer : public FileAnalyzer {
public:
    explicit HtmlAnalyzer(std::filesystem::path filePath);
    void analyze() override;
    [[nodiscard]] std::string languageName() const override;
    [[nodiscard]] Language language() const override;
};

} // namespace cba
