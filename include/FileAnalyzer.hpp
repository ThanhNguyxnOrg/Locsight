#pragma once

#include <cstdint>
#include <filesystem>
#include <string>

namespace cba {

/**
 * @brief Recognized language type for each source file.
 *
 * Each language has its own enum value, allowing accurate
 * per-language statistics and reporting.
 */
enum class Language {
    Cpp,           // C++ (.cpp, .hpp, .cxx, .cc, .hxx, .hh)
    C,             // C    (.c, .h)
    Python,        // Python (.py)
    Java,          // Java (.java)
    CSharp,        // C# (.cs)
    HTML,          // HTML (.html, .htm)
    CSS,           // CSS (.css)
    JavaScript,    // JavaScript (.js, .jsx)
    TypeScript,    // TypeScript (.ts, .tsx)
    Unknown
};

/**
 * @brief Abstract base class for all source file analyzers.
 *
 * Defines the common interface and holds core metric properties:
 * codeLines, commentLines, blankLines. Subclasses implement
 * analyze() with language-specific comment parsing logic.
 */
class FileAnalyzer {
public:
    explicit FileAnalyzer(std::filesystem::path filePath);
    virtual ~FileAnalyzer() = default;

    // Disable copy to prevent duplicating resources / metrics.
    FileAnalyzer(const FileAnalyzer&) = delete;
    FileAnalyzer& operator=(const FileAnalyzer&) = delete;
    FileAnalyzer(FileAnalyzer&&) = default;
    FileAnalyzer& operator=(FileAnalyzer&&) = default;

    /// Pure virtual method - subclasses must override.
    virtual void analyze() = 0;

    /// Human-readable language name for reports (e.g. "C++", "Python").
    [[nodiscard]] virtual std::string languageName() const = 0;

    /// Language type (enum).
    [[nodiscard]] virtual Language language() const = 0;

    // ---- Getters ----
    [[nodiscard]] const std::filesystem::path& filePath()    const noexcept { return filePath_; }
    [[nodiscard]] const std::string&           fileName()    const noexcept { return fileName_; }
    [[nodiscard]] std::uintmax_t               fileSize()    const noexcept { return fileSize_; }
    [[nodiscard]] std::size_t                  codeLines()   const noexcept { return codeLines_; }
    [[nodiscard]] std::size_t                  commentLines()const noexcept { return commentLines_; }
    [[nodiscard]] std::size_t                  blankLines()  const noexcept { return blankLines_; }
    [[nodiscard]] std::size_t                  totalLines()  const noexcept {
        return codeLines_ + commentLines_ + blankLines_;
    }

protected:
    std::filesystem::path filePath_;
    std::string           fileName_;
    std::uintmax_t        fileSize_{0};

    std::size_t codeLines_{0};
    std::size_t commentLines_{0};
    std::size_t blankLines_{0};

    /// Check whether a line is blank (contains only whitespace).
    static bool isBlank(const std::string& line) noexcept;

    /// Strip leading and trailing whitespace from a string (in-place).
    static void trim(std::string& s) noexcept;
};

} // namespace cba
