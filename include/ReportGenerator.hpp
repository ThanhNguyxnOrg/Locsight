#pragma once

#include "DirectoryScanner.hpp"
#include <string>

namespace cba {

class ReportGenerator {
public:
    explicit ReportGenerator(const DirectoryScanner& scanner);
    
    void printConsoleReport() const;
    void generateMarkdownReport(const std::string& outputPath) const;

private:
    const DirectoryScanner& scanner_;
};

} // namespace cba
