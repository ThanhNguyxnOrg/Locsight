#pragma once

#include "FileAnalyzer.hpp"

namespace cba {

class CppAnalyzer : public FileAnalyzer {
public:
    explicit CppAnalyzer(std::filesystem::path filePath);
    void analyze() override;
    [[nodiscard]] std::string languageName() const override;
    [[nodiscard]] Language language() const override;
};

} // namespace cba
