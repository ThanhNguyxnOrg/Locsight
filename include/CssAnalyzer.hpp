#pragma once

#include "FileAnalyzer.hpp"

namespace cba {

/// Analyzer for CSS files (.css). Comment syntax: /* ... */
class CssAnalyzer : public FileAnalyzer {
public:
    explicit CssAnalyzer(std::filesystem::path filePath);
    void analyze() override;
    [[nodiscard]] std::string languageName() const override;
    [[nodiscard]] Language language() const override;
};

} // namespace cba
