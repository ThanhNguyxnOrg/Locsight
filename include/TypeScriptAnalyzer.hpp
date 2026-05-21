#pragma once

#include "FileAnalyzer.hpp"

namespace cba {

/// Analyzer for TypeScript files (.ts, .tsx). Comment syntax: // and /* ... */
class TypeScriptAnalyzer : public FileAnalyzer {
public:
    explicit TypeScriptAnalyzer(std::filesystem::path filePath);
    void analyze() override;
    [[nodiscard]] std::string languageName() const override;
    [[nodiscard]] Language language() const override;
};

} // namespace cba
