#include "FileAnalyzer.hpp"
#include "DirectoryScanner.hpp"
#include <iostream>
#include <cassert>
#include <fstream>
#include <filesystem>

namespace fs = std::filesystem;

// Mock subclass to test FileAnalyzer protected static methods and setters
class TestFileAnalyzer : public cba::FileAnalyzer {
public:
    explicit TestFileAnalyzer(fs::path path) : FileAnalyzer(std::move(path)) {}
    
    void analyze() override {
        codeLines_ = 10;
        commentLines_ = 5;
        blankLines_ = 2;
    }
    
    std::string languageName() const override { return "TestLang"; }
    cba::Language language() const override { return cba::Language::Unknown; }

    // Expose protected static methods for unit testing
    using FileAnalyzer::isBlank;
    using FileAnalyzer::trim;
};

void testStringTrimming() {
    std::string testStr = "   hello world   ";
    TestFileAnalyzer::trim(testStr);
    assert(testStr == "hello world" && "Trim failed on both ends");

    std::string tabStr = "\t\tcode;\n";
    TestFileAnalyzer::trim(tabStr);
    assert(tabStr == "code;" && "Trim failed on tabs/newlines");
    std::cout << "✅ [Unit Test] String trimming logic passed!" << std::endl;
}

void testBlankLineDetection() {
    assert(TestFileAnalyzer::isBlank("") == true);
    assert(TestFileAnalyzer::isBlank("    ") == true);
    assert(TestFileAnalyzer::isBlank("\t\t") == true);
    assert(TestFileAnalyzer::isBlank("  a  ") == false);
    std::cout << "✅ [Unit Test] Blank line detection passed!" << std::endl;
}

void testFileMetricsEncapsulation() {
    fs::path tempFile = "temp_test.txt";
    std::ofstream out(tempFile);
    out << "line 1\n";
    out.close();

    TestFileAnalyzer analyzer(tempFile);
    analyzer.analyze();

    assert(analyzer.codeLines() == 10);
    assert(analyzer.commentLines() == 5);
    assert(analyzer.blankLines() == 2);
    assert(analyzer.totalLines() == 17);

    fs::remove(tempFile);
    std::cout << "✅ [Unit Test] Metrics encapsulation passed!" << std::endl;
}

int main() {
    std::cout << "=== RUNNING CODEBASE ANALYZER UNIT TESTS ===" << std::endl;
    try {
        testStringTrimming();
        testBlankLineDetection();
        testFileMetricsEncapsulation();
        std::cout << "🎉 ALL UNIT TESTS PASSED SUCCESSFULLY! 🎉" << std::endl;
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "❌ Test failed: " << e.what() << std::endl;
        return 1;
    }
}
