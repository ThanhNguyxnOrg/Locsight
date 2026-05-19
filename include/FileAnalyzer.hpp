#pragma once

#include <cstdint>
#include <filesystem>
#include <string>

namespace cba {

/**
 * @brief Loại ngôn ngữ được nhận diện cho mỗi tệp tin.
 */
enum class Language {
    Cpp,
    Python,
    Web,     // HTML / CSS / JS / TS
    Java,
    CSharp,
    Unknown
};

/**
 * @brief Lớp cơ sở trừu tượng cho mọi loại tệp mã nguồn.
 *
 * Định nghĩa giao diện chung và chứa các thuộc tính số liệu cốt lõi:
 * codeLines, commentLines, blankLines. Các lớp con triển khai phương thức
 * analyze() để phân tích cú pháp riêng cho từng ngôn ngữ.
 */
class FileAnalyzer {
public:
    explicit FileAnalyzer(std::filesystem::path filePath);
    virtual ~FileAnalyzer() = default;

    // Không cho copy để tránh nhân đôi tài nguyên / chỉ số.
    FileAnalyzer(const FileAnalyzer&) = delete;
    FileAnalyzer& operator=(const FileAnalyzer&) = delete;
    FileAnalyzer(FileAnalyzer&&) = default;
    FileAnalyzer& operator=(FileAnalyzer&&) = default;

    /// Phương thức ảo thuần túy - các lớp con phải override.
    virtual void analyze() = 0;

    /// Tên ngôn ngữ hiển thị trong báo cáo (ví dụ: "C++", "Python").
    [[nodiscard]] virtual std::string languageName() const = 0;

    /// Loại ngôn ngữ (enum).
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

    /// Tiện ích kiểm tra dòng có rỗng (chỉ chứa khoảng trắng) hay không.
    static bool isBlank(const std::string& line) noexcept;

    /// Xoá khoảng trắng đầu / cuối chuỗi (in-place).
    static void trim(std::string& s) noexcept;
};

} // namespace cba
