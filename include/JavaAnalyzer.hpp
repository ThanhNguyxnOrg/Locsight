#pragma once

#include "FileAnalyzer.hpp"

namespace cba {

class JavaAnalyzer : public FileAnalyzer {
public:
    explicit JavaAnalyzer(std::filesystem::path filePath);
    void analyze() override;
    [[nodiscard]] std::string languageName() const override;
    [[nodiscard]] Language language() const override;
};

} // namespace cba
