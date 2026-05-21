#pragma once

#include "FileAnalyzer.hpp"

namespace cba {

/// Analyzer for JavaScript files (.js, .jsx). Comment syntax: // and /* ... */
class JavaScriptAnalyzer : public FileAnalyzer {
public:
    explicit JavaScriptAnalyzer(std::filesystem::path filePath);
    void analyze() override;
    [[nodiscard]] std::string languageName() const override;
    [[nodiscard]] Language language() const override;
};

} // namespace cba
