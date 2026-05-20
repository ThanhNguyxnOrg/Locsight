#pragma once

#include "FileAnalyzer.hpp"

namespace cba {

class CSharpAnalyzer : public FileAnalyzer {
public:
    explicit CSharpAnalyzer(std::filesystem::path filePath);
    void analyze() override;
    [[nodiscard]] std::string languageName() const override;
    [[nodiscard]] Language language() const override;
};

} // namespace cba
