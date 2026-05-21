#include "DirectoryScanner.hpp"
#include "ReportGenerator.hpp"
#include <iostream>
#include <string>
#include <filesystem>

int main(int argc, char* argv[]) {
    std::filesystem::path targetDir;
    
    if (argc < 2) {
        targetDir = std::filesystem::current_path();
        std::cout << "No directory specified. Analyzing current directory...\n";
    } else {
        targetDir = argv[1];
    }
    
    if (!std::filesystem::exists(targetDir)) {
        std::cerr << "Error: Directory does not exist: " << targetDir.string() << "\n";
        return 1;
    }
    
    if (!std::filesystem::is_directory(targetDir)) {
        std::cerr << "Error: Path is not a directory: " << targetDir.string() << "\n";
        return 1;
    }

    cba::DirectoryScanner scanner(targetDir);
    scanner.scanDirectory();
    scanner.runAnalysis();

    cba::ReportGenerator reportGen(scanner);
    reportGen.printConsoleReport();
    
    std::filesystem::path reportPath = targetDir / "codebase_report.md";
    reportGen.generateMarkdownReport(reportPath.string());
    std::cout << "Report saved to: " << reportPath.string() << "\n";

    return 0;
}
